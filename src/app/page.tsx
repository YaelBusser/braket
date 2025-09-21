"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import { useCategory } from '@/components/providers/category-provider'

// Jeux populaires par catégorie - noms pour recherche API (limité à 6)
const POPULAR_GAMES_NAMES = {
  VIDEO_GAMES: [
    'EA Sports FC 25',
    'League of Legends', 
    'Mobile Legends: Bang Bang',
    'Altered TCG',
    'Counter-Strike 2',
    'eFootball 2024'
  ],
  SPORTS: [
    'FIFA 24',
    'NBA 2K24',
    'Tennis World Tour',
    'Volleyball Nations',
    'Handball 21',
    'Rugby 24'
  ],
  BOARD_GAMES: [
    'Monopoly Plus',
    'Catan',
    'Ticket to Ride',
    'Wingspan',
    'Azul',
    'Splendor'
  ]
}

export default function Home() {
  const { category, setCategory } = useCategory()
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
        const gameNames = POPULAR_GAMES_NAMES[category as keyof typeof POPULAR_GAMES_NAMES]
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
  }, [category])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams({ category })
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
  }, [category, query])

  useEffect(() => {
    // Si le changement de catégorie vient du header, on désactive l'animation au premier render
    try {
      const src = localStorage.getItem('lt_category_change_source')
      if (src === 'header') {
        setAnimated(false)
        localStorage.removeItem('lt_category_change_source')
      } else {
        setAnimated(true)
      }
    } catch {
      setAnimated(true)
    }
  }, [])

  useEffect(() => {
    // Thème header selon catégorie
    const root = document.documentElement
    if (category === 'VIDEO_GAMES') root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #111827, #1f2937)')
    else if (category === 'SPORTS') root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #065f46, #10b981)')
    else root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #4c1d95, #f59e0b)')
  }, [category])


  const getCategoryTitle = () => {
    switch (category) {
      case 'VIDEO_GAMES': return 'Jeux vidéo'
      case 'SPORTS': return 'Sports'
      case 'BOARD_GAMES': return 'Jeux de société'
      default: return 'Jeux'
    }
  }

  const getCategoryGradient = () => {
    switch (category) {
      case 'VIDEO_GAMES': return 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)'
      case 'SPORTS': return 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
      case 'BOARD_GAMES': return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #f59e0b 100%)'
      default: return 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)'
    }
  }

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      {/* Header avec bannière colorée */}
      <div style={{
        background: getCategoryGradient(),
        height: '280px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Overlay avec gradient */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)' 
        }} />
        
        {/* Contenu du header */}
        <div className="container" style={{ 
          position: 'relative', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          paddingTop: '2rem'
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '3rem', 
            fontWeight: '700',
            color: '#fff',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            marginBottom: '1.5rem'
          }}>
            {getCategoryTitle()}
          </h1>
          
          {/* Barre de recherche globale */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            position: 'relative'
          }}>
            <input
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
              placeholder="Rechercher des jeux, tournois..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim().length >= 2) {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                }
              }}
            />
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>

          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container" style={{ padding: '2rem 0' }}>
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
            <div style={{
              display: 'flex',
              gap: '1rem',
              overflowX: 'auto',
              paddingBottom: '1rem'
            }}>
              {Array.from({ length: 7 }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    background: '#1f2937',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid #374151',
                    height: '280px',
                    width: '200px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af'
                  }}
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
                  
                  <div className={styles.popularGameName}>
                    {game.name}
                  </div>
                  <div className={styles.popularGameGenre}>
                    {game.genres?.[0]?.name || 'Jeu'}
                  </div>
                  <div className={styles.popularGameRating}>
                    {game.rating?.toFixed(1)}
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
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #374151',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9ca3af' }}>Chargement des tournois...</div>
            </div>
          ) : tournaments.length === 0 ? (
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #374151',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9ca3af' }}>Aucun tournoi public dans cette catégorie.</div>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(2, 1fr)',
              gap: '1.5rem',
              maxWidth: '1200px',
              margin: '0 auto'
            }}>
              {tournaments
                .filter(t => {
                  if (activeTab === 'upcoming') return (t as any).status === 'REG_OPEN'
                  if (activeTab === 'in_progress') return (t as any).status === 'IN_PROGRESS'
                  if (activeTab === 'completed') return (t as any).status === 'COMPLETED'
                  return true
                })
                .slice(0, 6)
                .map((t) => (
                <div
                  key={t.id}
                  className={styles.tournamentCard}
                  onClick={() => router.push(`/tournaments/${t.id}`)}
                >
                  {/* Bannière avec image et trophée en overlay */}
                  <div className={styles.tournamentBanner}>
                    {t.posterUrl ? (
                      <img
                        src={t.posterUrl}
                        alt={t.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          filter: 'blur(1px)'
                        }}
                      />
                    ) : null}
                    
                    {/* Trophée en overlay au centre */}
                    <div className={styles.tournamentTrophy}>
                      🏆
                    </div>
                  </div>
                  
                  {/* Contenu principal */}
                  <div className={styles.tournamentContent}>
                    {/* Thumbnail et infos principales */}
                    <div className={styles.tournamentHeader}>
                      {/* Thumbnail/Avatar */}
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: '#ffffff',
                        fontWeight: 'bold'
                      }}>
                        {t.game?.charAt(0) || 'T'}
                      </div>
                      
                      {/* Titre et date */}
                      <div className={styles.tournamentInfo}>
                        <h3 className={styles.tournamentTitle}>
                          {t.name}
                        </h3>
                        
                        <div className={styles.tournamentGame}>
                          <span>
                            {t.startDate 
                              ? new Date(t.startDate).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                              : new Date(t.createdAt).toLocaleDateString('fr-FR', { 
                                  day: 'numeric', 
                                  month: 'short', 
                                  year: 'numeric' 
                                })
                            }
                          </span>
                          
                          {/* Drapeau français */}
                          <span style={{ fontSize: '0.75rem' }}>🇫🇷</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Statut et participants */}
                    <div className={styles.tournamentMeta}>
                      <div className={styles.tournamentStatus}>
                        {(t as any).status === 'REG_OPEN' ? 'Inscriptions ouvertes' :
                         (t as any).status === 'IN_PROGRESS' ? 'En attente' : 'Terminé'}
                      </div>
                      
                      <div className={styles.tournamentParticipants}>
                        <span>{t._count?.registrations || 0} {t.isTeamBased ? 'Équipes' : 'Joueurs'}</span>
                        <span style={{ color: '#fbbf24', fontSize: '1rem' }}>🏆</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}