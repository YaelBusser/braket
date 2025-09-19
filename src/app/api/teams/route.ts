import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { tournamentId, name } = await request.json()
    if (!tournamentId || !name) {
      return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
    }

    // vérifier tournoi
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
    if (!tournament) return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })

    // l'organisateur ne peut pas créer/rejoindre d'équipe
    if (tournament.organizerId === userId) {
      return NextResponse.json({ message: 'L’organisateur ne peut pas créer d’équipe' }, { status: 403 })
    }

    // exiger inscription préalable au tournoi
    const reg = await prisma.tournamentRegistration.findUnique({ where: { tournamentId_userId: { tournamentId, userId } } })
    if (!reg) {
      return NextResponse.json({ message: 'Inscrivez-vous au tournoi avant de créer une équipe' }, { status: 403 })
    }

    const team = await prisma.team.create({
      data: {
        name,
        tournamentId,
        members: {
          create: { userId }
        }
      }
    })

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


