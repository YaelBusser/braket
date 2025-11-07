'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import SettingsIcon from '../../components/icons/SettingsIcon'
import styles from './page.module.scss'

function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  
  
  // États pour les données utilisateur
  const [userTournaments, setUserTournaments] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string | null>(null)
  
  // Navigation par onglets
  const [activeTab, setActiveTab] = useState<'overview' | 'tournaments' | 'teams' | 'registrations'>('overview')
  
  // Statistiques utilisateur
  const [userStats, setUserStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalParticipants: 0,
    totalWins: 0,
    totalTeams: 0,
    totalRegistrations: 0
  })


  // Redirection hors rendu pour éviter les problèmes d'ordre des hooks
  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', '/profile') } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
  }, [status, router, openAuthModal])

  // Charger les données utilisateur
  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])


  const loadUserData = async () => {
    setLoadingData(true)
    try {
      // Charger les tournois de l'utilisateur
      const tournamentsRes = await fetch('/api/tournaments?mine=true')
      if (tournamentsRes.ok) {
        const tournaments = await tournamentsRes.json()
        setUserTournaments(tournaments)
      }

      // Charger les statistiques
      const statsRes = await fetch('/api/profile/stats')
      if (statsRes.ok) {
        const stats = await statsRes.json()
        setUserStats(stats)
      }

      // Charger le profil (pour la bannière)
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profile = await profileRes.json()
        if (profile.user?.bannerUrl) {
          setBannerUrl(profile.user.bannerUrl)
        } else {
          setBannerUrl('/images/games/games.jpg')
        }
      }

      // TODO: Charger les équipes et inscriptions
      // const teamsRes = await fetch('/api/teams?mine=true')
      // const registrationsRes = await fetch('/api/registrations?mine=true')
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoadingData(false)
    }
  }


  if (status === 'loading') {
    return (
      <ClientPageWrapper>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Chargement...</p>
        </div>
      </ClientPageWrapper>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  // Calculer la date d'inscription (approximative)
  const registrationDate = session?.user ? new Date() : null
  const daysSinceRegistration = registrationDate ? Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const yearsSinceRegistration = Math.floor(daysSinceRegistration / 365)

  return (
    <ClientPageWrapper>
      <div className={styles.profilePage}>
        {/* Header avec avatar et infos */}
        <div 
          className={styles.profileHeader}
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerUrl || '/images/games/games.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className={styles.headerContent}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarContainer}>
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <button 
                  className={styles.cameraButton} 
                  title="Changer la photo"
                  onClick={() => router.push('/settings')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userLabel}>UTILISATEUR</div>
              <h1 className={styles.username}>
                {session?.user?.name || 'Utilisateur'}
              </h1>
              <div className={styles.userMeta}>
                <span className={styles.status}>
                  <span className={styles.statusDot}></span>
                  En ligne
                </span>
                <span className={styles.separator}>•</span>
                <span className={styles.registrationDate}>
                  Inscrit(e) il y a {yearsSinceRegistration > 0 ? `${yearsSinceRegistration} an${yearsSinceRegistration > 1 ? 's' : ''}` : 'moins d\'un an'}
                </span>
              </div>
            </div>
          </div>
        </div>


        {/* Navigation par onglets */}
        <div className={styles.tabNavigation}>
          <div className={styles.tabContainer}>
            {[
              { key: 'overview', label: 'Aperçu' },
              { key: 'tournaments', label: 'Tournois' },
              { key: 'teams', label: 'Équipes' },
              { key: 'registrations', label: 'Inscriptions' }
            ].map((tab) => (
              <button
                key={tab.key}
                data-tab={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                {tab.label}
              </button>
            ))}
            <button
              className={styles.settingsButton}
              onClick={() => router.push('/settings')}
              title="Paramètres"
            >
              <SettingsIcon width={20} height={20} />
              <span>Paramètres</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              <div className={styles.activityCard}>
                <h3 className={styles.activityTitle}>Activité récente</h3>
                {loadingData ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Chargement...</p>
                  </div>
                ) : userTournaments && Array.isArray(userTournaments) && userTournaments.length > 0 ? (
                  <div className={styles.activityList}>
                    {userTournaments.slice(0, 5).map((tournament) => (
                      <div key={tournament.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>🏆</div>
                        <div className={styles.activityContent}>
                          <h4>{tournament.name}</h4>
                          <p>{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyActivity}>
                    <p>Aucune activité récente</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tournaments' && (
            <div className={styles.tournamentsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes tournois</h3>
                <button 
                  className={styles.createBtn}
                  onClick={() => router.push('/tournaments/create')}
                >
                  Créer un tournoi
                </button>
              </div>
              
              <div className={styles.tournamentList}>
                {loadingData ? (
                  <div className={styles.loading}>Chargement...</div>
                ) : !userTournaments || !Array.isArray(userTournaments) || userTournaments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Aucun tournoi créé</p>
                    <button 
                      className={styles.createBtn}
                      onClick={() => router.push('/tournaments/create')}
                    >
                      Créer mon premier tournoi
                    </button>
                  </div>
                ) : (
                  userTournaments.map((tournament) => (
                    <div key={tournament.id} className={styles.tournamentCard}>
                      <div className={styles.tournamentIcon}>🏆</div>
                      <div className={styles.tournamentInfo}>
                        <h4>{tournament.name}</h4>
                        <p>{tournament.game || 'Jeu non spécifié'}</p>
                        <p className={styles.tournamentDate}>
                          {new Date(tournament.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className={styles.tournamentStatus}>
                        <span className={`${styles.status} ${styles[tournament.status?.toLowerCase()]}`}>
                          {tournament.status === 'REG_OPEN' ? 'Inscriptions ouvertes' :
                           tournament.status === 'IN_PROGRESS' ? 'En cours' :
                           tournament.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                        </span>
                        <p>{tournament._count?.registrations || 0} participants</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className={styles.teamsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes équipes</h3>
                <button className={styles.createBtn}>
                  Créer une équipe
                </button>
              </div>
              
              <div className={styles.emptyState}>
                <p>Aucune équipe rejointe</p>
              </div>
            </div>
          )}

          {activeTab === 'registrations' && (
            <div className={styles.registrationsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes inscriptions</h3>
              </div>
              
              <div className={styles.emptyState}>
                <p>Aucune inscription</p>
              </div>
            </div>
          )}

        </div>

      </div>
    </ClientPageWrapper>
  )
}

export default function Profile() {
  return (
    <ClientPageWrapper>
      <ProfilePage />
    </ClientPageWrapper>
  )
}