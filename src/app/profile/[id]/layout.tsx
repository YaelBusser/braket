'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode, startTransition } from 'react'
import { useRouter, usePathname, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Tabs, ContentWithTabs, TournamentCard } from '../../../components/ui'
import styles from './page.module.scss'

type TabKey = 'tournaments' | 'participations' | 'overview' | 'teams'

interface ProfileData {
  user: any
  userTournaments: any[]
  userTeams: any[]
  userRegistrations: any[]
  userStats: {
    totalTournaments: number
    activeTournaments: number
    completedTournaments: number
    totalParticipants: number
    totalWins: number
    totalTeams: number
    totalRegistrations: number
  }
  bannerUrl: string
  loadingData: boolean
}

interface ProfileContextType extends ProfileData {
  refreshData: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | null>(null)

export function useProfileData() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfileData must be used within ProfileLayout')
  }
  return context
}

// Composants de contenu pour chaque onglet
function TournamentsContent() {
  const { userTournaments, loadingData } = useProfileData()

  return (
    <div className={styles.tournamentsTab}>
      <div className={styles.tabHeader}>
        <h3>Tournois créés</h3>
      </div>
      
      <div className={styles.tournamentList}>
        {loadingData ? (
          <div className={styles.loading}>Chargement...</div>
        ) : !userTournaments || !Array.isArray(userTournaments) || userTournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun tournoi créé</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem',
            width: '100%'
          }}>
            {userTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ParticipationsContent() {
  const { userRegistrations, loadingData } = useProfileData()

  return (
    <div className={styles.registrationsTab}>
      <div className={styles.tabHeader}>
        <h3>Tournois rejoints</h3>
      </div>
      
      <div className={styles.tournamentList}>
        {loadingData ? (
          <div className={styles.loading}>Chargement...</div>
        ) : !userRegistrations || !Array.isArray(userRegistrations) || userRegistrations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun tournoi rejoint</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem',
            width: '100%'
          }}>
            {userRegistrations.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OverviewContent() {
  const { userTournaments, loadingData } = useProfileData()

  return (
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
  )
}

function TeamsContent() {
  return (
    <div className={styles.teamsTab}>
      <div className={styles.tabHeader}>
        <h3>Équipes</h3>
      </div>
      
      <div className={styles.emptyState}>
        <p>Aucune équipe rejointe</p>
      </div>
    </div>
  )
}

function ProfileLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const userId = params.id as string

  // États pour les données utilisateur
  const [user, setUser] = useState<any>(null)
  const [userTournaments, setUserTournaments] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [bannerUrl, setBannerUrl] = useState<string>('/images/games.jpg')
  const [userStats, setUserStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    completedTournaments: 0,
    totalParticipants: 0,
    totalWins: 0,
    totalTeams: 0,
    totalRegistrations: 0
  })

  // Référence pour suivre si les données ont déjà été chargées pour cet utilisateur
  const loadedUserIdRef = useRef<string | null>(null)
  const isDataLoadedRef = useRef(false)

  // Navigation par onglets
  const getActiveTabFromPath = useCallback((): TabKey => {
    const pathParts = pathname.split('/')
    if (pathParts.length > 3) {
      const tab = pathParts[3]
      if (['tournaments', 'participations', 'overview', 'teams'].includes(tab)) {
        return tab as TabKey
      }
    }
    return 'tournaments'
  }, [pathname])

  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    const pathParts = pathname.split('/')
    if (pathParts.length > 3) {
      const tab = pathParts[3]
      if (['tournaments', 'participations', 'overview', 'teams'].includes(tab)) {
        return tab as TabKey
      }
    }
    return 'tournaments'
  })

  // Synchroniser l'onglet avec l'URL
  useEffect(() => {
    const tab = getActiveTabFromPath()
    setActiveTab(tab)
  }, [pathname, getActiveTabFromPath])

  // Rediriger /profile/[id] vers /profile/[id]/tournaments
  useEffect(() => {
    if (pathname === `/profile/${userId}` && userId) {
      router.replace(`/profile/${userId}/tournaments`)
    }
  }, [pathname, userId, router])

  const handleTabChange = useCallback((key: string) => {
    const tabKey = key as TabKey
    // Changer l'onglet immédiatement (côté client) - rendu instantané
    setActiveTab(tabKey)
    // Mettre à jour l'URL de manière asynchrone (ne bloque pas le rendu)
    const newUrl = `/profile/${userId}/${tabKey}`
    // Utiliser requestAnimationFrame pour différer la mise à jour de l'URL
    requestAnimationFrame(() => {
      router.replace(newUrl)
    })
  }, [userId, router])

  // Rediriger si l'utilisateur essaie d'accéder à son propre profil
  useEffect(() => {
    if (session?.user && (session.user as any).id === userId) {
      router.push('/profile')
      return
    }
  }, [session, userId, router])

  // Fonction pour charger les données utilisateur
  const loadUserData = useCallback(async () => {
    // Éviter de recharger si les données sont déjà chargées pour cet utilisateur
    if (loadedUserIdRef.current === userId && isDataLoadedRef.current) {
      return
    }

    setLoadingData(true)
    try {
      const [userRes, tournamentsRes, statsRes, participationsRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch(`/api/users/${userId}/tournaments`),
        fetch(`/api/users/${userId}/stats`),
        fetch(`/api/users/${userId}/participations`)
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)
        if (userData.user?.bannerUrl) {
          setBannerUrl(userData.user.bannerUrl)
        }
      }

      if (tournamentsRes.ok) {
        const data = await tournamentsRes.json()
        setUserTournaments(data.tournaments || [])
      }

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setUserStats(stats)
      }

      if (participationsRes.ok) {
        const data = await participationsRes.json()
        setUserRegistrations(data.participating || [])
      }

      loadedUserIdRef.current = userId
      isDataLoadedRef.current = true
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      router.push('/')
    } finally {
      setLoadingData(false)
    }
  }, [userId, router])

  // Charger les données utilisateur (seulement si l'utilisateur change)
  useEffect(() => {
    if (userId && (loadedUserIdRef.current !== userId || !isDataLoadedRef.current)) {
      loadUserData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Calculer la date d'inscription
  const registrationDate = user?.createdAt ? new Date(user.createdAt) : null
  const daysSinceRegistration = registrationDate ? Math.floor((Date.now() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
  const yearsSinceRegistration = Math.floor(daysSinceRegistration / 365)

  const contextValue: ProfileContextType = {
    user,
    userTournaments,
    userTeams,
    userRegistrations,
    userStats,
    bannerUrl,
    loadingData,
    refreshData: loadUserData
  }

  if (loadingData && !user) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <ProfileContext.Provider value={contextValue}>
      <div className={styles.profilePage}>
        {/* Header avec avatar et infos */}
        <div 
          className={styles.profileHeader}
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          <div className={styles.headerContent}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarContainer}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user.pseudo?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userLabel}>UTILISATEUR</div>
              <h1 className={styles.username}>
                {user.pseudo || 'Utilisateur'}
              </h1>
              <div className={styles.userMeta}>
                <span className={styles.registrationDate}>
                  Inscrit(e) il y a {yearsSinceRegistration > 0 ? `${yearsSinceRegistration} an${yearsSinceRegistration > 1 ? 's' : ''}` : 'moins d\'un an'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ContentWithTabs style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          {/* Navigation par onglets */}
          <Tabs
            tabs={[
              { key: 'participations', label: 'Tournois rejoints' },
              { key: 'tournaments', label: 'Tournois créés' },
              { key: 'overview', label: 'Aperçu' },
              { key: 'teams', label: 'Équipes' }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {/* Contenu des onglets - rendu côté client pour éviter la navigation */}
          <div className={styles.tabContent}>
            {activeTab === 'tournaments' && (
              <TournamentsContent />
            )}
            {activeTab === 'participations' && (
              <ParticipationsContent />
            )}
            {activeTab === 'overview' && (
              <OverviewContent />
            )}
            {activeTab === 'teams' && (
              <TeamsContent />
            )}
          </div>
        </ContentWithTabs>
      </div>
    </ProfileContext.Provider>
  )
}

export default ProfileLayout

