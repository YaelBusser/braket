import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId }
    if (unreadOnly) {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { notificationId, read } = await request.json()

    if (notificationId) {
      // Marquer une notification spécifique
      const notification = await prisma.notification.update({
        where: { id: notificationId, userId },
        data: { read: read ?? true }
      })
      return NextResponse.json({ notification })
    } else {
      // Marquer toutes les notifications comme lues
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true }
      })
      return NextResponse.json({ message: 'Toutes les notifications ont été marquées comme lues' })
    }
  } catch (error) {
    console.error('Update notification error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const notificationId = searchParams.get('notificationId')

    if (!notificationId) {
      return NextResponse.json({ message: 'ID de notification requis' }, { status: 400 })
    }

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!notification || notification.userId !== userId) {
      return NextResponse.json({ message: 'Notification introuvable' }, { status: 404 })
    }

    // Supprimer la notification
    await prisma.notification.delete({
      where: { id: notificationId }
    })

    return NextResponse.json({ message: 'Notification supprimée' })
  } catch (error) {
    console.error('Delete notification error:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
