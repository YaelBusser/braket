import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let name: string | undefined
    let description: string | undefined
    let game: string | undefined
    let format: string | undefined
    let gameId: string | undefined
    let visibility: string | undefined
    let startDate: string | undefined
    let endDate: string | undefined
    let posterUrl: string | undefined
    let logoUrl: string | undefined
    let registrationDeadline: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      name = (form.get('name') as string) || undefined
      description = (form.get('description') as string) || undefined
      game = (form.get('game') as string) || undefined
      gameId = (form.get('gameId') as string) || undefined
      format = (form.get('format') as string) || 'SINGLE_ELIMINATION'
      visibility = (form.get('visibility') as string) || 'PUBLIC'
      startDate = (form.get('startDate') as string) || undefined
      endDate = (form.get('endDate') as string) || undefined
      const posterFile = form.get('poster') as File | null
      if (posterFile) {
        const allowed = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowed.includes(posterFile.type)) {
          return NextResponse.json({ message: 'Affiche: type non supporté' }, { status: 400 })
        }
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters')
        if (!fs.existsSync(uploadDir)) await fsp.mkdir(uploadDir, { recursive: true })
        const ext = posterFile.type === 'image/png' ? '.png' : posterFile.type === 'image/webp' ? '.webp' : '.jpg'
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)
        const buf = Buffer.from(await posterFile.arrayBuffer())
        await fsp.writeFile(filePath, buf)
        posterUrl = `/uploads/posters/${fileName}`
      }
      
      const logoFile = form.get('logo') as File | null
      if (logoFile) {
        const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
        if (!allowed.includes(logoFile.type)) {
          return NextResponse.json({ message: 'Logo: type non supporté' }, { status: 400 })
        }
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
        if (!fs.existsSync(uploadDir)) await fsp.mkdir(uploadDir, { recursive: true })
        const ext = logoFile.type === 'image/png' ? '.png' : 
                   logoFile.type === 'image/webp' ? '.webp' : 
                   logoFile.type === 'image/svg+xml' ? '.svg' : '.jpg'
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)
        const buf = Buffer.from(await logoFile.arrayBuffer())
        await fsp.writeFile(filePath, buf)
        logoUrl = `/uploads/logos/${fileName}`
      }
      // options
      const isTeamBasedStr = form.get('isTeamBased') as string | null
      const maxParticipantsStr = form.get('maxParticipants') as string | null
      const kindStr = form.get('kind') as string | null
      if (isTeamBasedStr) (global as any).__tmp_isTeamBased = isTeamBasedStr === 'true'
      if (maxParticipantsStr) (global as any).__tmp_maxParticipants = parseInt(maxParticipantsStr)
      if (kindStr) (global as any).__tmp_kind = kindStr
      const regDL = form.get('registrationDeadline') as string | null
      if (regDL) registrationDeadline = regDL
    } else {
      const body = await request.json()
      name = body?.name
      description = body?.description
      game = body?.game
      gameId = body?.gameId
      format = body?.format || 'SINGLE_ELIMINATION'
      visibility = body?.visibility || 'PUBLIC'
      startDate = body?.startDate
      endDate = body?.endDate
      ;(global as any).__tmp_isTeamBased = body?.isTeamBased === true
      ;(global as any).__tmp_maxParticipants = body?.maxParticipants ? parseInt(body.maxParticipants) : undefined
      registrationDeadline = body?.registrationDeadline
    }

    if (!name) {
      return NextResponse.json({ message: 'Nom requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe (évite P2003 si session périmée)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return NextResponse.json({ message: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 })
    }

    // Vérifier la limite de 10 tournois actifs (non terminés) - uniquement pour les particuliers
    if (!existingUser.isEnterprise) {
      const activeTournaments = await prisma.tournament.count({
        where: { 
          organizerId: userId, 
          status: { not: 'COMPLETED' }
        }
      })
      if (activeTournaments >= 10) {
        return NextResponse.json({ 
          message: 'Limite atteinte : vous ne pouvez pas avoir plus de 10 tournois actifs simultanément. Terminez ou supprimez un tournoi existant pour en créer un nouveau.' 
        }, { status: 409 })
      }
    }

    // Coercion des enums (MVP: toujours SINGLE_ELIMINATION + PUBLIC)
    const safeFormat = 'SINGLE_ELIMINATION'
    const safeVisibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'

    try {
      // Si uniquement gameId fourni, récupérer le nom pour le champ legacy
      if (!game && gameId) {
        const g = await prisma.game.findUnique({ where: { id: gameId } })
        if (g) game = g.name
      }
      const tournament = await prisma.tournament.create({
        data: {
        name: name!,
        description: description || null,
        game: game || null,
        gameId: gameId || null,
        format: safeFormat,
        visibility: safeVisibility,
        posterUrl: posterUrl || null,
        logoUrl: logoUrl || null,
        isTeamBased: Boolean((global as any).__tmp_isTeamBased),
        maxParticipants: (global as any).__tmp_maxParticipants || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        organizerId: userId,
        ...(true ? ({ status: 'REG_OPEN' } as any) : {}),
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        },
      })
      return NextResponse.json({ tournament }, { status: 201 })
    } catch (e: any) {
      if (e?.code === 'P2003') {
        return NextResponse.json({ message: 'Votre session n’est plus valide. Reconnectez‑vous.' }, { status: 401 })
      }
      throw e
    }
  } catch (error: any) {
    console.error('Create tournament error:', error)
    return NextResponse.json({ message: error?.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine') === '1'
    const q = searchParams.get('q') || undefined
    const game = searchParams.get('game') || undefined
    const sort = searchParams.get('sort') || 'created_desc'
    const statusFilter = searchParams.get('status') || undefined
    const startMin = searchParams.get('startMin') || undefined
    const startMax = searchParams.get('startMax') || undefined
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined

    // Récupérer le type d'utilisateur si connecté
    let userIsEnterprise = false
    if (userId) {
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: { isEnterprise: true }
      })
      userIsEnterprise = user?.isEnterprise || false
    }

    const where: any = {}
    if (mine) {
      if (!userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
      }
      where.organizerId = userId
    } else {
      where.visibility = 'PUBLIC'
      // Séparation entreprises/particuliers : filtrer selon le type d'utilisateur
      // Par défaut (non connecté ou particulier), on montre uniquement les tournois de particuliers
      if (userIsEnterprise) {
        // Les entreprises ne voient que les tournois d'entreprises
        where.organizer = {
          isEnterprise: true
        }
      } else {
        // Les particuliers (et non connectés) ne voient que les tournois de particuliers
        where.organizer = {
          isEnterprise: false
        }
      }
    }
    if (q) {
      where.OR = [{ name: { contains: q } }, { game: { contains: q } }]
    }
    if (game) {
      where.game = { contains: game }
    }
    if (statusFilter && ['REG_OPEN','IN_PROGRESS','COMPLETED','DRAFT'].includes(statusFilter)) {
      where.status = statusFilter
    }
    if (startMin || startMax) {
      where.startDate = {}
      if (startMin) where.startDate.gte = new Date(startMin)
      if (startMax) where.startDate.lte = new Date(startMax)
    }

    const orderBy: any =
      sort === 'start_asc' ? { startDate: 'asc' } :
      sort === 'start_desc' ? { startDate: 'desc' } :
      { createdAt: 'desc' }


    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy,
      include: {
        organizer: {
          select: {
            id: true,
            pseudo: true,
            isEnterprise: true
          }
        },
        gameRef: {
          select: {
            id: true,
            name: true,
            imageUrl: true
          }
        },
        _count: {
          select: {
            registrations: true
          }
        }
      }
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('List tournaments error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


