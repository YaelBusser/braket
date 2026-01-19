'use client'

import Link from 'next/link'
import Image from 'next/image'
import { memo } from 'react'
import styles from './index.module.scss'

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
        <div className={styles.cardContent}>
          <div className={styles.teamLogoPlaceholder}>
            <div className={styles.skeletonTeamLogo}></div>
          </div>
          <div className={styles.textContent}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonDetails}></div>
          </div>
        </div>
      </div>
    )
  }

  const membersCount = team.members?.length || 0
  const captain = team.members?.find(m => m.isCaptain)

  return (
    <div className={`${styles.teamCard} ${className}`} style={{ position: 'relative' }}>
      <Link 
        href={`/teams/${team.id}`} 
        prefetch={true}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {/* Section contenu */}
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
