import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { pseudo, type } = await request.json()

    if (!pseudo || !type) {
      return NextResponse.json(
        { message: 'Pseudo et type sont requis' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pseudo,
        type: type as 'particulier' | 'association' | 'entreprise',
      }
    })

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        pseudo: updatedUser.pseudo,
        type: updatedUser.type,
        avatarUrl: updatedUser.avatarUrl,
      }
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    )
  }
}
