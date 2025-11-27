import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    
    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ users: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { pseudo: { contains: q } },
          { email: { contains: q } }
        ]
      },
      select: {
        id: true,
        pseudo: true,
        email: true,
        avatarUrl: true,
        createdAt: true
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('GET /api/users/search error', error)
    return NextResponse.json({ users: [] }, { status: 500 })
  }
}

