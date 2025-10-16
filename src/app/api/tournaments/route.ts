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
    let visibility: string | undefined
    let startDate: string | undefined
    let endDate: string | undefined
    let posterUrl: string | undefined
    let registrationDeadline: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      name = (form.get('name') as string) || undefined
      description = (form.get('description') as string) || undefined
      game = (form.get('game') as string) || undefined
      format = (form.get('format') as string) || 'SINGLE_ELIMINATION'
      visibility = (form.get('visibility') as string) || 'PUBLIC'
      startDate = (form.get('startDate') as string) || undefined
      endDate = (form.get('endDate') as string) || undefined
      const file = form.get('poster') as File | null
      if (file) {
        const allowed = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowed.includes(file.type)) {
          return NextResponse.json({ message: 'Affiche: type non supporté' }, { status: 400 })
        }
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters')
        if (!fs.existsSync(uploadDir)) await fsp.mkdir(uploadDir, { recursive: true })
        const ext = file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg'
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)
        const buf = Buffer.from(await file.arrayBuffer())
        await fsp.writeFile(filePath, buf)
        posterUrl = `/uploads/posters/${fileName}`
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

    // Vérifier la limite de 10 tournois actifs (non terminés)
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

    // Vérifier que l'utilisateur existe (évite P2003 si session périmée)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return NextResponse.json({ message: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 })
    }

    // Coercion des enums (MVP: toujours SINGLE_ELIMINATION + PUBLIC)
    const safeFormat = 'SINGLE_ELIMINATION'
    const safeVisibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'

    try {
      const tournament = await prisma.tournament.create({
        data: {
        name: name!,
        description: description || null,
        game: game || null,
        format: safeFormat,
        visibility: safeVisibility,
        posterUrl: posterUrl || null,
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

    const where: any = {}
    if (mine) {
      if (!userId) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })
      }
      where.organizerId = userId
    } else {
      where.visibility = 'PUBLIC'
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
      select: ({
        id: true,
        name: true,
        description: true,
        game: true,
        format: true,
        visibility: true,
        posterUrl: true,
        isTeamBased: true,
        maxParticipants: true,
        startDate: true,
        endDate: true,
        status: true,
        registrationDeadline: true,
        organizerId: true,
        createdAt: true,
        _count: { select: { registrations: true } }
      } as any),
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('List tournaments error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


