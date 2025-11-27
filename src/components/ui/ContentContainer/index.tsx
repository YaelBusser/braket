'use client'

import { ReactNode } from 'react'
import styles from './index.module.scss'

interface ContentContainerProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Composant générique pour centrer le contenu avec un décalage symétrique
 * Prend automatiquement en compte la sidebar et centre le contenu
 * Utilisable avec ou sans onglets
 */
export default function ContentContainer({ children, className = '', style }: ContentContainerProps) {
  return (
    <div className={`${styles.contentContainer} ${className}`} style={style}>
      {children}
    </div>
  )
}

