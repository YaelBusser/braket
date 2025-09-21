import { prisma } from './prisma'

export interface BracketEntrant {
  teamId: string
  teamName: string
  members: Array<{ userId: string; user: { pseudo: string } }>
}

export interface BracketMatch {
  id: string
  round: number
  teamAId: string
  teamBId: string
  winnerTeamId?: string
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED'
  scheduledAt?: Date
}

/**
 * Génère un arbre d'élimination directe pour un tournoi
 */
export async function generateSingleEliminationBracket(
  tournamentId: string,
  entrants: BracketEntrant[]
): Promise<{ matches: BracketMatch[]; immediateWinners: string[] }> {
  if (entrants.length < 2) {
    throw new Error('Au moins 2 participants requis pour un tournoi')
  }

  // Mélanger les participants
  const shuffledEntrants = [...entrants]
  for (let i = shuffledEntrants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledEntrants[i], shuffledEntrants[j]] = [shuffledEntrants[j], shuffledEntrants[i]]
  }

  // Calculer la prochaine puissance de 2
  let bracketSize = 1
  while (bracketSize < shuffledEntrants.length) {
    bracketSize *= 2
  }

  const byes = bracketSize - shuffledEntrants.length
  const immediateWinners: string[] = []
  const matches: BracketMatch[] = []

  // Créer les matchs du premier tour
  const firstRoundMatches: Array<{ teamAId: string; teamBId?: string }> = []
  
  // Ajouter tous les participants
  for (const entrant of shuffledEntrants) {
    firstRoundMatches.push({ teamAId: entrant.teamId })
  }

  // Distribuer les BYE (les derniers participants passent directement au tour suivant)
  for (let i = 0; i < byes; i++) {
    const lastMatch = firstRoundMatches.pop()
    if (lastMatch) {
      immediateWinners.push(lastMatch.teamAId)
    }
  }

  // Créer les vrais matchs (paires de participants)
  for (let i = 0; i < firstRoundMatches.length; i += 2) {
    const matchA = firstRoundMatches[i]
    const matchB = firstRoundMatches[i + 1]
    
    if (matchB) {
      // Créer un match entre les deux équipes
      const match = await prisma.match.create({
        data: {
          tournamentId,
          round: 1,
          teamAId: matchA.teamAId,
          teamBId: matchB.teamAId,
          status: 'PENDING'
        }
      })
      
      matches.push({
        id: match.id,
        round: match.round || 1,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        winnerTeamId: match.winnerTeamId || undefined,
        status: match.status as 'PENDING' | 'SCHEDULED' | 'COMPLETED',
        scheduledAt: match.scheduledAt || undefined
      })
    } else {
      // Participant seul (cas edge) - passe directement au tour suivant
      immediateWinners.push(matchA.teamAId)
    }
  }

  return { matches, immediateWinners }
}

/**
 * Calcule le nombre de tours nécessaires pour un bracket
 */
export function calculateRounds(participantCount: number): number {
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

  if (tournament.registrationDeadline && tournament.registrationDeadline < new Date()) {
    return { canStart: false, reason: 'Deadline d\'inscription dépassée', participantCount: 0 }
  }

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

  return { canStart: true, participantCount }
}
