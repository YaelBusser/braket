import { prisma } from './prisma'

export interface BracketEntrant {
  teamId: string
  teamName: string
  members: Array<{ userId: string; user: { pseudo: string } }>
}

export interface BracketMatch {
  id: string
  round: number
  position: number
  teamAId: string
  teamBId: string
  winnerTeamId?: string
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED'
  scheduledAt?: Date
}

/**
 * Génère un arbre d'élimination directe pour un tournoi
 * Gère les BYE automatiquement pour les brackets incomplets
 * Crée tous les rounds du bracket avec des équipes placeholder pour les matchs futurs
 */
export async function generateSingleEliminationBracket(
  tournamentId: string,
  entrants: BracketEntrant[]
): Promise<{ matches: BracketMatch[]; immediateWinners: string[] }> {
  if (entrants.length < 2) {
    throw new Error('Au moins 2 participants requis pour un tournoi')
  }

  // Mélanger les participants (Fisher-Yates shuffle) pour un matchmaking aléatoire
  const shuffledEntrants = [...entrants]
  for (let i = shuffledEntrants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledEntrants[i], shuffledEntrants[j]] = [shuffledEntrants[j], shuffledEntrants[i]]
  }

  // Calculer la taille du bracket (prochaine puissance de 2)
  let bracketSize = 1
  while (bracketSize < shuffledEntrants.length) {
    bracketSize *= 2
  }

  const totalRounds = Math.ceil(Math.log2(bracketSize))
  const matchesPerRound1 = bracketSize / 2
  const byes = bracketSize - shuffledEntrants.length
  
  const matches: BracketMatch[] = []
  const immediateWinners: string[] = []

  // Créer ou récupérer une équipe placeholder "À déterminer" globale pour les matchs non encore déterminés
  let tbdTeam = await prisma.team.findUnique({
    where: { id: 'tbd-global' }
  })
  
  if (!tbdTeam) {
    tbdTeam = await prisma.team.create({
      data: {
        id: 'tbd-global',
        name: 'À déterminer'
      }
    })
  } else if (tbdTeam.name === 'TBD (À déterminer)') {
    // Mettre à jour le nom si l'ancien format existe
    tbdTeam = await prisma.team.update({
      where: { id: 'tbd-global' },
      data: { name: 'À déterminer' }
    })
  }

  // Distribution des équipes avec gestion des BYE
  // Les BYE sont placés de manière à ce que les équipes passent directement au round 2
  // Stratégie : remplir le bracket de haut en bas, les slots vides = BYE
  
  const slots: (BracketEntrant | null)[] = new Array(bracketSize).fill(null)
  
  // Placer les équipes en utilisant un seeding basique
  // Les premières équipes (après shuffle) sont considérées comme les "meilleurs seeds"
  // et sont distribuées pour éviter qu'elles se rencontrent tôt
  for (let i = 0; i < shuffledEntrants.length; i++) {
    slots[i] = shuffledEntrants[i]
  }

  // Créer les matchs du premier tour
  for (let pos = 0; pos < matchesPerRound1; pos++) {
    const slotA = slots[pos * 2]
    const slotB = slots[pos * 2 + 1]
    
    if (slotA && slotB) {
      // Match normal entre deux équipes
      const match = await prisma.match.create({
        data: {
          tournamentId,
          round: 1,
          teamAId: slotA.teamId,
          teamBId: slotB.teamId,
          status: 'PENDING'
        }
      })
      
      matches.push({
        id: match.id,
        round: 1,
        position: pos,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        winnerTeamId: undefined,
        status: 'PENDING'
      })
    } else if (slotA && !slotB) {
      // Équipe A a un BYE → passe directement au round suivant
      immediateWinners.push(slotA.teamId)
    } else if (!slotA && slotB) {
      // Équipe B a un BYE → passe directement au round suivant
      immediateWinners.push(slotB.teamId)
    }
    // Si les deux sont null, c'est un slot vide (ne devrait pas arriver)
  }

  // Créer tous les matchs des rounds suivants avec des équipes placeholder
  // Les équipes seront mises à jour quand les matchs précédents seront terminés
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round)
    
    for (let pos = 0; pos < matchesInRound; pos++) {
      // Pour le round 2, gérer les BYE
      if (round === 2 && immediateWinners.length > 0) {
        const byeIndex = pos * 2
        const teamA = immediateWinners[byeIndex]
        const teamB = immediateWinners[byeIndex + 1]
        
        if (teamA && teamB) {
          // Deux équipes avec BYE se rencontrent
          const match = await prisma.match.create({
            data: {
              tournamentId,
              round: 2,
              teamAId: teamA,
              teamBId: teamB,
              status: 'PENDING'
            }
          })
          
          matches.push({
            id: match.id,
            round: 2,
            position: pos,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            winnerTeamId: undefined,
            status: 'PENDING'
          })
        } else if (teamA) {
          // Une seule équipe avec BYE, elle attend un gagnant du round 1
          const match = await prisma.match.create({
            data: {
              tournamentId,
              round: 2,
              teamAId: teamA,
              teamBId: tbdTeam.id, // Placeholder pour le gagnant du round 1
              status: 'PENDING'
            }
          })
          
          matches.push({
            id: match.id,
            round: 2,
            position: pos,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            winnerTeamId: undefined,
            status: 'PENDING'
          })
        } else {
          // Pas d'équipe avec BYE à cette position, créer un match placeholder
          const match = await prisma.match.create({
            data: {
              tournamentId,
              round: 2,
              teamAId: tbdTeam.id,
              teamBId: tbdTeam.id,
              status: 'PENDING'
            }
          })
          
          matches.push({
            id: match.id,
            round: 2,
            position: pos,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            winnerTeamId: undefined,
            status: 'PENDING'
          })
        }
      } else {
        // Pour les rounds 3+, créer des matchs avec des placeholders
        // Ces équipes seront mises à jour quand les matchs précédents seront terminés
        const match = await prisma.match.create({
          data: {
            tournamentId,
            round,
            teamAId: tbdTeam.id,
            teamBId: tbdTeam.id,
            status: 'PENDING'
          }
        })
        
        matches.push({
          id: match.id,
          round,
          position: pos,
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          winnerTeamId: undefined,
          status: 'PENDING'
        })
      }
    }
  }

  console.log(`Bracket généré: ${matches.length} matchs créés (${totalRounds} rounds), ${immediateWinners.length} BYE`)
  
  return { matches, immediateWinners }
}

