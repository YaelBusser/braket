import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'VIDEO_GAMES'
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    // Définir les jeux populaires par catégorie
    const popularGamesByCategory = {
      VIDEO_GAMES: [
        'EA Sports FC 25', 'League of Legends', 'Mobile Legends: Bang Bang', 'Altered TCG',
        'Counter-Strike 2', 'eFootball 2024', 'Valorant', 'Fortnite', 'Apex Legends',
        'Call of Duty: Modern Warfare III', 'Minecraft', 'Grand Theft Auto V',
        'The Witcher 3: Wild Hunt', 'Cyberpunk 2077', 'Elden Ring', 'God of War',
        'The Last of Us Part II', 'Red Dead Redemption 2', 'Assassin\'s Creed Valhalla',
        'FIFA 24', 'NBA 2K24', 'Rocket League', 'Among Us', 'Fall Guys'
      ],
      SPORTS: [
        'FIFA 24', 'NBA 2K24', 'Tennis World Tour', 'Volleyball Nations', 'Handball 21',
        'Rugby 24', 'Madden NFL 24', 'NHL 24', 'MLB The Show 23', 'PGA Tour 2K23',
        'F1 23', 'MotoGP 23', 'WRC Generations', 'Dirt Rally 2.0', 'Forza Horizon 5',
        'Gran Turismo 7', 'Project CARS 3', 'Assetto Corsa Competizione', 'iRacing',
        'F1 Manager 2023', 'Football Manager 2024', 'Out of the Park Baseball 24'
      ],
      BOARD_GAMES: [
        'Monopoly Plus', 'Catan', 'Ticket to Ride', 'Wingspan', 'Azul', 'Splendor',
        'Pandemic', 'Carcassonne', 'Settlers of Catan', 'Codenames', 'Dixit',
        '7 Wonders', 'Terraforming Mars', 'Gloomhaven', 'Scythe', 'Spirit Island',
        'Wingspan', 'Everdell', 'Root', 'Brass: Birmingham', 'Great Western Trail',
        'Tzolk\'in: The Mayan Calendar', 'Agricola', 'Le Havre'
      ]
    }

    const gameNames = popularGamesByCategory[category as keyof typeof popularGamesByCategory] || popularGamesByCategory.VIDEO_GAMES
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const gamesForPage = gameNames.slice(startIndex, endIndex)

    const games = []
    
    for (const gameName of gamesForPage) {
      try {
        const res = await fetch(
          `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&page_size=1&key=${process.env.RAWG_API_KEY}`
        )
        
        if (res.ok) {
          const data = await res.json()
          if (data.results && data.results.length > 0) {
            games.push(data.results[0])
          }
        }
      } catch (error) {
        console.error(`Erreur pour ${gameName}:`, error)
        // Ajouter un jeu de fallback
        games.push({
          id: Math.random(),
          name: gameName,
          background_image: null,
          released: null,
          rating: 0,
          genres: [],
          description_raw: null
        })
      }
    }

    return NextResponse.json({
      games,
      hasMore: endIndex < gameNames.length,
      total: gameNames.length
    })

  } catch (error) {
    console.error('Erreur récupération jeux populaires:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
