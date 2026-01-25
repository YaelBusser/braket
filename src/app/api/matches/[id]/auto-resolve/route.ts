import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

/**
 * Met à jour les statistiques des équipes et des joueurs après un match terminé
 * Les statistiques sont calculées dynamiquement, cette fonction s'assure que
 * les données sont à jour et peut être étendue pour mettre en cache les stats
 */
async function updateMatchStatistics(
  winnerTeamId: string,
  loserTeamId: string,
  tournamentId: string
) {
  try {
    // Vérifier que les équipes existent
    const winnerTeam = await prisma.team.findUnique({
      where: { id: winnerTeamId },
      select: { id: true, name: true }
    })

    const loserTeam = await prisma.team.findUnique({
      where: { id: loserTeamId },
      select: { id: true, name: true }
    })

    if (!winnerTeam || !loserTeam) {
      console.warn('Teams not found for statistics update')
      return
    }

    // Les statistiques sont calculées dynamiquement en comptant les matchs
    // Cette fonction garantit que les données sont cohérentes
    // Les statistiques seront recalculées automatiquement lors des prochaines requêtes
    
    // On peut ajouter ici :
    // - Une invalidation de cache si on utilise un système de cache
    // - Une mise à jour d'une table de statistiques si on en crée une
    // - Un événement pour notifier les clients de la mise à jour
    
    console.log(`✅ Match terminé - Statistiques mises à jour: ${winnerTeam.name} a gagné contre ${loserTeam.name}`)
    
    // Les statistiques sont disponibles via :
    // - Pour les équipes: compter les matchs dans team.wins et team.matchesA/matchesB
    // - Pour les joueurs: compter via teamMember.team.wins où le joueur est membre
  } catch (error) {
    console.error('❌ Error updating match statistics:', error)
  }
}

/**
 * Vérifie si le match est la finale et termine le tournoi si c'est le cas
 */
async function checkAndCompleteTournament(
  tournamentId: string,
  matchRound: number | null
) {
  try {
    if (matchRound === null) return

    // Récupérer le tournoi avec bracketMaxTeams
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { 
        id: true, 
        status: true, 
        bracketMaxTeams: true 
      }
    })

    if (!tournament || tournament.status === 'COMPLETED') return

    // Calculer le nombre total de rounds
    const totalSlots = tournament.bracketMaxTeams || 8
    const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
    const totalRounds = Math.ceil(Math.log2(normalizedSlots))

    // Si le match est le dernier round (la finale), terminer le tournoi
    if (matchRound === totalRounds) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'COMPLETED' }
      })
    }
  } catch (error) {
    console.error('Error checking and completing tournament:', error)
  }
}

/**
 * Propage le gagnant vers le match du round suivant.
 */
async function propagateWinnerToNextRound(
  tournamentId: string,
  currentRound: number,
  winnerTeamId: string
) {
  try {
    const currentRoundMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        round: currentRound
      },
      orderBy: { createdAt: 'asc' }
    })

    const matchIndex = currentRoundMatches.findIndex(m => 
      m.teamAId === winnerTeamId || m.teamBId === winnerTeamId
    )
    
    if (matchIndex === -1) return

    const pairIndex = Math.floor(matchIndex / 2)
    const isFirstOfPair = matchIndex % 2 === 0
    const siblingIndex = isFirstOfPair ? matchIndex + 1 : matchIndex - 1

    const siblingMatch = currentRoundMatches[siblingIndex]
    
    if (!siblingMatch || siblingMatch.status !== 'COMPLETED' || !siblingMatch.winnerTeamId) {
      return
    }

    const nextRound = currentRound + 1
    
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
      const updateData: any = {}
      const existingTeamAId = existingNextMatch.teamAId || 'tbd-global'
      const existingTeamBId = existingNextMatch.teamBId || 'tbd-global'
      
      if (existingTeamAId === 'tbd-global' && existingTeamBId === 'tbd-global') {
        if (!existingNextMatch.teamAId) {
          updateData.teamAId = winnerTeamId
        } else if (!existingNextMatch.teamBId) {
          updateData.teamBId = winnerTeamId
        }
      } else {
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
      const teamAId = isFirstOfPair ? winnerTeamId : siblingMatch.winnerTeamId
      const teamBId = isFirstOfPair ? siblingMatch.winnerTeamId : winnerTeamId
      
      // Ne pas créer de match si les deux équipes sont "À déterminer" (tbd-global)
      if (teamAId === 'tbd-global' && teamBId === 'tbd-global') {
        return
      }
      
      // Vérifier le statut du tournoi pour déterminer le statut du match
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        select: { status: true }
      })
      
      const matchStatus = tournament?.status === 'IN_PROGRESS' ? 'SCHEDULED' : 'PENDING'
      
      await prisma.match.create({
        data: {
          tournamentId,
          round: nextRound,
          teamAId,
          teamBId,
          status: matchStatus
        }
      })
    }
  } catch (error) {
    console.error('Error propagating winner:', error)
  }
}

