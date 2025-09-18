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
    let category: string | undefined
    let startDate: string | undefined
    let endDate: string | undefined
    let posterUrl: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      name = (form.get('name') as string) || undefined
      description = (form.get('description') as string) || undefined
      game = (form.get('game') as string) || undefined
      format = (form.get('format') as string) || 'SINGLE_ELIMINATION'
      visibility = (form.get('visibility') as string) || 'PUBLIC'
      category = (form.get('category') as string) || 'VIDEO_GAMES'
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
    } else {
      const body = await request.json()
      name = body?.name
      description = body?.description
      game = body?.game
      format = body?.format || 'SINGLE_ELIMINATION'
      visibility = body?.visibility || 'PUBLIC'
      category = body?.category || 'VIDEO_GAMES'
      startDate = body?.startDate
      endDate = body?.endDate
    }

    if (!name) {
      return NextResponse.json({ message: 'Nom requis' }, { status: 400 })
    }

    // Bloquer création si un tournoi "en cours" existe pour cet organisateur
    const ongoing = await prisma.tournament.findFirst({
      where: { organizerId: userId, endDate: null },
      select: { id: true }
    })
    if (ongoing) {
      return NextResponse.json({ message: 'Vous avez déjà un tournoi en cours' }, { status: 409 })
    }

    // Coercion des enums (MVP: toujours SINGLE_ELIMINATION + PUBLIC)
    const safeFormat = 'SINGLE_ELIMINATION'
    const safeVisibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
    const safeCategory = ['VIDEO_GAMES', 'SPORTS', 'BOARD_GAMES'].includes(category!)
      ? category
      : 'VIDEO_GAMES'

    const tournament = await prisma.tournament.create({
      data: {
        name: name!,
        description: description || null,
        game: game || null,
        format: safeFormat,
        visibility: safeVisibility,
        category: safeCategory,
        posterUrl: posterUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        organizerId: userId,
      },
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error: any) {
    console.error('Create tournament error:', error)
    return NextResponse.json({ message: error?.message || 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mine = searchParams.get('mine') === '1'
    const category = searchParams.get('category') || undefined
    const q = searchParams.get('q') || undefined
    const game = searchParams.get('game') || undefined
    const sort = searchParams.get('sort') || 'created_desc'
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
    if (category) where.category = category
    if (q) where.OR = [{ name: { contains: q } }, { game: { contains: q } }]
    if (game) where.game = { contains: game }
    if (startMin || startMax) {
      where.startDate = {}
      if (startMin) where.startDate.gte = new Date(startMin)
      if (startMax) where.startDate.lte = new Date(startMax)
    }

    const orderBy =
      sort === 'start_asc' ? { startDate: 'asc' } :
      sort === 'start_desc' ? { startDate: 'desc' } :
      { createdAt: 'desc' }

    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        description: true,
        game: true,
        format: true,
        visibility: true,
        category: true,
        posterUrl: true,
        startDate: true,
        endDate: true,
        organizerId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error('List tournaments error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


