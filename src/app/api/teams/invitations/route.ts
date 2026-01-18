import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

// GET: Récupérer les invitations de l'utilisateur ou d'une équipe
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    const status = searchParams.get('status') // 'PENDING', 'ACCEPTED', 'REJECTED' ou null pour tous

    const where: any = {}
    
    if (teamId) {
      // Récupérer les invitations d'une équipe (pour le capitaine)
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: {
            where: { userId, isCaptain: true }
          }
        }
      })

      if (!team) {
        return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
      }

      if (team.members.length === 0) {
        return NextResponse.json({ message: 'Vous n\'êtes pas le capitaine de cette équipe' }, { status: 403 })
      }

      where.teamId = teamId
    } else {
      // Récupérer les invitations de l'utilisateur
      where.userId = userId
    }

    if (status) {
      where.status = status
    } else {
      // Par défaut, on récupère seulement les invitations en attente
      where.status = 'PENDING'
    }

    const invitations = await prisma.teamInvitation.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            tournament: {
              select: {
                id: true,
                name: true,
                game: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        },
        invitedBy: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ invitations })
  } catch (error) {
    console.error('Get invitations error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
