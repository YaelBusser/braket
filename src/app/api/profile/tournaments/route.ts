import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    // Récupérer les tournois où l'utilisateur participe
    // 1. Inscriptions individuelles (tournois solo)
    const soloRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        userId,
        teamId: null
      },
      select: {
        tournamentId: true
      }
    })
    const soloTournamentIds = soloRegistrations.map(r => r.tournamentId)

    // 2. Inscriptions d'équipes (tournois en équipe) - vérifier que l'équipe est bien inscrite
    const teamRegistrations = await prisma.tournamentRegistration.findMany({
      where: {
        teamId: { not: null },
        team: {
          members: { some: { userId } }
        }
      },
      select: {
        tournamentId: true
      }
    })
    const teamTournamentIds = teamRegistrations.map(r => r.tournamentId)

    // Combiner les IDs uniques
    const allParticipatingIds = [...new Set([...soloTournamentIds, ...teamTournamentIds])]

    const participating = await prisma.tournament.findMany({
      where: {
        AND: [
          { id: { in: allParticipatingIds } },
          { status: { not: 'COMPLETED' } }
        ]
      },
      select: {
        id: true,
        name: true,
        posterUrl: true,
        logoUrl: true,
        game: true,
        status: true,
        gameRef: {
          select: {
            imageUrl: true,
            logoUrl: true,
            posterUrl: true
          }
        }
      }
    })

    const created = await prisma.tournament.findMany({
      where: {
        AND: [
          { organizerId: userId },
          { status: { not: 'COMPLETED' } }
        ]
      },
      select: {
        id: true,
        name: true,
        posterUrl: true,
        logoUrl: true,
        game: true,
        status: true,
        gameRef: {
          select: {
            imageUrl: true,
            logoUrl: true,
            posterUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Favorites: placeholder (pas encore de table). Retourne vide pour l'instant
    const favorites: any[] = []

    return NextResponse.json({ participating, created, favorites })
  } catch (error) {
    console.error('profile/tournaments error', error)
    return NextResponse.json({ participating: [], created: [], favorites: [] }, { status: 500 })
  }
}


