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

    return NextResponse.json({ user })
  } catch (error) {
    console.error('GET /api/users/[id] error', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

