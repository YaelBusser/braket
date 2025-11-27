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

    // Récupérer les tournois où l'utilisateur participe (inscriptions ou équipes)
    const participating = await prisma.tournament.findMany({
      where: {
        visibility: 'PUBLIC',
        OR: [
          { registrations: { some: { userId: id } } },
          { teams: { some: { members: { some: { userId: id } } } } }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        organizer: {
          select: {
            id: true,
            pseudo: true,
            isEnterprise: true
          }
        },
        gameRef: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    return NextResponse.json({ participating })
  } catch (error) {
    console.error('GET /api/users/[id]/participations error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



