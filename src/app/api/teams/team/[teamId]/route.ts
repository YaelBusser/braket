import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

// GET: récupère une équipe spécifique
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params
    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
          },
          orderBy: [
            { isCaptain: 'desc' },
            { createdAt: 'asc' }
          ]
        },
        tournament: {
          select: {
            id: true,
            name: true,
            game: true,
            status: true,
            startDate: true,
            endDate: true
          }
        }
      }
    })
    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })

    // Récupérer les tournois où l'équipe est inscrite (via TournamentRegistration)
    const registrations = await prisma.tournamentRegistration.findMany({
      where: {
        teamId: teamId
      },
      include: {
        tournament: {
          include: {
            gameRef: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                logoUrl: true,
                posterUrl: true
              }
            },
            organizer: {
              select: {
                id: true,
                pseudo: true,
                avatarUrl: true
              }
            },
            _count: {
              select: {
                registrations: true
              }
            }
          }
        }
      }
    })

    // Extraire les tournois uniques depuis les inscriptions
    const uniqueTournaments = registrations.map(r => r.tournament).filter(Boolean)

    return NextResponse.json({
      ...team,
      tournaments: uniqueTournaments
    })
  } catch (error) {
    console.error('Get team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT: met à jour une équipe (seulement le chef)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { teamId } = await params
    const contentType = request.headers.get('content-type') || ''

    let name: string | undefined
    let description: string | undefined
    let avatarUrl: string | undefined
    let bannerUrl: string | undefined

    // Vérifier que l'utilisateur est le chef de l'équipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId, isCaptain: true }
        }
      }
    })

    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    if (team.members.length === 0) {
      return NextResponse.json({ message: 'Vous n\'êtes pas le chef de cette équipe' }, { status: 403 })
    }

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      name = formData.get('name') as string | undefined
      description = formData.get('description') as string | undefined
      const avatarFile = formData.get('avatar') as File | null
      const bannerFile = formData.get('banner') as File | null

      const fs = await import('fs')
      const fsp = await import('fs/promises')
      const path = await import('path')
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'teams')
      if (!fs.existsSync(uploadDir)) {
        await fsp.mkdir(uploadDir, { recursive: true })
      }

      if (avatarFile && typeof avatarFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(avatarFile.type)) {
          return NextResponse.json({ message: 'Type de fichier non pris en charge' }, { status: 400 })
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if ((avatarFile as any).size && (avatarFile as any).size > maxSize) {
          return NextResponse.json({ message: 'Fichier trop volumineux (max 5MB)' }, { status: 400 })
        }

        const originalName = (avatarFile as any).name || 'avatar'
        const ext = path.extname(originalName) || (avatarFile.type === 'image/png' ? '.png' : avatarFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${teamId}-avatar-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        avatarUrl = `/uploads/teams/${fileName}`
      }

      if (bannerFile && typeof bannerFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(bannerFile.type)) {
          return NextResponse.json({ message: 'Type de fichier non pris en charge' }, { status: 400 })
        }

        const maxSize = 10 * 1024 * 1024 // 10MB pour les bannières
        if ((bannerFile as any).size && (bannerFile as any).size > maxSize) {
          return NextResponse.json({ message: 'Fichier trop volumineux (max 10MB)' }, { status: 400 })
        }

        const originalName = (bannerFile as any).name || 'banner'
        const ext = path.extname(originalName) || (bannerFile.type === 'image/png' ? '.png' : bannerFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${teamId}-banner-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await bannerFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        bannerUrl = `/uploads/teams/${fileName}`
      }
    } else {
      const body = await request.json()
      name = body.name
      description = body.description
      avatarUrl = body.avatarUrl
      bannerUrl = body.bannerUrl
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
    if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
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
          },
          orderBy: [
            { isCaptain: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE: supprime une équipe (seulement le chef)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { teamId } = await params

    // Vérifier que l'utilisateur est le chef de l'équipe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          where: { userId, isCaptain: true }
        },
        tournament: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    if (!team) return NextResponse.json({ message: 'Équipe introuvable' }, { status: 404 })
    if (team.members.length === 0) {
      return NextResponse.json({ message: 'Seul le chef peut supprimer l\'équipe' }, { status: 403 })
    }

    // Vérifier que le tournoi n'a pas commencé
    if (team.tournament && team.tournament.status !== 'REG_OPEN') {
      return NextResponse.json({ message: 'Impossible de supprimer l\'équipe après le début du tournoi' }, { status: 400 })
    }

    await prisma.team.delete({ where: { id: teamId } })
    return NextResponse.json({ message: 'Équipe supprimée' })
  } catch (error) {
    console.error('Delete team error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
