'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './page.module.scss'
import { SearchBar } from '@/components/ui'
import { GAMES, filterGames, GameInfo } from '@/data/games'

export default function GamesPage() {
  const [query, setQuery] = useState('')
  const [games, setGames] = useState<GameInfo[]>([])
  const [searching, setSearching] = useState(false)
  const [loadingPopular, setLoadingPopular] = useState(true)

  // Charger les jeux au montage (liste statique)
  useEffect(() => {
    setLoadingPopular(true)
    setGames(GAMES.slice(0, 10))
    setLoadingPopular(false)
  }, [])

  // Recherche locale avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        setSearching(true)
        setGames(filterGames(query))
        setSearching(false)
      } else if (query.trim().length === 0) {
        setGames(GAMES.slice(0, 10))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Pas de pagination avec la liste statique
  const hasMore = false

  const getCategoryTitle = () => 'Jeux'

  return (
    <main style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* En-tête simple: titre + recherche */}
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem' }}>
          {getCategoryTitle()}
        </h1>
        <div style={{ width: '100%', maxWidth: '680px', marginBottom: '1.5rem' }}>
          <SearchBar
            placeholder="Recherche d'une partie..."
            size="sm"
            variant="dark"
            onSearch={(v) => setQuery(v)}
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container" style={{ padding: '1rem 0 2rem 0' }}>
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
                  setGames(GAMES.slice(0, 10))
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
                <div className={styles.gamesGrid}>
                  {games.map((game, index) => (
                    <div
                      key={index}
                      className={styles.gameCard}
                      onClick={() => {
                        window.location.href = `/games/${encodeURIComponent(game.name)}`
                      }}
                    >
                      <div className={styles.gameImageContainer}>
                        {game.image ? (
                          <img src={game.image} alt={game.name} className={styles.gameImage} />
                        ) : (
                          <div className={styles.gameImage} style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffffff', fontWeight: 'bold', fontSize: '2rem'
                          }}>
                            {game.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.gameText}>
                        <div className={styles.gameTitle}>{game.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className={styles.gamesGrid}>
                  {games.map((game, index) => (
                    <div
                      key={index}
                      className={styles.gameCard}
                      onClick={() => {
                        window.location.href = `/games/${encodeURIComponent(game.name)}`
                      }}
                    >
                      <div className={styles.gameImageContainer}>
                        {game.image ? (
                          <img src={game.image} alt={game.name} className={styles.gameImage} />
                        ) : (
                          <div className={styles.gameImage} style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#ffffff', fontWeight: 'bold', fontSize: '2rem'
                          }}>
                            {game.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className={styles.gameText}>
                        <div className={styles.gameTitle}>{game.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
