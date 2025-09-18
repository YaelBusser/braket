import React from 'react'
import styles from './index.module.scss'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Chargement...' 
}: LoadingSpinnerProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.spinner} ${styles[`spinner-${size}`]}`}></div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  )
}
