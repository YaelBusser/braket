"use client"
import React, { useMemo, useState } from 'react'
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

type BracketProps = {
  matches?: Match[]
  maxTeams?: number
  tournamentStatus?: string
  participantCount?: number
  isTeamBased?: boolean
}

export default function Bracket({ 
  matches, 
  maxTeams, 
  tournamentStatus,
  participantCount = 0,
  isTeamBased = false
}: BracketProps) {
  // Générer un bracket vide si pas de matchs - toujours afficher le bracket visuel
  const emptyBracket = useMemo(() => {
    if (matches && matches.length > 0) return null
    
    // Utiliser maxTeams s'il est défini, sinon 8 par défaut pour l'affichage
    const bracketSize = maxTeams || 8
    
    const rounds: Array<{ round: number; items: Array<{ id: string; round: number; status?: string }> }> = []
    let currentRound = 1
    let matchesInRound = bracketSize / 2
    
    while (matchesInRound >= 1) {
      const roundMatches = []
      for (let i = 0; i < matchesInRound; i++) {
        roundMatches.push({
          id: `empty-${currentRound}-${i}`,
          round: currentRound,
          status: 'PENDING'
        })
      }
      rounds.push({ round: currentRound, items: roundMatches })
      currentRound++
      matchesInRound = matchesInRound / 2
    }
    
    return rounds
  }, [matches, maxTeams])
  
  // Déterminer le message à afficher pour les matchs vides
  const getEmptyMessage = (round: number) => {
    // Au premier round, si le tournoi n'a pas commencé et qu'il n'y a pas de participants
    if (round === 1 && tournamentStatus === 'REG_OPEN' && participantCount === 0) {
      return isTeamBased ? 'Aucune équipe inscrite' : 'Aucun joueur inscrit'
    }
    // Pour les rounds suivants, on ne sait pas encore qui a gagné
    return 'À déterminer'
  }

  const rounds = useMemo(() => {
    if (matches && matches.length > 0) {
      const map: Record<number, Match[]> = {}
      for (const m of matches || []) {
        const r = m.round || 1
        if (!map[r]) map[r] = []
        map[r].push(m)
      }
      const keys = Object.keys(map).map(n => parseInt(n)).sort((a,b)=>a-b)
      return keys.map(k => ({ round: k, items: map[k] }))
    }
    return emptyBracket || []
  }, [matches, emptyBracket])

  const getRoundTitle = (round: number, totalRounds: number) => {
    const matchCount = rounds.find(r => r.round === round)?.items.length || 0
    if (totalRounds === 1) return 'Finale'
    if (totalRounds === 2) {
      if (round === 1) return 'Demi-finales'
      return 'Finale'
    }
    if (totalRounds === 3) {
      if (round === 1) return 'Quart de finale'
      if (round === 2) return 'Demi-finales'
      return 'Finale'
    }
    if (totalRounds === 4) {
      if (round === 1) return '1/8 de finale'
      if (round === 2) return 'Quart de finale'
      if (round === 3) return 'Demi-finales'
      return 'Finale'
    }
    // Pour plus de rounds
    const matchCountLabel = matchCount > 1 ? `${matchCount} matchs` : '1 match'
    if (round === totalRounds) return `Finale`
    return `Round ${round} (${matchCountLabel})`
  }

  const getMatchStatusClass = (status?: string) => {
    switch (status) {
      case 'COMPLETED': return styles.statusCompleted
      case 'SCHEDULED': return styles.statusScheduled
      case 'IN_PROGRESS': return styles.statusInProgress
      default: return styles.statusPending
    }
  }

  const totalRounds = rounds.length
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0)

  // Toujours afficher le bracket visuel - ne jamais retourner un état vide
  // Si rounds est vide, emptyBracket devrait avoir généré quelque chose
  if (rounds.length === 0) {
    // Fallback : générer un bracket de 8 équipes par défaut
    const fallbackRounds: Array<{ round: number; items: Array<{ id: string; round: number; status?: string }> }> = []
    let currentRound = 1
    let matchesInRound = 4 // 8 équipes = 4 matchs
    
    while (matchesInRound >= 1) {
      const roundMatches = []
      for (let i = 0; i < matchesInRound; i++) {
        roundMatches.push({
          id: `fallback-${currentRound}-${i}`,
          round: currentRound,
          status: 'PENDING'
        })
      }
      fallbackRounds.push({ round: currentRound, items: roundMatches })
      currentRound++
      matchesInRound = matchesInRound / 2
    }
    
    // Utiliser les rounds de fallback
    const fallbackRoundsData = fallbackRounds.map(r => ({ round: r.round, items: r.items }))
    return (
      <div className={styles.bracketContainer}>
        <div className={styles.bracketContent}>
          {fallbackRoundsData.map((rc, colIdx) => {
            const isLastRound = colIdx === fallbackRoundsData.length - 1
            
            const getGlobalMatchNumberFallback = (round: number, matchIdx: number) => {
              let matchNum = 1
              for (let r = 1; r < round; r++) {
                const roundData = fallbackRoundsData.find(rd => rd.round === r)
                if (roundData) {
                  matchNum += roundData.items.length
                }
              }
              return matchNum + matchIdx
            }
            
            return (
              <div key={rc.round} className={styles.round}>
                <div className={styles.roundHeader}>
                  <div>{getRoundTitle(rc.round, fallbackRoundsData.length)}</div>
                  {rc.items.length > 1 && (
                    <div className={styles.roundMatchCount}>
                      {rc.items.length} matchs
                    </div>
                  )}
                </div>
                <div className={styles.matchesList}>
                  {rc.items.map((match, matchIdx) => {
                    const globalMatchNum = getGlobalMatchNumberFallback(rc.round, matchIdx)
                    const shouldShowConnector = !isLastRound
                    const isTopMatch = matchIdx % 2 === 0
                    const isBottomMatch = matchIdx % 2 === 1
                    
                    return (
                      <div key={match.id} className={styles.matchWrapper}>
                        <div className={`${styles.matchBox} ${getMatchStatusClass(match.status)}`}>
                          <div className={styles.matchHeader}>
                            <span className={styles.matchStatus}>En attente</span>
                            <span className={styles.matchNumber}>Match {globalMatchNum}</span>
                          </div>
                          
                          <div className={styles.teamRow}>
                            <div className={styles.team}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.teamIcon}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              <span className={`${styles.teamName} ${tournamentStatus === 'REG_OPEN' && participantCount === 0 && rc.round === 1 ? styles.emptyTeam : ''}`}>
                                {getEmptyMessage(rc.round)}
                              </span>
                              <span className={styles.teamScore}>0</span>
                            </div>
                          </div>
                          
                          <div className={styles.teamRow}>
                            <div className={styles.team}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.teamIcon}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                              </svg>
                              <span className={`${styles.teamName} ${tournamentStatus === 'REG_OPEN' && participantCount === 0 && rc.round === 1 ? styles.emptyTeam : ''}`}>
                                {getEmptyMessage(rc.round)}
                              </span>
                              <span className={styles.teamScore}>0</span>
                            </div>
                          </div>
                        </div>
                        
                        {shouldShowConnector && (
                          <div className={styles.connector}>
                            <div className={styles.connectorLine}></div>
                            {isTopMatch && <div className={styles.connectorVerticalTop}></div>}
                            {isBottomMatch && <div className={styles.connectorVerticalBottom}></div>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Calculer le numéro de match global pour chaque match
  const getGlobalMatchNumber = (round: number, matchIdx: number) => {
    let matchNum = 1
    for (let r = 1; r < round; r++) {
      const roundData = rounds.find(rd => rd.round === r)
      if (roundData) {
        matchNum += roundData.items.length
      }
    }
    return matchNum + matchIdx
  }

  // Navigation entre les rounds si nécessaire
  const showNavigation = totalRounds > 3
  const displayedRounds = showNavigation 
    ? rounds.slice(currentRoundIndex, currentRoundIndex + 3)
    : rounds

  return (
    <div className={styles.bracketWrapper}>
      {showNavigation && (
        <div className={styles.bracketNavigation}>
          <button
            onClick={() => setCurrentRoundIndex(Math.max(0, currentRoundIndex - 1))}
            disabled={currentRoundIndex === 0}
            className={styles.navButton}
          >
            ← Précédent
          </button>
          <div className={styles.navInfo}>
            Round {currentRoundIndex + 1} - {Math.min(currentRoundIndex + 3, totalRounds)} sur {totalRounds}
          </div>
          <button
            onClick={() => setCurrentRoundIndex(Math.min(totalRounds - 3, currentRoundIndex + 1))}
            disabled={currentRoundIndex >= totalRounds - 3}
            className={styles.navButton}
          >
            Suivant →
          </button>
        </div>
      )}
      
      <div className={styles.bracketContent}>
        {displayedRounds.map((rc, colIdx) => {
          const actualColIdx = showNavigation ? currentRoundIndex + colIdx : colIdx
          const isLastRound = actualColIdx === rounds.length - 1
          const nextRound = rounds[actualColIdx + 1]
          
          return (
            <div key={rc.round} className={styles.round}>
              <div className={styles.roundHeader}>
                <div className={styles.roundTitle}>{getRoundTitle(rc.round, totalRounds)}</div>
                {rc.items.length > 1 && (
                  <div className={styles.roundMatchCount}>
                    {rc.items.length} matchs
                  </div>
                )}
              </div>
              <div className={styles.matchesList}>
                {rc.items.map((match, matchIdx) => {
                  const isPlaceholder = match.id.startsWith('empty-')
                  const globalMatchNum = getGlobalMatchNumber(rc.round, matchIdx)
                  const shouldShowConnector = !isLastRound
                  const isTopMatch = matchIdx % 2 === 0
                  const isBottomMatch = matchIdx % 2 === 1
                  const nextMatchIndex = Math.floor(matchIdx / 2)
                  
                  return (
                    <div key={match.id} className={styles.matchWrapper}>
                      <div className={`${styles.matchBox} ${getMatchStatusClass(match.status)}`}>
                        <div className={styles.matchHeader}>
                          <span className={styles.matchStatus}>
                            {match.status === 'COMPLETED' ? 'terminé' : 
                             match.status === 'IN_PROGRESS' ? 'en cours' : 
                             match.status === 'SCHEDULED' ? 'programmé' : 'En attente'}
                          </span>
                          <span className={styles.matchNumber}>Match {globalMatchNum}</span>
                        </div>
                        
                        <div className={styles.teamRow}>
                          <div className={`${styles.team} ${match.winnerTeamId === match.teamAId ? styles.winner : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.teamIcon}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span className={`${styles.teamName} ${isPlaceholder && tournamentStatus === 'REG_OPEN' && participantCount === 0 && rc.round === 1 ? styles.emptyTeam : ''}`}>
                              {isPlaceholder ? getEmptyMessage(rc.round) : (match.teamA?.name || 'Équipe A')}
                            </span>
                            <span className={styles.teamScore}>
                              {isPlaceholder ? '0' : (match.winnerTeamId === match.teamAId ? '1' : '0')}
                            </span>
                          </div>
                        </div>
                        
                        <div className={styles.teamRow}>
                          <div className={`${styles.team} ${match.winnerTeamId === match.teamBId ? styles.winner : ''}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.teamIcon}>
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span className={`${styles.teamName} ${isPlaceholder && tournamentStatus === 'REG_OPEN' && participantCount === 0 && rc.round === 1 ? styles.emptyTeam : ''}`}>
                              {isPlaceholder ? getEmptyMessage(rc.round) : (match.teamB?.name || 'Équipe B')}
                            </span>
                            <span className={styles.teamScore}>
                              {isPlaceholder ? '0' : (match.winnerTeamId === match.teamBId ? '1' : '0')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {shouldShowConnector && (
                        <div className={styles.connector}>
                          <div className={styles.connectorHorizontal}></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


