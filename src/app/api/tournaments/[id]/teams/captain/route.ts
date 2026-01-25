import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

// GET: Récupère toutes les équipes de l'utilisateur (capitaine ou non) pour ce tournoi
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: tournamentId } = await params

    // Récupérer toutes les équipes où l'utilisateur est membre (capitaine ou non)
    // (pas seulement celles liées à ce tournoi, car on peut vouloir inscrire une équipe existante)
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            userId
          }
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
          },
          orderBy: [
            { isCaptain: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Ajouter une propriété isCaptain pour chaque équipe
    const teamsWithCaptainStatus = teams.map(team => {
      const userMember = team.members.find(m => m.userId === userId)
      return {
        ...team,
        isUserCaptain: userMember?.isCaptain || false
      }
    })

    return NextResponse.json({ teams: teamsWithCaptainStatus })
  } catch (error) {
    console.error('GET /api/tournaments/[id]/teams/captain error', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
