"use client"
import React, { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './reactflow-overrides.css'
import MatchNode from './MatchNode'
import ChampionNode from './ChampionNode'
import styles from './index.module.scss'

// Types
interface Team {
  id: string
  name: string
  avatarUrl?: string | null
  logoUrl?: string | null
}

interface Match {
  id: string
  round: number
  position?: number
  teamA?: Team | null
  teamB?: Team | null
  teamAId?: string
  teamBId?: string
  winnerTeamId?: string | null
  status?: 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'
}

interface BracketProps {
  matches: Match[]
  totalSlots?: number
  tournamentStatus?: string
  isTeamBased?: boolean
}

// Constantes de layout
const NODE_WIDTH = 260
const NODE_HEIGHT = 64
const HORIZONTAL_GAP = 100
const VERTICAL_GAP = 20

// Types de nodes personnalisés
const nodeTypes = {
  match: MatchNode,
  champion: ChampionNode,
}

function calculateTotalRounds(totalSlots: number): number {
  return Math.ceil(Math.log2(totalSlots))
}

function generateEmptyBracket(totalSlots: number): Match[][] {
  const totalRounds = calculateTotalRounds(totalSlots)
  const rounds: Match[][] = []
  
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = totalSlots / Math.pow(2, round)
    const roundMatches: Match[] = []
    
    for (let pos = 0; pos < matchesInRound; pos++) {
      roundMatches.push({
        id: `placeholder-${round}-${pos}`,
        round,
        position: pos,
        status: 'PENDING'
      })
    }
    rounds.push(roundMatches)
  }
  
  return rounds
}

function getRoundName(round: number, totalRounds: number): string {
  const roundsFromEnd = totalRounds - round + 1
  
  switch (roundsFromEnd) {
    case 1: return 'Finale'
    case 2: return 'Demi-finales'
    case 3: return 'Quarts de finale'
    case 4: return 'Huitièmes'
    case 5: return 'Seizièmes'
    case 6: return 'Trente-deuxièmes'
    default: return `Tour ${round}`
  }
}

// Calculer la position Y d'un match
function getMatchYPosition(roundIndex: number, matchIndex: number, baseGap: number): number {
  if (roundIndex === 0) {
    return matchIndex * (NODE_HEIGHT + baseGap)
  }
  
  const parent1Y = getMatchYPosition(roundIndex - 1, matchIndex * 2, baseGap)
  const parent2Y = getMatchYPosition(roundIndex - 1, matchIndex * 2 + 1, baseGap)
  
  return (parent1Y + parent2Y) / 2
}

