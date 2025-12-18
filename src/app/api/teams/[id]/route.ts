import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET: liste les équipes d'un tournoi (id = tournamentId)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const teams = await prisma.team.findMany({
      where: { tournamentId: id },
      include: {
        members: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } }
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json({ teams })
  } catch (error) {
    console.error('List teams error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


