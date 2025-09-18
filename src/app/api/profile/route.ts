import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    console.log('Profile API called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    
    if (!session?.user?.id) {
      console.log('No session or user ID')
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { pseudo } = await request.json()
    console.log('Received pseudo:', pseudo)

    if (!pseudo) {
      return NextResponse.json(
        { message: 'Pseudo est requis' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pseudo,
      }
    })

    console.log('User updated:', updatedUser)

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        pseudo: updatedUser.pseudo,
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
