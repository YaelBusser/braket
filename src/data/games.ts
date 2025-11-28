export type GameInfo = {
  id: string
  name: string
  slug: string
  image: string
}

export const GAMES: GameInfo[] = [
  { id: 'cs-2', name: 'CS 2', slug: 'cs-2', image: '/images/gamesPoster/cs2.webp' },
  { id: 'valorant', name: 'Valorant', slug: 'valorant', image: '/images/gamesPoster/valorant.webp' },
  { id: 'rocket-league', name: 'Rocket League', slug: 'rocket-league', image: '/images/gamesPoster/rocket-league.webp' },
  { id: 'league-of-legends', name: 'League of Legends', slug: 'league-of-legends', image: '/images/gamesPoster/league-of-legends.webp' },
  { id: 'dota-2', name: 'Dota 2', slug: 'dota-2', image: '/images/gamesPoster/dota-2.webp' },
  { id: 'street-fighter-6', name: 'Street Fighter 6', slug: 'street-fighter-6', image: '/images/gamesPoster/street-fighter-6.webp' },
  { id: 'fortnite', name: 'Fortnite', slug: 'fortnite', image: '/images/gamesPoster/fortnite.webp' },
  { id: 'pubg', name: 'pubg', slug: 'pubg', image: '/images/gamesPoster/pubg.webp' },
  { id: 'apex-legends', name: 'Apex Legends', slug: 'apex-legends', image: '/images/gamesPoster/apex-legends.webp' },
  { id: 'call-of-duty-7', name: 'Call of Duty 7', slug: 'call-of-duty-7', image: '/images/gamesPoster/call-of-duty-bo-7.webp' },
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


