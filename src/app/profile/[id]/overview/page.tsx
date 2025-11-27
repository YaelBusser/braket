'use client'

import { useProfileData } from '../layout'
import styles from '../page.module.scss'

export default function OverviewTab() {
  const { userTournaments, loadingData } = useProfileData()

  return (
    <div className={styles.overviewTab}>
      <div className={styles.activityCard}>
        <h3 className={styles.activityTitle}>Activité récente</h3>
        {loadingData ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        ) : userTournaments && Array.isArray(userTournaments) && userTournaments.length > 0 ? (
          <div className={styles.activityList}>
            {userTournaments.slice(0, 5).map((tournament) => (
              <div key={tournament.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>🏆</div>
                <div className={styles.activityContent}>
                  <h4>{tournament.name}</h4>
                  <p>{new Date(tournament.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyActivity}>
            <p>Aucune activité récente</p>
          </div>
        )}
      </div>
    </div>
  )
}
