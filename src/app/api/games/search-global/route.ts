import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('page_size') || '10')
    
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
      'gta': 'Grand Theft Auto',
      'fifa': 'FIFA',
      'lol': 'League of Legends',
      'cs': 'Counter-Strike',
      'valorant': 'Valorant'
    }
    
    if (gameMappings[searchQuery.toLowerCase()]) {
      searchQuery = gameMappings[searchQuery.toLowerCase()]
    }
    
    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(searchQuery)}&page=${page}&page_size=${pageSize}`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      return NextResponse.json({ games: [], hasMore: false, message: 'Erreur RAWG' }, { status: 502 })
    }
    
    const data = await res.json()
    const games = (data?.results || []).map((g: any) => ({ 
      id: g.id, 
      name: g.name, 
      background_image: g.background_image,
      released: g.released,
      description_raw: g.description_raw,
      genres: g.genres || [],
      platforms: g.platforms || [],
      metacritic: g.metacritic,
      slug: g.slug
    }))
    
    const hasMore = data.next ? true : false
    
    return NextResponse.json({ games, hasMore, total: data.count || 0 })
  } catch (error) {
    console.error('Global games search error:', error)
    return NextResponse.json({ games: [], hasMore: false }, { status: 500 })
  }
}
