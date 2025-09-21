'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useNotification } from '../../components/providers/notification-provider'
import styles from './page.module.scss'

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
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'my-teams' | 'all-teams'>('my-teams')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (session?.user) {
      loadTeams()
    }
  }, [session, status, router])

  const loadTeams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams?mine=true')
      if (res.ok) {
        const data = await res.json()
        setTeams(data)
      } else {
        notify('Erreur lors du chargement des équipes', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify('Erreur lors du chargement des équipes', 'error')
    } finally {
      setLoading(false)
    }
  }

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
    <div className={styles.teamsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Équipes</h1>
          <p className={styles.subtitle}>Gérez vos équipes et participez aux tournois</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tab} ${activeTab === 'my-teams' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('my-teams')}
        >
          Mes équipes
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'all-teams' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all-teams')}
        >
          Toutes les équipes
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'my-teams' && (
          <div className={styles.myTeamsTab}>
            <div className={styles.tabHeader}>
              <h2>Mes équipes</h2>
              <button 
                className={styles.createBtn}
                onClick={() => router.push('/teams/create')}
              >
                Créer une équipe
              </button>
            </div>

            {teams.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <h3>Aucune équipe</h3>
                <p>Vous n'avez pas encore rejoint d'équipe</p>
                <button 
                  className={styles.createBtn}
                  onClick={() => router.push('/teams/create')}
                >
                  Créer ma première équipe
                </button>
              </div>
            ) : (
              <div className={styles.teamsGrid}>
                {teams.map((team) => (
                  <div 
                    key={team.id} 
                    className={styles.teamCard}
                    onClick={() => router.push(`/teams/${team.id}`)}
                  >
                    <div className={styles.teamIcon}>
                      <span>👥</span>
                    </div>
                    <div className={styles.teamInfo}>
                      <h3>{team.name}</h3>
                      <p className={styles.tournamentName}>{team.tournament.name}</p>
                      <p className={styles.gameName}>{team.tournament.game}</p>
                    </div>
                    <div className={styles.teamStats}>
                      <div className={styles.memberCount}>
                        {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                      </div>
                      <div className={styles.tournamentStatus}>
                        <span className={`${styles.status} ${styles[team.tournament.status?.toLowerCase()]}`}>
                          {team.tournament.status === 'REG_OPEN' ? 'Inscriptions ouvertes' :
                           team.tournament.status === 'IN_PROGRESS' ? 'En cours' :
                           team.tournament.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all-teams' && (
          <div className={styles.allTeamsTab}>
            <div className={styles.tabHeader}>
              <h2>Toutes les équipes</h2>
              <div className={styles.filters}>
                <select className={styles.filterSelect}>
                  <option value="">Tous les jeux</option>
                  <option value="Counter-Strike 2">Counter-Strike 2</option>
                  <option value="Valorant">Valorant</option>
                  <option value="League of Legends">League of Legends</option>
                </select>
                <select className={styles.filterSelect}>
                  <option value="">Tous les statuts</option>
                  <option value="REG_OPEN">Inscriptions ouvertes</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="COMPLETED">Terminé</option>
                </select>
              </div>
            </div>

            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>Recherche d'équipes</h3>
              <p>Cette fonctionnalité sera bientôt disponible</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
