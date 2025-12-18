import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Statistiques des tournois publics créés
    const tournamentStats = await prisma.tournament.groupBy({
      by: ['status'] as any,
      where: { 
        organizerId: id,
        visibility: 'PUBLIC'
      },
      _count: { id: true }
    })

    const totalTournaments = await prisma.tournament.count({
      where: { 
        organizerId: id,
        visibility: 'PUBLIC'
      }
    })

    // Récupérer tous les tournois publics de l'utilisateur et filtrer côté application
    const allTournaments = await prisma.tournament.findMany({
      where: { 
        organizerId: id,
        visibility: 'PUBLIC'
      },
      select: { status: true } as any
    })

    const activeTournaments = allTournaments.filter((t: any) => t.status !== 'COMPLETED').length
    const completedTournaments = allTournaments.filter((t: any) => t.status === 'COMPLETED').length

    // Total des participants dans tous les tournois publics de l'utilisateur
    const totalParticipants = await prisma.tournamentRegistration.count({
      where: {
        tournament: { 
          organizerId: id,
          visibility: 'PUBLIC'
        }
      }
    })

    // Statistiques des victoires (en tant que participant dans des équipes)
    const userTeams = await prisma.teamMember.findMany({
      where: { userId: id },
      include: {
        team: {
          include: {
            wins: {
              include: {
                tournament: {
                  select: {
                    visibility: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Filtrer uniquement les victoires dans des tournois publics
    const totalWins = userTeams.reduce((acc, member) => {
      const publicWins = member.team.wins.filter((win: any) => win.tournament.visibility === 'PUBLIC')
      return acc + publicWins.length
    }, 0)

    // Statistiques des équipes (publiques)
    const teamStats = await prisma.teamMember.groupBy({
      by: ['teamId'],
      where: { userId: id },
      _count: { id: true }
    })

    const totalTeamsJoined = teamStats.length

    // Total des participations (inscriptions + équipes dans des tournois publics)
    const totalRegistrations = await prisma.tournamentRegistration.count({
      where: {
        userId: id,
        tournament: {
          visibility: 'PUBLIC'
        }
      }
    })

    return NextResponse.json({
      totalTournaments,
      activeTournaments,
      completedTournaments,
      totalParticipants,
      totalWins,
      totalTeams: totalTeamsJoined,
      totalRegistrations
    })
  } catch (error) {
    console.error('GET /api/users/[id]/stats error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



