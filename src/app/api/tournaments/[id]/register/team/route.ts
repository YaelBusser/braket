import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

// POST: Inscrire une équipe avec les membres participants sélectionnés
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: tournamentId } = await params
    const { teamId, participantMemberIds } = await request.json()

    if (!teamId || !Array.isArray(participantMemberIds)) {
      return NextResponse.json({ message: 'teamId et participantMemberIds requis' }, { status: 400 })
    }

    // Vérifier le tournoi
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        isTeamBased: true,
        teamMinSize: true,
        teamMaxSize: true,
        status: true,
        registrationDeadline: true,
        endDate: true
      }
    })

    if (!tournament) {
      return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })
    }

    if (!tournament.isTeamBased) {
      return NextResponse.json({ message: 'Ce tournoi n\'est pas un tournoi en équipe' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est capitaine de l'équipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, pseudo: true, avatarUrl: true }
            }
          }
        }
      }
    })

    if (!team) {
      return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    }

    const isCaptain = team.members.some(m => m.userId === userId && m.isCaptain)
    if (!isCaptain) {
      return NextResponse.json({ message: 'Vous devez être le capitaine de cette équipe' }, { status: 403 })
    }

    // Vérifier que tous les membres sélectionnés appartiennent à l'équipe
    const teamMemberIds = team.members.map(m => m.id)
    const invalidMembers = participantMemberIds.filter((id: string) => !teamMemberIds.includes(id))
    if (invalidMembers.length > 0) {
      return NextResponse.json({ message: 'Certains membres sélectionnés n\'appartiennent pas à l\'équipe' }, { status: 400 })
    }

    // Si l'équipe n'est pas encore liée à ce tournoi, la lier
    if (team.tournamentId !== tournamentId) {
      await prisma.team.update({
        where: { id: teamId },
        data: { tournamentId }
      })
    }

    // Vérifier les contraintes de taille
    const participantCount = participantMemberIds.length
    if (tournament.teamMinSize && participantCount < tournament.teamMinSize) {
      return NextResponse.json({ 
        message: `L'équipe doit avoir au moins ${tournament.teamMinSize} participant${tournament.teamMinSize > 1 ? 's' : ''}` 
      }, { status: 400 })
    }

    if (tournament.teamMaxSize && participantCount > tournament.teamMaxSize) {
      return NextResponse.json({ 
        message: `L'équipe ne peut pas avoir plus de ${tournament.teamMaxSize} participant${tournament.teamMaxSize > 1 ? 's' : ''}` 
      }, { status: 400 })
    }

    // Vérifier les conditions du tournoi
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Inscriptions fermées' }, { status: 400 })
    }

    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Inscriptions clôturées' }, { status: 400 })
    }

    if (tournament.endDate && tournament.endDate < new Date()) {
      return NextResponse.json({ message: 'Tournoi terminé' }, { status: 400 })
    }

    // Vérifier si l'équipe est déjà inscrite
    const existingRegistration = await prisma.tournamentRegistration.findFirst({
      where: {
        tournamentId,
        teamId
      }
    })

    if (existingRegistration) {
      // Mettre à jour les participants
      await prisma.teamTournamentParticipant.deleteMany({
        where: { registrationId: existingRegistration.id }
      })

      await prisma.teamTournamentParticipant.createMany({
        data: participantMemberIds.map((memberId: string) => ({
          registrationId: existingRegistration.id,
          teamMemberId: memberId
        }))
      })

      return NextResponse.json({ 
        message: 'Participants mis à jour',
        registration: existingRegistration
      })
    }

    // Créer l'inscription avec les participants
    const registration = await prisma.tournamentRegistration.create({
      data: {
        tournamentId,
        teamId,
        participants: {
          create: participantMemberIds.map((memberId: string) => ({
            teamMemberId: memberId
          }))
        }
      },
      include: {
        participants: {
          include: {
            teamMember: {
              include: {
                user: {
                  select: { id: true, pseudo: true, avatarUrl: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Équipe inscrite avec succès',
      registration
    }, { status: 201 })
  } catch (error) {
    console.error('Register team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
