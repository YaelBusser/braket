'use client'

import { ReactNode } from 'react'
import ContentContainer from '../ContentContainer'
import styles from './index.module.scss'

interface PageContentProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  variant?: 'default' | 'compact' | 'spacious'
  /**
   * Si true, applique le padding vertical standard (2rem)
   * Si false, pas de padding vertical (utile pour les pages avec header personnalisé)
   */
  withPadding?: boolean
}

/**
 * Composant standardisé pour le contenu des pages
 * Gère automatiquement les espacements cohérents avec le design system
 * 
 * @example
 * <PageContent>
 *   <h1>Ma page</h1>
 *   <p>Contenu...</p>
 * </PageContent>
 */
export default function PageContent({ 
  children, 
  className = '', 
  style,
  variant = 'default',
  withPadding = true
}: PageContentProps) {
  const paddingStyle = withPadding 
    ? { paddingTop: '2rem', paddingBottom: '2rem', ...style }
    : style

  return (
    <ContentContainer 
      className={`${styles.pageContent} ${styles[variant]} ${className}`}
      style={paddingStyle}
    >
      {children}
    </ContentContainer>
  )
}

