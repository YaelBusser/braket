'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import ClientPageWrapper from '../../../components/ClientPageWrapper'

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
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const [tournament, setTournament] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [teamName, setTeamName] = useState('')

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
        setTeams(teamData.teams)
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournamentId: id, name: teamName })
    })
    if (res.ok) {
      const data = await res.json()
      setTeams(prev => [...prev, { ...data.team, members: [{ user: { id: (session?.user as any)?.id, pseudo: session?.user?.name, avatarUrl: session?.user?.image } }] }])
      setTeamName('')
    }
  }

  const handleJoinTeam = async (teamId: string) => {
    const res = await fetch(`/api/teams/${teamId}/join`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: [...t.members, { user: { id: (session?.user as any)?.id, pseudo: session?.user?.name, avatarUrl: session?.user?.image } }] } : t))
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem 0' }}>Chargement...</div>
  if (!tournament) return <div className="container" style={{ padding: '2rem 0' }}>Tournoi introuvable</div>

  const isOrganizer = (session?.user as any)?.id === tournament.organizerId

  return (
    <div>
      {/* Hero visuel */}
      <div style={{
        background: tournament.posterUrl ? `url(${tournament.posterUrl}) center/cover no-repeat` : 'linear-gradient(135deg, #0f172a, #1f2937)',
        height: 320,
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.85))' }} />
        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#fff' }}>
          <div>
            <h1 style={{ margin: 0 }}>{tournament.name}</h1>
            <div style={{ opacity: 0.9, marginTop: 8 }}>{tournament.game || '—'}</div>
          </div>
        </div>
      </div>

      {/* Barre d’infos */}
      <div style={{ background: '#0b0f1a', color: '#fff', padding: '24px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div>
            <div style={{ opacity: 0.8 }}>Début</div>
            <div style={{ fontWeight: 600 }}>{tournament.startDate ? new Date(tournament.startDate).toLocaleString() : 'À définir'}</div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Participants</div>
            <div style={{ fontWeight: 600 }}>{teams.length} équipe(s)</div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Format</div>
            <div style={{ fontWeight: 600 }}>{tournament.format}</div>
          </div>
          <div>
            <div style={{ opacity: 0.8 }}>Créé par</div>
            <div style={{ fontWeight: 600 }}>{tournament.organizer?.pseudo || '—'}</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container" style={{ padding: '1.5rem 0' }}>
        {!isOrganizer && (
          <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
            <div className="card-body">
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (!session?.user) {
                    const returnTo = encodeURIComponent(window.location.pathname)
                    window.location.href = `/register?returnTo=${returnTo}`
                    return
                  }
                  alert('Inscription: à implémenter (selon le format du tournoi)')
                }}
              >
                Je m'inscris à ce tournoi !
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h2>Équipes</h2></div>
        <div className="card-body">
          {!isOrganizer ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input className="form-input" placeholder="Nom de l'équipe" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
              <button className="btn btn-primary" onClick={handleCreateTeam}>Créer une équipe</button>
            </div>
          ) : (
            <div className="text-muted" style={{ marginBottom: 12 }}>
              En tant qu’organisateur, vous ne pouvez pas créer ou rejoindre une équipe.
            </div>
          )}
          <ul style={{ display: 'grid', gap: 12 }}>
            {teams.map(team => (
              <li key={team.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{team.name}</strong>
                    <div className="text-muted" style={{ marginTop: 4 }}>{team.members.length} membre(s)</div>
                  </div>
                  {!isOrganizer && (
                    <button className="btn btn-outline" onClick={() => handleJoinTeam(team.id)}>Rejoindre</button>
                  )}
                </div>
                {team.members.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    {team.members.map((m: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {m.user.avatarUrl ? (
                          <img src={m.user.avatarUrl} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#eee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                            {(m.user.pseudo || 'U').charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span>{m.user.pseudo}</span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <MatchesSection tournamentId={id} isOrganizer={isOrganizer} />
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

  if (loading) return <div className="card"><div className="card-body">Chargement des matchs...</div></div>

  return (
    <div className="card">
      <div className="card-header"><h2>Résultats</h2></div>
      <div className="card-body">
        {matches.length === 0 ? (
          <div className="text-muted">Aucun match pour le moment.</div>
        ) : (
          <ul style={{ display: 'grid', gap: 12 }}>
            {matches.map(match => (
              <li key={match.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <strong>{match.teamA?.name || 'Équipe A'} vs {match.teamB?.name || 'Équipe B'}</strong>
                    <div className="text-muted" style={{ marginTop: 4 }}>Statut: {match.status}</div>
                  </div>
                  {isOrganizer && match.status !== 'COMPLETED' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success" onClick={() => handleValidate(match.id, match.teamAId)}>Victoire équipe A</button>
                      <button className="btn btn-error" onClick={() => handleValidate(match.id, match.teamBId)}>Victoire équipe B</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}


