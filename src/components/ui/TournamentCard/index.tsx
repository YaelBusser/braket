'use client'

import Link from 'next/link'
import styles from './index.module.scss'
import { formatRelativeTimeWithTZ } from '@/utils/dateUtils'

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
    createdAt?: string | null
    status: string
    format?: string
    maxParticipants?: number | null
    isTeamBased?: boolean
    teamMinSize?: number | null
    teamMaxSize?: number | null
    region?: string | null
    host?: {
      id: string
      pseudo: string
      avatarUrl?: string | null
    } | null
    _count?: {
      registrations: number
    }
  }
  className?: string
  variant?: 'default' | 'compact'
}

export default function TournamentCard({ tournament, className = '', variant = 'default' }: TournamentCardProps) {
  const participantsCount = tournament._count?.registrations || 0
  const maxParticipants = tournament.maxParticipants || 0
  
  // Utiliser gameRef si disponible, sinon fallback sur game
  const gameName = tournament.gameRef?.name || tournament.game || ''
  const gameImage = tournament.gameRef?.imageUrl || null
  
  // Image de fond : poster ou image du jeu
  const backgroundImage = tournament.posterUrl || gameImage

  // Format du mode de jeu
  const formatMode = () => {
    if (tournament.isTeamBased && tournament.teamMinSize && tournament.teamMaxSize) {
      return `${tournament.teamMinSize}v${tournament.teamMaxSize}`
    }
    return '1v1'
  }

  // Format des emplacements
  const formatSlots = () => {
    if (maxParticipants > 0) {
      return `${maxParticipants} emplacement${maxParticipants > 1 ? 's' : ''}`
    }
    return ''
  }

  // Région par défaut
  const region = tournament.region || 'Europe'

  // Date relative
  const relativeDate = formatRelativeTimeWithTZ(tournament.createdAt || tournament.startDate)

  // Icône de jeu par défaut selon le nom du jeu
  const getGameIcon = () => {
    const gameLower = gameName.toLowerCase()
    if (gameLower.includes('counter') || gameLower.includes('cs')) {
      return '🔫'
    }
    if (gameLower.includes('league') || gameLower.includes('lol')) {
      return '⚔️'
    }
    if (gameLower.includes('cricket') || gameLower.includes('rc24')) {
      return '🏏'
    }
    return '🎮'
  }

  if (variant === 'compact') {
    return (
      <Link href={`/tournaments/${tournament.id}`} className={`${styles.tournamentCard} ${styles.compact} ${className}`}>
        <div className={styles.cardImage}>
          {backgroundImage ? (
            <img 
              src={backgroundImage} 
              alt={tournament.name}
              className={styles.posterImage}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <div className={styles.gameIcon}>{getGameIcon()}</div>
            </div>
          )}
          
          {/* Icône de jeu en overlay */}
          <div className={styles.gameIconOverlay}>
            {gameImage ? (
              <img src={gameImage} alt={gameName} />
            ) : (
              <div className={styles.gameIconPlaceholder}>
                {getGameIcon()}
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.cardContent}>
          {/* Informations hôte et date */}
          <div className={styles.hostInfo}>
            {tournament.host?.avatarUrl ? (
              <img src={tournament.host.avatarUrl} alt={tournament.host.pseudo} className={styles.hostAvatar} />
            ) : (
              <div className={styles.hostAvatarPlaceholder}>
                {tournament.host?.pseudo?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
            <span className={styles.relativeDate}>{relativeDate}</span>
          </div>
          
          {/* Titre */}
          <h3 className={styles.tournamentTitle}>
            {tournament.name}
          </h3>
          
          {/* Détails */}
          <div className={styles.tournamentDetails}>
            {region} • {formatMode()} • {formatSlots()}
          </div>
          
          {/* Tag hôte */}
          <div className={styles.hostTag}>
            Hébergé par un utilisateur
          </div>
        </div>
      </Link>
    )
  }

  // Version par défaut (ancienne version conservée pour compatibilité)
  return (
    <Link href={`/tournaments/${tournament.id}`} className={`${styles.tournamentCard} ${className}`}>
      <div className={styles.cardImage}>
        {backgroundImage ? (
          <img 
            src={backgroundImage} 
            alt={tournament.name}
            className={styles.posterImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.gameIcon}>{getGameIcon()}</div>
          </div>
        )}
        
        {gameImage && !tournament.posterUrl && (
          <div className={styles.gameLogo}>
            <img src={gameImage} alt={gameName} />
          </div>
        )}
      </div>
      
      <div className={styles.cardContent}>
        {tournament.startDate && (
          <div className={styles.tournamentDate}>
            {new Date(tournament.startDate).toLocaleDateString('fr-FR', { 
              weekday: 'short',
              day: 'numeric', 
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '').toUpperCase()}
          </div>
        )}
        
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
              {formatMode()}
              {tournament.format && ' • '}
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
