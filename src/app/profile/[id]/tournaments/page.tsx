'use client'

import { useProfileData } from '../layout'
import { TournamentCard } from '../../../../components/ui'
import styles from '../page.module.scss'

export default function TournamentsTab() {
  const { userTournaments, loadingData } = useProfileData()

  return (
    <div className={styles.tournamentsTab}>
      <div className={styles.tabHeader}>
        <h3>Tournois</h3>
      </div>
      
      <div className={styles.tournamentList}>
        {loadingData ? (
          <div className={styles.loading}>Chargement...</div>
        ) : !userTournaments || !Array.isArray(userTournaments) || userTournaments.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucun tournoi créé</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem',
            width: '100%'
          }}>
            {userTournaments.map((tournament) => (
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
