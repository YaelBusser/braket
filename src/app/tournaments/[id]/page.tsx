'use client'

import { useEffect, useState } from 'react'
import { useNotification } from '../../../components/providers/notification-provider'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { useAuthModal } from '../../../components/AuthModal/AuthModalContext'
import ClientPageWrapper from '../../../components/ClientPageWrapper'
import Bracket from '../../../components/Bracket'

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
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [registrations, setRegistrations] = useState<any[]>([])
  const [hasTeam, setHasTeam] = useState(false)
  const [myTeamId, setMyTeamId] = useState<string | null>(null)
  const [isLastMember, setIsLastMember] = useState(false)
  const [tab, setTab] = useState<'overview'|'teams'|'results'|'bracket'>('overview')

  useEffect(() => {
    const load = async () => {
      try {
        const [tRes, teamRes] = await Promise.all([
          fetch(`/api/tournaments/${id}`),
          fetch(`/api/teams/${id}`)
        ])
        const tData = await tRes.json()
        const teamData = await teamRes.json()
        setTournament(tData.tournament)
        setRegistrations(tData.tournament?.registrations || [])
        setTeams(teamData.teams)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  // recalculer l'état d'inscription à l'arrivée de la session ou des données
  useEffect(() => {
    if (tournament?.registrations && session?.user) {
      setIsRegistered(tournament.registrations.some((r: any) => r.userId === (session?.user as any).id))
    }
  }, [tournament, session])

  // savoir si l'utilisateur a déjà une équipe dans ce tournoi
  useEffect(() => {
    const uid = (session?.user as any)?.id
    if (!uid) { setHasTeam(false); return }
    let found: string | null = null
    for (const t of teams) {
      if (t.members?.some((m: any) => m.user?.id === uid)) { found = t.id; break }
    }
    setHasTeam(!!found)
    setMyTeamId(found)
  }, [teams, session])

  // est-ce le dernier membre de son équipe ?
  useEffect(() => {
    if (!myTeamId) { setIsLastMember(false); return }
    const team = teams.find(t => t.id === myTeamId)
    setIsLastMember((team?.members?.length || 0) <= 1)
  }, [teams, myTeamId])

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

  if (loading) return <div className="container" style={{ padding: '2rem 0' }}>Chargement...</div>
  if (!tournament) return <div className="container" style={{ padding: '2rem 0' }}>Tournoi introuvable</div>

  const isOrganizer = (session?.user as any)?.id === tournament.organizerId
  const registeredCount = tournament._count?.registrations || 0
  const status = tournament.status as string | undefined
  const regClosed = status !== 'REG_OPEN' || (tournament.registrationDeadline && new Date(tournament.registrationDeadline) < new Date())

  return (
    <div style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Bannière hero */}
      <div style={{
        background: tournament.posterUrl 
          ? `url(${tournament.posterUrl}) center/cover no-repeat` 
          : 'linear-gradient(135deg, #1a1a2e, #16213e)',
        height: '280px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Overlay avec gradient */}
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)' 
        }} />
        
        {/* Contenu de la bannière */}
        <div className="container" style={{ 
          position: 'relative', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center',
          paddingTop: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#fff' }}>
            {/* Icône trophée */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55.47.98.97 1.21l1.03.4c.5.23 1.03.23 1.53 0l1.03-.4c.5-.23.97-.66.97-1.21v-2.34"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
            
            {/* Infos du tournoi */}
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: '2.5rem', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #fff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {tournament.name}
              </h1>
              <div style={{ 
                fontSize: '1.1rem', 
                opacity: 0.9, 
                marginTop: '0.5rem',
                color: '#cbd5e1'
              }}>
                {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                }) : 'Date à définir'}
              </div>
              <div style={{ 
                fontSize: '0.9rem', 
                marginTop: '0.25rem',
                color: status === 'IN_PROGRESS' ? '#ef4444' : status === 'COMPLETED' ? '#10b981' : '#f59e0b'
              }}>
                {status === 'REG_OPEN' ? 'Inscriptions ouvertes' : 
                 status === 'IN_PROGRESS' ? 'En cours' : 
                 status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <div style={{ 
        background: '#111827', 
        borderBottom: '1px solid #1f2937',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            gap: 0,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {[
              { key: 'overview', label: 'Vue d\'ensemble' },
              { key: 'teams', label: 'Participants' },
              { key: 'results', label: 'Matchs' },
              { key: 'bracket', label: 'Phases' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                style={{
                  padding: '1rem 1.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: tab === key ? '#ff008c' : '#9ca3af',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  borderBottom: tab === key ? '2px solid #ff008c' : '2px solid transparent',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.color = '#e5e7eb'
                  }
                }}
                onMouseLeave={(e) => {
                  if (tab !== key) {
                    e.currentTarget.style.color = '#9ca3af'
                  }
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container" style={{ padding: '2rem 0' }}>
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
            {/* Colonne principale */}
            <div>
              {/* Informations du tournoi */}
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '600' }}>Informations</h2>
                  <button style={{
                    background: '#ff008c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}>Règles</button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {/* Jeu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: '#10b981',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: '600',
                      fontSize: '0.875rem'
                    }}>
                      {tournament.game?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Jeu</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{tournament.game || 'Non spécifié'}</div>
                    </div>
                  </div>
                  
                  {/* Taille */}
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
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Taille</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>
                        {tournament.isTeamBased ? `${teams.length} Équipes` : `${registeredCount} Joueurs`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Format */}
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
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Format</div>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{tournament.format}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA d'inscription */}
              {!isOrganizer && (
                <div style={{
                  background: '#1f2937',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #374151',
                  textAlign: 'center'
                }}>
                  {tournament.isTeamBased ? (
                    isRegistered ? (
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#9ca3af' }}>Inscrit au tournoi. Créez ou rejoignez une équipe dans l'onglet Participants.</span>
                        <span style={{ 
                          background: '#10b981', 
                          color: '#fff', 
                          borderRadius: '999px', 
                          padding: '0.25rem 0.75rem', 
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>Inscrit</span>
                      </div>
                    ) : (
                      <button
                        style={{
                          background: regClosed ? '#6b7280' : '#ff008c',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem 2rem',
                          fontSize: '1rem',
                          fontWeight: '600',
                          cursor: regClosed ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        disabled={regClosed}
                        onClick={() => {
                          if (!session?.user) {
                            try { localStorage.setItem('lt_returnTo', window.location.pathname) } catch {}
                            openAuthModal('login')
                            return
                          }
                          fetch(`/api/tournaments/${id}/register`, { method: 'POST' })
                            .then(async (r) => {
                              const d = await r.json().catch(() => ({}))
                              if (r.ok) { setIsRegistered(true); notify({ type: 'success', message: '✅ Inscription réussie ! Vous pouvez maintenant créer ou rejoindre une équipe.' }) }
                              else notify({ type: 'error', message: d.message || '❌ Inscription impossible. Vérifiez les conditions du tournoi.' })
                            })
                        }}
                      >
                        {regClosed ? 'Inscriptions fermées' : 'Rejoindre le tournoi'}
                      </button>
                    )
                  ) : isRegistered ? (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ 
                        background: '#10b981', 
                        color: '#fff', 
                        borderRadius: '999px', 
                        padding: '0.25rem 0.75rem', 
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>Inscrit</span>
                      <button 
                        style={{
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          fetch(`/api/tournaments/${id}/register`, { method: 'DELETE' })
                            .then(async (r) => {
                              const d = await r.json().catch(() => ({}))
                              if (r.ok) { setIsRegistered(false); setRegistrations(prev => prev.filter((r: any) => r.userId !== (session?.user as any).id)); notify({ type: 'info', message: 'Désinscrit du tournoi.' }) }
                              else notify({ type: 'error', message: d.message || '❌ Erreur lors de la désinscription' })
                            })
                        }}
                      >Se désinscrire</button>
                    </div>
                  ) : (
                    <button
                      style={{
                        background: regClosed || (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants) ? '#6b7280' : '#ff008c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: regClosed || (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants) ? 'not-allowed' : 'pointer'
                      }}
                      disabled={regClosed || (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants)}
                      onClick={() => {
                        if (!session?.user) {
                          try { localStorage.setItem('lt_returnTo', window.location.pathname) } catch {}
                          openAuthModal('login')
                          return
                        }
                        fetch(`/api/tournaments/${id}/register`, { method: 'POST' })
                          .then(async (r) => {
                            const d = await r.json().catch(() => ({}))
                            if (r.ok) { setIsRegistered(true); setRegistrations(prev => [...prev, { userId: (session?.user as any).id, user: { pseudo: session?.user?.name, avatarUrl: session?.user?.image } }]); notify({ type: 'success', message: '🎯 Inscription réussie ! Bienvenue dans le tournoi.' }) }
                            else notify({ type: 'error', message: d.message || '❌ Inscription impossible. Vérifiez les conditions du tournoi.' })
                          })
                      }}
                    >
                      {regClosed ? 'Inscriptions fermées' : 
                       (tournament.maxParticipants && tournament._count?.registrations >= tournament.maxParticipants ? 'Complet' : 
                        "Je m'inscris à ce tournoi !")}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              {/* Planning */}
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: '600' }}>Planning</h3>
                  <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>UTC+01:00</span>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Dates du tournoi</div>
                  <div style={{ color: '#fff', fontWeight: '600' }}>
                    {tournament.startDate ? new Date(tournament.startDate).toLocaleDateString('fr-FR') : 'À définir'}
                    {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
                
                <div>
                  <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Inscriptions</div>
                  <div style={{ color: '#10b981', fontWeight: '600' }}>
                    {regClosed ? 'Fermées' : 'Ouvertes'}
                    {tournament.registrationDeadline && !regClosed && ` jusqu'au ${new Date(tournament.registrationDeadline).toLocaleDateString('fr-FR')}`}
                  </div>
                </div>
              </div>

              {/* Organisateur */}
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid #374151'
              }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Organisateur & contact</h3>
                <div style={{ color: '#ff008c', fontSize: '0.875rem' }}>
                  {tournament.organizer?.pseudo || 'Organisateur'}@example.com
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'teams' && (
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

        {tab === 'results' && (
          <div>
            {/* Sous-navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              borderBottom: '1px solid #374151',
              paddingBottom: '1rem'
            }}>
              <button style={{
                background: '#ff008c',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>Résultats</button>
              <button style={{
                background: 'transparent',
                color: '#9ca3af',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>Prochainement</button>
            </div>

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
              <Bracket matches={tournament.matches} />
            </div>
          </div>
        )}

        {!tournament.isTeamBased && (
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '1.5rem',
            marginTop: '2rem',
            border: '1px solid #374151'
          }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Joueurs inscrits</h2>
            {registrations.length === 0 ? (
              <div style={{ color: '#9ca3af' }}>Aucun joueur inscrit pour le moment.</div>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {registrations.map((r: any, idx: number) => (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    background: '#374151',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem'
                  }}>
                    {r.user?.avatarUrl ? (
                      <img src={r.user.avatarUrl} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: '#6b7280', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.75rem',
                        color: '#fff'
                      }}>
                        {(r.user?.pseudo || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span style={{ color: '#fff', fontSize: '0.875rem' }}>{r.user?.pseudo || 'Utilisateur'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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


