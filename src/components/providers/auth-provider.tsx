'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      refetchOnWindowFocus={false}
      refetchInterval={0}
      // Éviter les problèmes d'hydratation en ne refetchant pas immédiatement
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