export default function Bracket({ 
  matches, 
  totalSlots = 8,
  tournamentStatus,
  isTeamBased = false
}: BracketProps) {
  
  // Générer les données du bracket
  const bracketData = useMemo(() => {
    const normalizedSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(totalSlots, 2))))
    const totalRounds = calculateTotalRounds(normalizedSlots)
    const emptyStructure = generateEmptyBracket(normalizedSlots)
    
    if (!matches || matches.length === 0) {
      return { rounds: emptyStructure, totalRounds, totalSlots: normalizedSlots }
    }
    
    const filledRounds = emptyStructure.map((roundMatches, roundIndex) => {
      const round = roundIndex + 1
      const realMatchesForRound = matches.filter(m => m.round === round)
      
      return roundMatches.map((placeholder, pos) => {
        const realMatch = realMatchesForRound.find(m => 
          m.position === pos || realMatchesForRound.indexOf(m) === pos
        ) || realMatchesForRound[pos]
        
        if (realMatch) {
          return { ...realMatch, position: pos }
        }
        return placeholder
      })
    })
    
    return { rounds: filledRounds, totalRounds, totalSlots: normalizedSlots }
  }, [matches, totalSlots])

  const { rounds, totalRounds } = bracketData

  // Convertir en nodes et edges pour React Flow
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []
    
    rounds.forEach((roundMatches, roundIndex) => {
      const round = roundIndex + 1
      const roundName = getRoundName(round, totalRounds)
      const x = roundIndex * (NODE_WIDTH + HORIZONTAL_GAP)
      
      roundMatches.forEach((match, matchIndex) => {
        const y = getMatchYPosition(roundIndex, matchIndex, VERTICAL_GAP)
        const isPlaceholder = match.id.startsWith('placeholder-')
        
        // Créer le node du match
        nodes.push({
          id: match.id,
          type: 'match',
          position: { x, y },
          data: {
            match,
            roundName,
            matchNumber: matchIndex + 1,
            isPlaceholder,
            totalRounds,
            currentRound: round,
          },
          draggable: false,
        })
        
        // Créer les edges vers le match suivant (sauf dernier round)
        if (round < totalRounds) {
          const nextRoundMatchIndex = Math.floor(matchIndex / 2)
          const nextMatchId = rounds[roundIndex + 1]?.[nextRoundMatchIndex]?.id
          
          if (nextMatchId) {
            edges.push({
              id: `edge-${match.id}-${nextMatchId}`,
              source: match.id,
              target: nextMatchId,
              type: 'smoothstep',
              style: { 
                stroke: match.status === 'COMPLETED' 
                  ? '#ff008c' 
                  : (match.status === 'IN_PROGRESS' || match.status === 'SCHEDULED')
                    ? '#f59e0b'
                    : '#3d4654',
                strokeWidth: match.status === 'IN_PROGRESS' || match.status === 'SCHEDULED' ? 3 : 2,
              },
            })
          }
        }
      })
    })
    
    // Ajouter le node Champion
    const lastRound = rounds[rounds.length - 1]
    const finalMatch = lastRound?.[0]
    const championX = totalRounds * (NODE_WIDTH + HORIZONTAL_GAP)
    const championY = getMatchYPosition(totalRounds - 1, 0, VERTICAL_GAP)
    
    // Déterminer l'équipe gagnante
    const winnerTeam = finalMatch?.status === 'COMPLETED' 
      ? (finalMatch.winnerTeamId === finalMatch.teamAId 
          ? finalMatch.teamA 
          : finalMatch.teamB)
      : null
    
    nodes.push({
      id: 'champion',
      type: 'champion',
      position: { x: championX, y: championY },
      data: {
        winner: winnerTeam?.name || null,
        winnerTeam: winnerTeam || null
      },
      draggable: false,
    })
    
    // Edge vers le champion
    if (finalMatch) {
      edges.push({
        id: `edge-${finalMatch.id}-champion`,
        source: finalMatch.id,
        target: 'champion',
        type: 'smoothstep',
        style: { 
          stroke: finalMatch.status === 'COMPLETED' ? '#00d4aa' : '#4a5568',
          strokeWidth: 2,
        },
      })
    }
    
    return { initialNodes: nodes, initialEdges: edges }
  }, [rounds, totalRounds])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Mettre à jour quand les données changent
  React.useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  return (
    <div className={styles.bracketContainer}>
      <div className={styles.flowWrapper}>
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ 
          padding: 0.1,
        }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1} 
          color="#2d3748"
        />
        <Controls 
          showInteractive={false}
          className={styles.controls}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'champion') return '#ffd700'
            const match = node.data?.match as Match
            if (match?.status === 'COMPLETED') return '#00d4aa'
            if (match?.status === 'IN_PROGRESS') return '#f59e0b'
            return '#4a5568'
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className={styles.minimap}
        />
        </ReactFlow>
      </div>
      
      {/* Légende */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.pending}`} />
          <span>En attente</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.inProgress}`} />
          <span>En cours</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendDot} ${styles.completed}`} />
          <span>Terminé</span>
        </div>
        <div className={styles.legendInfo}>
          <span>🖱️ Glisser pour déplacer • Molette pour zoomer</span>
        </div>
      </div>
    </div>
  )
}
