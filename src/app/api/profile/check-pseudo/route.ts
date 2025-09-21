import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../lib/auth'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const pseudo = searchParams.get('pseudo')

    if (!pseudo || pseudo.length < 2) {
      return NextResponse.json(
        { available: false, message: 'Pseudo trop court' },
        { status: 400 }
      )
    }

    // Vérifier si le pseudo existe déjà (en excluant l'utilisateur actuel)
    const existingUser = await prisma.user.findFirst({
      where: {
        pseudo: pseudo,
        id: { not: userId }
      }
    })

    return NextResponse.json({
      available: !existingUser,
      pseudo: pseudo
    })

  } catch (error) {
    console.error('Check pseudo error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la vérification' },
      { status: 500 }
    )
  }
}
