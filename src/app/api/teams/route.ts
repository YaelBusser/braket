import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const contentType = request.headers.get('content-type') || ''
    let tournamentId: string | undefined
    let name: string | undefined
    let game: string | undefined
    let description: string | undefined
    let gameId: string | undefined
    let avatarUrl: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      tournamentId = formData.get('tournamentId') as string | undefined
      name = formData.get('name') as string | undefined
      game = formData.get('game') as string | undefined
      description = formData.get('description') as string | undefined
      gameId = formData.get('gameId') as string | undefined
      const avatarFile = formData.get('avatar') as File | null

      if (avatarFile && typeof avatarFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(avatarFile.type)) {
          return NextResponse.json({ message: 'Type de fichier non pris en charge' }, { status: 400 })
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if ((avatarFile as any).size && (avatarFile as any).size > maxSize) {
          return NextResponse.json({ message: 'Fichier trop volumineux (max 5MB)' }, { status: 400 })
        }

        const fs = await import('fs')
        const fsp = await import('fs/promises')
        const path = await import('path')

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'teams')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (avatarFile as any).name || 'avatar'
        const ext = path.extname(originalName) || (avatarFile.type === 'image/png' ? '.png' : avatarFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        avatarUrl = `/uploads/teams/${fileName}`
      }
    } else {
      const body = await request.json()
      tournamentId = body.tournamentId
      name = body.name
      game = body.game
      description = body.description
      gameId = body.gameId
    }
    
    // Si c'est une création d'équipe indépendante (pas liée à un tournoi)
    if (!tournamentId) {
      if (!name) {
        return NextResponse.json({ message: 'Le nom de l\'équipe est requis' }, { status: 400 })
      }

      // Si un jeu est spécifié, vérifier qu'il n'y a pas déjà une équipe pour ce jeu
      if (game) {
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
      }

      const teamDataIndep: any = {
        name,
        description,
        members: {
          create: { userId, isCaptain: true }
        }
      }
      
      if (game) {
        teamDataIndep.game = game
      }
      if (gameId) {
        teamDataIndep.gameId = gameId.toString()
      }
      if (avatarUrl) {
        teamDataIndep.avatarUrl = avatarUrl
      }
      
      const team = await prisma.team.create({
        data: teamDataIndep,
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
    if (!name) {
      return NextResponse.json({ message: 'Le nom de l\'équipe est requis' }, { status: 400 })
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
      return NextResponse.json({ message: "L\'organisateur ne peut pas créer d\'équipe" }, { status: 403 })
    }

    // Pour les tournois en équipe, on permet de créer une équipe sans inscription préalable
    // L'inscription se fera après, et nécessitera d'être dans une équipe

    // un utilisateur ne peut appartenir qu'à UNE équipe pour ce tournoi
    const alreadyInTournament = await prisma.teamMember.findFirst({
      where: { userId, team: { tournamentId } },
      include: { team: true }
    })
    if (alreadyInTournament) {
      return NextResponse.json({ message: 'Vous faites déjà partie d\'une équipe de ce tournoi' }, { status: 400 })
    }

    const teamData: any = {
      name,
      tournamentId,
      members: {
        create: { userId, isCaptain: true }
      }
    }
    if (avatarUrl) {
      teamData.avatarUrl = avatarUrl
    }
    const team = await prisma.team.create({
      data: teamData
    })

    // Ne plus auto-inscrire l'équipe - le capitaine doit sélectionner les membres participants
    // L'inscription se fera via /api/tournaments/[id]/register/team

    return NextResponse.json({ team }, { status: 201 })
  } catch (error) {
    console.error('Create team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine')
    const q = searchParams.get('q') || ''
    
    // Si on demande les équipes de l'utilisateur connecté
    if (mine === 'true') {
      const session = await getServerSession(authOptions)
      const userId = (session?.user as any)?.id as string | undefined
      if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

      const teams = await prisma.team.findMany({
        where: {
          members: {
            some: { userId }
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
          },
          tournament: {
            select: {
              id: true,
              name: true,
              game: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json(teams)
    }
    
    // Recherche par nom (logique existante)
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


