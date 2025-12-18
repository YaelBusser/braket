'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import CreateTournamentModal from './index'

interface CreateTournamentModalContextType {
  openCreateTournamentModal: () => void
  closeCreateTournamentModal: () => void
}

const CreateTournamentModalContext = createContext<CreateTournamentModalContextType | undefined>(undefined)

export function CreateTournamentModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openCreateTournamentModal = () => {
    setIsOpen(true)
  }

  const closeCreateTournamentModal = () => {
    setIsOpen(false)
  }

  return (
    <CreateTournamentModalContext.Provider value={{ openCreateTournamentModal, closeCreateTournamentModal }}>
      {children}
      <CreateTournamentModal 
        isOpen={isOpen} 
        onClose={closeCreateTournamentModal}
      />
    </CreateTournamentModalContext.Provider>
  )
}

export function useCreateTournamentModal() {
  const context = useContext(CreateTournamentModalContext)
  if (context === undefined) {
    throw new Error('useCreateTournamentModal must be used within a CreateTournamentModalProvider')
  }
  return context
}



