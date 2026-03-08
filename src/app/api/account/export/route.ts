import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          select: { id: true, expires: true }
        },
        teamMembers: {
          include: {
            team: { select: { id: true, name: true } }
          }
        },
        teamInvitations: {
          select: { id: true, teamId: true, status: true, createdAt: true }
        },
        sentTeamInvitations: {
          select: { id: true, teamId: true, userId: true, status: true, createdAt: true }
        },
        registrations: {
          include: {
            tournament: { select: { id: true, name: true, game: true } }
          }
        },
        tournaments: {
          select: { id: true, name: true, game: true, status: true, createdAt: true }
        },
        notifications: {
          select: { id: true, type: true, title: true, message: true, read: true, createdAt: true }
        },
        matchMessages: {
          select: { id: true, matchId: true, message: true, createdAt: true }
        },
        matchResultVotes: {
          select: { id: true, matchId: true, votedFor: true, createdAt: true }
        },
      }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    const { passwordHash, ...userData } = user

    const exportData = {
      exportDate: new Date().toISOString(),
      platform: 'Braket',
      userData,
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="braket-data-export-${userId}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de l\'export des données' },
      { status: 500 }
    )
  }
}
