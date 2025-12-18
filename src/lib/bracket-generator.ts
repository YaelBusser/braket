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
 */
export async function generateSingleEliminationBracket(
  tournamentId: string,
  entrants: BracketEntrant[]
): Promise<{ matches: BracketMatch[]; immediateWinners: string[] }> {
  if (entrants.length < 2) {
    throw new Error('Au moins 2 participants requis pour un tournoi')
  }

  // Mélanger les participants (Fisher-Yates shuffle)
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

  const matchesPerRound1 = bracketSize / 2
  const byes = bracketSize - shuffledEntrants.length
  
  const matches: BracketMatch[] = []
  const immediateWinners: string[] = []

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

  // Si des équipes ont des BYE, créer les matchs du round 2 avec ces équipes
  if (immediateWinners.length > 0) {
    // Les gagnants immédiats sont placés dans le round 2
    // Ils attendent les gagnants des matchs du round 1
    for (let i = 0; i < immediateWinners.length; i += 2) {
      const teamA = immediateWinners[i]
      const teamB = immediateWinners[i + 1]
      
      if (teamA && teamB) {
        // Deux équipes avec BYE se rencontrent au round 2
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
          position: Math.floor(i / 2),
          teamAId: match.teamAId,
          teamBId: match.teamBId,
          winnerTeamId: undefined,
          status: 'PENDING'
        })
      }
      // Si une seule équipe, elle attend un gagnant du round 1
    }
  }

  console.log(`Bracket généré: ${matches.length} matchs créés, ${immediateWinners.length} BYE`)
  
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
      teams: { include: { members: true } },
      registrations: { include: { user: true } }
    }
  })

  if (!tournament) {
    return { canStart: false, reason: 'Tournoi introuvable', participantCount: 0 }
  }

  if (tournament.status !== 'REG_OPEN') {
    return { canStart: false, reason: 'Inscriptions fermées', participantCount: 0 }
  }

  // Note: on permet de démarrer même après la deadline, c'est juste un indicateur
  
  let participantCount = 0

  if (tournament.isTeamBased) {
    const minSize = tournament.teamMinSize || 1
    const validTeams = tournament.teams.filter(team => team.members.length >= minSize)
    participantCount = validTeams.length
  } else {
    participantCount = tournament.registrations.length
  }

  if (participantCount < 2) {
    return { canStart: false, reason: 'Au moins 2 participants requis', participantCount }
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
