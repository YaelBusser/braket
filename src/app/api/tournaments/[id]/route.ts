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
        organizer: { select: { pseudo: true } },
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

    const existing = await prisma.tournament.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (existing.organizerId !== userId) {
      return NextResponse.json({ message: 'Interdit' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, game, format, visibility, startDate, endDate, status, registrationDeadline } = body || {}

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
      },
    })

    return NextResponse.json({ tournament: updated })
  } catch (error) {
    console.error('Update tournament error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

// Endpoints d'état simples via PATCH?mode=action
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const url = new URL(request.url)
    const mode = url.searchParams.get('mode')
    const t = await prisma.tournament.findUnique({ where: { id } })
    if (!t) return NextResponse.json({ message: 'Introuvable' }, { status: 404 })
    if (t.organizerId !== userId) return NextResponse.json({ message: 'Interdit' }, { status: 403 })

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


