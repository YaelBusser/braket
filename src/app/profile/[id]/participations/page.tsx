'use client'

import { useProfileData } from '../layout'
import { TournamentCard } from '../../../../components/ui'
import styles from '../page.module.scss'

export default function ParticipationsTab() {
  const { userRegistrations, loadingData } = useProfileData()

  return (
    <div className={styles.registrationsTab}>
      <div className={styles.tabHeader}>
        <h3>Tournois rejoints</h3>
      </div>
      
      <div className={styles.tournamentList}>
        {loadingData ? (
          <div className={styles.loading}>Chargement...</div>
        ) : !userRegistrations || !Array.isArray(userRegistrations) || userRegistrations.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun tournoi rejoint</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem',
            width: '100%'
          }}>
            {userRegistrations.map((tournament) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
