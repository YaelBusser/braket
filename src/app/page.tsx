"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import styles from './page.module.scss'
import { TournamentCard } from '@/components/ui'

export default function Home() {
  const { status } = useSession()
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [animated, setAnimated] = useState(false)
  const [popularGames, setPopularGames] = useState<any[]>([])
  const [loadingGames, setLoadingGames] = useState(false)
  const router = useRouter()

  // Charger les jeux populaires depuis la DB
  useEffect(() => {
    const load = async () => {
      setLoadingGames(true)
      try {
        const res = await fetch('/api/games')
        const data = await res.json()
        const games = (data.games || []).slice(0, 6).map((g: any) => ({
          id: g.id,
          name: g.name,
          image: g.imageUrl
        }))
        setPopularGames(games)
      } finally {
        setLoadingGames(false)
      }
    }
    load()
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
          <p className={styles.heroSubtitle}>
            Votre plateforme de tournois esport. Créez, participez, gagnez.
          </p>
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
        {/* Section B2C / B2B - Affichée uniquement si non connecté */}
        {status === 'unauthenticated' && (
          <div className={styles.offeringsSection}>
            <div className={styles.offeringsHeader}>
              <h2 className={styles.offeringsSectionTitle}>Choisissez votre formule</h2>
              <p className={styles.offeringsSectionSubtitle}>
                Une solution adaptée à vos besoins, que vous soyez un passionné ou une entreprise
              </p>
            </div>
            <div className={styles.offeringsContainer}>
              <div className={`${styles.offeringBlock} ${styles.offeringBlockB2C}`}>
                <div className={styles.offeringIcon}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.offeringBadge}>Gratuit</div>
                <h2 className={styles.offeringTitle}>Pour les particuliers</h2>
                <div className={styles.offeringContent}>
                  <p>
                    Créez votre tournoi gratuitement et facilement. Organisez vos compétitions esport 
                    en quelques clics, invitez vos amis et gérez vos participants.
                  </p>
                  <ul className={styles.offeringFeatures}>
                    <li>Création de tournois illimitée</li>
                    <li>Gestion des participants</li>
                    <li>Invitations faciles</li>
                    <li>Fonctionnalités premium à venir</li>
                  </ul>
                </div>
              </div>
              
              <div className={`${styles.offeringBlock} ${styles.offeringBlockB2B}`}>
                <div className={styles.offeringIcon}>
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z" fill="currentColor"/>
                  </svg>
                </div>
                <div className={styles.offeringBadge}>Sur mesure</div>
                <h2 className={styles.offeringTitle}>Pour les entreprises</h2>
                <div className={styles.offeringContent}>
                  <p>
                    Solutions sur mesure pour vos événements esport professionnels. Demandez un devis 
                    personnalisé et bénéficiez d'un accompagnement complet.
                  </p>
                  <ul className={styles.offeringFeatures}>
                    <li>Devis personnalisé</li>
                    <li>Fourniture de machines</li>
                    <li>Gestion complète de l'événement</li>
                    <li>Team building gaming</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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
            <Link 
              href="/games"
              className={styles.browseGamesBtn}
            >
              Voir tout
            </Link>
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
                        background: 'linear-gradient(135deg, #ff008c, #6748ff)',
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