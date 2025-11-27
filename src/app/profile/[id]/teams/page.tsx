'use client'

import { useProfileData } from '../layout'
import styles from '../page.module.scss'

export default function TeamsTab() {
  const { loadingData } = useProfileData()

  return (
    <div className={styles.teamsTab}>
      <div className={styles.tabHeader}>
        <h3>Équipes</h3>
      </div>
      
      <div className={styles.emptyState}>
        <p>Aucune équipe rejointe</p>
      </div>
    </div>
  )
}
