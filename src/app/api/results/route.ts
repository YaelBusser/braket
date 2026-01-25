import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// POST: organiser valide un résultat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { matchId, winnerTeamId } = await request.json()
    if (!matchId || !winnerTeamId) {
      return NextResponse.json({ message: 'matchId et winnerTeamId requis' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true, teamA: true, teamB: true }
    })
    if (!match) return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })

    if (match.tournament.organizerId !== userId) {
      return NextResponse.json({ message: 'Interdit' }, { status: 403 })
    }

    if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
      return NextResponse.json({ message: 'Winner invalide pour ce match' }, { status: 400 })
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { winnerTeamId, status: 'COMPLETED' },
      include: { teamA: true, teamB: true, winnerTeam: true }
    })

    // Propager le gagnant vers le round suivant
    if (updated.round !== null) {
      await propagateWinnerToNextRound(
        updated.tournamentId, 
        updated.round, 
        winnerTeamId
      )
    }

    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error('Validate result error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

/**
 * Propage le gagnant vers le match du round suivant.
 * Logique : Dans un bracket à élimination directe, les matchs sont regroupés par paires.
 * Match 0 et 1 du round 1 → Match 0 du round 2
 * Match 2 et 3 du round 1 → Match 1 du round 2
 * etc.
 */
async function propagateWinnerToNextRound(
  tournamentId: string,
  currentRound: number,
  winnerTeamId: string
) {
  try {
    // Récupérer tous les matchs du round actuel pour ce tournoi
    const currentRoundMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        round: currentRound
      },
      orderBy: { createdAt: 'asc' }
    })

    // Trouver la position du match actuel
    const matchIndex = currentRoundMatches.findIndex(m => 
      m.teamAId === winnerTeamId || m.teamBId === winnerTeamId
    )
    
    if (matchIndex === -1) return

    // Calculer la position du match pair (0-1 forment paire 0, 2-3 forment paire 1, etc.)
    const pairIndex = Math.floor(matchIndex / 2)
    const isFirstOfPair = matchIndex % 2 === 0
    const siblingIndex = isFirstOfPair ? matchIndex + 1 : matchIndex - 1

    // Vérifier si le match "sibling" existe et est terminé
    const siblingMatch = currentRoundMatches[siblingIndex]
    
    if (!siblingMatch || siblingMatch.status !== 'COMPLETED' || !siblingMatch.winnerTeamId) {
      // Le match pair n'est pas encore terminé, on attend
      return
    }

    const nextRound = currentRound + 1
    
    // Vérifier si un match existe déjà pour ce round suivant à cette position
    const existingNextMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        round: nextRound,
        OR: [
          { teamAId: winnerTeamId },
          { teamBId: winnerTeamId },
          { teamAId: siblingMatch.winnerTeamId },
          { teamBId: siblingMatch.winnerTeamId }
        ]
      }
    })

    if (existingNextMatch) {
      // Un match existe déjà, on ajoute l'équipe manquante
      const updateData: any = {}
      
      // Vérifier si le match existant a déjà les deux équipes "À déterminer"
      const existingTeamAId = existingNextMatch.teamAId || 'tbd-global'
      const existingTeamBId = existingNextMatch.teamBId || 'tbd-global'
      
      if (existingTeamAId === 'tbd-global' && existingTeamBId === 'tbd-global') {
        // Le match existant a les deux équipes "À déterminer", on peut le mettre à jour
        // avec au moins une équipe réelle
        if (!existingNextMatch.teamAId) {
          updateData.teamAId = winnerTeamId
        } else if (!existingNextMatch.teamBId) {
          updateData.teamBId = winnerTeamId
        }
      } else {
        // Le match a déjà au moins une équipe réelle, on ajoute l'équipe manquante
        if (!existingNextMatch.teamAId || existingNextMatch.teamAId === 'tbd-global') {
          updateData.teamAId = winnerTeamId
        } else if (!existingNextMatch.teamBId || existingNextMatch.teamBId === 'tbd-global') {
          updateData.teamBId = winnerTeamId
        }
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.match.update({
          where: { id: existingNextMatch.id },
          data: updateData
        })
      }
    } else {
      // Créer le match du round suivant
      // L'ordre : gagnant du premier match de la paire en teamA, gagnant du second en teamB
      const teamAId = isFirstOfPair ? winnerTeamId : siblingMatch.winnerTeamId
      const teamBId = isFirstOfPair ? siblingMatch.winnerTeamId : winnerTeamId

      // Ne pas créer de match si les deux équipes sont "À déterminer" (tbd-global)
      if (teamAId === 'tbd-global' && teamBId === 'tbd-global') {
        // Les deux équipes sont "À déterminer", ne pas créer le match
        return
      }

      await prisma.match.create({
        data: {
          tournamentId,
          round: nextRound,
          teamAId,
          teamBId,
          status: 'PENDING'
        }
      })
      
      console.log(`Match créé pour le round ${nextRound}: ${teamAId} vs ${teamBId}`)
    }
  } catch (e) {
    console.warn('Erreur propagation bracket:', e)
  }
}
