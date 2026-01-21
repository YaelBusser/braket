"use client"
import React, { useMemo } from 'react'
import styles from './MatchesSidebar.module.scss'

interface Team {
  id: string
  name: string
  avatarUrl?: string | null
}

interface Match {
  id: string
  round: number
  teamA?: Team | null
  teamB?: Team | null
  teamAId?: string
  teamBId?: string
  winnerTeamId?: string | null
  status?: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
  scheduledAt?: string | null
}

interface MatchesSidebarProps {
  matches: Match[]
  userId?: string | null
  userTeamId?: string | null
  isTeamBased?: boolean
  totalSlots?: number
}

function MatchesSidebar({ matches, userId, userTeamId, isTeamBased = false, totalSlots = 8 }: MatchesSidebarProps) {
  // Trouver le match en cours de l'utilisateur
  const currentUserMatch = useMemo(() => {
    if (!matches || matches.length === 0) return null
    
    return matches.find(match => {
      if (match.status !== 'IN_PROGRESS') return false
      
      if (isTeamBased) {
        // Pour les tournois en équipe, vérifier si l'équipe de l'utilisateur participe
        return match.teamAId === userTeamId || match.teamBId === userTeamId
      } else {
        // Pour les tournois solo, vérifier si l'utilisateur participe
        // Note: pour les tournois solo, teamAId et teamBId contiennent les userId
        return match.teamAId === userId || match.teamBId === userId
      }
    }) || null
  }, [matches, userId, userTeamId, isTeamBased])

  // Tous les autres matchs (sauf le match en cours de l'utilisateur)
  const otherMatches = useMemo(() => {
    if (!matches || matches.length === 0) return []
    
    const currentMatchId = currentUserMatch?.id
    return matches.filter(m => m.id !== currentMatchId)
      .sort((a, b) => {
        // Trier par statut (programmé > en cours > en attente > terminé)
        const statusOrder = { 'SCHEDULED': 0, 'IN_PROGRESS': 1, 'PENDING': 2, 'COMPLETED': 3 }
        const aOrder = statusOrder[a.status || 'PENDING'] ?? 2
        const bOrder = statusOrder[b.status || 'PENDING'] ?? 2
        if (aOrder !== bOrder) return aOrder - bOrder
        
        // Pour les matchs programmés, trier par date (plus proche en premier)
        if (a.status === 'SCHEDULED' && b.status === 'SCHEDULED') {
          const aDate = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
          const bDate = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
          if (aDate !== bDate) return aDate - bDate
        }
        
        // Puis par round (rounds plus élevés en premier)
        return (b.round || 0) - (a.round || 0)
      })
  }, [matches, currentUserMatch])

  // Calculer le nombre total de rounds à partir du totalSlots
  const totalRounds = useMemo(() => {
    const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
    return Math.ceil(Math.log2(normalizedSlots))
  }, [totalSlots])

  const getRoundName = (round: number) => {
    const roundsFromEnd = totalRounds - round + 1
    
    switch (roundsFromEnd) {
      case 1: return 'Finale'
      case 2: return 'Demi-finales'
      case 3: return 'Quarts de finale'
      case 4: return 'Huitièmes'
      case 5: return 'Seizièmes'
      default: return `Tour ${round}`
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'En cours'
      case 'SCHEDULED': return 'En cours'
      case 'COMPLETED': return 'Terminé'
      default: return 'En attente'
    }
  }

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'IN_PROGRESS': return styles.inProgress
      case 'SCHEDULED': return styles.inProgress // Utiliser le même style que IN_PROGRESS
      case 'COMPLETED': return styles.completed
      default: return styles.pending
    }
  }

  return (
    <div className={styles.matchesSidebar}>
      <h3 className={styles.sidebarTitle}>Matchs</h3>
      
      {/* Match en cours de l'utilisateur */}
      {currentUserMatch && (
        <div className={styles.currentMatchSection}>
          <h4 className={styles.sectionTitle}>Mon match en cours</h4>
          <div className={`${styles.matchCard} ${styles.currentMatch} ${getStatusClass(currentUserMatch.status)}`}>
            <div className={styles.matchHeader}>
              <span className={styles.roundName}>{getRoundName(currentUserMatch.round || 1)}</span>
              <span className={`${styles.statusBadge} ${getStatusClass(currentUserMatch.status)}`}>
                {getStatusLabel(currentUserMatch.status)}
              </span>
            </div>
            <div className={styles.matchTeams}>
              <div className={styles.team}>
                <div className={styles.teamLogo}>
                  {currentUserMatch.teamA?.avatarUrl ? (
                    <img src={currentUserMatch.teamA.avatarUrl} alt={currentUserMatch.teamA.name} />
                  ) : (
                    <span>{currentUserMatch.teamA?.name?.slice(0, 2).toUpperCase() || '?'}</span>
                  )}
                </div>
                <span className={styles.teamName}>{currentUserMatch.teamA?.name || '?'}</span>
              </div>
              <span className={styles.vs}>VS</span>
              <div className={styles.team}>
                <div className={styles.teamLogo}>
                  {currentUserMatch.teamB?.avatarUrl ? (
                    <img src={currentUserMatch.teamB.avatarUrl} alt={currentUserMatch.teamB.name} />
                  ) : (
                    <span>{currentUserMatch.teamB?.name?.slice(0, 2).toUpperCase() || '?'}</span>
                  )}
                </div>
                <span className={styles.teamName}>{currentUserMatch.teamB?.name || '?'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste des autres matchs */}
      <div className={styles.matchesList}>
        {currentUserMatch && <h4 className={styles.sectionTitle}>Tous les matchs</h4>}
        {otherMatches.length === 0 ? (
          <p className={styles.emptyMessage}>Aucun autre match</p>
        ) : (
          <div className={styles.matchesGrid}>
            {otherMatches.map(match => (
              <div key={match.id} className={`${styles.matchCard} ${getStatusClass(match.status)}`}>
                <div className={styles.matchHeader}>
                  <span className={styles.roundName}>{getRoundName(match.round || 1)}</span>
                  <span className={`${styles.statusBadge} ${getStatusClass(match.status)}`}>
                    {getStatusLabel(match.status)}
                  </span>
                </div>
                <div className={styles.matchTeams}>
                  <div className={styles.team}>
                    <div className={styles.teamLogo}>
                      {match.teamA?.avatarUrl ? (
                        <img src={match.teamA.avatarUrl} alt={match.teamA.name} />
                      ) : (
                        <span>{match.teamA?.name?.slice(0, 2).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <span className={styles.teamName}>{match.teamA?.name || '?'}</span>
                  </div>
                  <span className={styles.vs}>VS</span>
                  <div className={styles.team}>
                    <div className={styles.teamLogo}>
                      {match.teamB?.avatarUrl ? (
                        <img src={match.teamB.avatarUrl} alt={match.teamB.name} />
                      ) : (
                        <span>{match.teamB?.name?.slice(0, 2).toUpperCase() || '?'}</span>
                      )}
                    </div>
                    <span className={styles.teamName}>{match.teamB?.name || '?'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MatchesSidebar
