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

