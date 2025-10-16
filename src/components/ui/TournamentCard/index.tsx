'use client'

import Link from 'next/link'
import styles from './index.module.scss'

interface TournamentCardProps {
  tournament: {
    id: string
    name: string
    description?: string | null
    game?: string | null
    posterUrl?: string | null
    logoUrl?: string | null
    startDate?: string | null
    endDate?: string | null
    status: string
    maxParticipants?: number | null
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
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
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

  return (
    <Link href={`/tournaments/${tournament.id}`} className={`${styles.tournamentCard} ${className}`}>
      <div className={styles.cardImage}>
        {tournament.posterUrl ? (
          <img 
            src={tournament.posterUrl} 
            alt={tournament.name}
            className={styles.posterImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.gameIcon}>
              🎮
            </div>
          </div>
        )}
        
        {/* Logo du tournoi en overlay */}
        {tournament.logoUrl && (
          <div className={styles.tournamentLogo}>
            <img 
              src={tournament.logoUrl} 
              alt={`${tournament.name} logo`}
              className={styles.logoImage}
            />
          </div>
        )}
        
        {/* Étiquette du jeu en bas à gauche */}
        {tournament.game && (
          <div className={styles.gameLabel}>
            {tournament.game}
          </div>
        )}
        
        {/* Compteur d'inscrits en bas à droite */}
        <div className={styles.participantsCounter}>
          {participantsCount}/{maxParticipants || '∞'}
        </div>
      </div>
      
      <div className={styles.cardContent}>
        <div className={styles.tournamentInfo}>
          <div className={styles.tournamentTitle}>
            {tournament.name}
          </div>
          
          {tournament.startDate && (
            <div className={styles.tournamentDate}>
              {formatDate(tournament.startDate)}
            </div>
          )}
          
          <div className={styles.tournamentMeta}>
            <div className={styles.status} style={{ color: statusInfo.color }}>
              {statusInfo.text}
            </div>
            <div className={styles.participants}>
              {participantsCount} Équipes
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
