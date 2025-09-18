'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState('')
  const [sort, setSort] = useState('created_desc')
  const [startMin, setStartMin] = useState('')
  const [startMax, setStartMax] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q') || ''
    setQ(query)
    const load = async () => {
      setLoading(true)
      let cat = 'VIDEO_GAMES'
      try { const stored = localStorage.getItem('lt_category'); if (stored) cat = stored } catch {}
      const params = new URLSearchParams({ category: cat, q: query })
      if (game) params.set('game', game)
      if (sort) params.set('sort', sort)
      if (startMin) params.set('startMin', startMin)
      if (startMax) params.set('startMax', startMax)
      const res = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await res.json()
      setItems(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [game, sort, startMin, startMax])

  return (
    <main>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-body" style={{ display: 'grid', gap: 8, gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr' }}>
            <input className="form-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher..." onKeyDown={(e) => e.key === 'Enter' && (window.location.href = `/search?q=${encodeURIComponent(q)}`)} />
            <input className="form-input" placeholder="Filtrer par jeu..." value={game} onChange={(e) => setGame(e.target.value)} />
            <select className="form-input" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created_desc">Plus récents</option>
              <option value="start_asc">Début croissant</option>
              <option value="start_desc">Début décroissant</option>
            </select>
            <input className="form-input" type="date" value={startMin} onChange={(e) => setStartMin(e.target.value)} />
            <input className="form-input" type="date" value={startMax} onChange={(e) => setStartMax(e.target.value)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>Résultats</h2></div>
          <div className="card-body">
            {loading ? (
              <div>Chargement...</div>
            ) : items.length === 0 ? (
              <div className="text-muted">Aucun tournoi trouvé.</div>
            ) : (
              <ul style={{ display: 'grid', gap: 12 }}>
                {items.map(t => (
                  <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {t.posterUrl ? (
                        <img src={t.posterUrl} alt="" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                      ) : null}
                      <div>
                        <strong>{t.name}</strong>
                        <div className="text-muted" style={{ marginTop: 4 }}>{t.game || '—'} · {t.format}</div>
                      </div>
                    </div>
                    <Link className="btn btn-outline" href={`/tournaments/${t.id}`}>Voir</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


