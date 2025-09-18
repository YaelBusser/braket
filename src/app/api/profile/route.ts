import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'
import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, pseudo: true, avatarUrl: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Profile get error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('Profile API called')
    const session = await getServerSession(authOptions)
    console.log('Session:', session)
    
    const userId = (session?.user as any)?.id as string | undefined
    if (!userId) {
      console.log('No session or user ID')
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    // Conserver l'URL de l'ancien avatar pour nettoyage après mise à jour
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    })
    let pseudoFromBody: string | undefined
    let avatarUrlToSet: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const pseudo = formData.get('pseudo') as string | null
      const file = formData.get('avatar') as File | null

      if (pseudo) {
        pseudoFromBody = pseudo
      }

      if (file && typeof file === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { message: 'Type de fichier non pris en charge' },
            { status: 400 }
          )
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if ((file as any).size && (file as any).size > maxSize) {
          return NextResponse.json(
            { message: 'Fichier trop volumineux (max 5MB)' },
            { status: 400 }
          )
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (file as any).name || 'avatar'
        const ext = path.extname(originalName) || (file.type === 'image/png' ? '.png' : file.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        avatarUrlToSet = `/uploads/avatars/${fileName}`
      }
    } else {
      const { pseudo } = await request.json()
      pseudoFromBody = pseudo
    }

    if (!pseudoFromBody && !avatarUrlToSet) {
      return NextResponse.json(
        { message: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(pseudoFromBody ? { pseudo: pseudoFromBody } : {}),
        ...(avatarUrlToSet ? { avatarUrl: avatarUrlToSet } : {}),
      }
    })

    console.log('User updated:', updatedUser)

    // Nettoyage: supprimer l'ancien avatar si un nouveau a été uploadé
    if (avatarUrlToSet && existingUser?.avatarUrl && existingUser.avatarUrl !== avatarUrlToSet) {
      try {
        // Ne supprimer que si le fichier est dans notre répertoire uploads/avatars
        if (existingUser.avatarUrl.startsWith('/uploads/avatars/')) {
          const oldFilePath = path.join(process.cwd(), 'public', existingUser.avatarUrl)
          if (fs.existsSync(oldFilePath)) {
            await fsp.unlink(oldFilePath)
          }
        }
      } catch (cleanupError) {
        console.warn('Impossible de supprimer l\'ancien avatar:', cleanupError)
      }
    }

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
