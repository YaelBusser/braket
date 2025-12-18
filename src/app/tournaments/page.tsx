'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { TournamentCard, SearchBar, PageContent } from '@/components/ui'
import Link from 'next/link'

export default function TournamentsIndex() {
  return <TournamentsList />
}

function TournamentsList() {
  const { data: session } = useSession()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const userId = (session?.user as any)?.id || null

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
    <PageContent style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>Tournois</h1>
      <div style={{ maxWidth: '560px', marginBottom: '2rem' }}>
        <SearchBar
          placeholder="Rechercher un tournoi..."
          size="sm"
          variant="dark"
          onSearch={(v) => setQ(v)}
        />
      </div>
      {loading ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem',
          width: '100%'
        }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <TournamentCard key={index} loading={true} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-muted">Aucun tournoi public</div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem',
          width: '100%'
        }}>
          {items.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              userId={userId}
            />
          ))}
        </div>
      )}
    </PageContent>
  )
}


