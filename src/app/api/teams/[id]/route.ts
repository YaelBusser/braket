import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// GET: liste les équipes d'un tournoi (id = tournamentId)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const teams = await prisma.team.findMany({
      where: { tournamentId: params.id },
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


