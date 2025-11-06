import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const participating = await prisma.tournament.findMany({
      where: {
        OR: [
          { registrations: { some: { userId } } },
          { teams: { some: { members: { some: { userId } } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        posterUrl: true,
        game: true,
        status: true
      }
    })

    // Favorites: placeholder (pas encore de table). Retourne vide pour l'instant
    const favorites: any[] = []

    return NextResponse.json({ participating, favorites })
  } catch (error) {
    console.error('profile/tournaments error', error)
    return NextResponse.json({ participating: [], favorites: [] }, { status: 500 })
  }
}


