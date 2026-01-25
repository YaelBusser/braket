import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'
import fs from 'fs/promises'
import path from 'path'

// GET: Récupérer les messages d'un match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: matchId } = await params

    // Vérifier que l'utilisateur a accès au match (capitaine d'une équipe ou admin)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        teamB: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        tournament: {
          include: {
            organizer: { select: { id: true } }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })
    }

    // Vérifier les permissions : capitaine d'une équipe ou admin
    const isTeamACaptain = match.teamA.members.some(m => m.user.id === userId && m.isCaptain)
    const isTeamBCaptain = match.teamB.members.some(m => m.user.id === userId && m.isCaptain)
    const isAdmin = match.tournament.organizer.id === userId

    if (!isTeamACaptain && !isTeamBCaptain && !isAdmin) {
      return NextResponse.json({ message: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer les messages
    const messages = await prisma.matchMessage.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Get match messages error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// POST: Envoyer un message dans un match
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { id: matchId } = await params
    const formData = await request.formData()
    const message = formData.get('message') as string
    const imageFile = formData.get('image') as File | null

    if (!message && !imageFile) {
      return NextResponse.json({ message: 'Message ou image requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur a accès au match (capitaine d'une équipe ou admin)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        teamA: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        teamB: {
          include: {
            members: {
              include: { user: { select: { id: true } } }
            }
          }
        },
        tournament: {
          include: {
            organizer: { select: { id: true } }
          }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match introuvable' }, { status: 404 })
    }

    // Vérifier les permissions : capitaine d'une équipe ou admin
    const isTeamACaptain = match.teamA.members.some(m => m.user.id === userId && m.isCaptain)
    const isTeamBCaptain = match.teamB.members.some(m => m.user.id === userId && m.isCaptain)
    const isAdmin = match.tournament.organizer.id === userId

    if (!isTeamACaptain && !isTeamBCaptain && !isAdmin) {
      return NextResponse.json({ message: 'Seuls les capitaines et l\'admin peuvent envoyer des messages' }, { status: 403 })
    }

    // Traiter l'image si présente
    let imageUrl: string | null = null
    if (imageFile && imageFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'match-images')
      await fs.mkdir(uploadsDir, { recursive: true })
      
      const timestamp = Date.now()
      const filename = `${matchId}-${userId}-${timestamp}-${imageFile.name}`
      const filepath = path.join(uploadsDir, filename)
      
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await fs.writeFile(filepath, buffer)
      
      imageUrl = `/uploads/match-images/${filename}`
    }

    // Créer le message
    const newMessage = await prisma.matchMessage.create({
      data: {
        matchId,
        userId,
        message: message || '',
        imageUrl
      },
      include: {
        user: {
          select: {
            id: true,
            pseudo: true,
            avatarUrl: true
          }
        }
      }
    })

    return NextResponse.json({ message: newMessage }, { status: 201 })
  } catch (error) {
    console.error('Post match message error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
