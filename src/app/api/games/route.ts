import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GAMES } from '@/data/games'

// GET /api/games -> liste de tous les jeux (DB)
export async function GET() {
  try {
    const games = await prisma.game.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ games })
  } catch (error) {
    console.error('GET /api/games error', error)
    return NextResponse.json({ games: [] }, { status: 500 })
  }
}

// POST /api/games -> seed rapide à partir de src/data/games.ts
export async function POST(request: NextRequest) {
  try {
    let created = 0
    for (const g of GAMES) {
      await prisma.game.upsert({
        where: { slug: g.slug },
        create: { name: g.name, slug: g.slug, imageUrl: g.image },
        update: { name: g.name, imageUrl: g.image }
      })
      created += 1
    }
    return NextResponse.json({ ok: true, created })
  } catch (error) {
    console.error('POST /api/games error', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


