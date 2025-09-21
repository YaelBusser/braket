import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '20')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ games: [], hasMore: false })
    }

    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ games: [], hasMore: false, message: 'RAWG_API_KEY manquante' }, { status: 500 })
    }

    // Recherche plus flexible - essayer plusieurs variantes
    let searchQuery = query.trim()
    
    // Mappings pour les jeux populaires
    const gameMappings: { [key: string]: string } = {
      'EA FC 25': 'EA Sports FC 25',
      'Counter-Strike 2': 'Counter-Strike 2',
      'eFootball': 'eFootball 2024',
      'VALORANT': 'Valorant',
      'Mobile Legends: Bang Bang': 'Mobile Legends',
      'Free Fire': 'Garena Free Fire',
      'PUBG Mobile': 'PUBG Mobile',
      'Grand theft': 'Grand Theft Auto',
      'GTA': 'Grand Theft Auto',
      'Grand theft auto': 'Grand Theft Auto',
      'GTA V': 'Grand Theft Auto V',
      'GTA 5': 'Grand Theft Auto V',
      'League of Legends': 'League of Legends',
      'LOL': 'League of Legends',
      'FIFA': 'FIFA 24',
      'NBA': 'NBA 2K24',
      'Call of Duty': 'Call of Duty: Modern Warfare III',
      'COD': 'Call of Duty: Modern Warfare III',
      'Minecraft': 'Minecraft',
      'Fortnite': 'Fortnite',
      'Apex Legends': 'Apex Legends',
      'Rocket League': 'Rocket League'
    }
    
    let games: any[] = []
    let hasMore = false
    let total = 0
    
    // Essayer d'abord avec le mapping
    if (gameMappings[searchQuery]) {
      searchQuery = gameMappings[searchQuery]
    }
    
    // Première tentative avec la requête exacte
    let url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(searchQuery)}&page=${page}&page_size=${pageSize}`
    let res = await fetch(url, { next: { revalidate: 60 } })
    
    if (res.ok) {
      const data = await res.json()
      games = (data?.results || []).map((g: any) => ({ 
        id: g.id, 
        name: g.name, 
        background_image: g.background_image,
        released: g.released,
        description_raw: g.description_raw,
        genres: g.genres || [],
        platforms: g.platforms || [],
        metacritic: g.metacritic,
        rating: g.rating,
        rating_top: g.rating_top
      }))
      hasMore = data.next ? true : false
      total = data.count || 0
    }
    
    // Si pas de résultats et que la requête contient des mots partiels, essayer une recherche plus large
    if (games.length === 0 && searchQuery.includes(' ')) {
      const words = searchQuery.split(' ').filter(word => word.length > 2)
      if (words.length > 0) {
        const broaderQuery = words.join(' ')
        url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(broaderQuery)}&page=${page}&page_size=${pageSize}`
        res = await fetch(url, { next: { revalidate: 60 } })
        
        if (res.ok) {
          const data = await res.json()
          games = (data?.results || []).map((g: any) => ({ 
            id: g.id, 
            name: g.name, 
            background_image: g.background_image,
            released: g.released,
            description_raw: g.description_raw,
            genres: g.genres || [],
            platforms: g.platforms || [],
            metacritic: g.metacritic,
            rating: g.rating,
            rating_top: g.rating_top
          }))
          hasMore = data.next ? true : false
          total = data.count || 0
        }
      }
    }
    
    if (!res.ok) {
      return NextResponse.json({ games: [], hasMore: false, message: 'Erreur RAWG' }, { status: 502 })
    }
    
    return NextResponse.json({ games, hasMore, total })
  } catch (error) {
    console.error('Games search error:', error)
    return NextResponse.json({ games: [], hasMore: false }, { status: 500 })
  }
}


