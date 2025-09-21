'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useNotification } from '../../../../components/providers/notification-provider'
import Link from 'next/link'

interface Tournament {
  id: string
  name: string
  description: string | null
  game: string | null
  category: string
  format: string
  visibility: string
  status: string
  isTeamBased: boolean
  maxParticipants: number | null
  teamMinSize: number | null
  teamMaxSize: number | null
  startDate: string | null
  endDate: string | null
  registrationDeadline: string | null
  posterUrl: string | null
  createdAt: string
  updatedAt: string
  _count: {
    registrations: number
    teams: number
    matches: number
  }
  teams: Array<{
    id: string
    name: string
    members: Array<{
      id: string
      user: {
        id: string
        pseudo: string
        avatarUrl: string | null
      }
    }>
  }>
  matches: Array<{
    id: string
    round: number | null
    status: string
    teamA: { id: string; name: string }
    teamB: { id: string; name: string }
    winnerTeam: { id: string; name: string } | null
    scheduledAt: string | null
  }>
}

export default function TournamentAdminPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'matches' | 'settings'>('overview')
  const { notify } = useNotification()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/tournaments/${id}`)
        const data = await res.json()
        if (res.ok) {
          setTournament(data.tournament)
        } else {
          notify({ type: 'error', message: data.message || 'Erreur lors du chargement' })
        }
      } catch (error) {
        notify({ type: 'error', message: 'Erreur de connexion' })
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id, notify])

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement ce tournoi ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        notify({ type: 'success', message: 'Tournoi supprimé avec succès' })
        router.replace('/profile')
      } else {
        const d = await res.json().catch(() => ({}))
        notify({ type: 'error', message: d.message || 'Erreur lors de la suppression' })
      }
    } catch (error) {
      notify({ type: 'error', message: 'Erreur de connexion' })
    } finally {
      setDeleting(false)
    }
  }

  const callAction = async (mode: 'open_reg' | 'close_reg' | 'finish') => {
    try {
      const res = await fetch(`/api/tournaments/${id}?mode=${mode}`, { method: 'PUT' })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        setTournament(d.tournament)
        const messages = {
          open_reg: '🎉 Inscriptions ouvertes ! Les participants peuvent maintenant s\'inscrire au tournoi.',
          close_reg: '🚀 Tournoi démarré ! Le bracket a été généré et les matchs sont prêts.',
          finish: '🏆 Tournoi terminé ! Félicitations à tous les participants.'
        }
        notify({ type: 'success', message: messages[mode] })
        // Recharger les données pour avoir les matchs générés
        if (mode === 'close_reg') {
          setTimeout(() => window.location.reload(), 1000)
        }
      } else {
        const errorMessages = {
          open_reg: '❌ Impossible d\'ouvrir les inscriptions. Vérifiez les paramètres du tournoi.',
          close_reg: '❌ Impossible de démarrer le tournoi. Assurez-vous qu\'il y a au moins 2 participants.',
          finish: '❌ Impossible de terminer le tournoi. Vérifiez que tous les matchs sont terminés.'
        }
        notify({ type: 'error', message: d.message || errorMessages[mode] || 'Action impossible' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur de connexion. Vérifiez votre connexion internet.' })
    }
  }

  const validateMatchResult = async (matchId: string, winnerTeamId: string) => {
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winnerTeamId })
      })
      const d = await res.json().catch(() => ({}))
      if (res.ok) {
        notify({ type: 'success', message: '✅ Résultat validé ! Le vainqueur avance au tour suivant.' })
        // Recharger les données pour voir les changements
        setTimeout(() => window.location.reload(), 1000)
      } else {
        notify({ type: 'error', message: d.message || '❌ Erreur lors de la validation du résultat' })
      }
    } catch (error) {
      notify({ type: 'error', message: '❌ Erreur de connexion lors de la validation' })
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#9ca3af'
        }}>
          Chargement...
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '400px',
          color: '#9ca3af'
        }}>
          Tournoi introuvable
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return '#6b7280'
      case 'REG_OPEN': return '#10b981'
      case 'IN_PROGRESS': return '#f59e0b'
      case 'COMPLETED': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon'
      case 'REG_OPEN': return 'Inscriptions ouvertes'
      case 'IN_PROGRESS': return 'En cours'
      case 'COMPLETED': return 'Terminé'
      default: return status
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        color: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
              {tournament.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{
                background: getStatusColor(tournament.status),
                color: '#ffffff',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                {getStatusLabel(tournament.status)}
              </span>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                {tournament.game || 'Tournoi'}
              </span>
            </div>
          </div>
          <Link 
            href={`/tournaments/${id}`}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            }}
          >
            Voir le tournoi
          </Link>
        </div>
        
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
              {tournament._count.registrations}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {tournament.isTeamBased ? 'Équipes' : 'Participants'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
              {tournament._count.matches}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Matchs
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {tournament.maxParticipants || '∞'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              Max participants
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: '#1f2937',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #374151', marginBottom: '1rem' }}>
          {[
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'participants', label: 'Participants' },
            { key: 'matches', label: 'Matchs' },
            { key: 'settings', label: 'Paramètres' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                background: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#9ca3af',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = '#374151'
                  e.currentTarget.style.color = '#ffffff'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Actions rapides</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <button
                onClick={() => callAction('open_reg')}
                disabled={tournament.status === 'REG_OPEN'}
                style={{
                  background: tournament.status === 'REG_OPEN' ? '#374151' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: tournament.status === 'REG_OPEN' ? 'not-allowed' : 'pointer',
                  opacity: tournament.status === 'REG_OPEN' ? 0.5 : 1
                }}
              >
                Ouvrir inscriptions
              </button>
              <button
                onClick={() => callAction('close_reg')}
                disabled={tournament.status !== 'REG_OPEN'}
                style={{
                  background: tournament.status !== 'REG_OPEN' ? '#374151' : '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: tournament.status !== 'REG_OPEN' ? 'not-allowed' : 'pointer',
                  opacity: tournament.status !== 'REG_OPEN' ? 0.5 : 1
                }}
              >
                Démarrer tournoi
              </button>
              <button
                onClick={() => callAction('finish')}
                disabled={tournament.status === 'COMPLETED'}
                style={{
                  background: tournament.status === 'COMPLETED' ? '#374151' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: tournament.status === 'COMPLETED' ? 'not-allowed' : 'pointer',
                  opacity: tournament.status === 'COMPLETED' ? 0.5 : 1
                }}
              >
                Terminer tournoi
              </button>
            </div>

            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Informations du tournoi</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Détails
                </h4>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  <div><strong>Catégorie:</strong> {tournament.category}</div>
                  <div><strong>Format:</strong> {tournament.format}</div>
                  <div><strong>Visibilité:</strong> {tournament.visibility}</div>
                  <div><strong>Type:</strong> {tournament.isTeamBased ? 'Équipes' : 'Solo'}</div>
                </div>
              </div>
              <div style={{ background: '#374151', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#ffffff', margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: '600' }}>
                  Dates
                </h4>
                <div style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  <div><strong>Début:</strong> {tournament.startDate ? new Date(tournament.startDate).toLocaleString('fr-FR') : '—'}</div>
                  <div><strong>Fin:</strong> {tournament.endDate ? new Date(tournament.endDate).toLocaleString('fr-FR') : '—'}</div>
                  <div><strong>Clôture:</strong> {tournament.registrationDeadline ? new Date(tournament.registrationDeadline).toLocaleString('fr-FR') : '—'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>
              {tournament.isTeamBased ? 'Équipes' : 'Participants'} ({tournament._count.registrations})
            </h3>
            {tournament.teams && tournament.teams.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {tournament.teams.map((team) => (
                  <div key={team.id} style={{
                    background: '#374151',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #4b5563'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ color: '#ffffff', margin: 0, fontSize: '1rem', fontWeight: '600' }}>
                        {team.name}
                      </h4>
                      <span style={{
                        background: '#3b82f6',
                        color: '#ffffff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {team.members.length} membre{team.members.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {team.members.map((member) => (
                        <div key={member.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: '#4b5563',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}>
                          {member.user.avatarUrl ? (
                            <img
                              src={member.user.avatarUrl}
                              alt={member.user.pseudo}
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                            />
                          ) : (
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff',
                              fontSize: '0.75rem',
                              fontWeight: '600'
                            }}>
                              {member.user.pseudo.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{ color: '#ffffff' }}>{member.user.pseudo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#9ca3af',
                padding: '2rem',
                background: '#374151',
                borderRadius: '8px'
              }}>
                Aucun {tournament.isTeamBased ? 'équipe' : 'participant'} inscrit
              </div>
            )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>
              Matchs ({tournament._count.matches})
            </h3>
            {tournament.matches && tournament.matches.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {tournament.matches.map((match) => (
                  <div key={match.id} style={{
                    background: '#374151',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #4b5563'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        background: match.status === 'COMPLETED' ? '#10b981' : match.status === 'SCHEDULED' ? '#f59e0b' : '#6b7280',
                        color: '#ffffff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {match.status === 'COMPLETED' ? 'Terminé' : match.status === 'SCHEDULED' ? 'Programmé' : 'En attente'}
                      </span>
                      {match.round && (
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                          Tour {match.round}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ 
                          color: match.winnerTeam?.id === match.teamA.id ? '#10b981' : '#ffffff', 
                          fontWeight: '500',
                          fontSize: '1rem'
                        }}>
                          {match.teamA.name}
                        </div>
                      </div>
                      <div style={{ color: '#9ca3af', margin: '0 1rem', fontSize: '1.2rem' }}>VS</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ 
                          color: match.winnerTeam?.id === match.teamB.id ? '#10b981' : '#ffffff', 
                          fontWeight: '500',
                          fontSize: '1rem'
                        }}>
                          {match.teamB.name}
                        </div>
                      </div>
                    </div>
                    
                    {match.winnerTeam ? (
                      <div style={{
                        textAlign: 'center',
                        marginTop: '0.5rem',
                        color: '#10b981',
                        fontWeight: '600',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        🏆 Vainqueur: {match.winnerTeam.name}
                      </div>
                    ) : match.status === 'PENDING' && tournament.status === 'IN_PROGRESS' && (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => validateMatchResult(match.id, match.teamA.id)}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#10b981'
                          }}
                        >
                          {match.teamA.name} gagne
                        </button>
                        <button
                          onClick={() => validateMatchResult(match.id, match.teamB.id)}
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#059669'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#10b981'
                          }}
                        >
                          {match.teamB.name} gagne
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#9ca3af',
                padding: '2rem',
                background: '#374151',
                borderRadius: '8px'
              }}>
                Aucun match généré
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ color: '#ffffff', marginBottom: '1rem' }}>Actions dangereuses</h3>
            <div style={{
              background: '#374151',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #dc2626'
            }}>
              <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                Supprimer le tournoi
              </h4>
              <p style={{ color: '#9ca3af', margin: '0 0 1rem 0', fontSize: '0.875rem' }}>
                Cette action est irréversible. Tous les participants, équipes et matchs seront supprimés.
              </p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.5 : 1
                }}
              >
                {deleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


