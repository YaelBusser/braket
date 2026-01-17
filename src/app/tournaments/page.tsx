'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { TournamentCard, SearchBar, PageContent, TournamentFilters } from '@/components/ui'
import Link from 'next/link'
import styles from './page.module.scss'

interface Game {
  id: string
  name: string
  slug: string
}

type TournamentStatusFilter = 'all' | 'in_progress' | 'upcoming' | 'completed'

export default function TournamentsIndex() {
  return <TournamentsList />
}

function TournamentsList() {
  const { data: session } = useSession()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<TournamentStatusFilter>('all')
  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const userId = (session?.user as any)?.id || null
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Charger la liste des jeux disponibles
  useEffect(() => {
    const loadGames = async () => {
      try {
        const res = await fetch('/api/games')
        const data = await res.json()
        setAvailableGames(data.games || [])
      } catch (error) {
        console.error('Error loading games for filter:', error)
        setAvailableGames([])
      }
    }
    loadGames()
  }, [])

  // Fonction de debounce pour la recherche
  const debounce = useCallback((fn: () => void, delay: number) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(fn, delay)
  }, [])

  // Charger les tournois avec filtres
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      
      // Ajouter le filtre de statut
      if (statusFilter !== 'all') {
        const now = new Date()
        if (statusFilter === 'upcoming') {
          params.set('startMin', now.toISOString())
        } else if (statusFilter === 'in_progress') {
          params.set('status', 'IN_PROGRESS')
          params.set('startMax', now.toISOString())
        } else if (statusFilter === 'completed') {
          params.set('status', 'COMPLETED')
        }
      }
      
      const res = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await res.json()
      let tournaments = data.tournaments || []
      
      // Filtrer par jeux sélectionnés côté client
      if (selectedGameIds.length > 0) {
        tournaments = tournaments.filter((t: any) => {
          if (t.gameRef && t.gameRef.id) {
            return selectedGameIds.includes(t.gameRef.id)
          }
          if (t.gameId) {
            return selectedGameIds.includes(t.gameId)
          }
          // Fallback sur le nom du jeu
          if (t.game) {
            return selectedGameIds.some(gameId => {
              const game = availableGames.find(g => g.id === gameId)
              return game && game.name === t.game
            })
          }
          return false
        })
      }
      
      // Filtrer par statut côté client (pour les cas où l'API ne le fait pas)
      if (statusFilter !== 'all') {
        const now = new Date()
        tournaments = tournaments.filter((t: any) => {
          const startDate = t.startDate ? new Date(t.startDate) : null
          switch (statusFilter) {
            case 'upcoming':
              return !startDate || startDate > now
            case 'in_progress':
              return startDate && startDate <= now && t.status === 'IN_PROGRESS'
            case 'completed':
              return t.status === 'COMPLETED'
            default:
              return true
          }
        })
      }
      
      setItems(tournaments)
      setLoading(false)
    }

    debounce(load, q.trim() ? 300 : 0)
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [q, selectedGameIds, statusFilter, availableGames, debounce])

  return (
    <PageContent style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <h1 className={styles.title}>Tournois</h1>
      
      {/* Barre de recherche avec filtres */}
      <div className={styles.searchSection}>
        <div className={styles.searchBarWrapper}>
          <SearchBar
            placeholder="Rechercher un tournoi..."
            size="md"
            variant="dark"
            onSearch={(v) => setQ(v || '')}
            autoSearchDelay={300}
            defaultValue={q}
            className={styles.customSearchBar}
          />
        </div>
        
        {/* Filtres à droite de la barre de recherche */}
        <div className={styles.filtersWrapper}>
          <TournamentFilters
            games={availableGames}
            selectedGames={selectedGameIds}
            onGamesChange={setSelectedGameIds}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.tournamentsGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <TournamentCard key={index} loading={true} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyMessage}>
            {q ? `Aucun tournoi trouvé pour "${q}"` : 'Aucun tournoi public'}
          </p>
        </div>
      ) : (
        <div className={styles.tournamentsGrid}>
          {items.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              userId={userId}
            />
          ))}
        </div>
      )}
    </PageContent>
  )
}


