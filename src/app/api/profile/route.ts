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
      select: { id: true, email: true, pseudo: true, avatarUrl: true, bannerUrl: true } as any
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    // Utiliser la bannière par défaut si aucune bannière n'est définie
    const userWithDefaultBanner = {
      ...user,
      bannerUrl: (user as any).bannerUrl || '/images/games/@games.jpg'
    }

    return NextResponse.json({ user: userWithDefaultBanner })
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
    // Conserver l'URL de l'ancien avatar/bannière pour nettoyage après mise à jour
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, bannerUrl: true } as any
    })
    let pseudoFromBody: string | undefined
    let avatarUrlToSet: string | undefined
    let bannerUrlToSet: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const pseudo = formData.get('pseudo') as string | null
      const avatarFile = formData.get('avatar') as File | null
      const bannerFile = formData.get('banner') as File | null

      if (pseudo) {
        pseudoFromBody = pseudo
      }

      if (avatarFile && typeof avatarFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(avatarFile.type)) {
          return NextResponse.json(
            { message: 'Type de fichier non pris en charge' },
            { status: 400 }
          )
        }

        const maxSize = 5 * 1024 * 1024 // 5MB
        if ((avatarFile as any).size && (avatarFile as any).size > maxSize) {
          return NextResponse.json(
            { message: 'Fichier trop volumineux (max 5MB)' },
            { status: 400 }
          )
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (avatarFile as any).name || 'avatar'
        const ext = path.extname(originalName) || (avatarFile.type === 'image/png' ? '.png' : avatarFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await avatarFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        avatarUrlToSet = `/uploads/avatars/${fileName}`
      }

      if (bannerFile && typeof bannerFile === 'object') {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp']
        if (!allowedTypes.includes(bannerFile.type)) {
          return NextResponse.json(
            { message: 'Type de fichier non pris en charge pour la bannière' },
            { status: 400 }
          )
        }

        const maxSize = 10 * 1024 * 1024 // 10MB pour les bannières
        if ((bannerFile as any).size && (bannerFile as any).size > maxSize) {
          return NextResponse.json(
            { message: 'Fichier trop volumineux (max 10MB)' },
            { status: 400 }
          )
        }

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'banners')
        if (!fs.existsSync(uploadDir)) {
          await fsp.mkdir(uploadDir, { recursive: true })
        }

        const originalName = (bannerFile as any).name || 'banner'
        const ext = path.extname(originalName) || (bannerFile.type === 'image/png' ? '.png' : bannerFile.type === 'image/webp' ? '.webp' : '.jpg')
        const fileName = `${userId}-${Date.now()}${ext}`
        const filePath = path.join(uploadDir, fileName)

        const arrayBuffer = await bannerFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fsp.writeFile(filePath, buffer)

        bannerUrlToSet = `/uploads/banners/${fileName}`
      }
    } else {
      const { pseudo } = await request.json()
      pseudoFromBody = pseudo
    }

    if (!pseudoFromBody && !avatarUrlToSet && !bannerUrlToSet) {
      return NextResponse.json(
        { message: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      )
    }

    // Vérifier l'unicité du pseudo si un nouveau pseudo est fourni
    if (pseudoFromBody) {
      const existingUserWithPseudo = await prisma.user.findFirst({
        where: {
          pseudo: pseudoFromBody,
          id: { not: userId } // Exclure l'utilisateur actuel
        }
      })

      if (existingUserWithPseudo) {
        return NextResponse.json(
          { message: 'Ce pseudo est déjà utilisé par un autre utilisateur' },
          { status: 400 }
        )
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(pseudoFromBody ? { pseudo: pseudoFromBody } : {}),
        ...(avatarUrlToSet ? { avatarUrl: avatarUrlToSet } : {}),
        ...(bannerUrlToSet ? { bannerUrl: bannerUrlToSet as any } : {}),
      } as any
    })

    console.log('User updated:', updatedUser)

    // Nettoyage: supprimer l'ancien avatar si un nouveau a été uploadé
    const existingAvatarUrl = (existingUser as any)?.avatarUrl
    if (avatarUrlToSet && existingAvatarUrl && existingAvatarUrl !== avatarUrlToSet) {
      try {
        // Ne supprimer que si le fichier est dans notre répertoire uploads/avatars
        if (existingAvatarUrl.startsWith('/uploads/avatars/')) {
          const oldFilePath = path.join(process.cwd(), 'public', existingAvatarUrl)
          if (fs.existsSync(oldFilePath)) {
            await fsp.unlink(oldFilePath)
          }
        }
      } catch (cleanupError) {
        console.warn('Impossible de supprimer l\'ancien avatar:', cleanupError)
      }
    }

    // Nettoyage: supprimer l'ancienne bannière si une nouvelle a été uploadée
    const existingBannerUrl = (existingUser as any)?.bannerUrl
    if (bannerUrlToSet && existingBannerUrl && existingBannerUrl !== bannerUrlToSet) {
      try {
        // Ne supprimer que si le fichier est dans notre répertoire uploads/banners
        if (existingBannerUrl.startsWith('/uploads/banners/')) {
          const oldFilePath = path.join(process.cwd(), 'public', existingBannerUrl)
          if (fs.existsSync(oldFilePath)) {
            await fsp.unlink(oldFilePath)
          }
        }
      } catch (cleanupError) {
        console.warn('Impossible de supprimer l\'ancienne bannière:', cleanupError)
      }
    }

    const updatedUserBannerUrl = (updatedUser as any).bannerUrl || '/images/games/@games.jpg'

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        pseudo: updatedUser.pseudo,
        avatarUrl: updatedUser.avatarUrl,
        bannerUrl: updatedUserBannerUrl,
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
