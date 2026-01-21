"use client"
import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import styles from './MatchNode.module.scss'

interface Team {
  id: string
  name: string
  avatarUrl?: string | null
  logoUrl?: string
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
}

interface MatchNodeData {
  match: Match
  isPlaceholder: boolean
  totalRounds: number
  currentRound: number
}

function MatchNode({ data }: { data: MatchNodeData }) {
  const { match, isPlaceholder, currentRound } = data
  
  const isCompleted = match.status === 'COMPLETED'
  const isInProgress = match.status === 'IN_PROGRESS' || match.status === 'SCHEDULED'
  const teamAWins = match.winnerTeamId && match.winnerTeamId === match.teamAId
  const teamBWins = match.winnerTeamId && match.winnerTeamId === match.teamBId

  const teamAName = isPlaceholder ? '?' : (match.teamA?.name || '?')
  const teamBName = isPlaceholder ? '?' : (match.teamB?.name || '?')
  
  // Normaliser le nom pour remplacer "TBD (À déterminer)" ou "À déterminer" par "?"
  const normalizeName = (name: string) => {
    if (name.includes('TBD') || name === 'TBD (À déterminer)' || name === 'À déterminer') {
      return '?'
    }
    return name
  }
  
  const normalizedTeamAName = normalizeName(teamAName)
  const normalizedTeamBName = normalizeName(teamBName)

  // Initiales pour le logo placeholder
  const getInitials = (name: string) => {
    if (name === '?') return '?'
    return name.slice(0, 2).toUpperCase()
  }
  
  // Récupérer l'URL du logo (avatarUrl en priorité, puis logoUrl)
  const getTeamLogoUrl = (team: Team | null | undefined): string | null => {
    if (!team) return null
    return team.avatarUrl || team.logoUrl || null
  }

  return (
    <div 
      className={`
        ${styles.matchNode}
        ${isCompleted ? styles.completed : ''}
        ${isInProgress ? styles.inProgress : ''}
        ${isPlaceholder ? styles.placeholder : ''}
      `}
    >
      {currentRound > 1 && (
        <Handle type="target" position={Position.Left} className={styles.handle} />
      )}
      
      {/* Team A */}
      <div className={`${styles.teamSide} ${styles.teamA} ${teamAWins ? styles.winner : ''} ${teamBWins ? styles.loser : ''}`}>
        <div className={styles.teamLogo}>
          {getTeamLogoUrl(match.teamA) ? (
            <img 
              src={getTeamLogoUrl(match.teamA) || ''} 
              alt={normalizedTeamAName}
              className={styles.teamLogoImg}
            />
          ) : (
            getInitials(normalizedTeamAName)
          )}
        </div>
        <span className={styles.teamName}>{normalizedTeamAName}</span>
      </div>
      
      {/* VS Separator */}
      <div className={styles.vsSeparator}>
        <span className={styles.vsText}>VS</span>
      </div>
      
      {/* Team B */}
      <div className={`${styles.teamSide} ${styles.teamB} ${teamBWins ? styles.winner : ''} ${teamAWins ? styles.loser : ''}`}>
        <div className={styles.teamLogo}>
          {getTeamLogoUrl(match.teamB) ? (
            <img 
              src={getTeamLogoUrl(match.teamB) || ''} 
              alt={normalizedTeamBName}
              className={styles.teamLogoImg}
            />
          ) : (
            getInitials(normalizedTeamBName)
          )}
        </div>
        <span className={styles.teamName}>{normalizedTeamBName}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

export default memo(MatchNode)
