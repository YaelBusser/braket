'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCategory } from '@/components/providers/category-provider'

export default function SearchPage() {
  const router = useRouter()
  const { category } = useCategory()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [game, setGame] = useState('')
  const [sort, setSort] = useState('created_desc')
  const [startMin, setStartMin] = useState('')
  const [startMax, setStartMax] = useState('')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [gameResults, setGameResults] = useState<any[]>([])
  const [loadingGames, setLoadingGames] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q') || ''
    
    setQ(query)
    setGame('') // On ne gère plus le paramètre game ici
  }, [])

  // Charger les jeux quand on fait une recherche
  useEffect(() => {
    const loadGames = async () => {
      if (!q.trim() || q.trim().length < 2) {
        setGameResults([])
        return
      }
      
      setLoadingGames(true)
      try {
        const res = await fetch(`/api/games/search-global?q=${encodeURIComponent(q.trim())}&page_size=6`)
        const data = await res.json()
        setGameResults(data.games || [])
      } catch (error) {
        console.error('Erreur chargement jeux:', error)
        setGameResults([])
      } finally {
        setLoadingGames(false)
      }
    }
    
    loadGames()
  }, [q])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const params = new URLSearchParams({ category })
      
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
  }, [category, q, sort, startMin, startMax])

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Header de recherche */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#fff', 
            fontSize: '2rem', 
            fontWeight: '700', 
            marginBottom: '1.5rem' 
          }}>
            {q ? `Résultat de recherche pour "${q}"` : 'Recherche'}
          </h1>
          
          {/* Barre de recherche modifiable */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            position: 'relative',
            marginBottom: '1.5rem'
          }}>
            <input
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#ffffff',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
              placeholder="Rechercher des jeux, tournois..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && q.trim().length >= 2) {
                  // Rediriger vers la page de recherche avec la nouvelle query
                  router.push(`/search?q=${encodeURIComponent(q.trim())}`)
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#374151'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6b7280'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
          </div>
          
          {/* Boutons d'action */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (q.trim().length >= 2) {
                  router.push(`/search?q=${encodeURIComponent(q.trim())}`)
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6'
              }}
            >
              Rechercher
            </button>
            
            {(q || game) && (
              <button
                style={{
                  background: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setQ('')
                  setGame('')
                  router.push('/search')
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#374151'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                Effacer la recherche
              </button>
            )}
          </div>
          
          {/* Filtres par catégorie */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {['Tous', 'Jeux', 'Tournois'].map((filter) => (
              <button
                key={filter}
                style={{
                  background: activeFilter === filter ? '#3b82f6' : 'transparent',
                  color: activeFilter === filter ? '#fff' : '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setActiveFilter(filter)}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter) {
                    e.currentTarget.style.background = '#374151'
                    e.currentTarget.style.color = '#fff'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter) {
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

        {/* Section Jeux */}
        {activeFilter === 'Tous' || activeFilter === 'Jeux' ? (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '1.5rem' 
            }}>
              Jeux trouvés ({gameResults.length})
            </h2>
            
            {loadingGames ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Recherche de jeux...</div>
              </div>
            ) : gameResults.length === 0 ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Aucun jeu trouvé pour "{q}"</div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1.5rem'
              }}>
                {gameResults.map((game) => (
                  <div
                    key={game.id}
                    style={{
                      background: '#1f2937',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #374151',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#374151'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onClick={() => {
                      // Rediriger vers la page dédiée du jeu
                      router.push(`/games/${encodeURIComponent(game.name)}`)
                    }}
                  >
                    {/* Image du jeu */}
                    <div style={{
                      width: '100%',
                      height: '150px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {game.background_image ? (
                        <img
                          src={game.background_image}
                          alt={game.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          color: '#ffffff',
                          fontWeight: 'bold'
                        }}>
                          {game.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    {/* Contenu de la carte */}
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        lineHeight: '1.3'
                      }}>
                        {game.name}
                      </h3>
                      
                      {game.released && (
                        <div style={{
                          color: '#9ca3af',
                          fontSize: '0.875rem',
                          marginBottom: '0.5rem'
                        }}>
                          {new Date(game.released).getFullYear()}
                        </div>
                      )}
                      
                      {game.genres && game.genres.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.25rem',
                          marginTop: '0.5rem'
                        }}>
                          {game.genres.slice(0, 2).map((genre: any) => (
                            <span
                              key={genre.id}
                              style={{
                                background: '#374151',
                                color: '#9ca3af',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem'
                              }}
                            >
                              {genre.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

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
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
              }}>
                {items.map(t => (
                  <Link
                    key={t.id}
                    href={`/tournaments/${t.id}`}
                    style={{
                      background: '#1f2937',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid #374151',
                      transition: 'all 0.2s ease',
                      textDecoration: 'none',
                      color: '#fff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '200px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {t.posterUrl ? (
                        <img 
                          src={t.posterUrl} 
                          alt={t.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #374151, #4b5563)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                          fontSize: '3rem'
                        }}>
                          🏆
                        </div>
                      )}
                    </div>
                    
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ 
                        margin: 0, 
                        color: '#fff', 
                        fontSize: '1.125rem', 
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {t.name}
                      </h3>
                      
                      <div style={{ 
                        color: '#9ca3af', 
                        fontSize: '0.875rem',
                        marginBottom: '0.5rem'
                      }}>
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </div>
                      
                      {t.game && (
                        <div style={{ 
                          color: '#3b82f6', 
                          fontSize: '0.75rem',
                          marginBottom: '0.75rem',
                          fontWeight: '500'
                        }}>
                          🎮 {t.game}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            background: t.status === 'REG_OPEN' ? '#10b981' : 
                                       t.status === 'IN_PROGRESS' ? '#f59e0b' : 
                                       t.status === 'COMPLETED' ? '#6b7280' : '#374151',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {t.status === 'REG_OPEN' ? 'Inscriptions ouvertes' : 
                             t.status === 'IN_PROGRESS' ? 'En cours' : 
                             t.status === 'COMPLETED' ? 'Terminé' : 'Brouillon'}
                          </span>
                        </div>
                        
                        <div style={{ 
                          color: '#9ca3af', 
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          {t._count?.registrations || 0} {t.isTeamBased ? 'Équipes' : 'Joueurs'}
                          <div style={{
                            width: '24px',
                            height: '24px',
                            background: '#374151',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem'
                          }}>
                            {t.isTeamBased ? '👥' : '👤'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  )
}


