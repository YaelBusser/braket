import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // Temporairement sans adapter pour éviter les erreurs
  // adapter: PrismaAdapter(prisma),
  providers: [
    // GoogleProvider temporairement désactivé
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          })

          if (!user || !user.passwordHash) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.pseudo,
            image: user.avatarUrl,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    // garder la session active (cookies) pendant 30 jours
    maxAge: 60 * 60 * 24 * 30,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On login, hydrater le token avec les infos de l'utilisateur
      if (user) {
        token.id = (user as any).id
        token.name = user.name
        // "image" est la clé utilisée par NextAuth pour l'avatar côté token/session
        token.picture = (user as any).image
      }

      // Lors d'un session.update côté client, propager les champs mis à jour dans le token
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name
        if ((session as any).image) token.picture = (session as any).image
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        if (token.name) {
          session.user.name = token.name as string
        }
        if ((token as any).picture) {
          session.user.image = (token as any).picture as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
}
