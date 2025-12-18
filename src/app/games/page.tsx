'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SearchIcon from '@/components/ui/SearchIcon'
import { GameCardSkeleton, PageContent } from '@/components/ui'
import styles from './page.module.scss'

interface Game {
  id: string
  name: string
  slug: string
  imageUrl: string | null
  logoUrl: string | null
  posterUrl: string | null
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [filteredGames, setFilteredGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Charger tous les jeux
  useEffect(() => {
    const loadGames = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/games')
        const data = await res.json()
        const allGames = data.games || []
        setGames(allGames)
        setFilteredGames(allGames)
      } catch (error) {
        console.error('Erreur lors du chargement des jeux:', error)
        setGames([])
        setFilteredGames([])
      } finally {
        setLoading(false)
      }
    }
    loadGames()
  }, [])

  // Filtrer les jeux selon la recherche
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGames(games)
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = games.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        (game.slug && game.slug.toLowerCase().includes(query))
    )
    setFilteredGames(filtered)
  }, [searchQuery, games])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <PageContent style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tous les jeux</h1>
          <p className={styles.subtitle}>
            Découvrez tous les jeux disponibles pour participer à des tournois
          </p>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Rechercher un jeu..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <div className={styles.searchIcon}>
              <SearchIcon width={20} height={20} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles.gamesGrid}>
            <GameCardSkeleton count={12} />
          </div>
        ) : filteredGames.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyMessage}>
              {searchQuery
                ? `Aucun jeu trouvé pour "${searchQuery}"`
                : 'Aucun jeu disponible'}
            </p>
          </div>
        ) : (
          <div className={styles.gamesGrid}>
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                href={`/games/${encodeURIComponent(game.name)}`}
                className={styles.gameCard}
              >
                <div className={styles.gameImageContainer}>
                  {(() => {
                    const posterPath = game.posterUrl || game.imageUrl
                    return posterPath ? (
                      <img
                        src={posterPath}
                        alt={game.name}
                        className={styles.gameImage}
                      />
                    ) : (
                      <div className={styles.gameImagePlaceholder}>
                        {game.name.charAt(0).toUpperCase()}
                      </div>
                    )
                  })()}
                </div>
                <div className={styles.gameText}>
                  <h3 className={styles.gameTitle}>{game.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredGames.length > 0 && (
          <div className={styles.resultsCount}>
            {filteredGames.length} jeu{filteredGames.length > 1 ? 'x' : ''}{' '}
            {searchQuery && `trouvé${filteredGames.length > 1 ? 's' : ''}`}
          </div>
        )}
    </PageContent>
  )
}