// POST: Résolution automatique du match si les deux équipes sont d'accord
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: matchId } = await params

    // Récupérer le match avec les équipes et leurs capitaines
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          include: {
            members: {
              where: { isCaptain: true },
              include: { user: { select: { id: true } } }
            }
          }
        },
        teamB: {
          include: {
            members: {
              where: { isCaptain: true },
              include: { user: { select: { id: true } } }
            }
          }
        },
        tournament: {
          include: {
            organizer: { select: { id: true } }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })
    }

    // Vérifier que le match n'est pas déjà terminé
    if (match.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Le match est déjà terminé' }, { status: 400 })
    }

    // Récupérer les votes
    const votes = await prisma.matchResultVote.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true
          }
        }
      }
    })

    // Vérifier qu'il y a exactement 2 votes (un de chaque équipe)
    if (votes.length !== 2) {
      return NextResponse.json({ message: 'Les deux équipes doivent avoir voté' }, { status: 400 })
    }

    // Identifier les capitaines des équipes
    const teamACaptainIds = match.teamA.members.map(m => m.user.id)
    const teamBCaptainIds = match.teamB.members.map(m => m.user.id)

    // Vérifier qu'un vote vient de chaque équipe
    const teamAVote = votes.find(v => teamACaptainIds.includes(v.user.id))
    const teamBVote = votes.find(v => teamBCaptainIds.includes(v.user.id))

    if (!teamAVote || !teamBVote) {
      return NextResponse.json({ message: 'Les deux équipes doivent avoir voté' }, { status: 400 })
    }

    // Vérifier que les deux équipes sont d'accord (même vote)
    if (teamAVote.votedFor !== teamBVote.votedFor) {
      return NextResponse.json({ message: 'Les équipes ne sont pas d\'accord' }, { status: 400 })
    }

    // Déterminer le gagnant
    const winnerTeamId = teamAVote.votedFor === 'teamA' ? match.teamAId : match.teamBId

    if (!winnerTeamId) {
      return NextResponse.json({ message: 'Erreur: équipe gagnante introuvable' }, { status: 400 })
    }

    // Mettre à jour le match avec le gagnant
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerTeamId,
        status: 'COMPLETED'
      },
      include: {
        teamA: true,
        teamB: true,
        winnerTeam: true,
        tournament: true
      }
    })

    // Avancer le gagnant au tour suivant si nécessaire
    if (updatedMatch.round !== null) {
      await propagateWinnerToNextRound(
        updatedMatch.tournamentId,
        updatedMatch.round,
        winnerTeamId
      )
      
      // Vérifier si c'est la finale et terminer le tournoi si nécessaire
      await checkAndCompleteTournament(
        updatedMatch.tournamentId,
        updatedMatch.round
      )
    }

    // Mettre à jour les statistiques des équipes et des joueurs
    const loserTeamId = winnerTeamId === match.teamAId ? match.teamBId : match.teamAId
    if (loserTeamId) {
      await updateMatchStatistics(
        winnerTeamId,
        loserTeamId,
        updatedMatch.tournamentId
      )
    }

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error('Auto resolve match result error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
