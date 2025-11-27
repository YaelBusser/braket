import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        pseudo: true,
        avatarUrl: true,
        bannerUrl: true,
        isEnterprise: true,
        createdAt: true,
        _count: {
          select: {
            tournaments: true,
            teamMembers: true,
            registrations: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Utiliser la bannière par défaut si aucune bannière n'est définie
    const userWithDefaultBanner = {
      ...user,
      bannerUrl: user.bannerUrl || '/images/games.jpg'
    }

    return NextResponse.json({ user: userWithDefaultBanner })
  } catch (error) {
    console.error('GET /api/users/[id] error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

