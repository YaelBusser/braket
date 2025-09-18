'use client'

import { useEffect, useState } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import Link from 'next/link'

export default function TournamentsIndex() {
  return (
    <ClientPageWrapper>
      <TournamentsList />
    </ClientPageWrapper>
  )
}

function TournamentsList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      let cat = 'VIDEO_GAMES'
      try {
        const stored = localStorage.getItem('lt_category')
        if (stored) cat = stored
      } catch {}
      const res = await fetch(`/api/tournaments?category=${cat}`)
      const data = await res.json()
      setItems(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {loading ? (
        <div>Chargement...</div>
      ) : items.length === 0 ? (
        <div className="text-muted">Aucun tournoi public</div>
      ) : (
        <ul style={{ display: 'grid', gap: 12 }}>
          {items.map(t => (
            <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{t.name}</strong>
                <div className="text-muted" style={{ marginTop: 4 }}>{t.game} · {t.format} · {t.visibility}</div>
              </div>
              <Link className="btn btn-outline" href={`/tournaments/${t.id}`}>Voir</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}


