"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import { SearchBar, TournamentCard } from '@/components/ui'

// Jeux populaires - noms pour recherche API (limité à 6)
const POPULAR_GAMES_NAMES = [
  'EA Sports FC 25',
  'League of Legends', 
  'Mobile Legends: Bang Bang',
  'Altered TCG',
  'Counter-Strike 2',
  'eFootball 2024'
]

export default function Home() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [animated, setAnimated] = useState(false)
  const [popularGames, setPopularGames] = useState<any[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')
  const router = useRouter()

  // Charger les jeux populaires avec leurs images
  useEffect(() => {
    const loadPopularGames = async () => {
      setLoadingGames(true)
      try {
        const gameNames = POPULAR_GAMES_NAMES
        const games = []
        
        for (const gameName of gameNames.slice(0, 8)) { // Limiter à 8 jeux
          try {
            const res = await fetch(`/api/games/search?q=${encodeURIComponent(gameName)}&page_size=1`)
            const data = await res.json()
            if (data.games && data.games.length > 0) {
              games.push(data.games[0])
            } else {
              // Fallback si pas trouvé
              games.push({
                name: gameName,
                background_image: null,
                released: null
              })
            }
          } catch (error) {
            console.error(`Erreur pour ${gameName}:`, error)
            games.push({
              name: gameName,
              background_image: null,
              released: null
            })
          }
        }
        
        setPopularGames(games)
      } catch (error) {
        console.error('Erreur chargement jeux populaires:', error)
        setPopularGames([])
      } finally {
        setLoadingGames(false)
      }
    }
    
    loadPopularGames()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (query.trim()) {
        // Utiliser la recherche globale au lieu du filtre par jeu
        params.set('q', query.trim())
      }
      const res = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await res.json()
      setTournaments(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [query])

  useEffect(() => {
    setAnimated(true)
  }, [])

  useEffect(() => {
    // Thème header pour jeux vidéo
    const root = document.documentElement
    root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #111827, #1f2937)')
  }, [])

  return (
    <main className={styles.main}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header avec bannière colorée */}
      <div className={styles.heroSection}>
        {/* Overlay avec gradient */}
        <div className={styles.heroOverlay} />
        
        {/* Contenu du header */}
        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>
            Organisez votre tournoi de rêve
          </h1>
          <p className={styles.heroSubtitle}>
            Créez, participez et gagnez dans les meilleurs tournois de jeux vidéo
          </p>
          
          {/* Barre de recherche globale */}
          <SearchBar
            placeholder="Rechercher des jeux, tournois..."
            size="md"
            variant="dark"
            className={styles.searchContainer}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`container ${styles.mainContent}`}>
        {/* Section Jeux populaires */}
        <div className={styles.popularGames}>
          <div className={styles.popularGamesHeader}>
            <h2 className={styles.popularGamesTitle}>
              Jeux populaires
            </h2>
            <button 
              className={styles.browseGamesBtn}
              onClick={() => router.push('/games')}
            >
              Parcourir les jeux
            </button>
          </div>
          
          {loadingGames ? (
            <div className={styles.loadingGamesContainer}>
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  className={styles.loadingGameCard}
                >
                  Chargement...
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.popularGamesGrid}>
              {popularGames.slice(0, 6).map((game, index) => (
                <div
                  key={index}
                  className={styles.popularGameCard}
                  onClick={() => {
                    // Rediriger directement vers la page dédiée du jeu
                    router.push(`/games/${encodeURIComponent(game.name)}`)
                  }}
                >
                  <div className={styles.popularGameImageContainer}>
                    {game.background_image ? (
                      <img 
                        src={game.background_image} 
                        alt={game.name}
                        className={styles.popularGameImage}
                      />
                    ) : (
                      <div className={styles.popularGameImage} style={{
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        {game.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  {/* Texte en dessous de l'image */}
                  <div className={styles.popularGameText}>
                    <div className={styles.popularGameTitle}>
                      {game.name}
                    </div>
                    <div className={styles.popularGameSubtitle}>
                      {game.genres?.[0]?.name || 'Jeu'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Tournois */}
        <div className={styles.tournaments}>
          {/* Onglets de catégories */}
          <div className={styles.tournamentsHeader}>
            <h2 className={styles.tournamentsTitle}>Tournois</h2>
            <div className={styles.tournamentTabs}>
              {[
                { key: 'upcoming', label: 'Tournois à venir' },
                { key: 'in_progress', label: 'Tournois en cours' },
                { key: 'completed', label: 'Tournois terminés' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`${styles.tournamentTab} ${activeTab === tab.key ? styles.active : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className={styles.loadingTournamentsContainer}>
              <div>Chargement des tournois...</div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className={styles.emptyTournamentsContainer}>
              <div>Aucun tournoi public dans cette catégorie.</div>
            </div>
          ) : (
            <div className={styles.tournamentsGrid}>
              {tournaments
                .filter(t => {
                  if (activeTab === 'upcoming') return (t as any).status === 'REG_OPEN'
                  if (activeTab === 'in_progress') return (t as any).status === 'IN_PROGRESS'
                  if (activeTab === 'completed') return (t as any).status === 'COMPLETED'
                  return true
                })
                .slice(0, 6)
                .map((t) => (
                  <TournamentCard
                    key={t.id}
                    tournament={t}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}