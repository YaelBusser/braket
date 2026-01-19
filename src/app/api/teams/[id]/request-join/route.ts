import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

// POST: Faire une demande pour rejoindre une équipe
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: teamId } = await params

    // Vérifier que l'équipe existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: true,
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

    if (!team) {
      return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const isAlreadyMember = team.members.some(m => m.userId === userId)
    if (isAlreadyMember) {
      return NextResponse.json({ message: 'Vous êtes déjà membre de cette équipe' }, { status: 400 })
    }

    // Vérifier que les tournois sont encore ouverts aux inscriptions
    const activeRegistrations = team.registrations.filter(r => r.tournament.status === 'REG_OPEN')
    if (activeRegistrations.length > 0) {
      // Vérifier la taille maximale pour chaque tournoi actif
      for (const reg of activeRegistrations) {
        if (reg.tournament.teamMaxSize && team.members.length >= reg.tournament.teamMaxSize) {
          return NextResponse.json({ message: 'L\'équipe est complète pour ce tournoi' }, { status: 400 })
        }
      }
    }

    // Vérifier si l'utilisateur est déjà dans une autre équipe des mêmes tournois
    if (activeRegistrations.length > 0) {
      const tournamentIds = activeRegistrations.map(r => r.tournament.id)
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
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
        return NextResponse.json({ message: 'Vous faites déjà partie d\'une autre équipe de ce tournoi' }, { status: 400 })
      }
    }

    // Vérifier s'il y a déjà une invitation en attente
    const existingInvitation = await prisma.teamInvitation.findUnique({
      where: { teamId_userId: { teamId, userId } }
    })

    if (existingInvitation) {
      if (existingInvitation.status === 'PENDING') {
        return NextResponse.json({ message: 'Vous avez déjà une demande en attente pour cette équipe' }, { status: 400 })
      }
      // Si l'invitation a été refusée, on peut en créer une nouvelle
      if (existingInvitation.status === 'REJECTED') {
        await prisma.teamInvitation.delete({
          where: { id: existingInvitation.id }
        })
      }
    }

    // Trouver le capitaine de l'équipe
    const captain = team.members.find(m => m.isCaptain)
    if (!captain) {
      return NextResponse.json({ message: 'Aucun capitaine trouvé pour cette équipe' }, { status: 400 })
    }

    // Créer l'invitation (l'utilisateur s'invite lui-même, donc userId = invitedById)
    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId,
        userId,
        invitedById: userId, // L'utilisateur fait la demande lui-même
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
            tournament: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Créer une notification pour le capitaine
    try {
      await prisma.notification.create({
        data: {
          userId: captain.userId,
          type: 'team_invite',
          title: 'Demande pour rejoindre l\'équipe',
          message: `${(session.user as any).name || (session.user as any).pseudo} souhaite rejoindre votre équipe "${team.name}"${activeRegistrations.length > 0 ? ` pour le tournoi "${activeRegistrations[0].tournament.name}"` : ''}`,
          link: `/teams/${teamId}/manage?fromNotification=true`
        }
      })
    } catch (error) {
      console.error('Error creating notification:', error)
    }

    return NextResponse.json({ 
      message: 'Demande envoyée au capitaine de l\'équipe',
      invitation 
    }, { status: 201 })
  } catch (error) {
    console.error('Request join team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
