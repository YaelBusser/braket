'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { findGameByName, GameInfo } from '@/data/games'
import { ContentContainer, Tabs, TournamentCard } from '@/components/ui'
import { getGameLogoPath } from '@/utils/gameLogoUtils'
import styles from './page.module.scss'

interface Tournament {
  id: string
  name: string
  description: string | null
  game: string | null
  format: string
  visibility: string
  category: string
  posterUrl: string | null
  isTeamBased: boolean
  maxParticipants: number | null
  kind: string
  startDate: string | null
  endDate: string | null
  status: string
  registrationDeadline: string | null
  organizerId: string
  createdAt: string
  _count: {
    registrations: number
  }
}

type GameDetails = GameInfo

export default function GamePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [gameName, setGameName] = useState('')
  const [gameDetails, setGameDetails] = useState<GameDetails | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [gameLoading, setGameLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tournaments')
  const [tournamentFilter, setTournamentFilter] = useState('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const userId = (session?.user as any)?.id || null

  useEffect(() => {
    if (params.gameName) {
      const decodedGameName = decodeURIComponent(params.gameName as string)
      setGameName(decodedGameName)
    }
  }, [params.gameName])

  // Charger les détails du jeu depuis la liste statique
  useEffect(() => {
    if (!gameName) return
    setGameLoading(true)
    const found = findGameByName(gameName)
    setGameDetails(found || null)
    setGameLoading(false)
  }, [gameName])

  useEffect(() => {
    const loadTournaments = async () => {
      if (!gameName) return
      
      setLoading(true)
      try {
        const params = new URLSearchParams({ 
          game: gameName
        })
        
        const res = await fetch(`/api/tournaments?${params.toString()}`)
        const data = await res.json()
        setTournaments(data.tournaments || [])
      } catch (error) {
        console.error('Erreur lors du chargement des tournois:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTournaments()
  }, [gameName])

  const getFilteredTournaments = () => {
    let filtered = tournaments
    
    // Filtre par statut
    if (tournamentFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(tournament => {
        const startDate = tournament.startDate ? new Date(tournament.startDate) : null
        
        switch (tournamentFilter) {
          case 'upcoming':
            return !startDate || startDate > now
          case 'in_progress':
            return startDate && startDate <= now && tournament.status === 'IN_PROGRESS'
          case 'completed':
            return tournament.status === 'COMPLETED'
          default:
            return true
        }
      })
    }
    
    // Filtre par format
    if (formatFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.format === formatFilter)
    }
    
    // Filtre par catégorie
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tournament => tournament.category === categoryFilter)
    }
    
    return filtered
  }
  
  // Obtenir les formats et catégories uniques
  const availableFormats = Array.from(new Set(tournaments.map(t => t.format).filter(Boolean)))
  const availableCategories = Array.from(new Set(tournaments.map(t => t.category).filter(Boolean)))

  const getTournamentStats = () => {
    const now = new Date()
    const upcoming = tournaments.filter(t => {
      const startDate = t.startDate ? new Date(t.startDate) : null
      return !startDate || startDate > now
    }).length
    const inProgress = tournaments.filter(t => {
      const startDate = t.startDate ? new Date(t.startDate) : null
      return startDate && startDate <= now && t.status === 'IN_PROGRESS'
    }).length
    const completed = tournaments.filter(t => t.status === 'COMPLETED').length
    const totalParticipants = tournaments.reduce((sum, t) => sum + t._count.registrations, 0)
    
    return { upcoming, inProgress, completed, total: tournaments.length, totalParticipants }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'REG_OPEN':
        return 'Inscriptions ouvertes'
      case 'IN_PROGRESS':
        return 'En attente'
      case 'COMPLETED':
        return 'Terminé'
      default:
        return 'Brouillon'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REG_OPEN':
        return '#10b981'
      case 'IN_PROGRESS':
        return '#f59e0b'
      case 'COMPLETED':
        return '#6b7280'
      default:
        return '#374151'
    }
  }

  const filteredTournaments = getFilteredTournaments()

  return (
    <main style={{ background: 'var(--bg-page)', minHeight: '100vh' }}>
      {/* Header avec bannière du jeu - pleine largeur */}
      <div 
        className={styles.banner}
        style={{
          backgroundImage: gameDetails?.image 
            ? `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%), url(${gameDetails.image})`
            : 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          padding: '4rem 0',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '400px'
        }}
      >
        {/* Fade gradient en bas de la bannière */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 40%, var(--bg-page) 100%)',
          pointerEvents: 'none',
          zIndex: 1
        }} />
      </div>

      {/* Logo et nom du jeu - dans le flux normal du contenu */}
      <ContentContainer className={styles.gameHeader}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }}>
          {/* Image du jeu */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '16px',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            {gameLoading ? (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #ff008c 0%, #6748ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#ffffff'
              }}>
                {gameName.charAt(0).toUpperCase()}
              </div>
            ) : (() => {
              const gameLogoPath = getGameLogoPath(gameName)
              return gameLogoPath ? (
                <img 
                  src={gameLogoPath} 
                  alt={gameName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    background: '#1a1f2e',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #ff008c 0%, #6748ff 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#ffffff'
                }}>
                  {gameName.charAt(0).toUpperCase()}
                </div>
              )
            })()}
          </div>
          
          {/* Informations du jeu */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              color: '#ffffff',
              fontSize: '3rem',
              fontWeight: '700',
              margin: 0,
              marginBottom: '1rem',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {gameName}
            </h1>
            
            {/* Métadonnées simplifiées */}
            <div style={{ height: '1rem' }} />
            
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <p style={{
                color: '#e5e7eb',
                fontSize: '1.125rem',
                margin: 0,
                textShadow: '0 1px 3px rgba(0,0,0,0.5)'
              }}>
                {tournaments.length} tournoi{tournaments.length > 1 ? 's' : ''} au total
              </p>
              {tournaments.length > 0 && (
                <p style={{
                  color: '#e5e7eb',
                  fontSize: '1.125rem',
                  margin: 0,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                }}>
                  {tournaments.reduce((sum, t) => sum + t._count.registrations, 0)} participant{tournaments.reduce((sum, t) => sum + t._count.registrations, 0) > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>
      </ContentContainer>

      <ContentContainer style={{ padding: '2rem 0' }}>
        {/* Onglets principaux */}
        <Tabs
          tabs={[
            { key: 'tournaments', label: 'Tournois' },
            { key: 'about', label: 'À propos' },
            { key: 'stats', label: 'Statistiques' }
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Contenu des onglets */}
        <div className={styles.tabContent}>
        {activeTab === 'tournaments' && (
          <>
            {/* Filtres pour les tournois */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {/* Filtres de statut à gauche */}
              <div className={styles.filters}>
                {[
                  { id: 'all', label: 'Tous' },
                  { id: 'upcoming', label: 'À venir' },
                  { id: 'in_progress', label: 'En cours' },
                  { id: 'completed', label: 'Terminés' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTournamentFilter(filter.id)}
                    className={`${styles.filterBtn} ${tournamentFilter === filter.id ? styles.filterBtnActive : ''}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Filtres supplémentaires à droite */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Filtre par format */}
                {availableFormats.length > 0 && (
                  <div className={styles.filters} style={{ marginBottom: 0 }}>
                    <button
                      className={`${styles.filterBtn} ${formatFilter === 'all' ? styles.filterBtnActive : ''}`}
                      onClick={() => setFormatFilter('all')}
                    >
                      Tous les formats
                    </button>
                    {availableFormats.map((format) => (
                      <button
                        key={format}
                        className={`${styles.filterBtn} ${formatFilter === format ? styles.filterBtnActive : ''}`}
                        onClick={() => setFormatFilter(format)}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Filtre par catégorie */}
                {availableCategories.length > 0 && (
                  <div className={styles.filters} style={{ marginBottom: 0 }}>
                    <button
                      className={`${styles.filterBtn} ${categoryFilter === 'all' ? styles.filterBtnActive : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      Toutes les catégories
                    </button>
                    {availableCategories.map((category) => (
                      <button
                        key={category}
                        className={`${styles.filterBtn} ${categoryFilter === category ? styles.filterBtnActive : ''}`}
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Liste des tournois */}
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
        ) : filteredTournaments.length === 0 ? (
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #374151',
            textAlign: 'center'
          }}>
            <div style={{ color: '#9ca3af' }}>
              Aucun tournoi trouvé pour {gameName}.
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
            width: '100%'
          }}>
            {filteredTournaments.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                userId={userId}
              />
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'about' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              <div style={{
                padding: '1.5rem 0',
                borderBottom: '2px solid #374151'
              }}>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.8125rem', 
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500'
                }}>
                  Total de tournois
                </div>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '2.5rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {tournaments.length}
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem 0',
                borderBottom: '2px solid #374151'
              }}>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.8125rem', 
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500'
                }}>
                  Participants totaux
                </div>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '2.5rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {tournaments.reduce((sum, t) => sum + t._count.registrations, 0)}
                </div>
              </div>
              
              <div style={{
                padding: '1.5rem 0',
                borderBottom: '2px solid #374151'
              }}>
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.8125rem', 
                  marginBottom: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '500'
                }}>
                  Formats disponibles
                </div>
                <div style={{ 
                  color: '#ffffff', 
                  fontSize: '2.5rem', 
                  fontWeight: '700',
                  lineHeight: '1'
                }}>
                  {new Set(tournaments.map(t => t.format)).size}
                </div>
              </div>
            </div>

            <div style={{
              marginBottom: '2.5rem'
            }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1rem',
                fontWeight: '600',
                marginBottom: '1rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Description
              </h3>
              <p style={{
                color: '#d1d5db',
                lineHeight: '1.7',
                margin: 0,
                fontSize: '0.9375rem',
                maxWidth: '800px'
              }}>
                {gameName} est un jeu compétitif populaire sur notre plateforme. 
                Rejoignez les tournois organisés par la communauté et testez vos compétences 
                contre d'autres joueurs passionnés. Que vous soyez débutant ou expert, 
                vous trouverez des tournois adaptés à votre niveau.
              </p>
            </div>

            {tournaments.length > 0 && (
              <div>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Formats de tournois disponibles
                </h3>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.75rem' 
                }}>
                  {Array.from(new Set(tournaments.map(t => t.format))).map(format => (
                    <span
                      key={format}
                      style={{
                        background: 'transparent',
                        color: '#d1d5db',
                        padding: '0.5rem 0',
                        borderBottom: '1px solid #4b5563',
                        fontSize: '0.875rem',
                        fontWeight: '400',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderBottomColor = '#ff008c'
                        e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderBottomColor = '#4b5563'
                        e.currentTarget.style.color = '#d1d5db'
                      }}
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            {tournaments.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: '#9ca3af'
              }}>
                Aucune statistique disponible pour le moment.
              </div>
            ) : (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '2rem',
                  marginBottom: '4rem'
                }}>
                  {(() => {
                    const stats = getTournamentStats()
                    return [
                      { label: 'Tournois à venir', value: stats.upcoming, color: '#10b981' },
                      { label: 'Tournois en cours', value: stats.inProgress, color: '#f59e0b' },
                      { label: 'Tournois terminés', value: stats.completed, color: '#6b7280' },
                      { label: 'Total de tournois', value: stats.total, color: '#ff008c' },
                      { label: 'Participants totaux', value: stats.totalParticipants, color: '#3b82f6' },
                      { label: 'Moyenne par tournoi', value: stats.total > 0 ? Math.round(stats.totalParticipants / stats.total) : 0, color: '#8b5cf6' }
                    ]
                  })().map((stat, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '1.5rem 0',
                        borderBottom: `2px solid ${stat.color}`
                      }}
                    >
                      <div style={{
                        color: stat.color,
                        fontSize: '3rem',
                        fontWeight: '700',
                        marginBottom: '0.5rem',
                        lineHeight: '1'
                      }}>
                        {stat.value}
                      </div>
                      <div style={{
                        color: '#9ca3af',
                        fontSize: '0.8125rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: '500'
                      }}>
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '2rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Répartition des types de tournois
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(
                      tournaments.reduce((acc, t) => {
                        acc[t.kind] = (acc[t.kind] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([kind, count]) => {
                      const percentage = (count / tournaments.length) * 100
                      return (
                        <div key={kind}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '0.75rem'
                          }}>
                            <span style={{ 
                              color: '#d1d5db', 
                              fontSize: '0.9375rem',
                              fontWeight: '500'
                            }}>
                              {kind}
                            </span>
                            <span style={{ 
                              color: '#9ca3af', 
                              fontSize: '0.875rem',
                              fontVariantNumeric: 'tabular-nums'
                            }}>
                              {count} <span style={{ color: '#6b7280' }}>({percentage.toFixed(1)}%)</span>
                            </span>
                          </div>
                          <div style={{
                            background: '#374151',
                            borderRadius: '0',
                            height: '2px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{
                              background: '#ff008c',
                              height: '100%',
                              width: `${percentage}%`,
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </ContentContainer>
    </main>
  )
}
