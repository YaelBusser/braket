import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: params.id },
      include: {
        organizer: { select: { pseudo: true } },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } },
          },
        },
        matches: true,
      },
    })

    if (!tournament) {
      return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Get tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const existing = await prisma.tournament.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (existing.organizerId !== userId) {
      return NextResponse.json({ message: 'Interdit' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, game, format, visibility, startDate, endDate } = body || {}

    const updated = await prisma.tournament.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(game !== undefined ? { game } : {}),
        ...(format !== undefined ? { format } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
    })

    return NextResponse.json({ tournament: updated })
  } catch (error) {
    console.error('Update tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const existing = await prisma.tournament.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (existing.organizerId !== userId) return NextResponse.json({ message: 'Interdit' }, { status: 403 })

    // supprimer affiche si locale
    if (existing.posterUrl && existing.posterUrl.startsWith('/uploads/posters/')) {
      try {
        const p = path.join(process.cwd(), 'public', existing.posterUrl)
        if (fs.existsSync(p)) await fsp.unlink(p)
      } catch {}
    }

    await prisma.match.deleteMany({ where: { tournamentId: params.id } })
    const teams = await prisma.team.findMany({ where: { tournamentId: params.id } })
    await prisma.teamMember.deleteMany({ where: { teamId: { in: teams.map(t => t.id) } } })
    await prisma.team.deleteMany({ where: { tournamentId: params.id } })
    await prisma.tournament.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Tournoi supprimé' })
  } catch (error) {
    console.error('Delete tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


