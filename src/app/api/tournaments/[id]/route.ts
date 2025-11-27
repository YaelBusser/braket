import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'
import { generateSingleEliminationBracket, validateTournamentStart } from '../../../../lib/bracket-generator'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, pseudo: true, avatarUrl: true } },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } },
          },
        },
        matches: {
          include: { teamA: true, teamB: true, winnerTeam: true }
        },
        _count: { select: { registrations: true } },
        registrations: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } },
      },
    })

    if (!tournament) {
      return NextResponse.json({ message: 'Tournoi introuvable' }, { status: 404 })
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Get tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const existing = await prisma.tournament.findUnique({ 
      where: { id },
      include: {
        _count: { select: { registrations: true } }
      }
    })
    if (!existing) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (existing.organizerId !== userId) {
      return NextResponse.json({ message: 'Interdit' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, description, game, format, visibility, startDate, endDate, status, registrationDeadline,
      bracketMinTeams, bracketMaxTeams, maxParticipants
    } = body || {}

    // Validation des paramètres du bracket si fournis
    if (bracketMinTeams !== undefined || bracketMaxTeams !== undefined) {
      // Vérifier que le tournoi n'a pas encore commencé
      if (existing.status !== 'REG_OPEN') {
        return NextResponse.json({ 
          message: 'Impossible de modifier le bracket : le tournoi a déjà commencé' 
        }, { status: 400 })
      }

      // Convertir en nombres pour la validation
      const min = bracketMinTeams !== undefined ? parseInt(String(bracketMinTeams), 10) : existing.bracketMinTeams || 2
      const max = bracketMaxTeams !== undefined ? parseInt(String(bracketMaxTeams), 10) : existing.bracketMaxTeams || 8
      const validMaxValues = [2, 4, 8, 16, 32, 64, 128, 256]

      if (isNaN(min) || min < 2) {
        return NextResponse.json({ 
          message: 'Le minimum doit être au moins 2' 
        }, { status: 400 })
      }

      if (isNaN(max) || !validMaxValues.includes(max)) {
        return NextResponse.json({ 
          message: `Le maximum doit être l'un des suivants: ${validMaxValues.join(', ')}` 
        }, { status: 400 })
      }

      if (min > max) {
        return NextResponse.json({ 
          message: 'Le minimum ne peut pas être supérieur au maximum' 
        }, { status: 400 })
      }
    }

    // Validation de maxParticipants si fourni
    if (maxParticipants !== undefined) {
      // Vérifier que le tournoi n'a pas encore commencé
      if (existing.status !== 'REG_OPEN') {
        return NextResponse.json({ 
          message: 'Impossible de modifier le nombre maximum de participants : le tournoi a déjà commencé' 
        }, { status: 400 })
      }

      const maxParticipantsNum = maxParticipants === null || maxParticipants === '' ? null : parseInt(String(maxParticipants), 10)
      
      if (maxParticipantsNum !== null && (isNaN(maxParticipantsNum) || maxParticipantsNum < 2)) {
        return NextResponse.json({ 
          message: 'Le nombre maximum de participants doit être au moins 2 ou vide pour illimité' 
        }, { status: 400 })
      }

      // Vérifier que le nouveau max n'est pas inférieur au nombre actuel d'inscriptions
      const currentRegistrations = existing._count?.registrations || 0
      if (maxParticipantsNum !== null && maxParticipantsNum < currentRegistrations) {
        return NextResponse.json({ 
          message: `Le nombre maximum de participants ne peut pas être inférieur au nombre actuel d'inscriptions (${currentRegistrations})` 
        }, { status: 400 })
      }
    }

    const updated = await prisma.tournament.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(game !== undefined ? { game } : {}),
        ...(format !== undefined ? { format } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(registrationDeadline !== undefined ? { registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null } : {}),
        ...(bracketMinTeams !== undefined ? { bracketMinTeams: bracketMinTeams !== null && bracketMinTeams !== '' ? parseInt(String(bracketMinTeams), 10) : null } : {}),
        ...(bracketMaxTeams !== undefined ? { bracketMaxTeams: bracketMaxTeams !== null && bracketMaxTeams !== '' ? parseInt(String(bracketMaxTeams), 10) : null } : {}),
        ...(maxParticipants !== undefined ? { maxParticipants: maxParticipants === null || maxParticipants === '' ? null : parseInt(String(maxParticipants), 10) } : {}),
      },
      include: {
        organizer: { select: { id: true, pseudo: true, avatarUrl: true } },
        teams: {
          include: {
            members: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } },
          },
        },
        matches: {
          include: { teamA: true, teamB: true, winnerTeam: true }
        },
        _count: { select: { registrations: true } },
        registrations: { include: { user: { select: { id: true, pseudo: true, avatarUrl: true } } } },
      },
    })

    return NextResponse.json({ tournament: updated })
  } catch (error) {
    console.error('Update tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// Endpoints d'état simples via PUT?mode=action ou upload d'images
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const t = await prisma.tournament.findUnique({ where: { id } })
    if (!t) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (t.organizerId !== userId) return NextResponse.json({ message: 'Interdit' }, { status: 403 })

    const contentType = request.headers.get('content-type') || ''
    
    // Si c'est un upload d'image (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const logoFile = formData.get('logo') as File | null
      const posterFile = formData.get('poster') as File | null
      
      let logoUrlToSet: string | undefined
      let posterUrlToSet: string | undefined

      if (logoFile && typeof logoFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(logoFile.type)) {
          return NextResponse.json(
            { message: 'Type de fichier non pris en charge pour le logo' },
            { status: 400 }
          )
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if ((logoFile as any).size && (logoFile as any).size > maxSize) {
          return NextResponse.json(
            { message: 'Fichier trop volumineux (max 5MB)' },
            { status: 400 }
          )
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (logoFile as any).name || 'logo'
        const ext = path.extname(originalName) || (logoFile.type === 'image/png' ? '.png' : logoFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${id}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await logoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        logoUrlToSet = `/uploads/logos/${fileName}`
      }

      if (posterFile && typeof posterFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(posterFile.type)) {
          return NextResponse.json(
            { message: 'Type de fichier non pris en charge pour la bannière' },
            { status: 400 }
          )
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if ((posterFile as any).size && (posterFile as any).size > maxSize) {
          return NextResponse.json(
            { message: 'Fichier trop volumineux (max 10MB)' },
            { status: 400 }
          )
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'posters')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (posterFile as any).name || 'poster'
        const ext = path.extname(originalName) || (posterFile.type === 'image/png' ? '.png' : posterFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${id}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await posterFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        posterUrlToSet = `/uploads/posters/${fileName}`
      }

      // Supprimer les anciens fichiers si de nouveaux sont uploadés
      if (logoUrlToSet && t.logoUrl && t.logoUrl.startsWith('/uploads/logos/')) {
        try {
          const oldPath = path.join(process.cwd(), 'public', t.logoUrl)
          if (fs.existsSync(oldPath)) await fsp.unlink(oldPath)
        } catch {}
      }

      if (posterUrlToSet && t.posterUrl && t.posterUrl.startsWith('/uploads/posters/')) {
        try {
          const oldPath = path.join(process.cwd(), 'public', t.posterUrl)
          if (fs.existsSync(oldPath)) await fsp.unlink(oldPath)
        } catch {}
      }

      const updated = await prisma.tournament.update({
        where: { id },
        data: {
          ...(logoUrlToSet ? { logoUrl: logoUrlToSet } : {}),
          ...(posterUrlToSet ? { posterUrl: posterUrlToSet } : {}),
        },
      })

      return NextResponse.json({ tournament: updated })
    }

    // Sinon, c'est un changement d'état via ?mode=
    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')

    if (mode === 'open_reg') {
      const res = await prisma.tournament.update({ where: { id }, data: ({ status: 'REG_OPEN' } as any) })
      return NextResponse.json({ tournament: res })
    }
    if (mode === 'close_reg') {
      // Valider que le tournoi peut être démarré
      const validation = await validateTournamentStart(id)
      if (!validation.canStart) {
        return NextResponse.json({ 
          message: validation.reason || 'Impossible de démarrer le tournoi' 
        }, { status: 400 })
      }

      // Passer le tournoi en cours
      const updated = await prisma.tournament.update({ where: { id }, data: ({ status: 'IN_PROGRESS' } as any) })

      // Générer le bracket d'élimination directe
      try {
        const full = await prisma.tournament.findUnique({
          where: { id },
          include: {
            teams: { 
              include: { 
                members: { 
                  include: { 
                    user: { select: { id: true, pseudo: true } } 
                  } 
                } 
              } 
            },
            registrations: { 
              include: { 
                user: { select: { id: true, pseudo: true } } 
              } 
            }
          }
        })

        if (full) {
          let entrants: Array<{ teamId: string; teamName: string; members: Array<{ userId: string; user: { pseudo: string } }> }> = []

          if ((full as any).isTeamBased) {
            const minSize = (full as any).teamMinSize || 1
            const validTeams = (full as any).teams.filter((team: any) => team.members.length >= minSize)
            
            // Supprimer les équipes insuffisantes
            const toDelete = (full as any).teams.filter((team: any) => team.members.length < minSize).map((team: any) => team.id)
            if (toDelete.length > 0) {
              await prisma.teamMember.deleteMany({ where: { teamId: { in: toDelete } } })
              await prisma.team.deleteMany({ where: { id: { in: toDelete } } })
            }

            entrants = validTeams.map((team: any) => ({
              teamId: team.id,
              teamName: team.name,
              members: team.members.map((member: any) => ({
                userId: member.userId,
                user: { pseudo: member.user?.pseudo || 'Joueur' }
              }))
            }))
          } else {
            // Créer des équipes solo à partir des inscriptions
            for (const registration of (full as any).registrations) {
              const teamName = `Solo - ${registration.user?.pseudo || 'Joueur'}`
              const soloTeam = await prisma.team.create({
                data: { 
                  tournamentId: id, 
                  name: teamName, 
                  members: { 
                    create: { 
                      userId: registration.userId 
                    } 
                  } 
                }
              })
              
              entrants.push({
                teamId: soloTeam.id,
                teamName: soloTeam.name,
                members: [{
                  userId: registration.userId,
                  user: { pseudo: registration.user?.pseudo || 'Joueur' }
                }]
              })
            }
          }

          // Générer le bracket d'élimination directe
          const { matches, immediateWinners } = await generateSingleEliminationBracket(id, entrants)
          
          console.log(`Bracket généré: ${matches.length} matchs, ${immediateWinners.length} vainqueurs immédiats`)
        }
      } catch (error) {
        console.error('Erreur génération bracket:', error)
        return NextResponse.json({ 
          message: 'Erreur lors de la génération du bracket' 
        }, { status: 500 })
      }

      return NextResponse.json({ tournament: updated })
    }
    if (mode === 'finish') {
      const res = await prisma.tournament.update({ where: { id }, data: ({ status: 'COMPLETED', endDate: new Date() } as any) })
      return NextResponse.json({ tournament: res })
    }

    return NextResponse.json({ message: 'Mode inconnu' }, { status: 400 })
  } catch (error) {
    console.error('State change error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const existing = await prisma.tournament.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (existing.organizerId !== userId) return NextResponse.json({ message: 'Interdit' }, { status: 403 })

    // supprimer affiche si locale
    if (existing.posterUrl && existing.posterUrl.startsWith('/uploads/posters/')) {
      try {
        const p = path.join(process.cwd(), 'public', existing.posterUrl)
        if (fs.existsSync(p)) await fsp.unlink(p)
      } catch {}
    }

    await prisma.match.deleteMany({ where: { tournamentId: id } })
    const teams = await prisma.team.findMany({ where: { tournamentId: id } })
    await prisma.teamMember.deleteMany({ where: { teamId: { in: teams.map(t => t.id) } } })
    await prisma.team.deleteMany({ where: { tournamentId: id } })
    await prisma.tournamentRegistration.deleteMany({ where: { tournamentId: id } })
    await prisma.tournament.delete({ where: { id } })

    return NextResponse.json({ message: 'Tournoi supprimé' })
  } catch (error) {
    console.error('Delete tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}


