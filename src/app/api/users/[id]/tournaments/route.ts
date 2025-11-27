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

    // Récupérer uniquement les tournois publics de l'utilisateur
    const tournaments = await prisma.tournament.findMany({
      where: {
        organizerId: id,
        visibility: 'PUBLIC'
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

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('GET /api/users/[id]/tournaments error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}



