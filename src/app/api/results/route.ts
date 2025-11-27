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

    // Tentative d'avancement: si un autre match du même round est déjà complété
    // et qu'aucun match du round suivant n'existe avec ces vainqueurs, créer le match suivant
    try {
      const sibling = await prisma.match.findFirst({
        where: {
          tournamentId: updated.tournamentId,
          round: updated.round,
          status: 'COMPLETED',
          NOT: { id: updated.id }
        },
        orderBy: { createdAt: 'asc' }
      })

      if (sibling && sibling.winnerTeamId && updated.round !== null) {
        // Vérifier si un match r+1 existe déjà avec ces finalistes
        const existsNext = await prisma.match.findFirst({
          where: {
            tournamentId: updated.tournamentId,
            round: updated.round + 1,
            OR: [
              { teamAId: winnerTeamId, teamBId: sibling.winnerTeamId },
              { teamAId: sibling.winnerTeamId, teamBId: winnerTeamId }
            ]
          }
        })
        if (!existsNext) {
          await prisma.match.create({
            data: {
              tournamentId: updated.tournamentId,
              round: updated.round + 1,
              teamAId: winnerTeamId,
              teamBId: sibling.winnerTeamId,
              status: 'PENDING'
            }
          })
        }
      }
    } catch (e) {
      console.warn('Bracket advance warning:', e)
    }

    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error('Validate result error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


