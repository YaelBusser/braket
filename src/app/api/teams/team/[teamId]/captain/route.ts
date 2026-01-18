import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../lib/auth'
import { prisma } from '../../../../../../../lib/prisma'

// PATCH: Transférer le rôle de chef (seulement le chef actuel)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { teamId } = await params
    const { newCaptainUserId } = await request.json()

    if (!newCaptainUserId) {
      return NextResponse.json({ message: 'ID du nouveau chef requis' }, { status: 400 })
    }

    // Vérifier que l'utilisateur est le chef actuel
    const currentCaptain = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
      include: {
        team: {
          include: {
            tournament: {
              select: {
                id: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!currentCaptain || !currentCaptain.isCaptain) {
      return NextResponse.json({ message: 'Vous n\'êtes pas le chef de cette équipe' }, { status: 403 })
    }

    // Vérifier que le nouveau chef est membre de l'équipe
    const newCaptain = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId: newCaptainUserId } }
    })

    if (!newCaptain) {
      return NextResponse.json({ message: 'Le nouveau chef doit être membre de l\'équipe' }, { status: 400 })
    }

    if (newCaptainUserId === userId) {
      return NextResponse.json({ message: 'Vous êtes déjà le chef' }, { status: 400 })
    }

    // Transférer le rôle
    await prisma.$transaction([
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId } },
        data: { isCaptain: false }
      }),
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: newCaptainUserId } },
        data: { isCaptain: true }
      })
    ])

    return NextResponse.json({ message: 'Rôle de chef transféré' })
  } catch (error) {
    console.error('Transfer captain error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
