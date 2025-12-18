"use client"
import React, { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import styles from './ChampionNode.module.scss'

interface ChampionNodeData {
  winner: string | null
}

function ChampionNode({ data }: { data: ChampionNodeData }) {
  const { winner } = data

  return (
    <div className={`${styles.championNode} ${winner ? styles.hasWinner : ''}`}>
      <Handle
        type="target"
        position={Position.Left}
        className={styles.handle}
      />
      
      <div className={styles.trophy}>🏆</div>
      <div className={styles.winnerName}>
        {winner || 'À définir'}
      </div>
    </div>
  )
}

export default memo(ChampionNode)
