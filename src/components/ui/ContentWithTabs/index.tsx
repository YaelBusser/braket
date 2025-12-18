'use client'

import { ReactNode } from 'react'
import ContentContainer from '../ContentContainer'

interface ContentWithTabsProps {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

/**
 * Wrapper pour ContentContainer - utilise le même décalage
 * Nom conservé pour la compatibilité, mais utilise ContentContainer en interne
 */
export default function ContentWithTabs({ children, className = '', style }: ContentWithTabsProps) {
  return (
    <ContentContainer className={className} style={style}>
      {children}
    </ContentContainer>
  )
}

