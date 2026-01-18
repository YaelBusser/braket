import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

// PATCH: Accepter ou refuser une invitation
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
            pseudo: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien celui invité
    if (invitation.userId !== userId) {
      return NextResponse.json({ message: 'Vous n\'êtes pas autorisé à modifier cette invitation' }, { status: 403 })
    }

    // Vérifier que l'invitation est en attente
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ message: 'Cette invitation a déjà été traitée' }, { status: 400 })
    }

    if (action === 'reject') {
      // Refuser l'invitation
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      })

      return NextResponse.json({ message: 'Invitation refusée' })
    }

    // Accepter l'invitation
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
          userId,
          team: { tournamentId: invitation.team.tournament.id }
        }
      })
      if (inOtherTeam) {
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'REJECTED' }
        })
        return NextResponse.json({ message: 'Vous faites déjà partie d\'une autre équipe de ce tournoi' }, { status: 400 })
      }
    }

    // Créer le membre
    const member = await prisma.teamMember.create({
      data: { teamId: invitation.teamId, userId }
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

    // Créer une notification pour le capitaine
    try {
      const captain = await prisma.teamMember.findFirst({
        where: { teamId: invitation.teamId, isCaptain: true },
        include: { user: { select: { id: true } } }
      })
      if (captain) {
        await prisma.notification.create({
          data: {
            userId: captain.user.id,
            type: 'team_invite_accepted',
            title: 'Invitation acceptée',
            message: `${invitation.user.pseudo} a accepté votre invitation à rejoindre l'équipe "${invitation.team.name}"`,
            link: `/teams/${invitation.teamId}`
          }
        })
      }
    } catch (error) {
      console.error('Error creating notification:', error)
    }

    return NextResponse.json({ member, message: 'Invitation acceptée' }, { status: 200 })
  } catch (error) {
    console.error('Accept/reject invitation error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Supprimer une invitation (pour le capitaine ou l'utilisateur invité)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { invitationId } = await params

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: {
              where: { userId, isCaptain: true }
            }
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ message: 'Invitation introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur est soit l'invité, soit le capitaine
    const isInvitedUser = invitation.userId === userId
    const isCaptain = invitation.team.members.length > 0

    if (!isInvitedUser && !isCaptain) {
      return NextResponse.json({ message: 'Vous n\'êtes pas autorisé à supprimer cette invitation' }, { status: 403 })
    }

    await prisma.teamInvitation.delete({
      where: { id: invitationId }
    })

    return NextResponse.json({ message: 'Invitation supprimée' })
  } catch (error) {
    console.error('Delete invitation error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
