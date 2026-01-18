'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import TeamSelectionModal from './index'

type TeamSelectionModalContextType = {
  openTeamSelectionModal: (tournamentId: string, tournament?: any, onTeamJoined?: () => void) => void
  closeTeamSelectionModal: () => void
}

const TeamSelectionModalContext = createContext<TeamSelectionModalContextType | undefined>(undefined)

export function TeamSelectionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [tournament, setTournament] = useState<any>(null)
  const [onTeamJoinedCallback, setOnTeamJoinedCallback] = useState<(() => void) | undefined>(undefined)

  const openTeamSelectionModal = (id: string, tournamentData?: any, onTeamJoined?: () => void) => {
    setTournamentId(id)
    setTournament(tournamentData || null)
    setOnTeamJoinedCallback(() => onTeamJoined)
    setIsOpen(true)
  }

  const closeTeamSelectionModal = () => {
    setIsOpen(false)
    setTournamentId(null)
    setTournament(null)
    setOnTeamJoinedCallback(undefined)
  }

  return (
    <TeamSelectionModalContext.Provider value={{ openTeamSelectionModal, closeTeamSelectionModal }}>
      {children}
      {tournamentId && (
        <TeamSelectionModal 
          isOpen={isOpen} 
          onClose={closeTeamSelectionModal}
          tournamentId={tournamentId}
          tournament={tournament}
          onTeamJoined={onTeamJoinedCallback}
        />
      )}
    </TeamSelectionModalContext.Provider>
  )
}

export function useTeamSelectionModal() {
  const context = useContext(TeamSelectionModalContext)
  if (!context) {
    throw new Error('useTeamSelectionModal must be used within TeamSelectionModalProvider')
  }
  return context
}
