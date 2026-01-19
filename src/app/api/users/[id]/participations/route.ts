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

    // Récupérer les inscriptions actives de l'utilisateur (solo)
    const soloRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        userId: id
      },
      include: {
        tournament: {
          include: {
            organizer: {
              select: {
                id: true,
                pseudo: true
              }
            },
            gameRef: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                logoUrl: true,
                posterUrl: true
              }
            },
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      }
    })

    // Récupérer les équipes de l'utilisateur qui sont inscrites à des tournois
    const userTeams = await prisma.teamMember.findMany({
      where: {
        userId: id
      },
      include: {
        team: {
          include: {
            registrations: {
              include: {
                tournament: {
                  include: {
                    organizer: {
                      select: {
                        id: true,
                        pseudo: true
                      }
                    },
                    gameRef: {
                      select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                        logoUrl: true,
                        posterUrl: true
                      }
                    },
                    _count: {
                      select: {
                        registrations: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    // Extraire les tournois uniques depuis les inscriptions d'équipe
    const teamTournaments = userTeams
      .flatMap(member => member.team.registrations.map(reg => reg.tournament))
      .filter(t => t && t.visibility === 'PUBLIC')

    // Combiner les tournois solo et d'équipe, en supprimant les doublons
    const soloTournaments = soloRegistrations.map(reg => reg.tournament).filter(t => t && t.visibility === 'PUBLIC')
    const allTournaments = [...soloTournaments, ...teamTournaments]
    
    // Supprimer les doublons par ID
    const uniqueTournaments = Array.from(
      new Map(allTournaments.map(t => [t.id, t])).values()
    )

    const participating = uniqueTournaments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({ participating })
  } catch (error) {
    console.error('GET /api/users/[id]/participations error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



