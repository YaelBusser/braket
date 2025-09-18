'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.scss'

// Cette page reste en SSR (Server Side Rendering)
export default function Home() {
  const [category, setCategory] = useState<'VIDEO_GAMES'|'SPORTS'|'BOARD_GAMES'>('VIDEO_GAMES')
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lt_category') as any
      if (stored) setCategory(stored)
    } catch {}
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(`/api/tournaments?category=${category}`)
      const data = await res.json()
      setTournaments(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [category])

  // Pas de sélection locale: le header gère la catégorie

  useEffect(() => {
    // Thème header selon catégorie
    const root = document.documentElement
    if (category === 'VIDEO_GAMES') root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #111827, #1f2937)')
    else if (category === 'SPORTS') root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #065f46, #10b981)')
    else root.style.setProperty('--nav-bg', 'linear-gradient(135deg, #4c1d95, #f59e0b)')
  }, [category])

  return (
    <main className={styles.hero}>
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            placeholder="Rechercher un tournoi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Navigate automatiquement vers /search après une courte pause de saisie */}
        {/* eslint-disable-next-line react-hooks/rules-of-hooks */}
        {(() => {
          // petit hack pour rester simple dans cette page: navigation contrôlée par query via IIFE
          // on utilise un micro effet basé sur setTimeout externe à React
          if (typeof window !== 'undefined') {
            ;(window as any).__lt_home_search_timer && clearTimeout((window as any).__lt_home_search_timer)
            ;(window as any).__lt_home_search_timer = setTimeout(() => {
              if (query.trim().length >= 2) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`)
              }
            }, 400)
          }
          return null
        })()}

        <div className="card">
          <div className="card-header"><h2>Tournois publics</h2></div>
          <div className="card-body">
            {loading ? (
              <div>Chargement...</div>
            ) : tournaments.length === 0 ? (
              <div className="text-muted">Aucun tournoi public dans cette catégorie.</div>
            ) : (
              <ul style={{ display: 'grid', gap: 12 }}>
                {tournaments.map(t => (
                  <li key={t.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {t.posterUrl ? (
                        <img src={t.posterUrl} alt="" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                      ) : null}
                      <div>
                        <strong>{t.name}</strong>
                        <div className="text-muted" style={{ marginTop: 4 }}>{(t.game || '—') + ' · ' + t.format}</div>
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