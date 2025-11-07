'use client'

import Link from 'next/link'
import styles from './index.module.scss'

interface BestResultCardProps {
  id: string
  title: string
  type: string
  icon?: React.ReactNode
  href: string
  className?: string
}

export default function BestResultCard({ 
  id, 
  title, 
  type, 
  icon, 
  href, 
  className = '' 
}: BestResultCardProps) {
  return (
    <Link href={href} className={`${styles.bestResultCard} ${className}`}>
      <div className={styles.iconContainer}>
        {icon || <div className={styles.defaultIcon}>🚀</div>}
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.type}>{type}</p>
    </Link>
  )
}

