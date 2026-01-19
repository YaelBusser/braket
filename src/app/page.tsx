"use client"
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from './page.module.scss'
import { TournamentCard } from '@/components/ui'
import { useAuthModal } from '@/components/AuthModal/AuthModalContext'

export default function Home() {
  const { status, data: session } = useSession()
  const { openAuthModal } = useAuthModal()
  const [featuredTournaments, setFeaturedTournaments] = useState<any[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)
  const userId = (session?.user as any)?.id || null

  const carouselRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Charger les tournois en tendance (tous ceux avec featuredPosition)
    const loadFeatured = async () => {
      setFeaturedLoading(true)
      try {
        const res = await fetch('/api/tournaments/featured')
        const data = await res.json()
        
        // S'assurer que seuls les tournois avec featuredPosition valide sont affichés
        const validTournaments = (data.tournaments || []).filter((t: any) => 
          t.featuredPosition !== null && 
          t.featuredPosition >= 1
        )
        
        setFeaturedTournaments(validTournaments)
      } catch (error) {
        console.error('Error loading featured tournaments:', error)
      } finally {
        setFeaturedLoading(false)
      }
    }
    loadFeatured()
  }, [])

  // Initialiser le scroll pour voir les 3 premières cartes
  useEffect(() => {
    if (carouselRef.current && featuredTournaments.length > 0) {
      // Attendre que le DOM soit prêt
      const initScroll = () => {
        if (carouselRef.current) {
          // Scroll à 0 pour voir les 3 premières cartes
          carouselRef.current.scrollLeft = 0
        }
      }
      
      // Essayer plusieurs fois pour s'assurer que le DOM est prêt
      setTimeout(initScroll, 100)
      setTimeout(initScroll, 300)
      setTimeout(initScroll, 500)
    }
  }, [featuredTournaments.length])

  const scrollToIndex = (index: number) => {
    if (!carouselRef.current || featuredTournaments.length === 0) return
    
    const carousel = carouselRef.current
    const items = Array.from(carousel.children) as HTMLElement[]
    if (items.length === 0) return
    
    const item = items[index]
    if (!item) return
    
    // Calculer la position de scroll pour aligner la carte à gauche (première position visible)
    const itemLeft = item.offsetLeft
    
    // Annuler le scroll précédent en cours en passant directement à la position
    // puis démarrer le nouveau scroll smooth
    carousel.scrollTo({
      left: carousel.scrollLeft,
      behavior: 'auto'
    })
    
    // Démarrer le nouveau scroll immédiatement
    requestAnimationFrame(() => {
      carousel.scrollTo({
        left: itemLeft,
        behavior: 'smooth'
      })
    })
    
    // Mettre à jour l'index immédiatement
    setCurrentIndex(index)
  }

  const handlePrev = () => {
    if (featuredTournaments.length === 0) return
    
    // Attendre que le scroll soit terminé et récupérer l'index actuel depuis le DOM
    const carousel = carouselRef.current
    if (!carousel) return
    
    // Calculer l'index réel basé sur la position de scroll actuelle
    const items = Array.from(carousel.children) as HTMLElement[]
    if (items.length === 0) return
    
    const carouselRect = carousel.getBoundingClientRect()
    let closestIndex = 0
    let closestDistance = Infinity
    
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect()
      const distance = Math.abs(rect.left - carouselRect.left)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })
    
    // Utiliser l'index réel détecté plutôt que currentIndex qui peut être désynchronisé
    const actualIndex = closestIndex
    const newIndex = actualIndex === 0 ? featuredTournaments.length - 1 : actualIndex - 1
    scrollToIndex(newIndex)
  }

  const handleNext = () => {
    if (featuredTournaments.length === 0) return
    
    // Attendre que le scroll soit terminé et récupérer l'index actuel depuis le DOM
    const carousel = carouselRef.current
    if (!carousel) return
    
    // Calculer l'index réel basé sur la position de scroll actuelle
    const items = Array.from(carousel.children) as HTMLElement[]
    if (items.length === 0) return
    
    const carouselRect = carousel.getBoundingClientRect()
    let closestIndex = 0
    let closestDistance = Infinity
    
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect()
      const distance = Math.abs(rect.left - carouselRect.left)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })
    
    // Vérifier si on est à la fin
    const scrollLeft = carousel.scrollLeft
    const scrollWidth = carousel.scrollWidth
    const clientWidth = carousel.clientWidth
    const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 10
    
    // Utiliser l'index réel détecté plutôt que currentIndex qui peut être désynchronisé
    const actualIndex = isNearEnd ? featuredTournaments.length - 1 : closestIndex
    const newIndex = actualIndex >= featuredTournaments.length - 1 ? 0 : actualIndex + 1
    scrollToIndex(newIndex)
  }

  // Détecter le scroll pour mettre à jour l'index
  useEffect(() => {
    const carousel = carouselRef.current
    if (!carousel || featuredTournaments.length === 0) return

    const handleScroll = () => {
      const items = Array.from(carousel.children) as HTMLElement[]
      if (items.length === 0) return

      const carouselRect = carousel.getBoundingClientRect()
      let closestIndex = 0
      let closestDistance = Infinity

      // Trouver la carte la plus proche du bord gauche
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect()
        const distance = Math.abs(rect.left - carouselRect.left)

        if (distance < closestDistance) {
          closestDistance = distance
          closestIndex = index
        }
      })

      // Vérifier si on est à la fin ou au début du scroll
      const scrollLeft = carousel.scrollLeft
      const scrollWidth = carousel.scrollWidth
      const clientWidth = carousel.clientWidth
      const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 10 // 10px de marge
      const isNearStart = scrollLeft <= 10 // 10px de marge

      if (isNearEnd) {
        // On est à la fin, on met l'index à la dernière carte
        setCurrentIndex(featuredTournaments.length - 1)
      } else if (isNearStart) {
        // On est au début, on met l'index à la première carte
        setCurrentIndex(0)
      } else {
        // On est au milieu, on utilise la carte la plus proche
        setCurrentIndex(closestIndex)
      }
    }

    // Initial check
    handleScroll()
    
    carousel.addEventListener('scroll', handleScroll)
    return () => carousel.removeEventListener('scroll', handleScroll)
  }, [featuredTournaments.length])

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
          <div className={styles.heroTopSection}>
            <div className={styles.heroTextContainer}>
              <h1 className={styles.heroTitle}>
                Rejoignez les tournois et gagnez des gains
              </h1>
              <p className={styles.heroSubtitle}>
                La plateforme esport où les joueurs participent à des tournois compétitifs et remportent des récompenses. 
                Participez aux compétitions, affrontez les meilleurs joueurs, et gagnez des prix à chaque victoire.
              </p>
            </div>
            <div className={styles.heroCtaButtonWrapper}>
              {status === 'authenticated' ? (
                <Link href="/tournaments" className={styles.heroCtaButton}>
                  Voir les tournois
                </Link>
              ) : (
                <button 
                  onClick={() => openAuthModal('login')}
                  className={styles.heroCtaButton}
                >
                  Rejoindre maintenant
                </button>
              )}
            </div>
          </div>
          
          
          {/* Section Tournois en tendance dans le hero */}
          {featuredTournaments.length > 0 && (
            <div className={styles.featuredSection}>
              <div className={styles.featuredHeader}>
                <div className={styles.featuredBadge}>
                  <span>Tournois du moment</span>
                </div>
              </div>
              
              {/* Carousel des tournois */}
              <div className={styles.carouselWrapper}>
                <button 
                  className={styles.carouselButton}
                  onClick={handlePrev}
                  aria-label="Tournoi précédent"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                
                <div className={styles.carouselContainer}>
                  <div className={styles.carousel} ref={carouselRef}>
                    {featuredTournaments.map((tournament, index) => {
                      const position = tournament.featuredPosition || index + 1
                      return (
                        <div 
                          key={tournament.id} 
                          className={styles.carouselItem}
                          data-index={index}
                        >
                          <div className={styles.trendingBadge}>
                            #{position}
                          </div>
                          <TournamentCard
                            tournament={tournament}
                            userId={userId}
                            className={styles.featuredTournamentCard}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <button 
                  className={styles.carouselButton}
                  onClick={handleNext}
                  aria-label="Tournoi suivant"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className={`container ${styles.mainContent}`}>
        {/* Section Explication du concept */}
        <div className={styles.conceptSection}>
          <div className={styles.conceptHeader}>
            <h2 className={styles.conceptTitle}>Notre concept</h2>
            <p className={styles.conceptSubtitle}>
              Une plateforme esport où vous participez à des tournois compétitifs et remportez des gains
            </p>
          </div>
          
          <div className={styles.conceptGrid}>
            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🎮</div>
              <h3 className={styles.conceptCardTitle}>Participez aux tournois</h3>
              <p className={styles.conceptCardText}>
                Rejoignez des tournois organisés par la communauté et affrontez d'autres joueurs dans vos jeux favoris. 
                Que vous soyez débutant ou professionnel, trouvez des compétitions adaptées à votre niveau.
              </p>
            </div>
            
            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🏆</div>
              <h3 className={styles.conceptCardTitle}>Gagnez des récompenses</h3>
              <p className={styles.conceptCardText}>
                Remportez des gains et des prix en participant aux tournois. Plus vous progressez, plus les récompenses 
                sont importantes. Montrez vos compétences et soyez récompensé pour votre talent.
              </p>
            </div>
            
            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>📊</div>
              <h3 className={styles.conceptCardTitle}>Suivez vos performances</h3>
              <p className={styles.conceptCardText}>
                Consultez vos statistiques détaillées, votre historique de participations et vos gains accumulés. 
                Suivez votre progression, améliorez votre classement et devenez un champion reconnu.
              </p>
            </div>
            
            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>👥</div>
              <h3 className={styles.conceptCardTitle}>Rejoignez des équipes</h3>
              <p className={styles.conceptCardText}>
                Formez ou rejoignez des équipes pour participer aux tournois en mode équipe. Travaillez ensemble, 
                développez votre stratégie et remportez la victoire en équipe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}