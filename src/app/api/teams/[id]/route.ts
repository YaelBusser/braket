import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET: liste les équipes d'un tournoi (id = tournamentId) ou récupère une équipe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    // Si teamId est fourni, retourner une équipe spécifique
    if (teamId) {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatarUrl: true
                }
              }
            },
            orderBy: [
              { isCaptain: 'desc' },
              { createdAt: 'asc' }
            ]
          },
          tournament: {
            select: {
              id: true,
              name: true,
              game: true,
              status: true
            }
          }
        }
      })
      if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
      return NextResponse.json(team)
    }

    // Sinon, lister les équipes du tournoi
    // Ne retourner que les équipes inscrites au tournoi
    const allTeams = await prisma.team.findMany({
      where: { tournamentId: id },
      include: {
        members: { 
          include: { 
            user: { 
              select: { id: true, pseudo: true, avatarUrl: true } 
            } 
          } 
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Récupérer toutes les inscriptions d'équipes du tournoi
    const teamRegistrations = await prisma.tournamentRegistration.findMany({
      where: { 
        tournamentId: id,
        teamId: { not: null }
      },
      select: { teamId: true }
    })
    const registeredTeamIds = new Set(teamRegistrations.map(r => r.teamId).filter(Boolean))

    // Filtrer les équipes pour ne garder que celles inscrites
    const teams = allTeams.filter(team => 
      registeredTeamIds.has(team.id)
    )

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('List teams error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


