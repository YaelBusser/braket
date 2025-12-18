'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { TournamentCard, CircularCard, GameCardSkeleton, PageContent } from '@/components/ui'
import { formatRelativeTime } from '@/utils/dateUtils'
import Link from 'next/link'
import styles from './page.module.scss'

type FilterType = 'Tout' | 'Tournois' | 'Jeux' | 'Utilisateurs' | 'Équipes'

interface GameResult {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  logoUrl: string | null
  posterUrl: string | null
}

interface UserResult {
  id: string
  pseudo: string
  email: string
  avatarUrl: string | null
  createdAt?: string
}

interface TeamResult {
  id: string
  name: string
  game: string | null
  description: string | null
  members: Array<{
    user: {
      id: string
      pseudo: string
      avatarUrl: string | null
    }
  }>
  tournament: {
    id: string
    name: string
    game: string | null
  } | null
}

type TournamentStatusFilter = 'all' | 'upcoming' | 'in_progress' | 'completed'
type TournamentFormatFilter = 'all' | string

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PageContent style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Chargement de la recherche...</h1>
        </div>
      </PageContent>
    }>
      <SearchPageContent />
    </Suspense>
  )
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [q, setQ] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('Tout')
  
  // Filtres supplémentaires pour les tournois
  const [tournamentStatusFilter, setTournamentStatusFilter] = useState<TournamentStatusFilter>('all')
  const [tournamentFormatFilter, setTournamentFormatFilter] = useState<TournamentFormatFilter>('all')
  const [tournamentCategoryFilter, setTournamentCategoryFilter] = useState<string>('all')
  const userId = (session?.user as any)?.id || null
  
  // Results
  const [tournaments, setTournaments] = useState<any[]>([])
  const [games, setGames] = useState<GameResult[]>([])
  const [users, setUsers] = useState<UserResult[]>([])
  const [teams, setTeams] = useState<TeamResult[]>([])
  
  // Loading states
  const [loadingTournaments, setLoadingTournaments] = useState(false)
  const [loadingGames, setLoadingGames] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)

  // Références pour le debounce
  const tournamentsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gamesTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const usersTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const teamsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const gamesCacheRef = useRef<GameResult[]>([])

  // Mettre à jour q quand les paramètres de recherche changent
  useEffect(() => {
    const query = searchParams.get('q') || ''
    setQ(query)
  }, [searchParams])

  // Fonction de debounce générique
  const debounce = useCallback((fn: () => void, delay: number, timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(fn, delay)
  }, [])

  // Load tournaments avec debounce
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Tournois') {
      setTournaments([])
      return
    }
    
    const load = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setTournaments([])
        return
      }
      
      setLoadingTournaments(true)
      try {
        const res = await fetch(`/api/tournaments?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        setTournaments(data.tournaments || [])
      } catch (error) {
        console.error('Error loading tournaments:', error)
        setTournaments([])
      } finally {
        setLoadingTournaments(false)
      }
    }

    debounce(load, 300, tournamentsTimeoutRef)

    return () => {
      if (tournamentsTimeoutRef.current) {
        clearTimeout(tournamentsTimeoutRef.current)
      }
    }
  }, [q, activeFilter, debounce])

  // Load games avec debounce et cache
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Jeux') {
      setGames([])
      return
    }
    
    const load = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setGames([])
        return
      }
      
      setLoadingGames(true)
      try {
        // Utiliser le cache si disponible, sinon charger
        if (gamesCacheRef.current.length === 0) {
          const res = await fetch(`/api/games`)
          const data = await res.json()
          gamesCacheRef.current = data.games || []
        }
        
        const filtered = gamesCacheRef.current.filter((g: GameResult) => 
          g.name.toLowerCase().includes(q.toLowerCase()) || 
          g.slug.toLowerCase().includes(q.toLowerCase())
        )
        setGames(filtered)
      } catch (error) {
        console.error('Error loading games:', error)
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    debounce(load, 300, gamesTimeoutRef)

    return () => {
      if (gamesTimeoutRef.current) {
        clearTimeout(gamesTimeoutRef.current)
      }
    }
  }, [q, activeFilter, debounce])

  // Load users avec debounce
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Utilisateurs') {
      setUsers([])
      return
    }
    
    const load = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setUsers([])
        return
      }
      
      setLoadingUsers(true)
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error('Error loading users:', error)
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }

    debounce(load, 300, usersTimeoutRef)

    return () => {
      if (usersTimeoutRef.current) {
        clearTimeout(usersTimeoutRef.current)
      }
    }
  }, [q, activeFilter, debounce])

  // Load teams avec debounce
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Équipes') {
      setTeams([])
      return
    }
    
    const load = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setTeams([])
        return
      }
      
      setLoadingTeams(true)
      try {
        const res = await fetch(`/api/teams?q=${encodeURIComponent(q.trim())}`)
        const data = await res.json()
        setTeams(data.teams || [])
      } catch (error) {
        console.error('Error loading teams:', error)
        setTeams([])
      } finally {
        setLoadingTeams(false)
      }
    }

    debounce(load, 300, teamsTimeoutRef)

    return () => {
      if (teamsTimeoutRef.current) {
        clearTimeout(teamsTimeoutRef.current)
      }
    }
  }, [q, activeFilter, debounce])

  const filters: FilterType[] = ['Tout', 'Tournois', 'Jeux', 'Utilisateurs', 'Équipes']

  // Filtrer les tournois selon les filtres supplémentaires
  const getFilteredTournaments = () => {
    let filtered = tournaments

    // Filtre par statut
    if (tournamentStatusFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(t => {
        const startDate = t.startDate ? new Date(t.startDate) : null
        switch (tournamentStatusFilter) {
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

    // Filtre par format
    if (tournamentFormatFilter !== 'all') {
      filtered = filtered.filter(t => t.format === tournamentFormatFilter)
    }

    // Filtre par catégorie
    if (tournamentCategoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === tournamentCategoryFilter)
    }

    return filtered
  }

  // Obtenir les formats et catégories uniques des tournois
  const availableFormats = Array.from(new Set(tournaments.map(t => t.format).filter(Boolean)))
  const availableCategories = Array.from(new Set(tournaments.map(t => t.category).filter(Boolean)))

  const filteredTournaments = getFilteredTournaments()

  return (
    <PageContent style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {q ? `Résultats de la recherche ${q}` : 'Résultats de la recherche'}
          </h1>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div className={styles.filters}>
              {filters.map((filter) => (
                <button
                  key={filter}
                  className={`${styles.filterBtn} ${activeFilter === filter ? styles.filterBtnActive : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Filtres supplémentaires pour les tournois */}
            {(activeFilter === 'Tout' || activeFilter === 'Tournois') && tournaments.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Filtres de statut à gauche */}
                <div className={styles.filters} style={{ marginBottom: 0 }}>
                  {[
                    { id: 'all', label: 'Tous' },
                    { id: 'upcoming', label: 'À venir' },
                    { id: 'in_progress', label: 'En cours' },
                    { id: 'completed', label: 'Terminés' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      className={`${styles.filterBtn} ${tournamentStatusFilter === filter.id ? styles.filterBtnActive : ''}`}
                      onClick={() => setTournamentStatusFilter(filter.id as TournamentStatusFilter)}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                
                {/* Filtres supplémentaires à droite */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Filtre par format */}
                  {availableFormats.length > 0 && (
                    <div className={styles.filters} style={{ marginBottom: 0 }}>
                      <button
                        className={`${styles.filterBtn} ${tournamentFormatFilter === 'all' ? styles.filterBtnActive : ''}`}
                        onClick={() => setTournamentFormatFilter('all')}
                      >
                        Tous les formats
                      </button>
                      {availableFormats.map((format) => (
                        <button
                          key={format}
                          className={`${styles.filterBtn} ${tournamentFormatFilter === format ? styles.filterBtnActive : ''}`}
                          onClick={() => setTournamentFormatFilter(format)}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Filtre par catégorie */}
                  {availableCategories.length > 0 && (
                    <div className={styles.filters} style={{ marginBottom: 0 }}>
                      <button
                        className={`${styles.filterBtn} ${tournamentCategoryFilter === 'all' ? styles.filterBtnActive : ''}`}
                        onClick={() => setTournamentCategoryFilter('all')}
                      >
                        Toutes les catégories
                      </button>
                      {availableCategories.map((category) => (
                        <button
                          key={category}
                          className={`${styles.filterBtn} ${tournamentCategoryFilter === category ? styles.filterBtnActive : ''}`}
                          onClick={() => setTournamentCategoryFilter(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section Tournois */}
        {(activeFilter === 'Tout' || activeFilter === 'Tournois') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Tournois</h2>
            
            {loadingTournaments ? (
              <div className={styles.tournamentsList}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <TournamentCard key={index} loading={true} variant="compact" />
                ))}
              </div>
            ) : filteredTournaments.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {q ? `Aucun tournoi trouvé pour "${q}"` : 'Aucun tournoi trouvé'}
                </p>
              </div>
            ) : (
              <div className={styles.tournamentsList}>
                {filteredTournaments.map(t => (
                  <TournamentCard key={t.id} tournament={t} variant="compact" userId={userId} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Jeux */}
        {(activeFilter === 'Tout' || activeFilter === 'Jeux') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Jeux</h2>
            
            {loadingGames ? (
              <div className={styles.gamesGrid}>
                <GameCardSkeleton count={6} />
              </div>
            ) : games.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {q ? `Aucun jeu trouvé pour "${q}"` : 'Aucun jeu trouvé'}
                </p>
              </div>
            ) : (
              <div className={styles.gamesGrid}>
                {games.map(game => (
                  <Link key={game.id} href={`/games/${encodeURIComponent(game.name)}`} className={styles.gameCard}>
                    <div className={styles.gameImageContainer}>
                      {(() => {
                        const posterPath = game.posterUrl || game.imageUrl
                        return posterPath ? (
                          <img src={posterPath} alt={game.name} className={styles.gameImage} />
                        ) : (
                          <div className={styles.gameImagePlaceholder}>
                            {game.name.charAt(0).toUpperCase()}
                          </div>
                        )
                      })()}
                    </div>
                    <div className={styles.gameText}>
                      <h3 className={styles.gameTitle}>{game.name}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Utilisateurs */}
        {(activeFilter === 'Tout' || activeFilter === 'Utilisateurs') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Utilisateurs</h2>
            
            {loadingUsers ? (
              <div className={styles.emptyState}>
                <p>Chargement des utilisateurs...</p>
              </div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {q ? `Aucun utilisateur trouvé pour "${q}"` : 'Aucun utilisateur trouvé'}
                </p>
              </div>
            ) : (
              <div className={styles.circularList}>
                {users.map(user => (
                  <CircularCard
                    key={user.id}
                    id={user.id}
                    name={user.pseudo}
                    imageUrl={user.avatarUrl}
                    subtitle={user.createdAt ? `Inscrit(e) ${formatRelativeTime(user.createdAt).toLowerCase()}` : undefined}
                    href={`/profile/${user.id}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Équipes */}
        {(activeFilter === 'Tout' || activeFilter === 'Équipes') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Équipes</h2>
            
            {loadingTeams ? (
              <div className={styles.emptyState}>
                <p>Chargement des équipes...</p>
              </div>
            ) : teams.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyMessage}>
                  {q ? `Aucune équipe trouvée pour "${q}"` : 'Aucune équipe trouvée'}
                </p>
              </div>
            ) : (
              <div className={styles.circularList}>
                {teams.map(team => {
                  // Utiliser l'avatar du premier membre ou un placeholder
                  const teamImage = team.members[0]?.user?.avatarUrl || null
                  return (
                    <CircularCard
                      key={team.id}
                      id={team.id}
                      name={team.name}
                      imageUrl={teamImage}
                      subtitle={`${team.members.length} member${team.members.length > 1 ? 's' : ''}`}
                      href={`/teams/${team.id}`}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )}
    </PageContent>
  )
}
