'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo } from 'react'
import styles from './index.module.scss'
import { formatRelativeTimeWithTZ } from '@/utils/dateUtils'

interface TeamCardProps {
  team?: {
    id: string
    name: string
    description?: string | null
    game?: string | null
    avatarUrl?: string | null
    bannerUrl?: string | null
    tournament?: {
      id: string
      name: string
      game: string
      status: string
    } | null
    members?: Array<{
      id: string
      user: {
        id: string
        pseudo: string
        avatarUrl?: string | null
      }
      isCaptain: boolean
    }>
    createdAt?: string | null
  }
  className?: string
  loading?: boolean
}

function TeamCard({ team, className = '', loading = false }: TeamCardProps) {
  // Si loading, afficher le skeleton
  if (loading || !team) {
    return (
      <div className={`${styles.teamCard} ${styles.skeleton} ${className}`}>
        <div className={styles.cardImage}>
          <div className={styles.skeletonImagePlaceholder}></div>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.teamLogoPlaceholder}>
            <div className={styles.skeletonTeamLogo}></div>
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

  const membersCount = team.members?.length || 0
  const captain = team.members?.find(m => m.isCaptain)
  
  // Image de fond : banner ou placeholder
  const backgroundImage = team.bannerUrl

  // Date relative
  const getDateDisplay = () => {
    if (team.createdAt) {
      return formatRelativeTimeWithTZ(team.createdAt)
    }
    return 'Récemment créée'
  }

  return (
    <div className={`${styles.teamCard} ${className}`} style={{ position: 'relative' }}>
      <Link 
        href={`/teams/${team.id}`} 
        prefetch={true}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {/* Section image */}
        <div className={styles.cardImage}>
          {backgroundImage ? (
            <Image 
              src={backgroundImage} 
              alt={team.name}
              fill
              className={styles.posterImage}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className={styles.placeholderImage}>
              <div className={styles.teamIcon}>👥</div>
            </div>
          )}
        </div>
        
        {/* Section contenu en dessous de l'image */}
        <div className={styles.cardContent}>
          {/* Logo équipe à gauche */}
          {team.avatarUrl ? (
            <div className={styles.teamLogo}>
              <Image 
                src={team.avatarUrl} 
                alt={team.name}
                width={50}
                height={50}
                loading="lazy"
              />
            </div>
          ) : (
            <div className={styles.teamLogoPlaceholder}>
              {team.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Zone de texte alignée */}
          <div className={styles.textContent}>
            {/* Date en haut */}
            <div className={styles.dateRow}>
              <span className={styles.dateText}>{getDateDisplay()}</span>
            </div>
            
            {/* Nom de l'équipe */}
            <h3 className={styles.teamTitle}>
              {team.name}
            </h3>
            
            {/* Tags : Jeu si applicable */}
            <div className={styles.tagsRow}>
              {team.game && (
                <span className={styles.gameTag}>{team.game}</span>
              )}
            </div>
            
            {/* Détails de l'équipe */}
            <div className={styles.teamDetails}>
              <span className={styles.membersInfo}>
                {membersCount} membre{membersCount > 1 ? 's' : ''}
                {captain && ` • Capitaine: ${captain.user.pseudo}`}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default memo(TeamCard)
