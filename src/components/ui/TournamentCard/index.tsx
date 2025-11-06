'use client'

import Link from 'next/link'
import styles from './index.module.scss'

interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    description?: string | null
    game?: string | null
    gameRef?: {
      id: string
      name: string
      imageUrl: string | null
    } | null
    posterUrl?: string | null
    logoUrl?: string | null
    startDate?: string | null
    endDate?: string | null
    status: string
    format?: string
    maxParticipants?: number | null
    isTeamBased?: boolean
    teamMinSize?: number | null
    teamMaxSize?: number | null
    _count?: {
      registrations: number
    }
  }
  className?: string
}

export default function TournamentCard({ tournament, className = '' }: TournamentCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short',
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '').toUpperCase()
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'REG_OPEN':
        return { text: 'Inscriptions ouvertes', color: '#10b981' }
      case 'IN_PROGRESS':
        return { text: 'En cours', color: '#E54B6A' }
      case 'COMPLETED':
        return { text: 'Terminé', color: '#6b7280' }
      case 'DRAFT':
        return { text: 'Brouillon', color: '#f59e0b' }
      default:
        return { text: 'Inconnu', color: '#6b7280' }
    }
  }

  const statusInfo = getStatusInfo(tournament.status)
  const participantsCount = tournament._count?.registrations || 0
  const maxParticipants = tournament.maxParticipants || 0
  
  // Utiliser gameRef si disponible, sinon fallback sur game
  const gameName = tournament.gameRef?.name || tournament.game || ''
  const gameImage = tournament.gameRef?.imageUrl || null
  
  // Image de fond : poster ou image du jeu
  const backgroundImage = tournament.posterUrl || gameImage

  return (
    <Link href={`/tournaments/${tournament.id}`} className={`${styles.tournamentCard} ${className}`}>
      {/* Section supérieure avec image de fond (2/3) */}
      <div className={styles.cardImage}>
        {backgroundImage ? (
          <img 
            src={backgroundImage} 
            alt={tournament.name}
            className={styles.posterImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.gameIcon}>🎮</div>
          </div>
        )}
        
        {/* Logo du jeu en haut à gauche */}
        {gameImage && !tournament.posterUrl && (
          <div className={styles.gameLogo}>
            <img src={gameImage} alt={gameName} />
          </div>
        )}
        
        {/* Banner de statut en haut */}
        <div className={styles.statusBanner} style={{ backgroundColor: statusInfo.color }}>
          {statusInfo.text}
        </div>
      </div>
      
      {/* Section inférieure avec informations (1/3) */}
      <div className={styles.cardContent}>
        {/* Date en haut */}
        {tournament.startDate && (
          <div className={styles.tournamentDate}>
            {formatDate(tournament.startDate)}
          </div>
        )}
        
        {/* Logo du tournoi et titre */}
        <div className={styles.tournamentInfo}>
          {tournament.logoUrl && (
            <div className={styles.tournamentLogo}>
              <img 
                src={tournament.logoUrl} 
                alt={`${tournament.name} logo`}
                className={styles.logoImage}
              />
            </div>
          )}
          <div className={styles.tournamentText}>
            <h3 className={styles.tournamentTitle}>
              {tournament.name}
            </h3>
            <div className={styles.tournamentDetails}>
              {tournament.isTeamBased && tournament.teamMinSize && tournament.teamMaxSize && (
                <span>{tournament.teamMinSize}v{tournament.teamMaxSize}</span>
              )}
              {tournament.isTeamBased && tournament.teamMinSize && tournament.teamMaxSize && tournament.format && ' • '}
              {tournament.format === 'SINGLE_ELIMINATION' && 'Elimination directe'}
              {tournament.format === 'DOUBLE_ELIMINATION' && 'Double élimination'}
              {tournament.format === 'ROUND_ROBIN' && 'Round robin'}
              {maxParticipants > 0 && (
                <>
                  {' • '}
                  <span>{participantsCount}/{maxParticipants}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
