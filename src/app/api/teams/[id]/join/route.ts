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
    const team = await prisma.team.findUnique({ 
      where: { id }, 
      include: { 
        members: true, 
        tournament: {
          select: {
            id: true,
            status: true,
            registrationDeadline: true,
            endDate: true,
            organizerId: true,
            teamMinSize: true,
            teamMaxSize: true
          }
        }
      } 
    })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    const tournament = team.tournament
    if (!tournament) return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })

    // l'organisateur ne peut pas rejoindre d'équipe
    if (tournament.organizerId === userId) {
      return NextResponse.json({ message: 'L\'organisateur ne peut pas rejoindre d\'équipe' }, { status: 403 })
    }

    // rejoindre uniquement tant que inscriptions ouvertes
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Rejoindre impossible: inscriptions fermées' }, { status: 400 })
    }

    // Vérifier deadline d'inscription
    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Rejoindre impossible: deadline d\'inscription dépassée' }, { status: 400 })
    }

    // Vérifier que le tournoi n'est pas terminé
    if (tournament.endDate && tournament.endDate < new Date()) {
      return NextResponse.json({ message: 'Rejoindre impossible: tournoi terminé' }, { status: 400 })
    }

    // exiger inscription préalable au tournoi
    const reg = await prisma.tournamentRegistration.findUnique({ where: { tournamentId_userId: { tournamentId: team.tournamentId, userId } } })
    if (!reg) {
      return NextResponse.json({ message: 'Inscrivez-vous au tournoi avant de rejoindre une équipe' }, { status: 403 })
    }

    // équipe complète ?
    if (tournament.teamMaxSize && team.members.length >= tournament.teamMaxSize) {
      return NextResponse.json({ message: 'Équipe complète' }, { status: 400 })
    }

    // Vérifier si déjà membre de cette équipe
    const already = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId } } })
    if (already) return NextResponse.json({ message: 'Déjà membre' }, { status: 400 })

    // Empêcher de rejoindre plusieurs équipes du même tournoi
    const alreadyInTournament = await prisma.teamMember.findFirst({ where: { userId, team: { tournamentId: team.tournamentId } } })
    if (alreadyInTournament) {
      return NextResponse.json({ message: 'Vous faites déjà partie d\'une équipe de ce tournoi' }, { status: 400 })
    }

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
    const team = await prisma.team.findUnique({ 
      where: { id }, 
      include: { 
        tournament: {
          select: {
            id: true,
            status: true,
            registrationDeadline: true,
            endDate: true
          }
        }
      } 
    })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    const tournament = team.tournament
    if (!tournament) return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })

    // Vérifier qu'il est membre
    const existing = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId } } })
    if (!existing) return NextResponse.json({ message: 'Vous ne faites pas partie de cette équipe' }, { status: 400 })

    // Interdire de quitter après démarrage
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Impossible de quitter une équipe après le démarrage' }, { status: 400 })
    }

    // Vérifier deadline d'inscription
    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Impossible de quitter une équipe après la deadline d\'inscription' }, { status: 400 })
    }

    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: team.id, userId } } })

    // Vérifier s'il reste des membres
    const remaining = await prisma.teamMember.count({ where: { teamId: team.id } })
    if (remaining === 0) {
      await prisma.team.delete({ where: { id } })
      return NextResponse.json({ message: 'Vous avez quitté l\'équipe. L\'équipe a été supprimée (dernier membre).', teamDeleted: true, teamId: id })
    }

    return NextResponse.json({ message: 'Vous avez quitté l\'équipe', teamDeleted: false, teamId: id })
  } catch (error) {
    console.error('Leave team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


