"use client"
import React, { useMemo } from 'react'
import styles from './index.module.scss'

type Match = {
  id: string
  round: number
  teamA?: { id: string; name: string } | null
  teamB?: { id: string; name: string } | null
  teamAId?: string
  teamBId?: string
  winnerTeamId?: string | null
  status?: string
}

export default function Bracket({ matches }: { matches: Match[] }) {
  const rounds = useMemo(() => {
    const map: Record<number, Match[]> = {}
    for (const m of matches || []) {
      const r = m.round || 1
      if (!map[r]) map[r] = []
      map[r].push(m)
    }
    const keys = Object.keys(map).map(n => parseInt(n)).sort((a,b)=>a-b)
    return keys.map(k => ({ round: k, items: map[k] }))
  }, [matches])

  const getRoundTitle = (round: number) => {
    switch (round) {
      case 1: return '1/8 DE FINALE'
      case 2: return '1/4 DE FINALE'
      case 3: return '1/2 FINALE'
      case 4: return 'FINALE'
      default: return `Round ${round}`
    }
  }

  const getMatchStatusClass = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return styles.statusCompleted
      case 'SCHEDULED': return styles.statusScheduled
      case 'IN_PROGRESS': return styles.statusInProgress
      default: return styles.statusPending
    }
  }

  if (!matches || matches.length === 0) {
    return (
      <div className={styles.bracketContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏆</div>
          <div className={styles.emptyText}>Aucun match pour le moment</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.bracketContainer}>
      <div className={styles.bracketContent}>
        {rounds.map((rc, colIdx) => (
          <div key={rc.round} className={styles.round}>
            <div className={styles.roundHeader}>
              {getRoundTitle(rc.round)}
            </div>
            <div className={styles.matchesList}>
              {rc.items.map((match, matchIdx) => (
                <div key={match.id} className={`${styles.matchBox} ${getMatchStatusClass(match.status)}`}>
                  <div className={styles.matchHeader}>
                    <span className={styles.matchNumber}>Match #{matchIdx + 1}</span>
                    <span className={styles.matchStatus}>
                      {match.status === 'COMPLETED' ? 'terminé' : 
                       match.status === 'IN_PROGRESS' ? 'en cours' : 
                       match.status === 'SCHEDULED' ? 'programmé' : 'en attente'}
                    </span>
                  </div>
                  
                  <div className={styles.teamsContainer}>
                    <div className={`${styles.team} ${match.winnerTeamId === match.teamAId ? styles.winner : ''}`}>
                      <span className={styles.teamName}>{match.teamA?.name || 'Équipe A'}</span>
                      {match.winnerTeamId === match.teamAId && (
                        <span className={styles.winnerBadge}>V</span>
                      )}
                    </div>
                    
                    <div className={styles.vs}>VS</div>
                    
                    <div className={`${styles.team} ${match.winnerTeamId === match.teamBId ? styles.winner : ''}`}>
                      <span className={styles.teamName}>{match.teamB?.name || 'Équipe B'}</span>
                      {match.winnerTeamId === match.teamBId && (
                        <span className={styles.winnerBadge}>V</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


