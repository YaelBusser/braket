import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    
    if (!userId) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les IDs des équipes dont l'utilisateur est membre
    const userTeams = await prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true }
    })
    const teamIds = userTeams.map(tm => tm.teamId)

    // Récupérer les registrations de l'utilisateur
    // Soit directement (tournois solo) soit via ses équipes (tournois en équipe)
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        OR: [
          { userId },
          ...(teamIds.length > 0 ? [{ teamId: { in: teamIds } }] : [])
        ]
      },
      select: {
        tournamentId: true
      },
      distinct: ['tournamentId']
    })

    const tournamentIds = registrations.map(r => r.tournamentId)

    if (tournamentIds.length === 0) {
      return NextResponse.json({ tournaments: [] })
    }

    // Récupérer les tournois
    const tournaments = await prisma.tournament.findMany({
      where: {
        id: { in: tournamentIds }
      },
      include: {
        organizer: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('Get joined tournaments error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
