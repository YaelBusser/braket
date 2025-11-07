'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useNotification } from '../../../components/providers/notification-provider'
import { useAuthModal } from '../../../components/AuthModal/AuthModalContext'
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
    startDate: string
    endDate: string
  }
  members: Array<{
    id: string
    user: {
      id: string
      name: string
      image: string
    }
    createdAt: string
  }>
  createdAt: string
}

interface TeamStats {
  totalMatches: number
  wins: number
  losses: number
  winRate: number
  totalTournaments: number
}

export default function TeamPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const [team, setTeam] = useState<Team | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    totalTournaments: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'matches' | 'tournaments'>('overview')
  const [isMember, setIsMember] = useState(false)
  const [isCaptain, setIsCaptain] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      try { localStorage.setItem('lt_returnTo', `/teams/${params.id}`) } catch {}
      openAuthModal('login')
      router.push('/')
      return
    }
    if (params.id) {
      loadTeamData()
    }
  }, [params.id, status, router, openAuthModal])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teams/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setTeam(data)
        
        // Vérifier si l'utilisateur est membre de l'équipe
        if (session?.user) {
          const userIsMember = data.members.some((member: any) => member.user.id === session.user.id)
          setIsMember(userIsMember)
          
          // Vérifier si l'utilisateur est le capitaine (premier membre)
          const isFirstMember = data.members.length > 0 && data.members[0].user.id === session.user.id
          setIsCaptain(isFirstMember)
        }
      } else {
        notify('Équipe introuvable', 'error')
        router.push('/teams')
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify('Erreur lors du chargement de l\'équipe', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async () => {
    if (!session?.user) {
      try { localStorage.setItem('lt_returnTo', `/teams/${params.id}`) } catch {}
      openAuthModal('login')
      return
    }

    try {
      const res = await fetch(`/api/teams/${params.id}/join`, {
        method: 'POST'
      })

      if (res.ok) {
        notify('Vous avez rejoint l\'équipe ! 🎉', 'success')
        loadTeamData()
      } else {
        const error = await res.json()
        notify(error.message || 'Erreur lors de la participation à l\'équipe', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify('Erreur lors de la participation à l\'équipe', 'error')
    }
  }

  const handleLeaveTeam = async () => {
    if (!session?.user) return

    try {
      const res = await fetch(`/api/teams/${params.id}/join`, {
        method: 'DELETE'
      })

      if (res.ok) {
        notify('Vous avez quitté l\'équipe', 'success')
        loadTeamData()
      } else {
        const error = await res.json()
        notify(error.message || 'Erreur lors de la sortie de l\'équipe', 'error')
      }
    } catch (error) {
      console.error('Erreur:', error)
      notify('Erreur lors de la sortie de l\'équipe', 'error')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement de l'équipe...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!team) {
    return (
      <div className={styles.error}>
        <h2>Équipe introuvable</h2>
        <p>Cette équipe n'existe pas ou a été supprimée</p>
        <button 
          className={styles.backBtn}
          onClick={() => router.push('/teams')}
        >
          Retour aux équipes
        </button>
      </div>
    )
  }

  return (
    <div className={styles.teamPage}>
      {/* Header avec informations de l'équipe */}
      <div className={styles.teamHeader}>
        <div className={styles.headerContent}>
          <div className={styles.teamInfo}>
            <div className={styles.teamIcon}>
              <span>👥</span>
            </div>
            <div className={styles.teamDetails}>
              <h1 className={styles.teamName}>{team.name}</h1>
              <p className={styles.tournamentName}>{team.tournament.name}</p>
              <p className={styles.gameName}>{team.tournament.game}</p>
            </div>
          </div>
          <div className={styles.teamActions}>
            {isMember ? (
              <button 
                className={styles.leaveBtn}
                onClick={handleLeaveTeam}
              >
                Quitter l'équipe
              </button>
            ) : (
              <button 
                className={styles.joinBtn}
                onClick={handleJoinTeam}
              >
                Rejoindre l'équipe
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className={styles.tabNavigation}>
        {[
          { key: 'overview', label: 'Vue d\'ensemble' },
          { key: 'members', label: 'Membres' },
          { key: 'matches', label: 'Matchs' },
          { key: 'tournaments', label: 'Tournois' }
        ].map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div className={styles.tabContent}>
        {activeTab === 'overview' && (
          <div className={styles.overviewTab}>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Membres</h3>
                <div className={styles.statNumber}>{team.members.length}</div>
              </div>
              <div className={styles.statCard}>
                <h3>Matchs joués</h3>
                <div className={styles.statNumber}>{teamStats.totalMatches}</div>
              </div>
              <div className={styles.statCard}>
                <h3>Victoires</h3>
                <div className={styles.statNumber}>{teamStats.wins}</div>
              </div>
              <div className={styles.statCard}>
                <h3>Taux de victoire</h3>
                <div className={styles.statNumber}>{teamStats.winRate}%</div>
              </div>
            </div>

            <div className={styles.teamInfo}>
              <h3>Informations de l'équipe</h3>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <label>Tournoi</label>
                  <p>{team.tournament.name}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Jeu</label>
                  <p>{team.tournament.game}</p>
                </div>
                <div className={styles.infoItem}>
                  <label>Statut du tournoi</label>
                  <span className={`${styles.status} ${styles[team.tournament.status?.toLowerCase()]}`}>
                    {team.tournament.status === 'REG_OPEN' ? 'Inscriptions ouvertes' :
                     team.tournament.status === 'IN_PROGRESS' ? 'En cours' :
                     team.tournament.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <label>Date de création</label>
                  <p>{new Date(team.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className={styles.membersTab}>
            <div className={styles.tabHeader}>
              <h3>Membres de l'équipe</h3>
              <div className={styles.memberCount}>
                {team.members.length} membre{team.members.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className={styles.membersList}>
              {team.members.map((member, index) => (
                <div key={member.id} className={styles.memberCard}>
                  <div className={styles.memberAvatar}>
                    {member.user.image ? (
                      <img src={member.user.image} alt={member.user.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {member.user.name.charAt(0)}
                      </div>
                    )}
                    {index === 0 && (
                      <div className={styles.captainBadge}>C</div>
                    )}
                  </div>
                  <div className={styles.memberInfo}>
                    <h4>{member.user.name}</h4>
                    <p>Membre depuis {new Date(member.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                  {isCaptain && index > 0 && (
                    <button className={styles.kickBtn}>
                      Exclure
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className={styles.matchesTab}>
            <div className={styles.tabHeader}>
              <h3>Matchs de l'équipe</h3>
            </div>

            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚔️</div>
              <h3>Aucun match</h3>
              <p>Cette équipe n'a pas encore joué de matchs</p>
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className={styles.tournamentsTab}>
            <div className={styles.tabHeader}>
              <h3>Tournois de l'équipe</h3>
            </div>

            <div className={styles.tournamentCard}>
              <div className={styles.tournamentIcon}>🏆</div>
              <div className={styles.tournamentInfo}>
                <h4>{team.tournament.name}</h4>
                <p>{team.tournament.game}</p>
                <p className={styles.tournamentDate}>
                  {new Date(team.tournament.startDate).toLocaleDateString('fr-FR')} - 
                  {new Date(team.tournament.endDate).toLocaleDateString('fr-FR')}
                </p>
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
        )}
      </div>
    </div>
  )
}
