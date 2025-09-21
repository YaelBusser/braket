import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    // Statistiques des tournois créés
    const tournamentStats = await prisma.tournament.groupBy({
      by: ['status'] as any,
      where: { organizerId: userId },
      _count: { id: true }
    })

    const totalTournaments = await prisma.tournament.count({
      where: { organizerId: userId }
    })

    // Récupérer tous les tournois de l'utilisateur et filtrer côté application
    const allTournaments = await prisma.tournament.findMany({
      where: { organizerId: userId },
      select: { status: true } as any
    })

    const activeTournaments = allTournaments.filter((t: any) => t.status !== 'COMPLETED').length
    const completedTournaments = allTournaments.filter((t: any) => t.status === 'COMPLETED').length

    // Total des participants dans tous les tournois de l'utilisateur
    const totalParticipants = await prisma.tournamentRegistration.count({
      where: {
        tournament: { organizerId: userId }
      }
    })

    // Statistiques des victoires (en tant que participant)
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            wins: true
          }
        }
      }
    })

    const totalWins = userTeams.reduce((acc, member) => {
      return acc + member.team.wins.length
    }, 0)

    // Statistiques des équipes
    const teamStats = await prisma.teamMember.groupBy({
      by: ['teamId'],
      where: { userId },
      _count: { id: true }
    })

    const totalTeamsJoined = teamStats.length

    // Statistiques des matchs
    const matchStats = await prisma.match.findMany({
      where: {
        OR: [
          { teamA: { members: { some: { userId } } } },
          { teamB: { members: { some: { userId } } } }
        ]
      },
      include: {
        teamA: {
          include: {
            members: true
          }
        },
        teamB: {
          include: {
            members: true
          }
        },
        winnerTeam: true
      }
    })

    const totalMatches = matchStats.length
    const wonMatches = matchStats.filter(match => 
      match.winnerTeam && 
      (match.teamA.members.some((m: any) => m.userId === userId) || 
       match.teamB.members.some((m: any) => m.userId === userId))
    ).length

    const winRate = totalMatches > 0 ? (wonMatches / totalMatches) * 100 : 0

    return NextResponse.json({
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalParticipants,
      totalWins,
      totalTeamsJoined,
      totalMatches,
      wonMatches,
      winRate: Math.round(winRate * 100) / 100
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
