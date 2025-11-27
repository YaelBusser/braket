'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo } from 'react'
import styles from './index.module.scss'
import { formatRelativeTimeWithTZ } from '@/utils/dateUtils'
import { getGameLogoPath } from '@/utils/gameLogoUtils'
import SettingsIcon from '../../icons/SettingsIcon'

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
  // Vérifier si l'utilisateur est propriétaire du tournoi
  const isOwner = tournament && userId && (
    tournament.organizer?.id === userId ||
    tournament.host?.id === userId ||
    tournament.organizerId === userId
  )
  
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
  const maxParticipants = tournament.maxParticipants || 0
  
  // Utiliser gameRef si disponible, sinon fallback sur game
  const gameName = tournament.gameRef?.name || tournament.game || ''
  
  // Récupérer le logo du jeu depuis le dossier gamesLogo
  const gameLogoPath = getGameLogoPath(gameName)
  
  // Image de fond : poster ou image du jeu (on garde l'ancienne logique pour l'image de fond)
  const gameImage = tournament.gameRef?.imageUrl || null
  const backgroundImage = tournament.posterUrl || gameImage

  // Format du mode de jeu
  const formatMode = () => {
    if (tournament.isTeamBased && tournament.teamMinSize && tournament.teamMaxSize) {
      return `${tournament.teamMinSize}v${tournament.teamMaxSize}`
    }
    if (tournament.isTeamBased) {
      return 'Équipe'
    }
    return '1v1'
  }

  // Format des emplacements
  const formatSlots = () => {
    if (maxParticipants > 0) {
      return `${participantsCount}/${maxParticipants} participants`
    }
    if (participantsCount > 0) {
      return `${participantsCount} participant${participantsCount > 1 ? 's' : ''}`
    }
    return ''
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
      {/* Icône de gestion pour le propriétaire */}
      {isOwner && (
        <Link 
          href={`/tournaments/${tournament.id}/admin`}
          className={styles.adminIcon}
          title="Gérer le tournoi"
          onClick={(e) => e.stopPropagation()}
          prefetch={true}
        >
          <SettingsIcon width={18} height={18} fill="#fff" />
        </Link>
      )}
      
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
          {gameLogoPath ? (
            <Image src={gameLogoPath} alt={gameName} width={40} height={40} loading="lazy" />
          ) : (
            <div className={styles.gameIconPlaceholder}>
              {getGameIcon()}
            </div>
          )}
        </div>
      </div>
      
      {/* Section contenu en dessous de l'image */}
      <div className={styles.cardContent}>
        {/* Logo organisateur à gauche - utilise le logo du jeu par défaut si pas de logo tournoi */}
        {organizer?.avatarUrl || tournament.logoUrl || gameLogoPath ? (
          <div className={styles.organizerLogo}>
            <Image 
              src={organizer?.avatarUrl || tournament.logoUrl || gameLogoPath || ''} 
              alt={organizer?.pseudo || tournament.name || gameName}
              width={40}
              height={40}
              loading="lazy"
            />
          </div>
        ) : (
          <div className={styles.organizerLogoPlaceholder}>
            {organizer?.pseudo?.charAt(0).toUpperCase() || tournament.name.charAt(0).toUpperCase()}
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
          
          {/* Détails du tournoi */}
          <div className={styles.tournamentDetails}>
            {formatMode()}
            {formatSlots() && ` • ${formatSlots()}`}
            {tournament.format && tournament.format !== 'SINGLE_ELIMINATION' && (
              <>
                {' • '}
                {tournament.format === 'DOUBLE_ELIMINATION' ? 'Double élimination' : 
                 tournament.format === 'ROUND_ROBIN' ? 'Round robin' : 'Elimination directe'}
              </>
            )}
          </div>
        </div>
      </div>
      </Link>
    </div>
  )
}

export default memo(TournamentCard)
