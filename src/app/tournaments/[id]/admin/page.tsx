'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TournamentAdminPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id as string
  const router = useRouter()
  const [tournament, setTournament] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/tournaments/${id}`)
      const data = await res.json()
      setTournament(data.tournament)
      setLoading(false)
    }
    if (id) load()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Supprimer définitivement ce tournoi ?')) return
    setDeleting(true)
    const res = await fetch(`/api/tournaments/${id}`, { method: 'DELETE' })
    setDeleting(false)
    if (res.ok) {
      alert('Tournoi supprimé')
      router.replace('/profile')
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.message || 'Erreur lors de la suppression')
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem 0' }}>Chargement...</div>
  if (!tournament) return <div className="container" style={{ padding: '2rem 0' }}>Introuvable</div>

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header"><h1>Administration du tournoi</h1></div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: 8 }}>
            <div><strong>Nom:</strong> {tournament.name}</div>
            <div><strong>Catégorie:</strong> {tournament.category}</div>
            <div><strong>Format:</strong> {tournament.format}</div>
            <div><strong>Visibilité:</strong> {tournament.visibility}</div>
            <div><strong>Début:</strong> {tournament.startDate ? new Date(tournament.startDate).toLocaleString() : '—'}</div>
            <div><strong>Fin:</strong> {tournament.endDate ? new Date(tournament.endDate).toLocaleString() : '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button className="btn btn-error" onClick={handleDelete} disabled={deleting}>{deleting ? 'Suppression...' : 'Supprimer le tournoi'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


