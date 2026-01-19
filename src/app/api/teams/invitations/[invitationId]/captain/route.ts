import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

// PATCH: Le capitaine accepte ou refuse une demande d'adhésion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { invitationId } = await params
    const { action } = await request.json() // 'accept' ou 'reject'

    if (!action || (action !== 'accept' && action !== 'reject')) {
      return NextResponse.json({ message: 'Action invalide (accept ou reject requis)' }, { status: 400 })
    }

    // Récupérer l'invitation
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: {
              where: { userId, isCaptain: true }
            },
            tournament: {
              select: {
                id: true,
                status: true,
                teamMaxSize: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est le capitaine
    if (invitation.team.members.length === 0) {
      return NextResponse.json({ message: 'Vous n\'êtes pas le capitaine de cette équipe' }, { status: 403 })
    }

    // Vérifier que c'est bien une demande (userId === invitedById)
    if (invitation.userId !== invitation.invitedById) {
      return NextResponse.json({ message: 'Cette invitation n\'est pas une demande d\'adhésion' }, { status: 400 })
    }

    // Vérifier que l'invitation est en attente
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ message: 'Cette demande a déjà été traitée' }, { status: 400 })
    }

    if (action === 'reject') {
      // Refuser la demande
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      })

      // Créer une notification pour l'utilisateur
      try {
        await prisma.notification.create({
          data: {
            userId: invitation.userId,
            type: 'team_invite_rejected',
            title: 'Demande refusée',
            message: `Votre demande pour rejoindre l'équipe "${invitation.team.name}" a été refusée`,
            link: null
          }
        })
      } catch (error) {
        console.error('Error creating notification:', error)
      }

      return NextResponse.json({ message: 'Demande refusée' })
    }

    // Accepter la demande
    // Vérifier que le tournoi est encore ouvert aux inscriptions
    if (invitation.team.tournament && invitation.team.tournament.status !== 'REG_OPEN') {
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      })
      return NextResponse.json({ message: 'Impossible d\'accepter : le tournoi a déjà commencé' }, { status: 400 })
    }

    // Vérifier la taille maximale de l'équipe
    const currentMembers = await prisma.teamMember.count({ where: { teamId: invitation.teamId } })
    if (invitation.team.tournament?.teamMaxSize && currentMembers >= invitation.team.tournament.teamMaxSize) {
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      })
      return NextResponse.json({ message: 'Impossible d\'accepter : l\'équipe est complète' }, { status: 400 })
    }

    // Vérifier si l'utilisateur est déjà dans une autre équipe du même tournoi
    if (invitation.team.tournament) {
      const inOtherTeam = await prisma.teamMember.findFirst({
        where: {
          userId: invitation.userId,
          team: { tournamentId: invitation.team.tournament.id }
        }
      })
      if (inOtherTeam) {
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'REJECTED' }
        })
        return NextResponse.json({ message: 'L\'utilisateur fait déjà partie d\'une autre équipe de ce tournoi' }, { status: 400 })
      }
    }

    // Créer le membre
    const member = await prisma.teamMember.create({
      data: { teamId: invitation.teamId, userId: invitation.userId }
    })

    // Marquer l'invitation comme acceptée
    await prisma.teamInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' }
    })

    // Pour les tournois en équipe, s'assurer que l'équipe est inscrite au tournoi
    if (invitation.team.tournament && invitation.team.tournament.status === 'REG_OPEN') {
      try {
        await prisma.tournamentRegistration.upsert({
          where: { tournamentId_teamId: { tournamentId: invitation.team.tournament.id, teamId: invitation.teamId } },
          create: { tournamentId: invitation.team.tournament.id, teamId: invitation.teamId },
          update: {}
        })
      } catch (error) {
        console.error('Error auto-registering team to tournament:', error)
      }
    }

    // Créer une notification pour l'utilisateur
    try {
      await prisma.notification.create({
        data: {
          userId: invitation.userId,
          type: 'team_invite_accepted',
          title: 'Demande acceptée',
          message: `Votre demande pour rejoindre l'équipe "${invitation.team.name}" a été acceptée`,
          link: `/teams/${invitation.teamId}`
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }

    return NextResponse.json({ member, message: 'Demande acceptée' }, { status: 200 })
  } catch (error) {
    console.error('Accept/reject request error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
