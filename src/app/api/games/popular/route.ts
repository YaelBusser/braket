import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')

    // Définir les jeux populaires
    const popularGames = [
        'EA Sports FC 25', 'League of Legends', 'Mobile Legends: Bang Bang', 'Altered TCG',
        'Counter-Strike 2', 'eFootball 2024', 'Valorant', 'Fortnite', 'Apex Legends',
        'Call of Duty: Modern Warfare III', 'Minecraft', 'Grand Theft Auto V',
        'The Witcher 3: Wild Hunt', 'Cyberpunk 2077', 'Elden Ring', 'God of War',
        'The Last of Us Part II', 'Red Dead Redemption 2', 'Assassin\'s Creed Valhalla',
        'FIFA 24', 'NBA 2K24', 'Rocket League', 'Among Us', 'Fall Guys'
    ]
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const gamesForPage = popularGames.slice(startIndex, endIndex)

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
      hasMore: endIndex < popularGames.length,
      total: popularGames.length
    })

  } catch (error) {
    console.error('Erreur récupération jeux populaires:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
