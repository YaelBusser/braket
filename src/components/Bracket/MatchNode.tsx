"use client"
import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import styles from './MatchNode.module.scss'

interface Team {
  id: string
  name: string
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
  const teamAWins = match.winnerTeamId && match.winnerTeamId === match.teamAId
  const teamBWins = match.winnerTeamId && match.winnerTeamId === match.teamBId

  const teamAName = isPlaceholder ? '?' : (match.teamA?.name || '?')
  const teamBName = isPlaceholder ? '?' : (match.teamB?.name || '?')

  // Initiales pour le logo placeholder
  const getInitials = (name: string) => {
    if (name === '?') return '?'
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div 
      className={`
        ${styles.matchNode}
        ${isCompleted ? styles.completed : ''}
        ${isPlaceholder ? styles.placeholder : ''}
      `}
    >
      {currentRound > 1 && (
        <Handle type="target" position={Position.Left} className={styles.handle} />
      )}
      
      {/* Team A */}
      <div className={`${styles.teamSide} ${styles.teamA} ${teamAWins ? styles.winner : ''} ${teamBWins ? styles.loser : ''}`}>
        <div className={styles.teamLogo}>
          {getInitials(teamAName)}
        </div>
        <span className={styles.teamName}>{teamAName}</span>
      </div>
      
      {/* VS Separator */}
      <div className={styles.vsSeparator}>
        <span className={styles.vsText}>VS</span>
      </div>
      
      {/* Team B */}
      <div className={`${styles.teamSide} ${styles.teamB} ${teamBWins ? styles.winner : ''} ${teamAWins ? styles.loser : ''}`}>
        <div className={styles.teamLogo}>
          {getInitials(teamBName)}
        </div>
        <span className={styles.teamName}>{teamBName}</span>
      </div>
      
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  )
}

export default memo(MatchNode)
