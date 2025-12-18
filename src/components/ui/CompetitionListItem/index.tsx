'use client'

import Link from 'next/link'
import styles from './index.module.scss'
import { formatRelativeTimeWithTZ } from '@/utils/dateUtils'

interface CompetitionListItemProps {
  id: string
  name: string
  thumbnailUrl?: string | null
  createdAt?: string | null
  href: string
  className?: string
  onMenuClick?: (e: React.MouseEvent) => void
}

export default function CompetitionListItem({ 
  id, 
  name, 
  thumbnailUrl, 
  createdAt, 
  href, 
  className = '',
  onMenuClick
}: CompetitionListItemProps) {
  const relativeDate = formatRelativeTimeWithTZ(createdAt)

  return (
    <Link href={href} className={`${styles.competitionItem} ${className}`}>
      <div className={styles.thumbnail}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        {relativeDate && (
          <p className={styles.date}>{relativeDate}</p>
        )}
      </div>
      {onMenuClick && (
        <button 
          className={styles.menuButton}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onMenuClick(e)
          }}
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      )}
    </Link>
  )
}

