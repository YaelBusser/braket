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
            teamMaxSize: true,
            isTeamBased: true
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

    // Pour les tournois en équipe, on permet de rejoindre une équipe sans inscription préalable
    // L'inscription se fera après, et nécessitera d'être dans une équipe

    // équipe complète ?
    if (tournament.teamMaxSize && team.members.length >= tournament.teamMaxSize) {
      return NextResponse.json({ message: 'Équipe complète' }, { status: 400 })
    }

    // Vérifier si déjà membre de cette équipe
    const already = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: team.id, userId } } })
    if (already) return NextResponse.json({ message: 'Déjà membre' }, { status: 400 })

    // Empêcher de rejoindre plusieurs équipes du même tournoi
    const alreadyInTournament = await prisma.teamMember.findFirst({ where: { userId, team: { tournamentId: tournament.id } } })
    if (alreadyInTournament) {
      return NextResponse.json({ message: 'Vous faites déjà partie d\'une équipe de ce tournoi' }, { status: 400 })
    }

    const member = await prisma.teamMember.create({ data: { teamId: team.id, userId } })
    
    // Pour les tournois en équipe, s'assurer que l'équipe est inscrite au tournoi
    // (pas besoin d'inscrire individuellement chaque membre)
    if ((tournament as any).isTeamBased) {
      try {
        const existingReg = await prisma.tournamentRegistration.findFirst({
          where: { 
            tournamentId: tournament.id, 
            teamId: team.id 
          } as any
        })
        if (!existingReg) {
          await prisma.tournamentRegistration.create({
            data: { tournamentId: tournament.id, teamId: team.id } as any
          } as any)
        }
      } catch (error) {
        console.error('Error auto-registering team to tournament:', error)
      }
    }
    
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
            startDate: true,
            endDate: true,
            isTeamBased: true
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

    // Si l'utilisateur est capitaine, il doit transférer le rôle avant de quitter
    if (existing.isCaptain) {
      // Vérifier s'il y a d'autres membres dans l'équipe
      const otherMembers = await prisma.teamMember.findMany({
        where: {
          teamId: team.id,
          userId: { not: userId }
        }
      })
      
      if (otherMembers.length > 0) {
        return NextResponse.json({ 
          message: 'Vous ne pouvez pas quitter l\'équipe en tant que capitaine. Transférez d\'abord le rôle de capitaine à un autre membre.',
          requiresTransfer: true
        }, { status: 400 })
      }
      // Si c'est le dernier membre, on peut quitter (l'équipe sera supprimée)
    }

    // Interdire de quitter si le tournoi est en cours ou a commencé
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Impossible de quitter une équipe après le démarrage du tournoi' }, { status: 400 })
    }

    // Vérifier deadline d'inscription
    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Impossible de quitter une équipe après la deadline d\'inscription' }, { status: 400 })
    }

    // Vérifier si le tournoi a commencé (même si le statut est encore REG_OPEN)
    if (tournament.startDate && new Date(tournament.startDate) <= new Date()) {
      return NextResponse.json({ message: 'Impossible de quitter une équipe une fois que le tournoi a commencé' }, { status: 400 })
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


