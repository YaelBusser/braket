'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNotification } from '../../components/providers/notification-provider'
import { useAuthModal } from '../../components/AuthModal/AuthModalContext'
import { useCreateTeamModal } from '../../components/CreateTeamModal/CreateTeamModalContext'
import { ContentWithTabs, SearchBarWrapper, Button } from '../../components/ui'
import TeamCard from '../../components/ui/TeamCard'
import Link from 'next/link'
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
  const searchParams = useSearchParams()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const { openCreateTeamModal } = useCreateTeamModal()
  const [allTeams, setAllTeams] = useState<Team[]>([]) // Toutes les équipes chargées
  const [loading, setLoading] = useState(true)
  const [bannerUrl, setBannerUrl] = useState<string>('/images/games.jpg')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMine, setShowMine] = useState(false) // true = mes équipes, false = toutes les équipes

  const loadTeams = useCallback(async () => {
    setLoading(true)
    try {
      // Charger la bannière seulement si connecté
      if (session?.user) {
        const profileRes = await fetch('/api/profile')
        if (profileRes.ok) {
          const profile = await profileRes.json()
          if (profile.user?.bannerUrl) {
            setBannerUrl(profile.user.bannerUrl)
          }
        }
      }

      // Charger toutes les équipes (on filtrera côté client pour "mes équipes")
      const allTeamsRes = await fetch('/api/teams')
      if (allTeamsRes.ok) {
        const allData = await allTeamsRes.json()
        const allTeamsData = Array.isArray(allData) ? allData : (allData.teams || [])
        setAllTeams(allTeamsData)
      } else {
        notify({ message: 'Erreur lors du chargement des équipes', type: 'error' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify({ message: 'Erreur lors du chargement des équipes', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [notify, session])

  // Filtrer les équipes selon la recherche et le mode (mes équipes / toutes)
  const filteredTeams = useMemo(() => {
    let baseTeams = allTeams

    // Si on veut voir "mes équipes" et qu'on est connecté
    if (showMine && session?.user) {
      const userId = (session.user as any).id
      baseTeams = allTeams.filter((team: any) => 
        team.members?.some((member: any) => member.user?.id === userId)
      )
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      baseTeams = baseTeams.filter((team: any) => 
        team.name?.toLowerCase().includes(query) ||
        team.tournament?.name?.toLowerCase().includes(query) ||
        team.members?.some((member: any) => 
          member.user?.name?.toLowerCase().includes(query) ||
          member.user?.pseudo?.toLowerCase().includes(query)
        )
      )
    }

    return baseTeams
  }, [allTeams, searchQuery, showMine, session])

  // Initialiser showMine depuis l'URL
  useEffect(() => {
    const mine = searchParams.get('mine')
    setShowMine(mine === 'true' || mine === '1')
  }, [searchParams])

  useEffect(() => {
    loadTeams()

    // Écouter les événements de création d'équipe seulement si connecté
    if (session?.user) {
      const handleTeamCreated = () => {
        loadTeams()
      }

      window.addEventListener('team-created', handleTeamCreated)

      return () => {
        window.removeEventListener('team-created', handleTeamCreated)
      }
    }
  }, [session, loadTeams])

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement des équipes...</p>
      </div>
    )
  }

  const isAuthenticated = status === 'authenticated' && session?.user

  return (
    <div className={profileStyles.profilePage}>
      {/* Header avec avatar et infos */}
      {isAuthenticated ? (
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
              <div className={profileStyles.userLabel}>{showMine ? 'MES ÉQUIPES' : 'ÉQUIPES'}</div>
              <h1 className={profileStyles.username}>
                {showMine ? (session?.user?.name || 'Utilisateur') : 'Toutes les équipes'}
              </h1>
              <div className={profileStyles.userMeta}>
                <span className={profileStyles.status}>
                  <span className={profileStyles.statusDot}></span>
                  En ligne
                </span>
                <span className={profileStyles.separator}>•</span>
                <span className={profileStyles.registrationDate}>
                  {filteredTeams.length} équipe{filteredTeams.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
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
            <div className={profileStyles.userInfo}>
              <div className={profileStyles.userLabel}>ÉQUIPES</div>
              <h1 className={profileStyles.username}>
                Toutes les équipes
              </h1>
              <div className={profileStyles.userMeta}>
                <span className={profileStyles.registrationDate}>
                  {filteredTeams.length} équipe{filteredTeams.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <ContentWithTabs style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {/* Contenu principal */}
        <div className={profileStyles.tabContent}>
          <div className={profileStyles.teamsTab}>
            <div className={profileStyles.tabHeader}>
              <h3>{showMine && isAuthenticated ? 'Mes équipes' : 'Toutes les équipes'}</h3>
              {isAuthenticated && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                  <Button
                    variant={!showMine ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => router.push('/teams')}
                  >
                    Toutes les équipes
                  </Button>
                  <Button
                    variant={showMine ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => router.push('/teams?mine=true')}
                  >
                    Mes équipes
                  </Button>
                </div>
              )}
            </div>
            
            {/* Barre de recherche */}
            <SearchBarWrapper
              placeholder="Rechercher une équipe..."
              onSearch={setSearchQuery}
              autoSearchDelay={300}
              defaultValue={searchQuery}
            />
            
            {loading ? (
              <div className={profileStyles.loading}>
                <div className={profileStyles.spinner}></div>
                <p>Chargement...</p>
              </div>
            ) : !filteredTeams || filteredTeams.length === 0 ? (
              <div className={profileStyles.emptyState}>
                <p>
                  {searchQuery.trim() 
                    ? 'Aucune équipe trouvée pour cette recherche' 
                    : (showMine && isAuthenticated ? 'Aucune équipe rejointe' : 'Aucune équipe disponible')
                  }
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem',
                width: '100%'
              }}>
                {filteredTeams.map((team: any) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        </div>
      </ContentWithTabs>
    </div>
  )
}
