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

    // Récupérer les équipes où l'utilisateur est membre
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId: id }
        }
      },
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
          }
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                game: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Transformer les équipes pour avoir une structure compatible avec TeamCard
    const teamsWithTournament = teams.map(team => {
      // Prendre le premier tournoi inscrit (ou null si aucun)
      const tournament = team.registrations?.[0]?.tournament || null
      // Retirer registrations et ajouter tournament directement
      const { registrations, ...teamWithoutRegistrations } = team
      return {
        ...teamWithoutRegistrations,
        tournament
      }
    })

    return NextResponse.json(teamsWithTournament)
  } catch (error) {
    console.error('GET /api/users/[id]/teams error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
