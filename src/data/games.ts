export type GameInfo = {
  id: string
  name: string
  slug: string
  image: string
}

export const GAMES: GameInfo[] = [
  { id: 'cs-2', name: 'CS 2', slug: 'cs-2', image: '/images/games/cs-2.jpg' },
  { id: 'valorant', name: 'Valorant', slug: 'valorant', image: '/images/games/valorant.jpg' },
  { id: 'rocket-league', name: 'Rocket League', slug: 'rocket-league', image: '/images/games/rocket-league.jpg' },
  { id: 'league-of-legends', name: 'League of Legends', slug: 'league-of-legends', image: '/images/games/league-of-legends.jpg' },
  { id: 'dota-2', name: 'Dota 2', slug: 'dota-2', image: '/images/games/dota-2.jpg' },
  { id: 'street-fighter-6', name: 'Street Fighter 6', slug: 'street-fighter-6', image: '/images/games/street-fighter-6.png' },
  { id: 'fortnite', name: 'Fortnite', slug: 'fortnite', image: '/images/games/fortnite.jpg' },
  { id: 'pubg', name: 'pubg', slug: 'pubg', image: '/images/games/pubg.jpg' },
  { id: 'apex-legends', name: 'Apex Legends', slug: 'apex-legends', image: '/images/games/apex-legends.jpg' },
  { id: 'call-of-duty-7', name: 'Call of Duty 7', slug: 'call-of-duty-7', image: '/images/games/call-of-duty-7.jpg' },
]

export function findGameByName(name: string): GameInfo | undefined {
  const lower = name.trim().toLowerCase()
  return GAMES.find(g => g.name.toLowerCase() === lower || g.slug === lower)
}

export function filterGames(query: string): GameInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return GAMES
  return GAMES.filter(g => g.name.toLowerCase().includes(q) || g.slug.includes(q))
}


