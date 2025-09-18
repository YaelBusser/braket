import React from 'react'
import styles from './index.module.scss'

interface CardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat' | 'outlined'
  size?: 'sm' | 'md' | 'lg'
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardBodyProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  size = 'md'
}: CardProps) {
  const cardClasses = [
    styles.card,
    styles[`card-${variant}`],
    styles[`card-${size}`],
    className
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClasses}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`${styles.cardHeader} ${className}`}>
      {children}
    </div>
  )
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`${styles.cardBody} ${className}`}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`${styles.cardFooter} ${className}`}>
      {children}
    </div>
  )
}
