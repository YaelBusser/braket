'use client'

import Link from 'next/link'
import { useProfileData } from '../layout'
import styles from '../page.module.scss'

export default function OverviewTab() {
  const { userTournaments, userRegistrations, userTeams, userStats, loadingData } = useProfileData()
  const stats = userStats as any

  return (
    <div className={styles.overviewTab}>
      {/* Statistiques principales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{userRegistrations?.length || 0}</div>
            <div className={styles.statLabel}>Tournois rejoints</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalTeamsJoined || userTeams?.length || 0}</div>
            <div className={styles.statLabel}>Équipes</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⚔️</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats?.totalMatches || 0}</div>
            <div className={styles.statLabel}>Matchs joués</div>
          </div>
        </div>
        
        {(stats?.totalMatches || 0) > 0 && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🏅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.wonMatches || 0}</div>
              <div className={styles.statLabel}>Victoires</div>
            </div>
          </div>
        )}
        
        {(stats?.totalMatches || 0) > 0 && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats?.winRate || 0}%</div>
              <div className={styles.statLabel}>Taux de victoire</div>
            </div>
          </div>
        )}
      </div>

      {/* Activité récente */}
      <div className={styles.activityCard}>
        <h3 className={styles.activityTitle}>Activité récente</h3>
        {loadingData ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Chargement...</p>
          </div>
        ) : (userTournaments && Array.isArray(userTournaments) && userTournaments.length > 0) || (userRegistrations && Array.isArray(userRegistrations) && userRegistrations.length > 0) ? (
          <div className={styles.activityList}>
            {[...(userTournaments || []), ...(userRegistrations || [])]
              .sort((a, b) => {
                const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime()
                const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime()
                return dateB - dateA
              })
              .slice(0, 5)
              .map((tournament) => {
                const isCreated = userTournaments?.some(t => t.id === tournament.id)
                return (
                  <Link key={tournament.id} href={`/tournaments/${tournament.id}`} className={styles.activityItem}>
                    <div className={styles.activityIcon}>🏆</div>
                    <div className={styles.activityContent}>
                      <h4>{tournament.name}</h4>
                      <p>
                        {isCreated ? 'Créé' : 'Rejoint'} le {new Date(tournament.createdAt || tournament.updatedAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </Link>
                )
              })}
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
