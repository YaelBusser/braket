'use client'

import Link from 'next/link'
import styles from './index.module.scss'

interface CircularCardProps {
  id: string
  name: string
  imageUrl?: string | null
  subtitle?: string
  href: string
  className?: string
}

export default function CircularCard({ 
  id, 
  name, 
  imageUrl, 
  subtitle, 
  href, 
  className = '' 
}: CircularCardProps) {
  return (
    <Link href={href} className={`${styles.circularCard} ${className}`}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
      </div>
    </Link>
  )
}

