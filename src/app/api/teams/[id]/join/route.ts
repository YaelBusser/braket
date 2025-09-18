import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const team = await prisma.team.findUnique({ where: { id: params.id }, include: { members: true, tournament: true } })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    // l'organisateur ne peut pas rejoindre d'équipe
    if (team.tournament.organizerId === userId) {
      return NextResponse.json({ message: 'L’organisateur ne peut pas rejoindre d’équipe' }, { status: 403 })
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


