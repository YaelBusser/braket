'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './index.module.scss'

interface Game {
  id: string
  name: string
  slug?: string
}

interface TournamentFiltersProps {
  games: Game[]
  selectedGames: string[]
  onGamesChange: (gameIds: string[]) => void
  statusFilter: 'all' | 'in_progress' | 'upcoming' | 'completed'
  onStatusChange: (status: 'all' | 'in_progress' | 'upcoming' | 'completed') => void
}

export default function TournamentFilters({
  games,
  selectedGames,
  onGamesChange,
  statusFilter,
  onStatusChange
}: TournamentFiltersProps) {
  const [isGamesDropdownOpen, setIsGamesDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGamesDropdownOpen(false)
      }
    }

    if (isGamesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isGamesDropdownOpen])

  const toggleGame = (gameId: string) => {
    if (selectedGames.includes(gameId)) {
      onGamesChange(selectedGames.filter(id => id !== gameId))
    } else {
      onGamesChange([...selectedGames, gameId])
    }
  }

  const getSelectedGamesLabel = () => {
    if (selectedGames.length === 0) {
      return 'Tous les jeux'
    }
    if (selectedGames.length === 1) {
      const game = games.find(g => g.id === selectedGames[0])
      return game ? game.name : '1 jeu'
    }
    return `${selectedGames.length} jeux`
  }

  return (
    <div className={styles.filtersContainer}>
      {/* Filtre Jeux */}
      <div className={styles.filterWrapper} ref={dropdownRef}>
        <button
          className={`${styles.filterButton} ${isGamesDropdownOpen ? styles.filterButtonActive : ''}`}
          onClick={() => setIsGamesDropdownOpen(!isGamesDropdownOpen)}
          type="button"
        >
          <span className={styles.filterLabel}>Jeux</span>
          <span className={styles.filterValue}>{getSelectedGamesLabel()}</span>
          <svg
            className={`${styles.dropdownIcon} ${isGamesDropdownOpen ? styles.dropdownIconOpen : ''}`}
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>

        {isGamesDropdownOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownHeader}>
              <span className={styles.dropdownTitle}>Sélectionner les jeux</span>
              {selectedGames.length > 0 && (
                <button
                  className={styles.clearButton}
                  onClick={() => onGamesChange([])}
                  type="button"
                >
                  Tout effacer
                </button>
              )}
            </div>
            <div className={styles.dropdownContent}>
              {games.length === 0 ? (
                <div className={styles.emptyMessage}>Aucun jeu disponible</div>
              ) : (
                games.map(game => (
                  <label key={game.id} className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedGames.includes(game.id)}
                      onChange={() => toggleGame(game.id)}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>{game.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filtres de statut */}
      <div className={styles.statusFilters}>
        <button
          className={`${styles.statusButton} ${statusFilter === 'all' ? styles.statusButtonActive : ''}`}
          onClick={() => onStatusChange('all')}
          type="button"
        >
          Tous
        </button>
        <button
          className={`${styles.statusButton} ${statusFilter === 'upcoming' ? styles.statusButtonActive : ''}`}
          onClick={() => onStatusChange('upcoming')}
          type="button"
        >
          À venir
        </button>
        <button
          className={`${styles.statusButton} ${statusFilter === 'in_progress' ? styles.statusButtonActive : ''}`}
          onClick={() => onStatusChange('in_progress')}
          type="button"
        >
          En cours
        </button>
        <button
          className={`${styles.statusButton} ${statusFilter === 'completed' ? styles.statusButtonActive : ''}`}
          onClick={() => onStatusChange('completed')}
          type="button"
        >
          Terminé
        </button>
      </div>
    </div>
  )
}
