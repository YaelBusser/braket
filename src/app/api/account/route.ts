import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined

    if (!userId) {
      return NextResponse.json(
        { message: 'Non authentifié' },
        { status: 401 }
      )
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json(
      { message: 'Compte supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la suppression du compte' },
      { status: 500 }
    )
  }
}
