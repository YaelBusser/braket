'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SearchBar } from '@/components/ui'

export default function GamesPage() {
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingPopular, setLoadingPopular] = useState(true)

  // Charger les jeux populaires au montage
  useEffect(() => {
    const loadPopularGames = async () => {
      setLoadingPopular(true)
      try {
        const res = await fetch(`/api/games/popular?page=1&page_size=20`)
        const data = await res.json()
        setGames(data.games || [])
        setHasMore(data.hasMore || false)
      } catch (error) {
        console.error('Erreur chargement jeux populaires:', error)
        setGames([])
        setHasMore(false)
      } finally {
        setLoadingPopular(false)
      }
    }
    
    loadPopularGames()
  }, [])

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
        } else if (query.trim().length === 0) {
          // Recharger les jeux populaires quand la recherche est effacée
          setLoadingPopular(true)
          try {
            const res = await fetch(`/api/games/popular?page=1&page_size=20`)
            const data = await res.json()
            setGames(data.games || [])
            setHasMore(data.hasMore || false)
          } catch (error) {
            console.error('Erreur chargement jeux populaires:', error)
            setGames([])
            setHasMore(false)
          } finally {
            setLoadingPopular(false)
          }
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
      let res
      if (query.trim().length >= 2) {
        // Charger plus de résultats de recherche
        res = await fetch(`/api/games/search?q=${encodeURIComponent(query.trim())}&page=${page + 1}`)
      } else {
        // Charger plus de jeux populaires
        res = await fetch(`/api/games/popular?page=${page + 1}&page_size=20`)
      }
      
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
    return 'Jeux vidéo'
  }

  const getCategoryGradient = () => {
    return 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #8b5cf6 100%)'
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
          <SearchBar
            placeholder="Rechercher un jeu..."
            size="md"
            variant="light"
            onSearch={(query) => setQuery(query)}
          />
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
                      window.location.href = `/games/${encodeURIComponent(game.name)}`
                    }}>
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
            
            {loadingPopular ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af' }}>Chargement des jeux populaires...</div>
              </div>
            ) : games.length === 0 ? (
              <div style={{
                background: '#1f2937',
                borderRadius: '12px',
                padding: '2rem',
                border: '1px solid #374151',
                textAlign: 'center'
              }}>
                <div style={{ color: '#9ca3af', fontSize: '1.125rem', marginBottom: '1rem' }}>
                  Aucun jeu populaire trouvé pour cette catégorie
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Utilisez la barre de recherche ci-dessus pour découvrir des milliers de jeux
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {games.map((game, index) => (
                    <div key={index} style={{
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
                      window.location.href = `/games/${encodeURIComponent(game.name)}`
                    }}>
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
        )}
      </div>
    </main>
  )
}
