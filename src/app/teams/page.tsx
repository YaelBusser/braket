'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import { useCreateTeamModal } from '../../components/CreateTeamModal/CreateTeamModalContext'
import { ContentWithTabs } from '../../components/ui'
import TeamCard from '../../components/ui/TeamCard'
import styles from './page.module.scss'
import profileStyles from '../profile/page.module.scss'

interface Team {
  id: string
  name: string
  tournamentId: string
  tournament: {
    id: string
    name: string
    game: string
    status: string
  }
  members: Array<{
    id: string
    user: {
      id: string
      name: string
      image: string
    }
  }>
  createdAt: string
}

export default function TeamsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const { openCreateTeamModal } = useCreateTeamModal()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [bannerUrl, setBannerUrl] = useState<string>('/images/games.jpg')

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      // Charger la bannière en priorité
      const profileRes = await fetch('/api/profile')
      if (profileRes.ok) {
        const profile = await profileRes.json()
        if (profile.user?.bannerUrl) {
          setBannerUrl(profile.user.bannerUrl)
        }
      }

      const res = await fetch('/api/teams?mine=true')
      if (res.ok) {
        const data = await res.json()
        setTeams(data)
      } else {
        notify({ message: 'Erreur lors du chargement des équipes', type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors du chargement des équipes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', '/teams') } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
    if (session?.user) {
      loadTeams()
    }

    // Écouter les événements de création d'équipe
    const handleTeamCreated = () => {
      loadTeams()
    }

    window.addEventListener('team-created', handleTeamCreated)

    return () => {
      window.removeEventListener('team-created', handleTeamCreated)
    }
  }, [session, status, router, openAuthModal, loadTeams])

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement des équipes...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className={profileStyles.profilePage}>
      {/* Header avec avatar et infos */}
      <div 
        className={profileStyles.profileHeader}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.7) 100%), url(${bannerUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className={profileStyles.headerContent}>
          <div className={profileStyles.avatarWrapper}>
            <div className={profileStyles.avatarContainer}>
              {session?.user?.image ? (
                <img src={session.user.image} alt="Avatar" className={profileStyles.avatar} />
              ) : (
                <div className={profileStyles.avatarPlaceholder}>
                  {session?.user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
          </div>
          <div className={profileStyles.userInfo}>
            <div className={profileStyles.userLabel}>MES ÉQUIPES</div>
            <h1 className={profileStyles.username}>
              {session?.user?.name || 'Utilisateur'}
            </h1>
            <div className={profileStyles.userMeta}>
              <span className={profileStyles.status}>
                <span className={profileStyles.statusDot}></span>
                En ligne
              </span>
              <span className={profileStyles.separator}>•</span>
              <span className={profileStyles.registrationDate}>
                {teams.length} équipe{teams.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <ContentWithTabs style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Contenu principal */}
        <div className={profileStyles.tabContent}>
          {(
            <div className={profileStyles.teamsTab}>
              <div className={profileStyles.tabHeader}>
                <h3>Mes équipes</h3>
                <button 
                  className={profileStyles.createBtn}
                  onClick={openCreateTeamModal}
                >
                  Créer une équipe
                </button>
              </div>
              
              {loading ? (
                <div className={profileStyles.loading}>
                  <div className={profileStyles.spinner}></div>
                  <p>Chargement...</p>
                </div>
              ) : !teams || teams.length === 0 ? (
                <div className={profileStyles.emptyState}>
                  <p>Aucune équipe rejointe</p>
                  <button 
                    className={profileStyles.createBtn}
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
                  {teams.map((team: any) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </ContentWithTabs>
    </div>
  )
}
