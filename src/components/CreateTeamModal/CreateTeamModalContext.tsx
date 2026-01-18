'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import CreateTeamModal from './index'

interface CreateTeamModalContextType {
  openCreateTeamModal: () => void
  closeCreateTeamModal: () => void
}

const CreateTeamModalContext = createContext<CreateTeamModalContextType | undefined>(undefined)

export function CreateTeamModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openCreateTeamModal = () => {
    setIsOpen(true)
  }

  const closeCreateTeamModal = () => {
    setIsOpen(false)
  }

  return (
    <CreateTeamModalContext.Provider value={{ openCreateTeamModal, closeCreateTeamModal }}>
      {children}
      <CreateTeamModal 
        isOpen={isOpen} 
        onClose={closeCreateTeamModal}
        onTeamCreated={(teamId) => {
          closeCreateTeamModal()
          // Déclencher un événement pour rafraîchir les listes d'équipes
          window.dispatchEvent(new CustomEvent('team-created', { detail: { teamId } }))
        }}
      />
    </CreateTeamModalContext.Provider>
  )
}

export function useCreateTeamModal() {
  const context = useContext(CreateTeamModalContext)
  if (!context) {
    throw new Error('useCreateTeamModal must be used within CreateTeamModalProvider')
  }
  return context
}
