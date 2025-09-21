import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: true,
        teamB: true,
        tournament: { select: { id: true, organizerId: true } }
      }
    })
    if (!match) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    return NextResponse.json({ match })
  } catch (error) {
    console.error('Get match error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


