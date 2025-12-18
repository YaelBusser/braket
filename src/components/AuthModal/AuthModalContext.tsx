'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import AuthModal from './index'

interface AuthModalContextType {
  openAuthModal: (mode?: 'login' | 'register') => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const openAuthModal = (initialMode: 'login' | 'register' = 'login') => {
    setMode(initialMode)
    setIsOpen(true)
  }

  const closeAuthModal = () => {
    setIsOpen(false)
  }

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      <AuthModal 
        isOpen={isOpen} 
        onClose={closeAuthModal}
        initialMode={mode}
      />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

