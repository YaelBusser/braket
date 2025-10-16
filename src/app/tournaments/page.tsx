'use client'

import { useEffect, useState } from 'react'
import ClientPageWrapper from '../../components/ClientPageWrapper'
import { TournamentCard } from '@/components/ui'
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
      const res = await fetch(`/api/tournaments`)
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


