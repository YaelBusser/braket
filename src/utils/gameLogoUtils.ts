/**
 * Mappe les noms de jeux aux fichiers de logos dans le dossier gamesLogo
 */
export function getGameLogoPath(gameName: string | null | undefined): string | null {
  if (!gameName) return null

  const normalizedName = gameName.toLowerCase().trim()

  // Mapping des noms de jeux aux fichiers de logos
  const gameLogoMap: { [key: string]: string } = {
    // Counter-Strike / CS 2
    'counter-strike 2': 'cs2.webp',
    'counter-strike2': 'cs2.webp',
    'cs 2': 'cs2.webp',
    'cs2': 'cs2.webp',
    'counter-strike': 'cs2.webp',
    'cs': 'cs2.webp',
    
    // Valorant
    'valorant': 'valorant.png',
    
    // Rocket League
    'rocket league': 'rocket-league.webp',
    'rocket-league': 'rocket-league.webp',
    'rl': 'rocket-league.webp',
    
    // League of Legends
    'league of legends': 'league-of-legends.png',
    'lol': 'league-of-legends.png',
    'league-of-legends': 'league-of-legends.png',
    
    // Dota 2
    'dota 2': 'dota-2.png',
    'dota2': 'dota-2.png',
    'dota': 'dota-2.png',
    'dota-2': 'dota-2.png',
    
    // Street Fighter 6
    'street fighter 6': 'street-fighter-6.png',
    'street fighter': 'street-fighter-6.png',
    'street-fighter-6': 'street-fighter-6.png',
    'sf6': 'street-fighter-6.png',
    
    // Fortnite
    'fortnite': 'fortnite.png',
    
    // PUBG
    'pubg': 'pubg.png',
    'playerunknown\'s battlegrounds': 'pubg.png',
    'battlegrounds': 'pubg.png',
    
    // Apex Legends
    'apex legends': 'apex.png',
    'apex': 'apex.png',
    'apex-legends': 'apex.png',
    
    // Call of Duty
    'call of duty': 'call-of-duty-7.png',
    'call of duty 7': 'call-of-duty-7.png',
    'cod': 'call-of-duty-7.png',
    'call-of-duty': 'call-of-duty-7.png',
    'call-of-duty-7': 'call-of-duty-7.png',
  }

  // Recherche exacte d'abord
  if (gameLogoMap[normalizedName]) {
    return `/images/gamesLogo/${gameLogoMap[normalizedName]}`
  }

  // Recherche partielle (contient)
  for (const [key, value] of Object.entries(gameLogoMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return `/images/gamesLogo/${value}`
    }
  }

  return null
}

/**
 * Mappe les noms de jeux aux fichiers d'affiches dans le dossier gamesPoster
 */
export function getGamePosterPath(gameName: string | null | undefined): string | null {
  if (!gameName) return null

  const normalizedName = gameName.toLowerCase().trim()

  // Mapping des noms de jeux aux fichiers d'affiches
  const gamePosterMap: { [key: string]: string } = {
    // Counter-Strike / CS 2
    'counter-strike 2': 'cs2.webp',
    'counter-strike2': 'cs2.webp',
    'cs 2': 'cs2.webp',
    'cs2': 'cs2.webp',
    'counter-strike': 'cs2.webp',
    'cs': 'cs2.webp',
    
    // Valorant
    'valorant': 'valorant.webp',
    
    // Rocket League
    'rocket league': 'rocket-league.webp',
    'rocket-league': 'rocket-league.webp',
    'rl': 'rocket-league.webp',
    
    // League of Legends
    'league of legends': 'league-of-legends.webp',
    'lol': 'league-of-legends.webp',
    'league-of-legends': 'league-of-legends.webp',
    
    // Dota 2
    'dota 2': 'dota-2.webp',
    'dota2': 'dota-2.webp',
    'dota': 'dota-2.webp',
    'dota-2': 'dota-2.webp',
    
    // Street Fighter 6
    'street fighter 6': 'street-fighter-6.webp',
    'street fighter': 'street-fighter-6.webp',
    'street-fighter-6': 'street-fighter-6.webp',
    'sf6': 'street-fighter-6.webp',
    
    // Fortnite
    'fortnite': 'fortnite.webp',
    
    // PUBG
    'pubg': 'pubg.webp',
    'playerunknown\'s battlegrounds': 'pubg.webp',
    'battlegrounds': 'pubg.webp',
    
    // Apex Legends
    'apex legends': 'apex-legends.webp',
    'apex': 'apex-legends.webp',
    'apex-legends': 'apex-legends.webp',
    
    // Call of Duty
    'call of duty': 'call-of-duty-bo-7.webp',
    'call of duty 7': 'call-of-duty-bo-7.webp',
    'call of duty bo 7': 'call-of-duty-bo-7.webp',
    'cod': 'call-of-duty-bo-7.webp',
    'call-of-duty': 'call-of-duty-bo-7.webp',
    'call-of-duty-7': 'call-of-duty-bo-7.webp',
    'call-of-duty-bo-7': 'call-of-duty-bo-7.webp',
  }

  // Recherche exacte d'abord
  if (gamePosterMap[normalizedName]) {
    return `/images/gamesPoster/${gamePosterMap[normalizedName]}`
  }

  // Recherche partielle (contient)
  for (const [key, value] of Object.entries(gamePosterMap)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return `/images/gamesPoster/${value}`
    }
  }

  return null
}

