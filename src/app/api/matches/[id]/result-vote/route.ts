import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

// GET: Récupérer les votes de résultat d'un match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: matchId } = await params

    // Vérifier que l'utilisateur a accès au match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        teamB: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        tournament: {
          include: {
            organizer: { select: { id: true } }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })
    }

    // Récupérer les votes
    const votes = await prisma.matchResultVote.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ votes })
  } catch (error) {
    console.error('Get match result votes error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Voter pour un résultat (teamA ou teamB)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: matchId } = await params
    const { votedFor } = await request.json()

    if (!votedFor || (votedFor !== 'teamA' && votedFor !== 'teamB')) {
      return NextResponse.json({ message: 'votedFor doit être "teamA" ou "teamB"' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est capitaine d'une équipe du match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          include: {
            members: {
              where: { isCaptain: true },
              include: { user: { select: { id: true } } }
            }
          }
        },
        teamB: {
          include: {
            members: {
              where: { isCaptain: true },
              include: { user: { select: { id: true } } }
            }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est capitaine d'une équipe
    const isTeamACaptain = match.teamA.members.some(m => m.user.id === userId)
    const isTeamBCaptain = match.teamB.members.some(m => m.user.id === userId)

    if (!isTeamACaptain && !isTeamBCaptain) {
      return NextResponse.json({ message: 'Seuls les capitaines peuvent voter' }, { status: 403 })
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVote = await prisma.matchResultVote.findUnique({
      where: {
        matchId_userId: {
          matchId,
          userId
        }
      }
    })

    if (existingVote) {
      // Mettre à jour le vote existant
      const updatedVote = await prisma.matchResultVote.update({
        where: { id: existingVote.id },
        data: { votedFor },
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true
            }
          }
        }
      })
      return NextResponse.json({ vote: updatedVote })
    } else {
      // Créer un nouveau vote
      const newVote = await prisma.matchResultVote.create({
        data: {
          matchId,
          userId,
          votedFor
        },
        include: {
          user: {
            select: {
              id: true,
              pseudo: true,
              avatarUrl: true
            }
          }
        }
      })
      return NextResponse.json({ vote: newVote }, { status: 201 })
    }
  } catch (error) {
    console.error('Post match result vote error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
