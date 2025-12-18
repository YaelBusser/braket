import React from 'react'
import styles from './index.module.scss'

interface TournamentCardSkeletonProps {
  count?: number
}

export default function TournamentCardSkeleton({ count = 1 }: TournamentCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.skeletonCard}>
          <div className={styles.skeletonImage}>
            <div className={styles.skeletonGameLogo}></div>
          </div>
          <div className={styles.skeletonContent}>
            <div className={styles.skeletonOrganizerLogo}></div>
            <div className={styles.skeletonTextContent}>
              <div className={styles.skeletonDate}></div>
              <div className={styles.skeletonTitle}></div>
              <div className={styles.skeletonDetails}></div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

