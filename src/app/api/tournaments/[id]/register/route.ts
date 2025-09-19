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
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, isTeamBased: true, maxParticipants: true, endDate: true }
    })
    if (!tournament) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })

    // Pour les tournois en équipe, on autorise l'inscription individuelle

    // Considérer "terminé" uniquement si endDate est passée
    if (tournament.endDate && tournament.endDate < new Date()) {
      return NextResponse.json({ message: 'Tournoi terminé' }, { status: 400 })
    }

    // Éviter les doublons (déjà inscrit)
    const exists = await prisma.tournamentRegistration.findUnique({ where: { tournamentId_userId: { tournamentId: id, userId } } })
    if (exists) {
      return NextResponse.json({ message: 'Déjà inscrit' })
    }

    const count = await prisma.tournamentRegistration.count({ where: { tournamentId: id } })
    if (tournament.maxParticipants && count >= tournament.maxParticipants) {
      return NextResponse.json({ message: 'Tournoi complet' }, { status: 400 })
    }

    await prisma.tournamentRegistration.create({ data: { tournamentId: id, userId } })
    return NextResponse.json({ message: 'Inscrit' }, { status: 201 })
  } catch (error) {
    console.error('Register error:', error)
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
    await prisma.tournamentRegistration.delete({ where: { tournamentId_userId: { tournamentId: id, userId } } })
    return NextResponse.json({ message: 'Désinscrit' })
  } catch (error) {
    console.error('Unregister error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


