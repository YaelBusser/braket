import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

// Helper function pour parser un nombre de manière sûre
function parseInteger(value: string | null | undefined): number | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed === '') return null
  // Utiliser une regex pour vérifier que c'est un nombre entier
  if (!/^\d+$/.test(trimmed)) return null
  // Conversion manuelle
  let result = 0
  for (let i = 0; i < trimmed.length; i++) {
    const digit = trimmed.charCodeAt(i) - 48 // '0' = 48
    if (digit < 0 || digit > 9) return null
    result = result * 10 + digit
  }
  return result > 0 ? result : null
}

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
    let prizes: string | undefined
    let rules: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      name = (form.get('name') as string) || undefined
      description = (form.get('description') as string) || undefined
      prizes = (form.get('prizes') as string) || undefined
      rules = (form.get('rules') as string) || undefined
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
      const teamMinSizeValue = form.get('teamMinSize')
      const teamMaxSizeValue = form.get('teamMaxSize')
      const kindStr = form.get('kind') as string | null
      
      console.log('API - Received teamMinSize:', teamMinSizeValue, 'type:', typeof teamMinSizeValue)
      console.log('API - Received teamMaxSize:', teamMaxSizeValue, 'type:', typeof teamMaxSizeValue)
      console.log('API - isTeamBased:', isTeamBasedStr)
      
      if (isTeamBasedStr) (global as any).__tmp_isTeamBased = isTeamBasedStr === 'true'
      if (maxParticipantsStr) {
        const parsed = parseInteger(maxParticipantsStr)
        (global as any).__tmp_maxParticipants = parsed !== null ? parsed : undefined
      }
      // Parser teamMinSize et teamMaxSize (vérifier que c'est une string)
      const teamMinSizeStr = typeof teamMinSizeValue === 'string' ? teamMinSizeValue : null
      const teamMaxSizeStr = typeof teamMaxSizeValue === 'string' ? teamMaxSizeValue : null
      
      // Conversion directe pour teamMinSize
      if (teamMinSizeStr && typeof teamMinSizeStr === 'string' && teamMinSizeStr.trim() !== '') {
        const trimmed = teamMinSizeStr.trim()
        if (/^\d+$/.test(trimmed)) {
          let result = 0
          for (let i = 0; i < trimmed.length; i++) {
            const digit = trimmed.charCodeAt(i) - 48
            if (digit >= 0 && digit <= 9) {
              result = result * 10 + digit
            } else {
              result = 0
              break
            }
          }
          (global as any).__tmp_teamMinSize = result > 0 ? result : null
        } else {
          (global as any).__tmp_teamMinSize = null
        }
      } else {
        (global as any).__tmp_teamMinSize = null
      }
      
      // Conversion directe pour teamMaxSize
      if (teamMaxSizeStr && typeof teamMaxSizeStr === 'string' && teamMaxSizeStr.trim() !== '') {
        const trimmed = teamMaxSizeStr.trim()
        if (/^\d+$/.test(trimmed)) {
          let result = 0
          for (let i = 0; i < trimmed.length; i++) {
            const digit = trimmed.charCodeAt(i) - 48
            if (digit >= 0 && digit <= 9) {
              result = result * 10 + digit
            } else {
              result = 0
              break
            }
          }
          (global as any).__tmp_teamMaxSize = result > 0 ? result : null
        } else {
          (global as any).__tmp_teamMaxSize = null
        }
      } else {
        (global as any).__tmp_teamMaxSize = null
      }
      
      console.log('API - Parsed teamMinSize:', (global as any).__tmp_teamMinSize, 'from:', teamMinSizeStr)
      console.log('API - Parsed teamMaxSize:', (global as any).__tmp_teamMaxSize, 'from:', teamMaxSizeStr)
      if (kindStr) (global as any).__tmp_kind = kindStr
      
      // Debug logs
      console.log('Tournament creation - isTeamBased:', (global as any).__tmp_isTeamBased)
      console.log('Tournament creation - teamMinSizeStr:', teamMinSizeStr, '-> parsed:', (global as any).__tmp_teamMinSize)
      console.log('Tournament creation - teamMaxSizeStr:', teamMaxSizeStr, '-> parsed:', (global as any).__tmp_teamMaxSize)
      const regDL = form.get('registrationDeadline') as string | null
      if (regDL) registrationDeadline = regDL
    } else {
      const body = await request.json()
      name = body?.name
      description = body?.description
      prizes = body?.prizes
      rules = body?.rules
      game = body?.game
      gameId = body?.gameId
      format = body?.format || 'SINGLE_ELIMINATION'
      visibility = body?.visibility || 'PUBLIC'
      startDate = body?.startDate
      endDate = body?.endDate
      ;(global as any).__tmp_isTeamBased = body?.isTeamBased === true
      if (body?.maxParticipants) {
        const parsed = parseInteger(String(body.maxParticipants))
        ;(global as any).__tmp_maxParticipants = parsed !== null ? parsed : undefined
      } else {
        ;(global as any).__tmp_maxParticipants = undefined
      }
      // Parser teamMinSize et teamMaxSize même si vides (retournera null si vide ou invalide)
      ;(global as any).__tmp_teamMinSize = body?.teamMinSize !== undefined && body?.teamMinSize !== null && body?.teamMinSize !== '' 
        ? parseInteger(String(body.teamMinSize)) 
        : null
      ;(global as any).__tmp_teamMaxSize = body?.teamMaxSize !== undefined && body?.teamMaxSize !== null && body?.teamMaxSize !== '' 
        ? parseInteger(String(body.teamMaxSize)) 
        : null
      registrationDeadline = body?.registrationDeadline
    }

    if (!name) {
      return NextResponse.json({ message: 'Nom requis' }, { status: 400 })
    }

    if (!startDate) {
      return NextResponse.json({ message: 'Date de début requise' }, { status: 400 })
    }

    // Vérifier que l'utilisateur existe (évite P2003 si session périmée)
    const existingUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!existingUser) {
      return NextResponse.json({ message: 'Session expirée. Veuillez vous reconnecter.' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est administrateur
    if (!(existingUser as any).isAdmin) {
      return NextResponse.json({ message: 'Accès réservé aux administrateurs' }, { status: 403 })
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

    // Coercion des enums (MVP: toujours SINGLE_ELIMINATION + PUBLIC)
    const safeFormat = 'SINGLE_ELIMINATION'
    const safeVisibility = visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'

    // Validation de teamMinSize et teamMaxSize si fournis
    const teamMinSize = (global as any).__tmp_teamMinSize
    const teamMaxSize = (global as any).__tmp_teamMaxSize
    if (teamMinSize !== undefined && teamMinSize !== null) {
      if (typeof teamMinSize !== 'number' || teamMinSize < 1) {
        return NextResponse.json({ 
          message: 'La taille minimale d\'équipe doit être au moins 1' 
        }, { status: 400 })
      }
    }
    if (teamMaxSize !== undefined && teamMaxSize !== null) {
      if (typeof teamMaxSize !== 'number' || teamMaxSize < 1) {
        return NextResponse.json({ 
          message: 'La taille maximale d\'équipe doit être au moins 1' 
        }, { status: 400 })
      }
    }
    // Vérifier que minSize <= maxSize si les deux sont définis
    if (teamMinSize !== undefined && teamMinSize !== null && 
        teamMaxSize !== undefined && teamMaxSize !== null && 
        teamMinSize > teamMaxSize) {
      return NextResponse.json({ 
        message: 'La taille minimale ne peut pas être supérieure à la taille maximale' 
      }, { status: 400 })
    }

    try {
      // Si uniquement gameId fourni, récupérer le nom pour le champ legacy
      if (!game && gameId) {
        const g = await prisma.game.findUnique({ where: { id: gameId } })
        if (g) game = g.name
      }
      
      // Debug: vérifier les valeurs avant création
      const teamMinSizeValue = (global as any).__tmp_teamMinSize
      const teamMaxSizeValue = (global as any).__tmp_teamMaxSize
      console.log('Before tournament creation - teamMinSize:', teamMinSizeValue, 'type:', typeof teamMinSizeValue)
      console.log('Before tournament creation - teamMaxSize:', teamMaxSizeValue, 'type:', typeof teamMaxSizeValue)
      console.log('Before tournament creation - isTeamBased:', (global as any).__tmp_isTeamBased)
      
      const tournament = await prisma.tournament.create({
        data: {
        name: name!,
        description: description || null,
        prizes: prizes || null,
        rules: rules || null,
        game: game || null,
        gameId: gameId || null,
        format: safeFormat,
        visibility: safeVisibility,
        posterUrl: posterUrl || null,
        logoUrl: logoUrl || null,
        isTeamBased: Boolean((global as any).__tmp_isTeamBased),
        maxParticipants: (global as any).__tmp_maxParticipants !== undefined ? (global as any).__tmp_maxParticipants : null,
        teamMinSize: teamMinSizeValue ?? null,
        teamMaxSize: teamMaxSizeValue ?? null,
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
    const mineParam = searchParams.get('mine')
    const mine = mineParam === '1' || mineParam === 'true'
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
      sort === 'featured' ? { featuredPosition: 'asc' } :
      { createdAt: 'desc' }


    const tournaments = await prisma.tournament.findMany({
      where,
      orderBy,
      include: {
        organizer: {
          select: {
            id: true,
            pseudo: true
          }
        },
        gameRef: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            logoUrl: true,
            posterUrl: true
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


