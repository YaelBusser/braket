'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TournamentCard } from '@/components/ui'
import Link from 'next/link'
import styles from './page.module.scss'

type FilterType = 'Tout' | 'Tournois' | 'Jeux' | 'Utilisateurs' | 'Equipes'

interface GameResult {
  id: string
  name: string
  slug: string
  imageUrl: string | null
}

interface UserResult {
  id: string
  pseudo: string
  email: string
  avatarUrl: string | null
  isEnterprise: boolean
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

export default function SearchPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('Tout')
  
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q') || ''
    setQ(query)
  }, [])

  // Load tournaments
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Tournois') return
    
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
    load()
  }, [q, activeFilter])

  // Load games
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Jeux') return
    
    const load = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setGames([])
        return
      }
      
      setLoadingGames(true)
      try {
        const res = await fetch(`/api/games`)
        const data = await res.json()
        const allGames = data.games || []
        const filtered = allGames.filter((g: GameResult) => 
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
    load()
  }, [q, activeFilter])

  // Load users
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Utilisateurs') return
    
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
    load()
  }, [q, activeFilter])

  // Load teams
  useEffect(() => {
    if (activeFilter !== 'Tout' && activeFilter !== 'Equipes') return
    
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
    load()
  }, [q, activeFilter])

  const filters: FilterType[] = ['Tout', 'Tournois', 'Jeux', 'Utilisateurs', 'Equipes']

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {q ? `Résultats pour "${q}"` : 'Recherche'}
          </h1>
          
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
        </div>

        {/* Section Tournois */}
        {(activeFilter === 'Tout' || activeFilter === 'Tournois') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Tournois</h2>
            
            {loadingTournaments ? (
              <div className={styles.emptyState}>Chargement des tournois...</div>
            ) : tournaments.length === 0 ? (
              <div className={styles.emptyState}>
                {q ? `Aucun tournoi trouvé pour "${q}".` : 'Commencez une recherche pour trouver des tournois.'}
              </div>
            ) : (
              <div className={styles.tournamentsGrid}>
                {tournaments.map(t => (
                  <TournamentCard key={t.id} tournament={t} />
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
              <div className={styles.emptyState}>Chargement des jeux...</div>
            ) : games.length === 0 ? (
              <div className={styles.emptyState}>
                {q ? `Aucun jeu trouvé pour "${q}".` : 'Commencez une recherche pour trouver des jeux.'}
              </div>
            ) : (
              <div className={styles.gamesGrid}>
                {games.map(game => (
                  <Link key={game.id} href={`/games/${encodeURIComponent(game.name)}`} className={styles.gameCard}>
                    <div className={styles.gameImageContainer}>
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.name} className={styles.gameImage} />
                      ) : (
                        <div className={styles.gameImagePlaceholder}>
                          {game.name.charAt(0).toUpperCase()}
                        </div>
                      )}
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
              <div className={styles.emptyState}>Chargement des utilisateurs...</div>
            ) : users.length === 0 ? (
              <div className={styles.emptyState}>
                {q ? `Aucun utilisateur trouvé pour "${q}".` : 'Commencez une recherche pour trouver des utilisateurs.'}
              </div>
            ) : (
              <div className={styles.usersGrid}>
                {users.map(user => (
                  <Link key={user.id} href={`/profile/${user.id}`} className={styles.userCard}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.pseudo} className={styles.userAvatar} />
                    ) : (
                      <div className={styles.userAvatarPlaceholder}>
                        {user.pseudo.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.userInfo}>
                      <h3 className={styles.userName}>{user.pseudo}</h3>
                      {user.isEnterprise && (
                        <span className={styles.userBadge}>Entreprise</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Equipes */}
        {(activeFilter === 'Tout' || activeFilter === 'Equipes') && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Equipes</h2>
            
            {loadingTeams ? (
              <div className={styles.emptyState}>Chargement des équipes...</div>
            ) : teams.length === 0 ? (
              <div className={styles.emptyState}>
                {q ? `Aucune équipe trouvée pour "${q}".` : 'Commencez une recherche pour trouver des équipes.'}
              </div>
            ) : (
              <div className={styles.teamsGrid}>
                {teams.map(team => (
                  <Link key={team.id} href={`/teams/${team.id}`} className={styles.teamCard}>
                    <div className={styles.teamInfo}>
                      <h3 className={styles.teamName}>{team.name}</h3>
                      {team.game && (
                        <p className={styles.teamGame}>{team.game}</p>
                      )}
                      {team.description && (
                        <p className={styles.teamDescription}>{team.description}</p>
                      )}
                      {team.tournament && (
                        <p className={styles.teamTournament}>Tournoi: {team.tournament.name}</p>
                      )}
                      <div className={styles.teamMembers}>
                        {team.members.slice(0, 5).map((member, idx) => (
                          <div key={member.user.id} className={styles.teamMemberAvatar}>
                            {member.user.avatarUrl ? (
                              <img src={member.user.avatarUrl} alt={member.user.pseudo} />
                            ) : (
                              <span>{member.user.pseudo.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        ))}
                        {team.members.length > 5 && (
                          <span className={styles.teamMembersMore}>+{team.members.length - 5}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
