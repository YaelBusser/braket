'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo } from 'react'
import styles from './index.module.scss'
import { formatRelativeTimeWithTZ } from '@/utils/dateUtils'

interface TournamentCardProps {
  tournament?: {
    id: string
    name: string
    description?: string | null
    game?: string | null
    gameRef?: {
      id: string
      name: string
      imageUrl: string | null
      logoUrl: string | null
      posterUrl: string | null
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
    bracketMaxTeams?: number | null
    region?: string | null
    organizer?: {
      id: string
      pseudo: string
      avatarUrl?: string | null
    } | null
    host?: {
      id: string
      pseudo: string
      avatarUrl?: string | null
    } | null
    organizerId?: string
    _count?: {
      registrations: number
    }
  }
  className?: string
  variant?: 'default' | 'compact'
  loading?: boolean
  userId?: string | null
}

function TournamentCard({ tournament, className = '', variant = 'default', loading = false, userId }: TournamentCardProps) {
  // Si loading, afficher le skeleton
  if (loading || !tournament) {
    return (
      <div className={`${styles.tournamentCard} ${styles.unified} ${variant === 'compact' ? styles.compact : ''} ${styles.skeleton} ${className}`}>
        <div className={styles.cardImage}>
          <div className={styles.skeletonImagePlaceholder}></div>
          <div className={styles.gameLogoOverlay}>
            <div className={styles.skeletonGameLogo}></div>
          </div>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.organizerLogoPlaceholder}>
            <div className={styles.skeletonOrganizerLogo}></div>
          </div>
          <div className={styles.textContent}>
            <div className={styles.skeletonDate}></div>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonDetails}></div>
          </div>
        </div>
      </div>
    )
  }

  const participantsCount = tournament._count?.registrations || 0
  // Pour le maximum : utiliser bracketMaxTeams si tournoi en équipe, sinon maxParticipants
  const maxParticipants = tournament.isTeamBased 
    ? (tournament.bracketMaxTeams || 0)
    : (tournament.bracketMaxTeams || tournament.maxParticipants || 0)
  
  // Utiliser gameRef si disponible, sinon fallback sur game
  const gameName = tournament.gameRef?.name || tournament.game || ''
  
  // Image de fond : poster ou image du jeu (on garde l'ancienne logique pour l'image de fond)
  const gameImage = tournament.gameRef?.imageUrl || null
  const backgroundImage = tournament.posterUrl || gameImage
  const gameLogoUrl = tournament.gameRef?.logoUrl

  // Format du mode de jeu (5v5, 4v4, etc.)
  const formatMode = () => {
    if (tournament.isTeamBased) {
      // Si on a teamMinSize et teamMaxSize, utiliser les deux
      if (tournament.teamMinSize && tournament.teamMaxSize) {
        return `${tournament.teamMinSize}v${tournament.teamMaxSize}`
      }
      // Si on a seulement teamMaxSize, utiliser pour les deux côtés (5v5)
      if (tournament.teamMaxSize) {
        return `${tournament.teamMaxSize}v${tournament.teamMaxSize}`
      }
      // Si on a seulement teamMinSize, utiliser pour les deux côtés
      if (tournament.teamMinSize) {
        return `${tournament.teamMinSize}v${tournament.teamMinSize}`
      }
    }
    // Tournoi individuel
    return '1v1'
  }


  // Format du statut du tournoi
  const getStatusLabel = () => {
    switch (tournament.status) {
      case 'DRAFT':
        return 'Brouillon'
      case 'REG_OPEN':
        return 'Inscriptions ouvertes'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'COMPLETED':
        return 'Terminé'
      default:
        return tournament.status
    }
  }

  const getStatusColor = () => {
    switch (tournament.status) {
      case 'DRAFT':
        return styles.statusDraft
      case 'REG_OPEN':
        return styles.statusOpen
      case 'IN_PROGRESS':
        return styles.statusInProgress
      case 'COMPLETED':
        return styles.statusCompleted
      default:
        return styles.statusDefault
    }
  }

  // Région par défaut
  const region = tournament.region || 'Europe'

  // Date relative ou absolue
  const getDateDisplay = () => {
    if (tournament.startDate) {
      const startDate = new Date(tournament.startDate)
      const now = new Date()
      const diffInHours = Math.floor((startDate.getTime() - now.getTime()) / (1000 * 60 * 60))
      
      if (diffInHours > 0 && diffInHours < 24) {
        return `DANS ENVIRON ${diffInHours} HEURE${diffInHours > 1 ? 'S' : ''}, ${startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      }
      
      return startDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }).toUpperCase()
    }
    return formatRelativeTimeWithTZ(tournament.createdAt)
  }

  // Organisateur (organizer ou host)
  const organizer = tournament.organizer || tournament.host

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
    if (gameLower.includes('valorant')) {
      return '🎯'
    }
    return '🎮'
  }

  // Nouveau design avec texte en dessous
  return (
    <div className={`${styles.tournamentCard} ${styles.unified} ${variant === 'compact' ? styles.compact : ''} ${className}`} style={{ position: 'relative' }}>
      <Link 
        href={`/tournaments/${tournament.id}`} 
        prefetch={true}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {/* Section image */}
        <div className={styles.cardImage}>
        {backgroundImage ? (
          <Image 
            src={backgroundImage} 
            alt={tournament.name}
            fill
            className={styles.posterImage}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.gameIcon}>{getGameIcon()}</div>
          </div>
        )}
        
        {/* Logo du jeu en haut à gauche */}
        <div className={styles.gameLogoOverlay}>
          {gameLogoUrl ? (
            <Image src={gameLogoUrl} alt={gameName} width={40} height={40} loading="lazy" style={{ objectFit: 'cover' }} />
          ) : (
            <div className={styles.gameIconPlaceholder}>
              {getGameIcon()}
            </div>
          )}
        </div>
      </div>
      
      {/* Section contenu en dessous de l'image */}
      <div className={styles.cardContent}>
        {/* Logo du tournoi à gauche - utilise le logo du jeu par défaut si pas de logo tournoi */}
        {tournament.logoUrl || gameLogoUrl ? (
          <div className={styles.organizerLogo}>
            <Image 
              src={tournament.logoUrl || gameLogoUrl || ''} 
              alt={tournament.name || gameName}
              width={40}
              height={40}
              loading="lazy"
            />
          </div>
        ) : (
          <div className={styles.organizerLogoPlaceholder}>
            {tournament.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        {/* Zone de texte alignée */}
        <div className={styles.textContent}>
          {/* Date en haut */}
          <div className={styles.dateRow}>
            <span className={styles.dateText}>{getDateDisplay()}</span>
          </div>
          
          {/* Titre du tournoi */}
          <h3 className={styles.tournamentTitle}>
            {tournament.name}
          </h3>
          
          {/* Tags : Format et Statut */}
          <div className={styles.tagsRow}>
            <span className={styles.formatTag}>{formatMode()}</span>
            <span className={`${styles.statusTag} ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            {maxParticipants > 0 && (
              <span className={styles.participantsTag}>
                {participantsCount}/{maxParticipants}
              </span>
            )}
          </div>
          
          {/* Détails du tournoi : Format de tournoi */}
          {tournament.format && tournament.format !== 'SINGLE_ELIMINATION' && (
            <div className={styles.tournamentDetails}>
              <span className={styles.slotsInfo}>
                {tournament.format === 'DOUBLE_ELIMINATION' ? 'Double élimination' : 
                 tournament.format === 'ROUND_ROBIN' ? 'Round robin' : 'Elimination directe'}
              </span>
            </div>
          )}
        </div>
      </div>
      </Link>
    </div>
  )
}

export default memo(TournamentCard)
