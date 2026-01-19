import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

// POST: Inviter un joueur à rejoindre l'équipe (seulement le chef)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { teamId } = await params
    const { invitedUserId } = await request.json()

    if (!invitedUserId) {
      return NextResponse.json({ message: 'ID utilisateur requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le chef
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId, isCaptain: true }
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                teamMaxSize: true
              }
            }
          }
        }
      }
    })

    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    if (team.members.length === 0) {
      return NextResponse.json({ message: 'Vous n\'êtes pas le chef de cette équipe' }, { status: 403 })
    }

    // Vérifier que les tournois sont encore ouverts aux inscriptions
    const activeRegistrations = team.registrations.filter(r => r.tournament.status === 'REG_OPEN')
    if (activeRegistrations.length > 0) {
      // Vérifier la taille maximale pour chaque tournoi actif
      const currentMembers = await prisma.teamMember.count({ where: { teamId } })
      for (const reg of activeRegistrations) {
        if (reg.tournament.teamMaxSize && currentMembers >= reg.tournament.teamMaxSize) {
          return NextResponse.json({ message: 'Équipe complète pour ce tournoi' }, { status: 400 })
        }
      }
    }

    // Vérifier si l'utilisateur est déjà membre
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: invitedUserId } }
    })
    if (existing) {
      return NextResponse.json({ message: 'L\'utilisateur est déjà membre de l\'équipe' }, { status: 400 })
    }

    // Vérifier si l'utilisateur est déjà dans une autre équipe des mêmes tournois
    if (activeRegistrations.length > 0) {
      const tournamentIds = activeRegistrations.map(r => r.tournament.id)
      const userTeams = await prisma.teamMember.findMany({
        where: { userId: invitedUserId },
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
        return NextResponse.json({ message: 'L\'utilisateur fait déjà partie d\'une autre équipe de ce tournoi' }, { status: 400 })
      }
    }

    // Vérifier s'il y a déjà une invitation
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: { teamId_userId: { teamId, userId: invitedUserId } }
    })
    
    if (existingInvitation) {
      if (existingInvitation.status === 'PENDING') {
        return NextResponse.json({ message: 'Une invitation est déjà en attente pour cet utilisateur' }, { status: 400 })
      }
      // Si l'invitation existe mais a été refusée ou acceptée, on la supprime pour en créer une nouvelle
      if (existingInvitation.status === 'REJECTED' || existingInvitation.status === 'ACCEPTED') {
        await prisma.teamInvitation.delete({
          where: { id: existingInvitation.id }
        })
      }
    }

    // Créer l'invitation
    const invitation = await prisma.teamInvitation.create({
      data: { 
        teamId, 
        userId: invitedUserId,
        invitedById: userId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        },
        team: {
          select: {
            id: true,
            name: true,
            registrations: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Créer une notification pour l'utilisateur invité
    try {
      await prisma.notification.create({
        data: {
          userId: invitedUserId,
          type: 'team_invite',
          title: 'Invitation à rejoindre une équipe',
          message: `Vous avez été invité à rejoindre l'équipe "${team.name}"${activeRegistrations.length > 0 ? ` pour le tournoi "${activeRegistrations[0].tournament.name}"` : ''}`,
          link: `/teams/${teamId}?invitation=${invitation.id}`
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }

    return NextResponse.json({ invitation }, { status: 201 })
  } catch (error) {
    console.error('Invite member error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: Retirer un membre (seulement le chef)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { teamId } = await params
    const { searchParams } = new URL(request.url)
    const memberUserId = searchParams.get('userId')

    if (!memberUserId) {
      return NextResponse.json({ message: 'ID utilisateur requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le chef
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId, isCaptain: true }
        },
        registrations: {
          include: {
            tournament: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    if (team.members.length === 0) {
      return NextResponse.json({ message: 'Vous n\'êtes pas le chef de cette équipe' }, { status: 403 })
    }

    // Vérifier que les tournois n'ont pas commencé
    const activeRegistrations = team.registrations.filter(r => r.tournament.status !== 'REG_OPEN')
    if (activeRegistrations.length > 0) {
      return NextResponse.json({ message: 'Impossible de retirer un membre après le début du tournoi' }, { status: 400 })
    }

    // Vérifier que le membre existe
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: memberUserId } }
    })
    if (!member) {
      return NextResponse.json({ message: 'Membre introuvable' }, { status: 404 })
    }

    // Empêcher de se retirer soi-même (le chef doit transférer le rôle d'abord)
    if (memberUserId === userId && member.isCaptain) {
      return NextResponse.json({ message: 'Transférez d\'abord le rôle de chef avant de quitter l\'équipe' }, { status: 400 })
    }

    await prisma.teamMember.delete({
      where: { teamId_userId: { teamId, userId: memberUserId } }
    })

    return NextResponse.json({ message: 'Membre retiré' })
  } catch (error) {
    console.error('Remove member error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
