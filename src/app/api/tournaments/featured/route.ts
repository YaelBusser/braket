import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    // Récupérer tous les tournois en tendance (avec featuredPosition)
    const featuredTournaments = await prisma.tournament.findMany({
      where: {
        visibility: 'PUBLIC',
        status: { not: 'COMPLETED' },
        featuredPosition: { 
          not: null,
          gte: 1
        }
      },
      orderBy: {
        featuredPosition: 'asc'
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
      }
    })

    // Filtrer et s'assurer que tous ont bien une featuredPosition valide
    const validTournaments = featuredTournaments
      .filter(t => 
        t.featuredPosition !== null && 
        t.featuredPosition >= 1
      )
      .sort((a, b) => (a.featuredPosition || 0) - (b.featuredPosition || 0))

    return NextResponse.json({ 
      tournaments: validTournaments 
    })
  } catch (error) {
    console.error('Get featured tournaments error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
