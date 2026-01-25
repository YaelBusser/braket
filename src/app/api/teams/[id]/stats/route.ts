import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET: récupère les statistiques d'une équipe
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: teamId } = await params

    // Vérifier que l'équipe existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true }
    })

    if (!team) {
      return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    }

    // Compter les matchs joués (où l'équipe est teamA ou teamB et le match est terminé)
    const totalMatches = await prisma.match.count({
      where: {
        status: 'COMPLETED',
        OR: [
          { teamAId: teamId },
          { teamBId: teamId }
        ]
      }
    })

    // Compter les victoires (où l'équipe est le gagnant)
    const wins = await prisma.match.count({
      where: {
        status: 'COMPLETED',
        winnerTeamId: teamId
      }
    })

    // Calculer les défaites
    const losses = totalMatches - wins

    // Calculer le taux de victoire
    const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

    // Compter les tournois où l'équipe est inscrite
    const totalTournaments = await prisma.tournamentRegistration.count({
      where: {
        teamId: teamId
      }
    })

    // Compter les tournois gagnés (où l'équipe a gagné le match de la finale)
    // Un tournoi est gagné si l'équipe a gagné le match du dernier round d'un tournoi terminé
    const completedTournaments = await prisma.tournament.findMany({
      where: {
        status: 'COMPLETED',
        registrations: {
          some: {
            teamId: teamId
          }
        }
      },
      select: {
        id: true,
        bracketMaxTeams: true,
        matches: {
          where: {
            status: 'COMPLETED',
            winnerTeamId: teamId
          },
          select: {
            round: true
          }
        }
      }
    })

    // Pour chaque tournoi terminé, vérifier si l'équipe a gagné le match de la finale
    let tournamentsWon = 0
    for (const tournament of completedTournaments) {
      // Calculer le nombre total de rounds
      const totalSlots = tournament.bracketMaxTeams || 8
      const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
      const totalRounds = Math.ceil(Math.log2(normalizedSlots))
      
      // Vérifier si l'équipe a gagné le match de la finale (dernier round)
      const finalMatch = tournament.matches.find(m => m.round === totalRounds)
      if (finalMatch) {
        tournamentsWon++
      }
    }

    return NextResponse.json({
      totalMatches,
      wins,
      losses,
      winRate,
      totalTournaments,
      tournamentsWon
    })
  } catch (error) {
    console.error('Get team stats error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
