import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { tournamentId, name, game, description, gameId } = await request.json()
    
    // Si c'est une création d'équipe indépendante (pas liée à un tournoi)
    if (!tournamentId && game) {
      if (!name || !game) {
        return NextResponse.json({ message: 'Nom et jeu requis' }, { status: 400 })
      }

      // Vérifier que l'utilisateur n'a pas déjà une équipe pour ce jeu
      const existingTeam = await prisma.team.findFirst({
        where: {
          game: game,
          members: {
            some: { userId }
          }
        }
      })

      if (existingTeam) {
        return NextResponse.json({ message: 'Vous avez déjà une équipe pour ce jeu' }, { status: 400 })
      }

      const team = await prisma.team.create({
        data: {
          name,
          game,
          description,
          gameId: gameId?.toString(),
          members: {
            create: { userId, isCaptain: true }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  pseudo: true,
                  avatarUrl: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({ team }, { status: 201 })
    }

    // Logique existante pour les équipes de tournoi
    if (!tournamentId || !name) {
      return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 })
    }

    // vérifier tournoi
    const tournament = await prisma.tournament.findUnique({ 
      where: { id: tournamentId },
      select: { 
        id: true, 
        status: true, 
        registrationDeadline: true, 
        endDate: true, 
        organizerId: true,
        teamMinSize: true,
        teamMaxSize: true
      }
    })
    if (!tournament) return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })

    // inscriptions seules si statut ouvert
    if (tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Création d\'équipe impossible: inscriptions fermées' }, { status: 400 })
    }

    // Vérifier deadline d'inscription
    if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
      return NextResponse.json({ message: 'Création d\'équipe impossible: deadline d\'inscription dépassée' }, { status: 400 })
    }

    // Vérifier que le tournoi n'est pas terminé
    if (tournament.endDate && tournament.endDate < new Date()) {
      return NextResponse.json({ message: 'Création d\'équipe impossible: tournoi terminé' }, { status: 400 })
    }

    // l'organisateur ne peut pas créer/rejoindre d'équipe
    if (tournament.organizerId === userId) {
      return NextResponse.json({ message: 'L'organisateur ne peut pas créer d'équipe' }, { status: 403 })
    }

    // exiger inscription préalable au tournoi
    const reg = await prisma.tournamentRegistration.findUnique({ where: { tournamentId_userId: { tournamentId, userId } } })
    if (!reg) {
      return NextResponse.json({ message: 'Inscrivez-vous au tournoi avant de créer une équipe' }, { status: 403 })
    }

    // un utilisateur ne peut appartenir qu'à UNE équipe pour ce tournoi
    const alreadyInTournament = await prisma.teamMember.findFirst({
      where: { userId, team: { tournamentId } },
      include: { team: true }
    })
    if (alreadyInTournament) {
      return NextResponse.json({ message: 'Vous faites déjà partie d\'une équipe de ce tournoi' }, { status: 400 })
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''
    
    if (!q.trim() || q.trim().length < 2) {
      return NextResponse.json({ teams: [] })
    }

    const teams = await prisma.team.findMany({
      where: {
        name: { contains: q }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                pseudo: true,
                avatarUrl: true
              }
            }
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            game: true
          }
        }
      },
      take: 20,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('GET /api/teams error', error)
    return NextResponse.json({ teams: [] }, { status: 500 })
  }
}


