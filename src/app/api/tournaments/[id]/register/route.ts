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
      select: { 
        id: true, 
        isTeamBased: true, 
        maxParticipants: true, 
        bracketMaxTeams: true,
        bracketMinTeams: true,
        endDate: true, 
        registrationDeadline: true, 
        status: true 
      }
    })
    if (!tournament) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })

    // Pour les tournois en équipe, l'inscription se fait automatiquement via l'équipe
    // On ne permet pas d'inscription individuelle
    if (tournament.isTeamBased) {
      return NextResponse.json({ message: 'Pour les tournois en équipe, vous devez créer ou rejoindre une équipe. L\'inscription se fait automatiquement.' }, { status: 400 })
    }

    // Pour les tournois solo, inscription individuelle
    // Inscriptions fermées si statut non REG_OPEN ou deadline dépassée
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Inscriptions fermées' }, { status: 400 })
    }
    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Inscriptions clôturées' }, { status: 400 })
    }
    // Considérer terminé si endDate passée
    if (tournament.endDate && tournament.endDate < new Date()) {
      return NextResponse.json({ message: 'Tournoi terminé' }, { status: 400 })
    }

    // Éviter les doublons (déjà inscrit)
    const exists = await prisma.tournamentRegistration.findFirst({ 
      where: { tournamentId: id, userId: userId! } 
    })
    if (exists) {
      return NextResponse.json({ message: 'Déjà inscrit' })
    }

    // Pour les tournois solo, compter les inscriptions individuelles
    const count = await prisma.tournamentRegistration.count({ 
      where: { 
        tournamentId: id,
        userId: { not: null as any }
      } 
    })
    
    // Vérifier bracketMaxTeams (priorité sur maxParticipants)
    if (tournament.bracketMaxTeams && count >= tournament.bracketMaxTeams) {
      return NextResponse.json({ 
        message: `Tournoi complet (${count}/${tournament.bracketMaxTeams} participants maximum)` 
      }, { status: 400 })
    }
    
    // Vérifier maxParticipants (si bracketMaxTeams n'est pas défini)
    if (tournament.maxParticipants && count >= tournament.maxParticipants) {
      return NextResponse.json({ message: 'Tournoi complet' }, { status: 400 })
    }

    await prisma.tournamentRegistration.create({ data: { tournamentId: id, userId: userId! } })
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
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, startDate: true, status: true }
    })
    if (!tournament) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })

    // Vérifier que le tournoi n'a pas encore commencé
    if (tournament.startDate && tournament.startDate < new Date()) {
      return NextResponse.json({ message: 'Le tournoi a déjà commencé. Désinscription impossible.' }, { status: 400 })
    }
    if (tournament.status !== 'REG_OPEN' && tournament.status !== 'REG_CLOSED' as any) {
      return NextResponse.json({ message: 'Le tournoi a déjà commencé. Désinscription impossible.' }, { status: 400 })
    }

    // Vérifier si c'est un tournoi en équipe
    const tournamentWithType = await prisma.tournament.findUnique({
      where: { id },
      select: { isTeamBased: true }
    })

    // Trouver l'équipe de l'utilisateur pour ce tournoi
    // Pour les tournois en équipe, trouver l'inscription de l'équipe de l'utilisateur
    let userTeam = null
    if (tournamentWithType?.isTeamBased) {
      // Trouver toutes les équipes dont l'utilisateur est membre
      const userTeams = await prisma.teamMember.findMany({
        where: { userId },
        include: {
          team: {
            include: {
              registrations: {
                where: { tournamentId: id },
                select: { id: true }
              },
              members: {
                select: { userId: true, isCaptain: true }
              }
            }
          }
        }
      })

      // Trouver l'équipe qui est inscrite à ce tournoi
      const teamWithRegistration = userTeams.find((tm: any) => 
        tm.team.registrations && tm.team.registrations.length > 0
      )

      if (teamWithRegistration) {
        userTeam = {
          team: {
            id: teamWithRegistration.team.id,
            name: teamWithRegistration.team.name,
            members: teamWithRegistration.team.members
          },
          isCaptain: teamWithRegistration.isCaptain
        }
      }
    }

    // Vérifier que l'utilisateur est bien inscrit (pour tournois solo) ou que son équipe est inscrite (pour tournois en équipe)
    let registration = null
    if (tournamentWithType?.isTeamBased) {
      // Pour les tournois en équipe, vérifier l'inscription de l'équipe
      if (userTeam && userTeam.team) {
        registration = await prisma.tournamentRegistration.findFirst({ 
          where: { 
            tournamentId: id, 
            teamId: userTeam.team.id 
          } as any
        })
      }
    } else {
      // Pour les tournois solo, vérifier l'inscription individuelle
      registration = await prisma.tournamentRegistration.findFirst({ 
        where: { tournamentId: id, userId } 
      })
    }
    
    if (!registration) {
      return NextResponse.json({ message: 'Vous n\'êtes pas inscrit à ce tournoi' }, { status: 400 })
    }

    // Si l'utilisateur fait partie d'une équipe dans un tournoi en équipe
    if (tournamentWithType?.isTeamBased && userTeam && userTeam.team) {
      // Vérifier que l'utilisateur est capitaine (on peut utiliser directement userTeam.isCaptain)
      if (!userTeam.isCaptain) {
        return NextResponse.json({ message: 'Seul le capitaine peut désinscrire l\'équipe' }, { status: 403 })
      }

      // Trouver l'inscription de l'équipe
      const teamRegistration = await prisma.tournamentRegistration.findFirst({
        where: {
          tournamentId: id,
          teamId: userTeam.team.id
        } as any
      })

      if (teamRegistration) {
        // Supprimer les participants
        await (prisma as any).teamTournamentParticipant.deleteMany({
          where: { registrationId: teamRegistration.id }
        })
        
        // Supprimer l'inscription
        await prisma.tournamentRegistration.delete({
          where: { id: teamRegistration.id }
        })
      }

      const teamMemberCount = userTeam.team.members.length
      return NextResponse.json({ 
        message: 'Désinscrit',
        unregisteredTeam: true,
        teamName: userTeam.team.name,
        unregisteredCount: teamMemberCount
      })
    } else {
      // Pour les tournois solo, désinscrire uniquement l'utilisateur
      const soloRegistration = await prisma.tournamentRegistration.findFirst({
        where: { tournamentId: id, userId }
      })
      if (soloRegistration) {
        await prisma.tournamentRegistration.delete({ 
          where: { id: soloRegistration.id } 
        })
      }
      return NextResponse.json({ message: 'Désinscrit' })
    }
  } catch (error) {
    console.error('Unregister error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


