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
        <div className="surface" style={{ padding: 12 }}>
          <ul className="list">
            {items.map(t => (
              <li key={t.id} className="row">
                {t.posterUrl ? (<img className="rowPoster" src={t.posterUrl} alt="" />) : (<div className="rowPoster" style={{ background: 'rgba(255,255,255,0.06)' }} />)}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{t.name}</strong>
                    {(t as any).status && (<span className="chip">{(t as any).status}</span>)}
                  </div>
                  <div className="text-muted">{t.game} · {t.format} · {t.visibility}</div>
                </div>
                <Link className="btn btn-outline" href={`/tournaments/${t.id}`}>Voir</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}


