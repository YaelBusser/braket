'use client'

import { useEffect, useState } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import { TournamentCard, SearchBar } from '@/components/ui'
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
  const [q, setQ] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      const res = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await res.json()
      setItems(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [q])

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <h1 style={{ color: '#fff', fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Tournois</h1>
      <div style={{ maxWidth: '560px', marginBottom: '1.5rem' }}>
        <SearchBar
          placeholder="Rechercher un tournoi..."
          size="sm"
          variant="dark"
          onSearch={(v) => setQ(v)}
        />
      </div>
      {loading ? (
        <div>Chargement...</div>
      ) : items.length === 0 ? (
        <div className="text-muted">Aucun tournoi public</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {items.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
            />
          ))}
        </div>
      )}
    </div>
  )
}


