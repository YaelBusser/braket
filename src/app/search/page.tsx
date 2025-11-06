'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TournamentCard } from '@/components/ui'
import Link from 'next/link'
import { filterGames, GameInfo } from '@/data/games'

export default function SearchPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState('')
  const [sort, setSort] = useState('created_desc')
  const [startMin, setStartMin] = useState('')
  const [startMax, setStartMax] = useState('')
  const [activeFilter, setActiveFilter] = useState<'Tournois' | 'Équipes' | 'Joueurs'>('Tournois')
  const [gameResults, setGameResults] = useState<GameInfo[]>([])
  const [loadingGames, setLoadingGames] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q') || ''
    
    setQ(query)
    setGame('') // On ne gère plus le paramètre game ici
  }, [])

  // Charger les jeux (liste statique) quand on fait une recherche
  useEffect(() => {
    const loadGames = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setGameResults([])
        return
      }
      
      setLoadingGames(true)
      try {
        const results = filterGames(q)
        setGameResults(results)
      } finally {
        setLoadingGames(false)
      }
    }
    
    loadGames()
  }, [q])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      
      // Toujours utiliser la recherche globale (q) pour les tournois
      // La recherche dans les tournois cherche dans le nom ET le jeu
      if (q.trim()) {
        params.set('q', q.trim())
      }
      
      if (sort) params.set('sort', sort)
      if (startMin) params.set('startMin', startMin)
      if (startMax) params.set('startMax', startMax)
      
      const res = await fetch(`/api/tournaments?${params.toString()}`)
      const data = await res.json()
      setItems(data.tournaments || [])
      setLoading(false)
    }
    load()
  }, [q, sort, startMin, startMax])

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Header - pas de barre locale, on s'appuie sur celle du header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: '2rem', 
            fontWeight: '700', 
            marginBottom: '1.5rem' 
          }}>
            {q ? `Résultats pour "${q}"` : 'Recherche'}
          </h1>
          {/* Onglets (priorité Tournois) */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {['Tournois', 'Équipes', 'Joueurs'].map((filter) => (
              <button
                key={filter}
                style={{
                  background: activeFilter === (filter as any) ? '#3b82f6' : 'transparent',
                  color: activeFilter === (filter as any) ? '#fff' : '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveFilter(filter as any)}
                onMouseEnter={(e) => {
                  if (activeFilter !== (filter as any)) {
                    e.currentTarget.style.background = '#374151'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== (filter as any)) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = '#9ca3af'
                  }
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Section Jeux supprimée ici: la page de recherche privilégie Tournois */}

        {/* Section Tournois */}
        {activeFilter === 'Tous' || activeFilter === 'Tournois' ? (
          <div>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '1.5rem' 
            }}>
              Tournois
            </h2>
            
            {loading ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                Chargement des tournois...
              </div>
            ) : items.length === 0 ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                Aucun tournoi trouvé pour "{q}".
                <br />
                <small style={{ fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
                  Recherche dans: nom du tournoi et jeu associé
                </small>
              </div>
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
        ) : null}
      </div>
    </main>
  )
}


