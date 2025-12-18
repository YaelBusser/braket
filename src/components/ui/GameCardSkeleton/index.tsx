import React from 'react'
import styles from './index.module.scss'

interface GameCardSkeletonProps {
  count?: number
}

export default function GameCardSkeleton({ count = 1 }: GameCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage}></div>
          <div className={styles.skeletonText}></div>
        </div>
      ))}
    </>
  )
}

