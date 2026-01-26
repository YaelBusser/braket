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
            registrations: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    status: true,
                    teamMaxSize: true
                  }
                }
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
    // Vérifier que les tournois sont encore ouverts aux inscriptions
    const activeRegistrations = invitation.team.registrations.filter(r => r.tournament.status === 'REG_OPEN')
    if (activeRegistrations.length === 0 && invitation.team.registrations.length > 0) {
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'REJECTED' }
      })
      return NextResponse.json({ message: 'Impossible d\'accepter : le tournoi a déjà commencé' }, { status: 400 })
    }

    // Vérifier la taille maximale de l'équipe pour chaque tournoi actif
    const currentMembers = await prisma.teamMember.count({ where: { teamId: invitation.teamId } })
    for (const reg of activeRegistrations) {
      if (reg.tournament.teamMaxSize && currentMembers >= reg.tournament.teamMaxSize) {
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'REJECTED' }
        })
        return NextResponse.json({ message: 'Impossible d\'accepter : l\'équipe est complète pour ce tournoi' }, { status: 400 })
      }
    }

    // Vérifier si l'utilisateur est déjà dans une autre équipe des mêmes tournois
    if (activeRegistrations.length > 0) {
      const tournamentIds = activeRegistrations.map(r => r.tournament.id)
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: invitation.userId },
        include: {
          team: {
            include: {
              registrations: {
                where: { tournamentId: { in: tournamentIds } }
              }
            }
          }
        }
      })
      const inOtherTeam = userTeams.some(tm => tm.team.registrations.length > 0)
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

    // Pour les tournois en équipe, s'assurer que l'équipe est inscrite aux tournois actifs
    for (const reg of activeRegistrations) {
      try {
        const existingReg = await prisma.tournamentRegistration.findFirst({
          where: { tournamentId: reg.tournament.id, teamId: invitation.teamId }
        })
        if (!existingReg) {
          await prisma.tournamentRegistration.create({
            data: { tournamentId: reg.tournament.id, teamId: invitation.teamId }
          })
        }
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
