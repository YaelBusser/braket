import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, pseudo } = await request.json()

    // Validation
    if (!email || !password || !pseudo) {
      return NextResponse.json(
        { message: 'Tous les champs sont requis' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Un compte avec cet email existe déjà' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        pseudo,
        // stocker la préférence dans image (temp) ? mieux: une table/colonne dédiée; pour MVP, localStorage côté client
      }
    })

    // Return user without password
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: 'Compte créé avec succès', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de la création du compte' },
      { status: 500 }
    )
  }
}
