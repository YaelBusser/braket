"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import { TournamentCard } from '@/components/ui'
import { GAMES, GameInfo } from '@/data/games'

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
  const [popularGames, setPopularGames] = useState<GameInfo[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const router = useRouter()

  // Charger les jeux populaires depuis la liste statique
  useEffect(() => {
    setLoadingGames(true)
    // Sélectionner les 6 premiers jeux de la liste
    setPopularGames(GAMES.slice(0, 6))
    setLoadingGames(false)
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
      {/* Header avec vidéo */}
      <div className={styles.heroSection}>
        <video className={styles.heroVideo} src="/videos/hero.mp4" autoPlay muted loop playsInline />
        {/* Overlays */}
        <div className={styles.heroOverlay} />
        <div className={styles.heroBottomFade} />
        
        {/* Contenu du header */}
        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>
            Organisez votre tournoi de rêve
          </h1>
          <button
            className={styles.heroCtaButton}
            onClick={() => router.push('/tournaments/create')}
            type="button"
          >
            Créer un tournoi
          </button>
          
          {/* Barre de recherche déplacée dans le header */}
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`container ${styles.mainContent}`}>
        {/* Section Tournois (remontée) */}
        <div className={styles.tournaments}>
          {/* En-tête simplifié: uniquement le titre */}
          <div className={styles.tournamentsHeader}>
            <h2 className={styles.tournamentsTitle}>Tournois recommandés</h2>
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
                .filter(t => (t as any).status !== 'COMPLETED')
                .sort((a, b) => {
                  const getTime = (x: any) => new Date(x?.startDate || x?.createdAt || x?.updatedAt || 0).getTime()
                  return getTime(b as any) - getTime(a as any)
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

        {/* Section Jeux populaires (grille) */}
        <div className={styles.popularGames}>
          <div className={styles.popularGamesHeader}>
            <h2 className={styles.popularGamesTitle}>Parcourir les jeux</h2>
            <button 
              className={styles.browseGamesBtn}
              onClick={() => router.push('/games')}
            >
              Voir tout
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
                    router.push(`/games/${encodeURIComponent(game.name)}`)
                  }}
                >
                  <div className={styles.popularGameImageContainer}>
                    {game.image ? (
                      <img 
                        src={game.image} 
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