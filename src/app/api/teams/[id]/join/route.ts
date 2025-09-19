import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const team = await prisma.team.findUnique({ where: { id }, include: { members: true, tournament: true } })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    // l'organisateur ne peut pas rejoindre d'équipe
    if (team.tournament.organizerId === userId) {
      return NextResponse.json({ message: 'L’organisateur ne peut pas rejoindre d’équipe' }, { status: 403 })
    }

    // exiger inscription préalable au tournoi
    const reg = await prisma.tournamentRegistration.findUnique({ where: { tournamentId_userId: { tournamentId: team.tournamentId, userId } } })
    if (!reg) {
      return NextResponse.json({ message: 'Inscrivez-vous au tournoi avant de rejoindre une équipe' }, { status: 403 })
    }

    // équipe complète ?
    const max = team.tournament.teamMaxSize || undefined
    if (max && team.members.length >= max) {
      return NextResponse.json({ message: 'Équipe complète' }, { status: 400 })
    }

    // Vérifier si déjà membre
    const already = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId } } })
    if (already) return NextResponse.json({ message: 'Déjà membre' }, { status: 400 })

    const member = await prisma.teamMember.create({ data: { teamId: team.id, userId } })
    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Join team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id } = await params
    const team = await prisma.team.findUnique({ where: { id }, include: { tournament: true } })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    // Vérifier qu'il est membre
    const existing = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId } } })
    if (!existing) return NextResponse.json({ message: 'Vous ne faites pas partie de cette équipe' }, { status: 400 })

    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: team.id, userId } } })
    return NextResponse.json({ message: 'Vous avez quitté l\'équipe' })
  } catch (error) {
    console.error('Leave team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


