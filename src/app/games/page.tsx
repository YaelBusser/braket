'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useCategory } from '@/components/providers/category-provider'

export default function GamesPage() {
  const { category } = useCategory()
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Recherche de jeux avec debounce
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const timer = setTimeout(async () => {
        if (query.trim().length >= 2) {
          setSearching(true)
          setPage(1)
          try {
            const res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}&page=1`)
            const data = await res.json()
            setGames(data.games || [])
            setHasMore(data.hasMore || false)
          } catch (error) {
            console.error('Erreur recherche jeux:', error)
            setGames([])
            setHasMore(false)
          } finally {
            setSearching(false)
          }
        } else {
          setGames([])
          setHasMore(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [query])

  // Charger plus de jeux
  const loadMore = async () => {
    if (loading || !hasMore) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}&page=${page + 1}`)
      const data = await res.json()
      setGames(prev => [...prev, ...(data.games || [])])
      setHasMore(data.hasMore || false)
      setPage(prev => prev + 1)
    } catch (error) {
      console.error('Erreur chargement jeux:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCategoryTitle = () => {
    switch (category) {
      case 'VIDEO_GAMES': return 'Jeux vidéo'
      case 'SPORTS': return 'Sports'
      case 'BOARD_GAMES': return 'Jeux de société'
      default: return 'Jeux'
    }
  }

  const getCategoryGradient = () => {
    switch (category) {
      case 'VIDEO_GAMES': return 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)'
      case 'SPORTS': return 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)'
      case 'BOARD_GAMES': return 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #f59e0b 100%)'
      default: return 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)'
    }
  }

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header avec bannière colorée */}
      <div style={{
        background: getCategoryGradient(),
        height: '280px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Overlay avec gradient */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)'
        }} />

        {/* Contenu du header */}
        <div className="container" style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '2rem',
          textAlign: 'center'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '3rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fff 0%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '1rem'
          }}>
            {getCategoryTitle()}
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            color: '#cbd5e1',
            marginBottom: '2rem',
            maxWidth: '600px'
          }}>
            Découvrez et explorez tous les jeux disponibles pour organiser vos tournois
          </p>
          
          {/* Barre de recherche */}
          <div style={{
            width: '100%',
            maxWidth: '600px',
            position: 'relative'
          }}>
            <input
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                fontSize: '1rem',
                outline: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
              placeholder="Rechercher un jeu..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: searching ? '#3b82f6' : '#6b7280'
            }}>
              {searching ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid #3b82f6', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container" style={{ padding: '2rem 0' }}>
        {/* Résultats de recherche */}
        {query.length >= 2 ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ 
                color: '#fff', 
                fontSize: '1.5rem', 
                fontWeight: '600',
                margin: 0
              }}>
                Résultats pour "{query}" ({games.length})
              </h2>
              <button
                style={{
                  background: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  setQuery('')
                  setGames([])
                  setPage(1)
                  setHasMore(false)
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#374151'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#9ca3af'
                }}
              >
                Effacer la recherche
              </button>
            </div>

            {searching ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Recherche en cours...</div>
              </div>
            ) : games.length === 0 ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Aucun jeu trouvé pour "{query}".</div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {games.map((game, index) => (
                    <div key={index} style={{
                      background: '#1f2937',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      border: '1px solid #374151',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    onClick={() => {
                      window.location.href = `/games/${encodeURIComponent(game.name)}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        {game.background_image ? (
                          <img 
                            src={game.background_image} 
                            alt="" 
                            style={{ 
                              width: '60px', 
                              height: '60px', 
                              borderRadius: '12px', 
                              objectFit: 'cover' 
                            }} 
                          />
                        ) : (
                          <div style={{
                            width: '60px',
                            height: '60px',
                            background: '#374151',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#9ca3af',
                            fontSize: '1.5rem'
                          }}>
                            {game.name.charAt(0)}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h3 style={{ margin: 0, color: '#fff', fontSize: '1.125rem', fontWeight: '600' }}>
                            {game.name}
                          </h3>
                          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                            {game.released ? new Date(game.released).getFullYear() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                        {game.description_raw ? 
                          game.description_raw.substring(0, 120) + '...' : 
                          'Aucune description disponible'
                        }
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '0.5rem', 
                        marginTop: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        {game.genres?.slice(0, 3).map((genre: any, idx: number) => (
                          <span key={idx} style={{
                            background: '#374151',
                            color: '#9ca3af',
                            borderRadius: '999px',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem'
                          }}>
                            {genre.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center' }}>
                    <button
                      style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s ease'
                      }}
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Charger plus de jeux'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ 
              color: '#fff', 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              marginBottom: '1.5rem' 
            }}>
              Jeux populaires
            </h2>
            
            <div style={{
              background: '#1f2937',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #374151',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '1rem' }}>
                Commencez à taper le nom d'un jeu pour le rechercher
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                Utilisez la barre de recherche ci-dessus pour découvrir des milliers de jeux
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
