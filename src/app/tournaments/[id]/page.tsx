'use client'

import { useEffect, useState, lazy, Suspense, startTransition } from 'react'
import { useNotification } from '../../../components/providers/notification-provider'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useAuthModal } from '../../../components/AuthModal/AuthModalContext'
import { useTeamSelectionModal } from '../../../components/TeamSelectionModal/TeamSelectionModalContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import profileStyles from '../../profile/page.module.scss'
import SettingsIcon from '../../../components/icons/SettingsIcon'
import { Tabs, ContentWithTabs, TournamentPageSkeleton, TeamCard, Modal, type ModalButton } from '../../../components/ui'

// Lazy load Bracket component
const Bracket = lazy(() => import('../../../components/Bracket'))

type Tournament = {
  id: string
  name: string
  description: string | null
  game: string
  format: string
  visibility: string
  startDate: string | null
  endDate: string | null
  organizerId: string
}

export default function TournamentPage() {
  return <TournamentView />
}

function TournamentView() {
  const { data: session } = useSession()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
  const { openTeamSelectionModal } = useTeamSelectionModal()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  // Initialiser avec des valeurs par défaut pour afficher immédiatement
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(false) // Ne pas bloquer l'affichage
  const [teamName, setTeamName] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [hasTeam, setHasTeam] = useState(false)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview'|'bracket'|'players'|'results'>('overview')
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null)
  const [showUnregisterModal, setShowUnregisterModal] = useState(false)
  const [myTeam, setMyTeam] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      // Précharger les données immédiatement
      try {
        // Charger le tournoi avec les matchs pour le bracket
        const tRes = await fetch(`/api/tournaments/${id}?includeMatches=true`)
        const tData = await tRes.json()
        
        // Mettre à jour le tournoi immédiatement (priorité)
        startTransition(() => {
          setTournament(tData.tournament)
          setRegistrations(tData.tournament?.registrations || [])
        })
        
        // Charger les registrations seulement si nécessaire (pour vérifier l'inscription de l'utilisateur)
        if (session?.user) {
          const regRes = await fetch(`/api/tournaments/${id}?includeRegistrations=true`)
          const regData = await regRes.json()
          if (regData.tournament?.registrations) {
            startTransition(() => {
              setRegistrations(regData.tournament.registrations)
              setTournament((prev: any) => prev ? { ...prev, registrations: regData.tournament.registrations } : null)
            })
          }
        }
        
        // Charger les équipes en parallèle (moins prioritaire)
        const teamRes = await fetch(`/api/teams/${id}`)
        const teamData = await teamRes.json()
        
        startTransition(() => {
          setTeams(teamData.teams)
        })
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      }
    }
    load()
  }, [id, session])

  // Optimisation : combiner les calculs liés à l'utilisateur
  useEffect(() => {
    const uid = (session?.user as any)?.id
    if (!uid) {
      setIsRegistered(false)
      setHasTeam(false)
      setMyTeamId(null)
      return
    }

    // Vérifier l'inscription
    if (tournament?.registrations) {
      if (tournament.isTeamBased) {
        // Pour les tournois en équipe, vérifier si l'équipe de l'utilisateur est inscrite
        const userTeamId = teams.find(t => t.members?.some((m: any) => m.user?.id === uid))?.id
        const isTeamRegistered = userTeamId ? tournament.registrations.some((r: any) => r.teamId === userTeamId) : false
        setIsRegistered(isTeamRegistered)
      } else {
        // Pour les tournois solo, vérifier l'inscription individuelle
        const isUserRegistered = tournament.registrations.some((r: any) => r.userId === uid)
        setIsRegistered(isUserRegistered)
      }
    } else {
      // Si pas de registrations, l'utilisateur n'est pas inscrit
      setIsRegistered(false)
    }

    // Vérifier l'équipe
    let found: string | null = null
    let foundTeam: any = null
    for (const t of teams) {
      if (t.members?.some((m: any) => m.user?.id === uid)) {
        found = t.id
        foundTeam = t
        break
      }
    }
    setHasTeam(!!found)
    setMyTeamId(found)
    setMyTeam(foundTeam)
  }, [tournament?.registrations, teams, session])

  // Compte à rebours
  useEffect(() => {
    if (!tournament?.startDate) return
    
    const updateCountdown = () => {
      const now = new Date()
      const start = new Date(tournament.startDate)
      const diff = start.getTime() - now.getTime()
      
      if (diff <= 0) {
        setCountdown(null)
        return
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setCountdown({ days, hours, minutes, seconds })
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [tournament?.startDate])

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    if (hasTeam) { alert('Vous faites déjà partie d\'une équipe de ce tournoi'); return }
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: id, name: teamName })
    })
    if (res.ok) {
      const data = await res.json()
      setTeams(prev => [...prev, { ...data.team, members: [{ user: { id: (session?.user as any)?.id, pseudo: session?.user?.name, avatarUrl: session?.user?.image } }] }])
      setTeamName('')
      setHasTeam(true)
      setMyTeamId(data.team.id)
      setIsRegistered(true)
      // Rafraîchir les inscriptions
      const regRes = await fetch(`/api/tournaments/${id}?includeRegistrations=true`)
      const regData = await regRes.json()
      if (regData.tournament?.registrations) {
        setRegistrations(regData.tournament.registrations)
        setTournament((prev: any) => prev ? { ...prev, registrations: regData.tournament.registrations } : null)
      }
      notify({ type: 'success', message: '🎉 Équipe créée ! Vous êtes automatiquement inscrit au tournoi.' })
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    if (hasTeam) { alert('Vous faites déjà partie d\'une équipe de ce tournoi'); return }
    const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: [...t.members, { user: { id: (session?.user as any)?.id, pseudo: session?.user?.name, avatarUrl: session?.user?.image } }] } : t))
      setHasTeam(true)
      setMyTeamId(teamId)
      setIsRegistered(true)
      // Rafraîchir les inscriptions
      const regRes = await fetch(`/api/tournaments/${id}?includeRegistrations=true`)
      const regData = await regRes.json()
      if (regData.tournament?.registrations) {
        setRegistrations(regData.tournament.registrations)
        setTournament((prev: any) => prev ? { ...prev, registrations: regData.tournament.registrations } : null)
      }
      notify({ type: 'success', message: '🤝 Bienvenue dans l\'équipe ! Vous êtes automatiquement inscrit au tournoi.' })
    }
  }

  // Fonction pour recharger les données après inscription d'équipe
  const refreshAfterTeamRegistration = async () => {
    const uid = (session?.user as any)?.id
    if (!uid) return

    try {
      // Recharger les équipes et les inscriptions en parallèle
      const [teamsRes, regRes] = await Promise.all([
        fetch(`/api/teams/${id}`),
        fetch(`/api/tournaments/${id}?includeRegistrations=true`)
      ])
      
      const teamsData = await teamsRes.json()
      const regData = await regRes.json()
      
      if (teamsData.teams) {
        setTeams(teamsData.teams)
        
        // Trouver l'équipe de l'utilisateur
        const userTeam = teamsData.teams.find((t: any) => 
          t.members?.some((m: any) => m.user?.id === uid)
        )
        
        if (userTeam) {
          setHasTeam(true)
          setMyTeamId(userTeam.id)
          setMyTeam(userTeam)
        }
      }

      if (regData.tournament?.registrations) {
        setRegistrations(regData.tournament.registrations)
        setTournament((prev: any) => prev ? { ...prev, registrations: regData.tournament.registrations } : null)
        
        // Vérifier si l'utilisateur est maintenant inscrit
        if (tournament?.isTeamBased) {
          const userTeamId = teamsData.teams?.find((t: any) => 
            t.members?.some((m: any) => m.user?.id === uid)
          )?.id
          if (userTeamId) {
            const isTeamRegistered = regData.tournament.registrations.some((r: any) => r.teamId === userTeamId)
            setIsRegistered(isTeamRegistered)
          } else {
            setIsRegistered(false)
          }
        } else {
          const isUserRegistered = regData.tournament.registrations.some((r: any) => r.userId === uid)
          setIsRegistered(isUserRegistered)
        }
      }

      // Déclencher un événement pour rafraîchir la sidebar
      window.dispatchEvent(new CustomEvent('tournament-registration-changed'))
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error)
    }
  }

  const handleLeaveTeam = async () => {
    if (!myTeamId) return
    const res = await fetch(`/api/teams/${myTeamId}/join`, { method: 'DELETE' })
    const d = await res.json().catch(() => ({}))
    if (res.ok) {
      const uid = (session?.user as any)?.id
      if (d.teamDeleted) {
        setTeams(prev => prev.filter(t => t.id !== myTeamId))
        notify({ type: 'info', message: 'Vous avez quitté l\'équipe. L\'équipe a été supprimée.' })
      } else {
        setTeams(prev => prev.map(t => t.id === myTeamId ? { ...t, members: t.members.filter((m: any) => m.user?.id !== uid) } : t))
        notify({ type: 'info', message: 'Vous avez quitté l\'équipe.' })
      }
      setHasTeam(false)
      setMyTeamId(null)
    } else {
      notify({ type: 'error', message: d.message || '❌ Impossible de quitter l\'équipe. Vérifiez les conditions.' })
    }
  }

  // Afficher un squelette pendant le chargement initial
  if (!tournament) {
    return <TournamentPageSkeleton />
  }

  const isOrganizer = (session?.user as any)?.id === tournament.organizerId
  // Pour les tournois en équipe, compter uniquement les membres des équipes inscrites
  // Pour les tournois solo, compter toutes les inscriptions
  const registeredCount = tournament?.isTeamBased 
    ? teams.reduce((total, team) => total + (team.members?.length || 0), 0)
    : (tournament?._count?.registrations || 0)
  
  // Compter les équipes inscrites pour les tournois en équipe
  const registeredTeamsCount = tournament?.isTeamBased
    ? (tournament.registrations?.filter((r: any) => r.teamId).length || 0)
    : 0
  
  const status = tournament.status as string | undefined
  const regClosed = status !== 'REG_OPEN' || (tournament.registrationDeadline && new Date(tournament.registrationDeadline) < new Date())
  
  // Vérifier si le tournoi est complet
  const isFull = tournament?.isTeamBased
    ? (tournament.bracketMaxTeams && registeredTeamsCount >= tournament.bracketMaxTeams)
    : (tournament.bracketMaxTeams && tournament._count?.registrations >= tournament.bracketMaxTeams) ||
      (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants)

  // Format de la date pour l'affichage
  const getDateDisplay = () => {
    if (!tournament.startDate) return 'Date à définir'
    const startDate = new Date(tournament.startDate)
    const now = new Date()
    const diffInHours = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours > 0 && diffInHours < 24) {
      return `Dans environ ${diffInHours} heure${diffInHours > 1 ? 's' : ''} • ${startDate.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'long', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      })}`
    }
    
    return startDate.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatCountdown = () => {
    if (!countdown) return null
    return countdown
  }

  // Récupérer la bannière du jeu par défaut
  const bannerUrl = tournament.posterUrl || tournament.gameRef?.posterUrl || tournament.gameRef?.imageUrl || null

  return (
    <div className={styles.tournamentPage}>
      {/* Bannière hero */}
      <div 
        className={styles.banner}
        style={{
          backgroundImage: bannerUrl
            ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url(${bannerUrl})`
            : 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className={styles.bannerContent}>
          <div className={styles.bannerInner}>
            {/* Photo de profil circulaire - utilise le logo du jeu par défaut */}
            {(() => {
              const logoUrl = tournament.logoUrl || tournament.gameRef?.logoUrl
              
              return logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={tournament.name}
                  className={styles.profilePicture}
                />
              ) : (
                <div className={styles.profilePicture} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '3rem'
                }}>
                  🎮
                </div>
              )
            })()}
            
            {/* Infos du tournoi */}
            <div className={styles.bannerInfo}>
              <h1 className={styles.title}>{tournament.name}</h1>
              
              <div className={styles.eventDetails}>
                <span>{getDateDisplay()}</span>
              </div>
              
              {status && (
                <span 
                  className={styles.statusTag}
                  style={{
                    background: status === 'REG_OPEN' 
                      ? 'rgba(255, 0, 140, 0.2)' 
                      : status === 'IN_PROGRESS'
                      ? 'rgba(103, 72, 255, 0.2)'
                      : status === 'COMPLETED'
                      ? 'rgba(107, 114, 128, 0.2)'
                      : 'rgba(55, 65, 81, 0.2)',
                    color: status === 'REG_OPEN'
                      ? '#ff008c'
                      : status === 'IN_PROGRESS'
                      ? '#6748ff'
                      : status === 'COMPLETED'
                      ? '#9ca3af'
                      : '#6b7280',
                    border: `1px solid ${status === 'REG_OPEN' 
                      ? 'rgba(255, 0, 140, 0.4)' 
                      : status === 'IN_PROGRESS'
                      ? 'rgba(103, 72, 255, 0.4)'
                      : status === 'COMPLETED'
                      ? 'rgba(107, 114, 128, 0.4)'
                      : 'rgba(55, 65, 81, 0.4)'}`
                  }}
                >
                  {status === 'REG_OPEN' 
                    ? 'Ouvert' 
                    : status === 'IN_PROGRESS'
                    ? 'En cours'
                    : status === 'COMPLETED'
                    ? 'Terminé'
                    : 'Brouillon'}
                </span>
              )}
            </div>
            
            {/* Section droite avec compte à rebours et bouton */}
            <div className={styles.bannerRight}>
              {countdown && (
                <div className={styles.countdownContainer}>
                  <div className={styles.countdown}>
                    <div className={styles.countdownUnit}>
                      <div className={styles.countdownValue}>{countdown.days.toString().padStart(2, '0')}</div>
                      <div className={styles.countdownLabelUnit}>j</div>
                    </div>
                    <div className={styles.countdownSeparator}>:</div>
                    <div className={styles.countdownUnit}>
                      <div className={styles.countdownValue}>{countdown.hours.toString().padStart(2, '0')}</div>
                      <div className={styles.countdownLabelUnit}>h</div>
                    </div>
                    <div className={styles.countdownSeparator}>:</div>
                    <div className={styles.countdownUnit}>
                      <div className={styles.countdownValue}>{countdown.minutes.toString().padStart(2, '0')}</div>
                      <div className={styles.countdownLabelUnit}>m</div>
                    </div>
                    <div className={styles.countdownSeparator}>:</div>
                    <div className={styles.countdownUnit}>
                      <div className={styles.countdownValue}>{countdown.seconds.toString().padStart(2, '0')}</div>
                      <div className={styles.countdownLabelUnit}>s</div>
                    </div>
                  </div>
                </div>
              )}
              
              {!isOrganizer && !tournament.isTeamBased && (
                <button
                    className={styles.joinButton}
                    disabled={
                      !isRegistered && (
                        regClosed || 
                        (tournament.bracketMaxTeams && tournament._count?.registrations >= tournament.bracketMaxTeams) ||
                        (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants)
                      )
                    }
                    onClick={() => {
                      if (!session?.user) {
                        try { localStorage.setItem('lt_returnTo', window.location.pathname) } catch {}
                        openAuthModal('login')
                        return
                      }
                      if (isRegistered) {
                        // Ouvrir la modale de confirmation
                        setShowUnregisterModal(true)
                        return
                      }
                      // Inscription individuelle pour tournois solo
                      fetch(`/api/tournaments/${id}/register`, { method: 'POST' })
                        .then(async (r) => {
                          const d = await r.json().catch(() => ({}))
                          if (r.ok) { 
                            setIsRegistered(true)
                            // Recharger les inscriptions depuis le serveur pour avoir les données à jour
                            const regRes = await fetch(`/api/tournaments/${id}?includeRegistrations=true`)
                            const regData = await regRes.json()
                            if (regData.tournament?.registrations) {
                              setRegistrations(regData.tournament.registrations)
                              setTournament((prev: any) => prev ? { ...prev, registrations: regData.tournament.registrations } : null)
                            }
                            notify({ type: 'success', message: '🎯 Inscription réussie ! Bienvenue dans le tournoi.' })
                            
                            // Déclencher un événement pour rafraîchir la sidebar
                            window.dispatchEvent(new CustomEvent('tournament-registration-changed'))
                          } else {
                            notify({ type: 'error', message: d.message || '❌ Inscription impossible. Vérifiez les conditions du tournoi.' })
                          }
                        })
                    }}
                  >
                    {isRegistered ? 'Se désinscrire' : regClosed ? 'Inscriptions fermées' : 
                     (tournament.bracketMaxTeams && tournament._count?.registrations >= tournament.bracketMaxTeams ? 'Complet' : 
                      (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants ? 'Complet' : 
                       'Rejoindre le tournoi'))}
                  </button>
              )}
              
              {!isOrganizer && tournament.isTeamBased && !isRegistered && (
                <button
                    className={styles.joinButton}
                    disabled={regClosed || isFull}
                    onClick={() => {
                      if (!session?.user) {
                        try { localStorage.setItem('lt_returnTo', window.location.pathname) } catch {}
                        openAuthModal('login')
                        return
                      }
                      openTeamSelectionModal(id, tournament, refreshAfterTeamRegistration)
                    }}
                  >
                    {regClosed ? 'Inscriptions fermées' : 
                     (tournament.bracketMaxTeams && registeredTeamsCount >= tournament.bracketMaxTeams ? 'Complet' : 
                      'Rejoindre le tournoi')}
                  </button>
              )}
              
              {!isOrganizer && tournament.isTeamBased && isRegistered && (
                <button
                    className={styles.joinButton}
                    onClick={() => {
                      setShowUnregisterModal(true)
                    }}
                  >
                    Se désinscrire
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation et contenu principal */}
      <ContentWithTabs style={{ marginTop: '3rem' }}>
        {/* Navigation par onglets */}
        <Tabs
          tabs={[
            { key: 'overview', label: 'Aperçu' },
            { key: 'bracket', label: 'Bracket' },
            { key: 'players', label: 'Equipes' },
            { key: 'results', label: 'Résultats' }
          ]}
          activeTab={tab}
          onTabChange={(key) => setTab(key as any)}
        >
          {/* Bouton Paramètres pour le propriétaire */}
          {isOrganizer && (
            <Link
              href={`/tournaments/${id}/admin`}
              className={profileStyles.settingsButton}
            >
              <SettingsIcon width={20} height={20} />
              <span>Paramètres</span>
            </Link>
          )}
        </Tabs>

        {/* Contenu principal */}
        <div className={profileStyles.tabContent}>
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Section Format et Équipes - Layout en 2 colonnes */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
              }}>
                {/* Format */}
            <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem',
                    marginTop: 0
                  }}>
                    Format
                  </h3>
              <div style={{ 
                display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '0.75rem' 
                  }}>
                    {/* Jeu */}
                    <div style={{
                      background: 'transparent',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      {(() => {
                        const gameImageUrl = tournament.gameRef?.logoUrl
                        const gameName = tournament.gameRef?.name || tournament.game || ''
                        return gameImageUrl ? (
                          <img 
                            src={gameImageUrl} 
                            alt={gameName}
                            style={{
                              width: '32px',
                              height: '32px',
                              objectFit: 'cover'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '32px',
                            height: '32px',
                            background: '#374151',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.25rem'
                          }}>🎮</div>
                        )
                      })()}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem'
                        }}>
                          Jeu
                        </div>
                        <div style={{ 
                          color: '#fff', 
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {tournament.gameRef?.name || tournament.game || 'Non spécifié'}
                        </div>
                      </div>
                    </div>

                    {/* Fenêtre de préparation */}
                    {tournament.registrationDeadline && (
                      <div style={{
                        background: 'transparent',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: '#374151',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}>📅</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem',
                            marginBottom: '0.25rem'
                          }}>
                            Fenêtre de préparation
                          </div>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {new Date(tournament.registrationDeadline).toLocaleDateString('fr-FR', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Taille de l'équipe */}
                    {tournament.isTeamBased && (
                      <div style={{
                        background: 'transparent',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: '#374151',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.25rem'
                        }}>👥</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem',
                            marginBottom: '0.25rem'
                          }}>
                            Taille de l'équipe
                          </div>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {tournament.teamMinSize && tournament.teamMaxSize 
                              ? tournament.teamMinSize === tournament.teamMaxSize
                                ? `${tournament.teamMinSize}v${tournament.teamMaxSize}`
                                : `${tournament.teamMinSize}v${tournament.teamMinSize} + ${tournament.teamMaxSize - tournament.teamMinSize} remplaçant${tournament.teamMaxSize - tournament.teamMinSize > 1 ? 's' : ''}`
                              : tournament.teamMaxSize 
                                ? `${tournament.teamMaxSize}v${tournament.teamMaxSize}`
                                : 'Variable'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Format */}
                    <div style={{
                      background: 'transparent',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#374151',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                      }}>⚔️</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '0.75rem',
                          marginBottom: '0.25rem'
                        }}>
                          Format
                        </div>
                        <div style={{ 
                          color: '#fff', 
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {tournament.format === 'SINGLE_ELIMINATION' ? 'Élimination simple' :
                           tournament.format === 'DOUBLE_ELIMINATION' ? 'Élimination double' :
                           tournament.format === 'ROUND_ROBIN' ? 'Round-robin' :
                           tournament.format === 'SWISS' ? 'Suisse' :
                           tournament.format}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Équipes */}
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem',
                    marginTop: 0
                  }}>
                    Équipes
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                gap: '1.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem'
                      }}>
                        Inscrit(e)
                      </div>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '1.5rem',
                        fontWeight: '600'
                      }}>
                        {registeredCount}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem'
                      }}>
                        Confirmé
                      </div>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '1.5rem',
                        fontWeight: '600'
                      }}>
                        {teams.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem',
                        marginBottom: '0.25rem'
                      }}>
                        Emplacements
                      </div>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '1.5rem',
                        fontWeight: '600'
                      }}>
                        {tournament.isTeamBased 
                          ? (tournament.bracketMaxTeams || '∞')
                          : (tournament.bracketMaxTeams || tournament.maxParticipants || '∞')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Avatars des équipes avec meilleure présentation */}
                  {teams.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginLeft: '-8px'
                        }}>
                          {teams.slice(0, 10).map((team, idx) => (
                            <div 
                              key={team.id} 
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: team.avatarUrl ? 'transparent' : '#374151',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: team.id === myTeamId ? '3px solid #ff008c' : '2px solid #1f2937',
                                marginLeft: idx > 0 ? '-12px' : '0',
                                overflow: 'hidden',
                                position: 'relative',
                                zIndex: teams.length - idx,
                                cursor: team.id === myTeamId ? 'pointer' : 'default',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => {
                                if (team.id === myTeamId) {
                                  window.location.href = `/teams/${team.id}`
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (team.id === myTeamId) {
                                  e.currentTarget.style.transform = 'scale(1.1)'
                                  e.currentTarget.style.zIndex = '100'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.zIndex = String(teams.length - idx)
                              }}
                              title={team.name}
                            >
                              {team.avatarUrl ? (
                                <img 
                                  src={team.avatarUrl} 
                                  alt={team.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : team.members?.[0]?.user?.avatarUrl ? (
                                <img 
                                  src={team.members[0].user.avatarUrl} 
                                  alt={team.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              ) : (
                                <span style={{ 
                                  color: '#fff', 
                                  fontSize: '1rem',
                                  fontWeight: '700'
                                }}>
                                  {(team.name || 'T').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ))}
                          {teams.length > 10 && (
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '50%',
                              background: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #1f2937',
                              marginLeft: '-12px',
                              color: '#9ca3af',
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              position: 'relative',
                              zIndex: 0
                            }}>
                              +{teams.length - 10}
                            </div>
                          )}
                        </div>
                      </div>
                      {teams.length > 0 && (
                        <div style={{ 
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {teams.slice(0, 3).map(t => t.name).join(', ')}
                            {teams.length > 3 && ` et ${teams.length - 3} autre${teams.length - 3 > 1 ? 's' : ''}`}
                          </div>
                          {myTeamId && (
                            <div style={{ 
                              color: '#ff008c', 
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              Votre équipe est inscrite
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Section Hébergé par et Calendrier - Layout en 2 colonnes */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '2rem' 
              }}>
                {/* Hébergé par */}
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem',
                    marginTop: 0
                  }}>
                    Hébergé par
                  </h3>
                <div style={{ 
                  background: 'transparent',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    {tournament.organizer?.avatarUrl ? (
                      <img 
                        src={tournament.organizer.avatarUrl} 
                        alt={tournament.organizer.pseudo}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '8px',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#374151',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    fontSize: '1.25rem', 
                        color: '#fff'
                      }}>
                        {(tournament.organizer?.pseudo || 'O').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#fff', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        marginBottom: '0.25rem'
                      }}>
                        {tournament.organizer?.pseudo || 'Organisateur'}
                      </div>
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.75rem'
                      }}>
                        Organisateur du tournoi
                      </div>
                    </div>
                    {!isOrganizer && (
                      <button
                        style={{
                          background: 'transparent',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          padding: '0.5rem 1rem',
                          color: '#fff',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#374151'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Contacter
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendrier */}
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem',
                    marginTop: 0
                  }}>
                    Calendrier
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tournament.registrationDeadline && (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          minWidth: '60px'
                        }}>
                          <div style={{
                            width: '2px',
                            height: '100%',
                            background: '#374151',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#ff008c',
                              border: '2px solid #1f2937'
                            }}></div>
                          </div>
                        </div>
                        <div style={{ flex: 1, paddingBottom: '1rem' }}>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem',
                            marginBottom: '0.25rem'
                          }}>
                            {new Date(tournament.registrationDeadline).toLocaleDateString('fr-FR', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            }).toUpperCase()} {new Date(tournament.registrationDeadline).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.25rem'
                          }}>
                            Inscription ouverte
                          </div>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem'
                          }}>
                            Les inscriptions sont ouvertes. Inscrivez-vous maintenant.
                          </div>
                        </div>
                      </div>
                    )}
                    {tournament.startDate && (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.25rem',
                          minWidth: '60px'
                        }}>
                          <div style={{
                            width: '2px',
                            height: '100%',
                            background: '#374151',
                            position: 'relative'
                          }}>
                            <div style={{
                              position: 'absolute',
                              top: '0',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: '#10b981',
                              border: '2px solid #1f2937'
                            }}></div>
                          </div>
                        </div>
                        <div style={{ flex: 1, paddingBottom: '1rem' }}>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem',
                            marginBottom: '0.25rem'
                          }}>
                            {new Date(tournament.startDate).toLocaleDateString('fr-FR', {
                              month: 'short',
                              day: 'numeric',
                              weekday: 'short'
                            }).toUpperCase()} {new Date(tournament.startDate).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div style={{ 
                            color: '#fff', 
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            marginBottom: '0.25rem'
                          }}>
                            Commencer
                          </div>
                          <div style={{ 
                            color: '#9ca3af', 
                            fontSize: '0.75rem'
                          }}>
                            Le tournoi commence et vous recevrez une notification pour votre premier match.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Classement */}
              {(tournament.matches && tournament.matches.length > 0) || status === 'COMPLETED' ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem' 
                  }}>
                    <h3 style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 600, 
                      color: '#fff',
                      margin: 0
                    }}>
                      Classement
                    </h3>
                    {tournament.matches && tournament.matches.length > 0 && (
                      <Link
                        href={`#`}
                        style={{
                          color: '#3b82f6',
                          fontSize: '0.875rem',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        Voir tout
                      </Link>
                    )}
                  </div>
                  <div style={{
                    background: 'transparent',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    {[1, 2, 3].map((rank) => {
                      // Pour l'instant, on affiche "À déterminer" car le classement nécessite une logique plus complexe
                      // basée sur les résultats des matchs et le format du tournoi
                      return (
                        <div key={rank} style={{
                          padding: '1rem',
                          borderBottom: rank < 3 ? '1px solid #374151' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem'
                        }}>
                          <div style={{
                            width: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {rank === 1 && <span style={{ fontSize: '1.25rem' }}>🥇</span>}
                            {rank === 2 && <span style={{ fontSize: '1.25rem' }}>🥈</span>}
                            {rank === 3 && <span style={{ fontSize: '1.25rem' }}>🥉</span>}
                          </div>
                          <div style={{
                            width: '32px',
                            color: '#9ca3af',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}>
                            {rank}
                          </div>
                          <div style={{
                            flex: 1,
                            color: '#fff',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            {tournament.isTeamBased ? (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#374151',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}>👥</div>
                            ) : (
                              <div style={{
                                width: '24px',
                                height: '24px',
                                background: '#374151',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem'
                              }}>👤</div>
                            )}
                            <span>À déterminer</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Description */}
              {tournament.description && (
                <div>
                  <h3 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem',
                    marginTop: 0
                  }}>
                    Description
                  </h3>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {tournament.description}
                  </p>
                </div>
              )}
            </div>
          )}

        {tab === 'players' && (
          <div>
            {/* Messages d'état */}
            {!isOrganizer && !session?.user && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Connectez-vous pour créer ou rejoindre une équipe.</div>
              </div>
            )}

            {isOrganizer && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af', marginBottom: '1rem' }}>
                  En tant qu'organisateur, vous ne pouvez pas créer ou rejoindre une équipe.
                </div>
                <a
                  href={`/tournaments/${id}/admin`}
                  style={{
                    background: '#ff008c',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    display: 'inline-block',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#cc0070'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ff008c'
                  }}
                >
                  🛠️ Administration du tournoi
                </a>
              </div>
            )}

            {regClosed && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Les inscriptions sont fermées.</div>
              </div>
            )}

            {/* En-tête avec statistiques */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: '#fff', 
                  margin: '0 0 0.5rem 0' 
                }}>
                  Équipes inscrites
                </h2>
                <p style={{ color: '#9ca3af', margin: 0 }}>
                  {teams.length} équipe{teams.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Liste des équipes avec TeamCard */}
            {teams.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem 0'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p style={{ color: '#9ca3af', margin: '0.5rem 0' }}>Aucune équipe inscrite</p>
                <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>Soyez le premier à créer une équipe !</p>
              </div>
            ) : (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem',
                width: '100%'
              }}>
                {teams.map(team => (
                  <TeamCard
                    key={team.id}
                    team={team}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'results' && (
          <div>
            <MatchesSection tournamentId={id} isOrganizer={isOrganizer} />
          </div>
        )}

        {tab === 'bracket' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>Arbre de tournoi</h2>
            </div>
            <Suspense fallback={<div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Chargement du tableau...</div>}>
              <Bracket 
                matches={tournament.matches || []} 
                totalSlots={tournament.bracketMaxTeams || 8}
                tournamentStatus={tournament.status}
                isTeamBased={tournament.isTeamBased || false}
              />
            </Suspense>
          </div>
        )}

        </div>
      </ContentWithTabs>

      {/* Modale de confirmation de désinscription */}
      <Modal
        isOpen={showUnregisterModal}
        onClose={() => setShowUnregisterModal(false)}
        title="Confirmer la désinscription"
        footer={[
          { label: 'Annuler', onClick: () => setShowUnregisterModal(false), variant: 'cancel' },
          { 
            label: 'Confirmer la désinscription', 
            onClick: async () => {
              setShowUnregisterModal(false)
              const res = await fetch(`/api/tournaments/${id}/register`, { method: 'DELETE' })
              const data = await res.json().catch(() => ({}))
              
              if (res.ok) {
                const uid = (session?.user as any)?.id
                
                // Recharger les données du tournoi AVANT de mettre à jour l'état
                const regRes = await fetch(`/api/tournaments/${id}?includeRegistrations=true`)
                const regData = await regRes.json()
                
                // Mettre à jour les registrations et le tournament en premier
                if (regData.tournament) {
                  const updatedRegistrations = regData.tournament.registrations || []
                  setRegistrations(updatedRegistrations)
                  setTournament((prev: any) => prev ? { ...prev, registrations: updatedRegistrations } : null)
                  
                  // Mettre à jour isRegistered basé sur les nouvelles données
                  if (regData.tournament.isTeamBased) {
                    // Pour les tournois en équipe, vérifier si l'équipe de l'utilisateur est inscrite
                    const teamsRes = await fetch(`/api/teams/${id}`)
                    const teamsData = await teamsRes.json()
                    if (teamsData.teams) {
                      setTeams(teamsData.teams)
                      const userTeamId = teamsData.teams.find((t: any) => t.members?.some((m: any) => m.user?.id === uid))?.id
                      setIsRegistered(userTeamId ? updatedRegistrations.some((r: any) => r.teamId === userTeamId) : false)
                    } else {
                      setIsRegistered(false)
                    }
                  } else {
                    // Pour les tournois solo, vérifier l'inscription individuelle
                    setIsRegistered(updatedRegistrations.some((r: any) => r.userId === uid))
                  }
                } else {
                  setIsRegistered(false)
                }
                
                // Si toute l'équipe a été désinscrite
                if (data.unregisteredTeam && myTeam) {
                  notify({ 
                    type: 'success', 
                    message: `✅ Toute l'équipe "${data.teamName}" a été désinscrite (${data.unregisteredCount} membre${data.unregisteredCount > 1 ? 's' : ''}).` 
                  })
                } else {
                  // Désinscription individuelle (tournois solo)
                  notify({ type: 'success', message: '✅ Désinscription réussie. Vous pouvez vous réinscrire si vous le souhaitez.' })
                }

                // Déclencher un événement pour rafraîchir la sidebar
                window.dispatchEvent(new CustomEvent('tournament-unregistration-changed'))
              } else {
                notify({ type: 'error', message: data.message || '❌ Impossible de se désinscrire. Vérifiez les conditions du tournoi.' })
              }
            }, 
            variant: 'danger' 
          }
        ]}
      >
        {myTeam ? (
          <div className={styles.warningBox}>
            <p>
              Vous êtes sur le point de désinscrire <strong>toute votre équipe</strong> "{myTeam.name}" de ce tournoi.
            </p>
            <p>
              Tous les membres de l'équipe ({myTeam.members?.length || 0} membre{myTeam.members?.length > 1 ? 's' : ''}) seront désinscrits.
            </p>
            <p className={styles.warningText}>
              ⚠️ Cette action est irréversible. Vous pourrez vous réinscrire plus tard si le tournoi le permet.
            </p>
          </div>
        ) : (
          <p>Êtes-vous sûr de vouloir vous désinscrire de ce tournoi ?</p>
        )}
      </Modal>
    </div>
  )
}

function MatchesSection({ tournamentId, isOrganizer }: { tournamentId: string; isOrganizer: boolean }) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}?includeMatches=true`)
      const data = await res.json()
      setMatches(data.tournament?.matches || [])
      setLoading(false)
    }
    load()
  }, [tournamentId])

  const handleValidate = async (matchId: string, winnerTeamId: string) => {
    const res = await fetch('/api/results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, winnerTeamId })
    })
    if (res.ok) {
      const data = await res.json()
      setMatches(prev => prev.map(m => m.id === matchId ? data.match : m))
    }
  }

  if (loading) return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid #374151',
      textAlign: 'center'
    }}>
      <div style={{ color: '#9ca3af' }}>Chargement des matchs...</div>
    </div>
  )

  if (matches.length === 0) return (
    <div style={{
      background: '#1f2937',
      borderRadius: '12px',
      padding: '2rem',
      border: '1px solid #374151',
      textAlign: 'center'
    }}>
      <div style={{ color: '#9ca3af' }}>Aucun match pour le moment.</div>
    </div>
  )

  // Grouper les matchs par round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1
    if (!acc[round]) acc[round] = []
    acc[round].push(match)
    return acc
  }, {} as Record<number, any[]>)

  return (
    <div>
      {Object.entries(matchesByRound).map(([round, roundMatches]) => (
        <div key={round} style={{ marginBottom: '2rem' }}>
          <div style={{ 
            color: '#9ca3af', 
            fontSize: '0.875rem', 
            marginBottom: '1rem',
            fontWeight: '500'
          }}>
            Playoffs - Round {round}
          </div>
          
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {(roundMatches as any[]).map((match: any, idx: number) => (
              <div key={match.id} style={{
                background: '#1f2937',
                borderRadius: '8px',
                padding: '1rem',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      Match #{idx + 1}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                      {match.status === 'COMPLETED' ? 'terminé' : match.status === 'SCHEDULED' ? 'programmé' : 'en attente'}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: '#fff', fontWeight: '600' }}>
                      {match.teamA?.name || 'Équipe A'}
                    </div>
                    <div style={{ 
                      color: match.winnerTeamId === match.teamAId ? '#10b981' : '#fff',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}>
                      {match.teamAScore || 0}
                    </div>
                    <div style={{ color: '#9ca3af' }}>:</div>
                    <div style={{ 
                      color: match.winnerTeamId === match.teamBId ? '#10b981' : '#fff',
                      fontWeight: '600',
                      fontSize: '1.125rem'
                    }}>
                      {match.teamBScore || 0}
                    </div>
                    <div style={{ color: '#fff', fontWeight: '600' }}>
                      {match.teamB?.name || 'Équipe B'}
                    </div>
                  </div>
                </div>
                
                {isOrganizer && match.status !== 'COMPLETED' && (
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    marginTop: '1rem',
                    justifyContent: 'center'
                  }}>
                    <button 
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleValidate(match.id, match.teamAId)}
                    >Victoire {match.teamA?.name || 'Équipe A'}</button>
                    <button 
                      style={{
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleValidate(match.id, match.teamBId)}
                    >Victoire {match.teamB?.name || 'Équipe B'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


