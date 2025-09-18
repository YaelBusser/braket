import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

// POST: organiser valide un résultat
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { matchId, winnerTeamId } = await request.json()
    if (!matchId || !winnerTeamId) {
      return NextResponse.json({ message: 'matchId et winnerTeamId requis' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true, teamA: true, teamB: true }
    })
    if (!match) return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })

    if (match.tournament.organizerId !== userId) {
      return NextResponse.json({ message: 'Interdit' }, { status: 403 })
    }

    if (winnerTeamId !== match.teamAId && winnerTeamId !== match.teamBId) {
      return NextResponse.json({ message: 'Winner invalide pour ce match' }, { status: 400 })
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { winnerTeamId, status: 'COMPLETED' }
    })

    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error('Validate result error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


