import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que le tournoi existe
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true, bracketMaxTeams: true, isTeamBased: true }
    })

    if (!tournament) {
      return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })
    }

    // Récupérer tous les matchs terminés avec les équipes
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: id,
        status: 'COMPLETED'
      },
      include: {
        teamA: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bannerUrl: true
          }
        },
        teamB: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bannerUrl: true
          }
        },
        winnerTeam: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bannerUrl: true
          }
        }
      },
      orderBy: { round: 'desc' }
    })

    if (matches.length === 0) {
      return NextResponse.json({ ranking: [] })
    }

    // Calculer le nombre total de rounds
    const maxRound = Math.max(...matches.map(m => m.round || 0))
    const totalSlots = tournament.bracketMaxTeams || 8
    const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
    const totalRounds = Math.ceil(Math.log2(normalizedSlots))

    // Calculer le classement
    const ranking: Array<{
      rank: number
      team: any
      eliminatedInRound: number | null
    }> = []

    // Trouver le gagnant (1er) - gagnant de la finale
    const finalMatch = matches.find(m => m.round === maxRound && m.status === 'COMPLETED')
    if (finalMatch && finalMatch.winnerTeam && finalMatch.winnerTeam.id !== 'tbd-global') {
      ranking.push({
        rank: 1,
        team: finalMatch.winnerTeam,
        eliminatedInRound: null
      })

      // Trouver le perdant de la finale (2ème)
      const finalLoser = finalMatch.teamAId === finalMatch.winnerTeamId 
        ? finalMatch.teamB 
        : finalMatch.teamA
      if (finalLoser && finalLoser.id && finalLoser.id !== 'tbd-global') {
        ranking.push({
          rank: 2,
          team: finalLoser,
          eliminatedInRound: maxRound
        })
      }
    }

    // Pour les autres places, remonter depuis la finale
    // Les perdants des demi-finales = 3ème-4ème, etc.
    let currentRank = 3
    for (let round = maxRound - 1; round >= 1; round--) {
      const roundMatches = matches.filter(m => m.round === round && m.status === 'COMPLETED')
      const losers: any[] = []

      for (const match of roundMatches) {
        if (match.winnerTeam && match.winnerTeam.id !== 'tbd-global') {
          // Le perdant est l'équipe qui n'a pas gagné
          const loser = match.teamAId === match.winnerTeamId 
            ? match.teamB 
            : match.teamA
          
          // Vérifier que le perdant n'est pas déjà dans le classement et n'est pas un placeholder
          if (loser && loser.id && loser.id !== 'tbd-global' && !ranking.some(r => r.team.id === loser.id)) {
            losers.push(loser)
          }
        }
      }

      // Ajouter les perdants de ce round au classement (trier par position pour cohérence)
      losers.sort((a, b) => {
        // Trier par l'ordre dans lequel ils apparaissent dans les matchs
        const aMatch = roundMatches.find(m => m.teamAId === a.id || m.teamBId === a.id)
        const bMatch = roundMatches.find(m => m.teamAId === b.id || m.teamBId === b.id)
        return (aMatch?.position || 0) - (bMatch?.position || 0)
      })

      for (const loser of losers) {
        ranking.push({
          rank: currentRank,
          team: loser,
          eliminatedInRound: round
        })
        currentRank++
      }
    }

    return NextResponse.json({ ranking })
  } catch (error) {
    console.error('GET /api/tournaments/[id]/ranking error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
