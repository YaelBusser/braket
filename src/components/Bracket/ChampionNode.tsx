"use client"
import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import styles from './ChampionNode.module.scss'

interface Team {
  id: string
  name: string
  avatarUrl?: string | null
  logoUrl?: string | null
}

interface ChampionNodeData {
  winner: string | null
  winnerTeam: Team | null
}

function ChampionNode({ data }: { data: ChampionNodeData }) {
  const { winner, winnerTeam } = data

  // Récupérer l'URL du logo (avatarUrl en priorité, puis logoUrl)
  const getTeamLogoUrl = (team: Team | null): string | null => {
    if (!team) return null
    return team.avatarUrl || team.logoUrl || null
  }

  // Initiales pour le logo placeholder
  const getInitials = (name: string) => {
    if (!name || name === 'À définir') return '?'
    return name.slice(0, 2).toUpperCase()
  }

  const logoUrl = getTeamLogoUrl(winnerTeam)
  const initials = getInitials(winner || '')

  return (
    <div className={`${styles.championNode} ${winner ? styles.hasWinner : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      
      <div className={styles.winnerLogo}>
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={winner || 'Gagnant'}
            className={styles.winnerLogoImg}
          />
        ) : (
          <div className={styles.winnerLogoPlaceholder}>
            {initials}
          </div>
        )}
      </div>
      <div className={styles.winnerName}>
        {winner || 'À définir'}
      </div>
    </div>
  )
}

export default memo(ChampionNode)