/**
 * Calcule le nombre de tours nécessaires pour un bracket
 */
export function calculateRounds(participantCount: number): number {
  if (participantCount < 2) return 0
  return Math.ceil(Math.log2(participantCount))
}

/**
 * Calcule le nombre de matchs par tour
 */
export function calculateMatchesPerRound(round: number, totalParticipants: number): number {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalParticipants)))
  return Math.floor(bracketSize / Math.pow(2, round))
}

/**
 * Valide qu'un tournoi peut être démarré
 */
export async function validateTournamentStart(tournamentId: string): Promise<{
  canStart: boolean
  reason?: string
  participantCount: number
}> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      registrations: { 
        include: { 
          user: true,
          team: {
            include: {
              members: true
            }
          }
        } 
      }
    }
  })

  if (!tournament) {
    return { canStart: false, reason: 'Tournoi introuvable', participantCount: 0 }
  }

  if (tournament.status !== 'REG_OPEN' && tournament.status !== 'REG_CLOSED') {
    return { canStart: false, reason: 'Le tournoi a déjà commencé ou est terminé', participantCount: 0 }
  }

  // Note: on permet de démarrer même après la deadline, c'est juste un indicateur
  
  let participantCount = 0

  if (tournament.isTeamBased) {
    const minSize = tournament.teamMinSize || 1
    // Récupérer les équipes inscrites via les registrations
    const teamRegistrations = tournament.registrations.filter(reg => reg.teamId !== null)
    const validTeams = teamRegistrations.filter(reg => 
      reg.team && reg.team.members.length >= minSize
    )
    participantCount = validTeams.length
  } else {
    participantCount = tournament.registrations.filter(reg => reg.userId !== null).length
  }

  // Vérifier le minimum requis (bracketMinTeams ou au moins 2)
  const minTeams = tournament.bracketMinTeams || 2
  if (participantCount < minTeams) {
    return { 
      canStart: false, 
      reason: `Nombre de participants insuffisant (${participantCount}/${minTeams} minimum requis)`, 
      participantCount 
    }
  }

  // Vérifier le nombre max si défini
  const maxTeams = tournament.bracketMaxTeams || 256
  if (participantCount > maxTeams) {
    return { 
      canStart: false, 
      reason: `Trop de participants (${participantCount}/${maxTeams} max)`, 
      participantCount 
    }
  }

  return { canStart: true, participantCount }
}
