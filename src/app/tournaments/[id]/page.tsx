'use client'

import { useEffect, useState, lazy, Suspense, startTransition } from 'react'
import { useNotification } from '../../../components/providers/notification-provider'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useAuthModal } from '../../../components/AuthModal/AuthModalContext'
import ClientPageWrapper from '../../../components/ClientPageWrapper'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'
import profileStyles from '../../profile/page.module.scss'
import SettingsIcon from '../../../components/icons/SettingsIcon'
import { Tabs, ContentWithTabs, TournamentCard } from '../../../components/ui'
import { getGameLogoPath } from '@/utils/gameLogoUtils'

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
  return (
    <ClientPageWrapper>
      <TournamentView />
    </ClientPageWrapper>
  )
}

function TournamentView() {
  const { data: session } = useSession()
  const { notify } = useNotification()
  const { openAuthModal } = useAuthModal()
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
  const [isLastMember, setIsLastMember] = useState(false)
  const [tab, setTab] = useState<'overview'|'bracket'|'matches'|'players'|'results'>('overview')
  const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      // Précharger les données immédiatement
      try {
        // Charger le tournoi en priorité pour afficher rapidement
        const tRes = await fetch(`/api/tournaments/${id}`)
        const tData = await tRes.json()
        
        // Mettre à jour le tournoi immédiatement (priorité)
        startTransition(() => {
          setTournament(tData.tournament)
          setRegistrations(tData.tournament?.registrations || [])
        })
        
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
  }, [id])

  // Optimisation : combiner les calculs liés à l'utilisateur
  useEffect(() => {
    const uid = (session?.user as any)?.id
    if (!uid) {
      setIsRegistered(false)
      setHasTeam(false)
      setMyTeamId(null)
      setIsLastMember(false)
      return
    }

    // Vérifier l'inscription
    if (tournament?.registrations) {
      setIsRegistered(tournament.registrations.some((r: any) => r.userId === uid))
    }

    // Vérifier l'équipe
    let found: string | null = null
    for (const t of teams) {
      if (t.members?.some((m: any) => m.user?.id === uid)) {
        found = t.id
        break
      }
    }
    setHasTeam(!!found)
    setMyTeamId(found)

    // Vérifier si dernier membre
    if (found) {
      const team = teams.find(t => t.id === found)
      setIsLastMember((team?.members?.length || 0) <= 1)
    } else {
      setIsLastMember(false)
    }
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
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      
      setCountdown({ hours, minutes, seconds })
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
      notify({ type: 'success', message: '🎉 Équipe créée avec succès ! Vous êtes maintenant membre de l\'équipe.' })
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
      notify({ type: 'success', message: '🤝 Bienvenue dans l\'équipe ! Vous êtes maintenant membre.' })
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
    return (
      <div className={styles.tournamentPage}>
        <div className={styles.banner}>
          <div className={styles.bannerContent}>
            <div className={styles.bannerInner}>
              <div className={styles.profilePicture} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '3rem',
                background: '#1a1f2e'
              }}>
                🎮
              </div>
              <div className={styles.bannerInfo}>
                <h1 className={styles.title} style={{ 
                  background: 'linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                  borderRadius: '8px',
                  height: '2rem',
                  width: '300px'
                }}></h1>
                <div className={styles.eventDetails} style={{ 
                  background: '#374151',
                  borderRadius: '4px',
                  height: '1.25rem',
                  width: '200px',
                  marginTop: '0.5rem'
                }}></div>
              </div>
            </div>
          </div>
        </div>
        <ContentWithTabs style={{ margin: '3rem 0' }}>
          <div style={{ 
            background: '#1f2937',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #374151',
            textAlign: 'center',
            color: '#9ca3af'
          }}>
            Chargement du tournoi...
          </div>
        </ContentWithTabs>
        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </div>
    )
  }

  const isOrganizer = (session?.user as any)?.id === tournament.organizerId
  const registeredCount = tournament._count?.registrations || 0
  const status = tournament.status as string | undefined
  const regClosed = status !== 'REG_OPEN' || (tournament.registrationDeadline && new Date(tournament.registrationDeadline) < new Date())

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
    const { hours, minutes, seconds } = countdown
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.tournamentPage}>
      {/* Bannière hero */}
      <div 
        className={styles.banner}
        style={{
          backgroundImage: tournament.posterUrl 
            ? `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url(${tournament.posterUrl})`
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
              const gameName = tournament.gameRef?.name || tournament.game || ''
              const gameLogoPath = getGameLogoPath(gameName)
              const logoUrl = tournament.logoUrl || gameLogoPath
              
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
              
              {status === 'REG_OPEN' && (
                <span className={styles.statusTag}>Ouverte</span>
              )}
            </div>
            
            {/* Section droite avec compte à rebours et bouton */}
            <div className={styles.bannerRight}>
              {countdown && (
                <div className={styles.countdown}>
                  Commence dans {formatCountdown()}
                </div>
              )}
              
              {!isOrganizer && (
                <button
                  className={styles.joinButton}
                  disabled={regClosed || (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants)}
                  onClick={() => {
                    if (!session?.user) {
                      try { localStorage.setItem('lt_returnTo', window.location.pathname) } catch {}
                      openAuthModal('login')
                      return
                    }
                    if (isRegistered) return
                    fetch(`/api/tournaments/${id}/register`, { method: 'POST' })
                      .then(async (r) => {
                        const d = await r.json().catch(() => ({}))
                        if (r.ok) { 
                          setIsRegistered(true)
                          setRegistrations(prev => [...prev, { userId: (session?.user as any).id, user: { pseudo: session?.user?.name, avatarUrl: session?.user?.image } }])
                          notify({ type: 'success', message: '🎯 Inscription réussie ! Bienvenue dans le tournoi.' })
                        } else {
                          notify({ type: 'error', message: d.message || '❌ Inscription impossible. Vérifiez les conditions du tournoi.' })
                        }
                      })
                  }}
                >
                  {isRegistered ? 'Inscrit' : regClosed ? 'Inscriptions fermées' : 
                   (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants ? 'Complet' : 
                    'Rejoindre le tournoi')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation et contenu principal */}
      <ContentWithTabs style={{ margin: '3rem 0' }}>
        {/* Navigation par onglets */}
        <Tabs
          tabs={[
            { key: 'overview', label: 'Aperçu' },
            { key: 'bracket', label: 'Tableau' },
            { key: 'matches', label: 'Matchs' },
            { key: 'players', label: 'Joueurs' },
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
            <div>
              {/* Afficher le tournoi avec TournamentCard */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                gap: '1.5rem',
                width: '100%',
                marginBottom: '2rem'
              }}>
                <TournamentCard tournament={tournament} userId={(session?.user as any)?.id || null} />
              </div>
              
              {/* Description si disponible */}
              {tournament.description && (
                <div style={{ 
                  background: 'transparent',
                  padding: '1.5rem 0',
                  marginBottom: '2rem'
                }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 600, 
                    color: '#fff', 
                    marginBottom: '1rem' 
                  }}>
                    Description
                  </h3>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    lineHeight: 1.6,
                    margin: 0
                  }}>
                    {tournament.description}
                  </p>
                </div>
              )}
            </div>
          )}

        {tab === 'players' && (
          <div>
            {/* Header avec compteur */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>
                Taille: {teams.length} Équipes
              </h2>
            </div>

            {/* Actions pour créer une équipe */}
            {!isOrganizer && session?.user && isRegistered && !hasTeam && !regClosed && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151'
              }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Créer une équipe</h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    style={{
                      flex: 1,
                      background: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      color: '#fff',
                      fontSize: '0.875rem'
                    }}
                    placeholder="Nom de l'équipe" 
                    value={teamName} 
                    onChange={(e) => setTeamName(e.target.value)} 
                  />
                  <button 
                    style={{
                      background: '#ff008c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onClick={handleCreateTeam}
                  >Créer</button>
                </div>
              </div>
            )}

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

            {!isOrganizer && session?.user && !isRegistered && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Inscrivez-vous au tournoi pour créer ou rejoindre une équipe.</div>
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

            {hasTeam && (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Vous faites déjà partie d'une équipe pour ce tournoi.</div>
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

            {hasTeam && isLastMember && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#f59e0b'
              }}>
                ⚠️ Attention : vous êtes le dernier membre de votre équipe. Si vous quittez, l'équipe sera supprimée.
              </div>
            )}

            {/* Liste des équipes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {teams.map(team => (
                <div key={team.id} style={{
                  background: '#1f2937',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #374151',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#374151',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H16c-.8 0-1.54.37-2.01.99L12 11l-1.99-2.01A2.5 2.5 0 0 0 8 8H5.46c-.8 0-1.54.37-2.01.99L1 12.5V22h2v-6h2.5l2.5 7.5h2L8 16h2l2.5 7.5h2L15 16h2l2.5 7.5h2L20 16h2v6h2z"/>
                        </svg>
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontWeight: '600', fontSize: '1rem' }}>{team.name}</div>
                        <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          {team.members.length} membre(s)
                          {tournament?.teamMaxSize && team.members.length >= tournament.teamMaxSize ? ' · Complet' : ''}
                        </div>
                      </div>
                    </div>
                    
                    {team.id === myTeamId && (
                      <span style={{
                        background: '#ff008c',
                        color: '#fff',
                        borderRadius: '999px',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>Mon équipe</span>
                    )}
                  </div>

                  {/* Actions */}
                  {!isOrganizer && session?.user && isRegistered && (
                    <div style={{ marginBottom: '1rem' }}>
                      {team.members?.some((m: any) => m.user?.id === (session?.user as any)?.id) ? (
                        <button 
                          style={{
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                          onClick={handleLeaveTeam}
                        >Quitter l'équipe</button>
                      ) : (
                        <button
                          style={{
                            background: hasTeam || (tournament?.teamMaxSize && team.members.length >= tournament.teamMaxSize) ? '#6b7280' : '#ff008c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            cursor: hasTeam || (tournament?.teamMaxSize && team.members.length >= tournament.teamMaxSize) ? 'not-allowed' : 'pointer',
                            width: '100%'
                          }}
                          onClick={() => handleJoinTeam(team.id)}
                          disabled={hasTeam || (tournament?.teamMaxSize && team.members.length >= tournament.teamMaxSize)}
                        >
                          {tournament?.teamMaxSize && team.members.length >= tournament.teamMaxSize ? 'Complet' : 'Rejoindre'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Membres */}
                  {team.members.length > 0 && (
                    <div>
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Membres</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {team.members.map((m: any, idx: number) => (
                          <div key={idx} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            background: '#374151',
                            borderRadius: '6px',
                            padding: '0.25rem 0.5rem'
                          }}>
                            {m.user.avatarUrl ? (
                              <img 
                                src={m.user.avatarUrl} 
                                alt="" 
                                style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '50%', 
                                  objectFit: 'cover' 
                                }} 
                              />
                            ) : (
                              <span style={{ 
                                width: '20px', 
                                height: '20px', 
                                borderRadius: '50%', 
                                background: '#6b7280', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.75rem',
                                color: '#fff'
                              }}>
                                {(m.user.pseudo || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span style={{ color: '#fff', fontSize: '0.75rem' }}>{m.user.pseudo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'matches' && (
          <div>
            <MatchesSection tournamentId={id} isOrganizer={isOrganizer} />
          </div>
        )}

        {tab === 'results' && (
          <div>
            <MatchesSection tournamentId={id} isOrganizer={isOrganizer} />
          </div>
        )}

        {tab === 'bracket' && tournament.matches && tournament.matches.length > 0 && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', fontWeight: '600' }}>Arbre de tournoi</h2>
            </div>
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #374151',
              overflow: 'auto'
            }}>
              <Suspense fallback={<div style={{ color: '#9ca3af', textAlign: 'center', padding: '2rem' }}>Chargement du tableau...</div>}>
                <Bracket matches={tournament.matches} />
              </Suspense>
            </div>
          </div>
        )}

        </div>
      </ContentWithTabs>
    </div>
  )
}

function MatchesSection({ tournamentId, isOrganizer }: { tournamentId: string; isOrganizer: boolean }) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/tournaments/${tournamentId}`)
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


