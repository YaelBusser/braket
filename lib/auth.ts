import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import DiscordProvider from 'next-auth/providers/discord'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  // Temporairement sans adapter pour éviter les erreurs
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    }),
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
    async signIn({ user, account, profile }) {
      // Si c'est une connexion OAuth (Discord ou Google)
      if (account && (account.provider === 'discord' || account.provider === 'google')) {
        if (!user.email) {
          return false
        }

        try {
          // Vérifier si l'utilisateur existe déjà
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true }
          })

          if (!existingUser) {
            // Générer un pseudo à partir du nom ou de l'email
            let pseudo = user.name || user.email.split('@')[0]
            // Nettoyer le pseudo (enlever les caractères spéciaux, espaces, etc.)
            pseudo = pseudo
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '')
              .substring(0, 20)
            
            // S'assurer que le pseudo n'est pas vide
            if (!pseudo || pseudo.length === 0) {
              pseudo = 'user'
            }
            
            // Vérifier que le pseudo est unique, sinon ajouter un suffixe
            let uniquePseudo = pseudo
            let counter = 1
            while (await prisma.user.findFirst({ where: { pseudo: uniquePseudo } })) {
              uniquePseudo = `${pseudo}${counter}`
              counter++
            }

            // Créer l'utilisateur en base de données (toujours particulier pour OAuth)
            await prisma.user.create({
              data: {
                email: user.email,
                pseudo: uniquePseudo,
                name: user.name || null,
                image: user.image || null,
                avatarUrl: user.image || null,
                passwordHash: null, // Pas de mot de passe pour les utilisateurs OAuth
              }
            })
          }
        } catch (error) {
          console.error('Error creating OAuth user:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session, account }) {
      // On login, hydrater le token avec les infos de l'utilisateur
      if (user) {
        // Pour les connexions OAuth, récupérer l'utilisateur depuis la base de données
        if (account && (account.provider === 'discord' || account.provider === 'google')) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email! },
              select: { id: true, pseudo: true, avatarUrl: true, image: true }
            })
            if (dbUser) {
              token.id = dbUser.id
              token.name = dbUser.pseudo
              token.picture = dbUser.avatarUrl || dbUser.image || null
            } else {
              token.id = (user as any).id
              token.name = user.name
              token.picture = (user as any).image
            }
          } catch (error) {
            console.error('Error fetching user in jwt callback:', error)
            token.id = (user as any).id
            token.name = user.name
            token.picture = (user as any).image
          }
        } else {
          // Pour les connexions credentials, récupérer l'utilisateur depuis la base de données
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: (user as any).email || '' },
              select: { id: true, pseudo: true, avatarUrl: true, image: true }
            })
            if (dbUser) {
              token.id = dbUser.id
              token.name = dbUser.pseudo
              token.picture = dbUser.avatarUrl || dbUser.image || null
            } else {
              token.id = (user as any).id
              token.name = user.name
              token.picture = (user as any).image
            }
          } catch (error) {
            console.error('Error fetching user in jwt callback:', error)
            token.id = (user as any).id
            token.name = user.name
            token.picture = (user as any).image
          }
        }
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
