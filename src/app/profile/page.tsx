'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import { useCreateTournamentModal } from '../../components/CreateTournamentModal/CreateTournamentModalContext'
import { useCreateTeamModal } from '../../components/CreateTeamModal/CreateTeamModalContext'
import SettingsIcon from '../../components/icons/SettingsIcon'
import { Tabs, ContentWithTabs, TournamentCard } from '../../components/ui'
import TeamCard from '../../components/ui/TeamCard'
import styles from './page.module.scss'

type TabKey = 'tournaments' | 'participations' | 'overview' | 'teams'

function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const { openCreateTournamentModal } = useCreateTournamentModal()
  const { openCreateTeamModal } = useCreateTeamModal()
  const isAdmin = (session?.user as any)?.isAdmin === 1
  
  
  // États pour les données utilisateur
  const [userTournaments, setUserTournaments] = useState<any[]>([])
  const [userTeams, setUserTeams] = useState<any[]>([])
  const [userRegistrations, setUserRegistrations] = useState<any[]>([])
  const [joinedTournaments, setJoinedTournaments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)
  // Initialiser avec la valeur par défaut pour afficher immédiatement
  const [bannerUrl, setBannerUrl] = useState<string>('/images/games.jpg')
  
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  
  const handleTabChange = (key: string) => {
    const tabKey = key as TabKey
    setActiveTab(tabKey)
  }
  
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

    // Écouter les événements de création d'équipe
    const handleTeamCreated = () => {
      loadUserData()
    }

    window.addEventListener('team-created', handleTeamCreated)

    return () => {
      window.removeEventListener('team-created', handleTeamCreated)
    }
  }, [session])


  const loadUserData = async () => {
    setLoadingData(true)
    try {
      // Charger la bannière en priorité pour un affichage immédiat
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profile = await profileRes.json()
        if (profile.user?.bannerUrl) {
          setBannerUrl(profile.user.bannerUrl)
        }
      }

      // Charger les autres données en parallèle pour améliorer les performances
      const [tournamentsRes, statsRes, registrationsRes] = await Promise.all([
        fetch('/api/tournaments?mine=true'),
        fetch('/api/profile/stats'),
        fetch('/api/tournaments/joined')
      ])

      if (tournamentsRes.ok) {
        const data = await tournamentsRes.json()
        setUserTournaments(data.tournaments || [])
      }

      if (statsRes.ok) {
        const stats = await statsRes.json()
        setUserStats(stats)
      }

      // Charger les tournois rejoints
      if (registrationsRes.ok) {
        const joinedData = await registrationsRes.json()
        setJoinedTournaments(joinedData.tournaments || [])
      }

      // Charger les équipes
      const teamsRes = await fetch('/api/teams?mine=true')
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setUserTeams(Array.isArray(teamsData) ? teamsData : [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoadingData(false)
    }
  }


  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
      </div>
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
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {session?.user?.name?.charAt(0) || 'U'}
                  </div>
                )}
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

        <ContentWithTabs style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          {/* Navigation par onglets */}
          <Tabs
            tabs={[
              { key: 'overview', label: 'Aperçu' },
              { key: 'participations', label: 'Tournois rejoints' },
              { key: 'tournaments', label: 'Tournois créés' },
              { key: 'teams', label: 'Équipes' }
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          >
            <button
              className={styles.settingsButton}
              onClick={() => router.push('/settings')}
              title="Paramètres"
            >
              <SettingsIcon width={20} height={20} />
              <span>Paramètres</span>
            </button>
          </Tabs>

          {/* Contenu principal */}
          <div className={styles.tabContent}>
          {activeTab === 'overview' && (
            <div className={styles.overviewTab}>
              {/* Statistiques principales */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🎯</div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{joinedTournaments.length}</div>
                    <div className={styles.statLabel}>Tournois rejoints</div>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👥</div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{userStats.totalTeamsJoined || userTeams.length}</div>
                    <div className={styles.statLabel}>Équipes</div>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⚔️</div>
                  <div className={styles.statContent}>
                    <div className={styles.statValue}>{userStats.totalMatches || 0}</div>
                    <div className={styles.statLabel}>Matchs joués</div>
                  </div>
                </div>
                
                {userStats.totalMatches > 0 && (
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏅</div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{userStats.wonMatches || 0}</div>
                      <div className={styles.statLabel}>Victoires</div>
                    </div>
                  </div>
                )}
                
                {userStats.totalMatches > 0 && (
                  <div className={styles.statCard}>
                    <div className={styles.statIcon}>📊</div>
                    <div className={styles.statContent}>
                      <div className={styles.statValue}>{userStats.winRate || 0}%</div>
                      <div className={styles.statLabel}>Taux de victoire</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activité récente */}
              <div className={styles.activityCard}>
                <h3 className={styles.activityTitle}>Activité récente</h3>
                {loadingData ? (
                  <div className={styles.loadingState}>
                    <div className={styles.spinner}></div>
                    <p>Chargement...</p>
                  </div>
                ) : (userTournaments && Array.isArray(userTournaments) && userTournaments.length > 0) || (joinedTournaments && Array.isArray(joinedTournaments) && joinedTournaments.length > 0) ? (
                  <div className={styles.activityList}>
                    {[...(userTournaments || []), ...(joinedTournaments || [])]
                      .sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime()
                        const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime()
                        return dateB - dateA
                      })
                      .slice(0, 5)
                      .map((tournament) => {
                        const isCreated = userTournaments.some(t => t.id === tournament.id)
                        return (
                          <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className={styles.activityItem}>
                            <div className={styles.activityIcon}>🏆</div>
                            <div className={styles.activityContent}>
                              <h4>{tournament.name}</h4>
                              <p>
                                {isCreated ? 'Créé' : 'Rejoint'} le {new Date(tournament.createdAt || tournament.updatedAt).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </Link>
                        )
                      })}
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
                <h3>Tournois créés</h3>
                {isAdmin && (
                  <button 
                    className={styles.createBtn}
                    onClick={openCreateTournamentModal}
                  >
                    Créer un tournoi
                  </button>
                )}
              </div>
              
              <div className={styles.tournamentList}>
                {loadingData ? (
                  <div className={styles.loading}>Chargement...</div>
                ) : !userTournaments || !Array.isArray(userTournaments) || userTournaments.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Aucun tournoi créé</p>
                    {isAdmin && (
                      <button 
                        className={styles.createBtn}
                        onClick={openCreateTournamentModal}
                      >
                        Créer mon premier tournoi
                      </button>
                    )}
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
          )}

          {activeTab === 'teams' && (
            <div className={styles.teamsTab}>
              <div className={styles.tabHeader}>
                <h3>Mes équipes</h3>
                <button 
                  className={styles.createBtn}
                  onClick={openCreateTeamModal}
                >
                  Créer une équipe
                </button>
              </div>
              
              {loadingData ? (
                <div className={styles.loading}>
                  <div className={styles.spinner}></div>
                  <p>Chargement...</p>
                </div>
              ) : !userTeams || userTeams.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Aucune équipe rejointe</p>
                  <button 
                    className={styles.createBtn}
                    onClick={openCreateTeamModal}
                  >
                    Créer ma première équipe
                  </button>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  width: '100%'
                }}>
                  {userTeams.map((team: any) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'participations' && (
            <div className={styles.registrationsTab}>
              <div className={styles.tabHeader}>
                <h3>Tournois rejoints</h3>
              </div>
              
              <div className={styles.tournamentList}>
                {loadingData ? (
                  <div className={styles.loading}>Chargement...</div>
                ) : !joinedTournaments || !Array.isArray(joinedTournaments) || joinedTournaments.length === 0 ? (
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
                    {joinedTournaments.map((tournament) => (
                      <TournamentCard
                        key={tournament.id}
                        tournament={tournament}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          </div>
        </ContentWithTabs>

      </div>
  )
}

export default function Profile() {
  return <ProfilePage />
}