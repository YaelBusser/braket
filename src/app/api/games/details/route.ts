import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameName = searchParams.get('name')

    if (!gameName) {
      return NextResponse.json({ message: 'Nom du jeu requis' }, { status: 400 })
    }

    // Rechercher le jeu par nom exact
    const response = await fetch(
      `https://api.rawg.io/api/games?search=${encodeURIComponent(gameName)}&page_size=1&key=${process.env.RAWG_API_KEY}`
    )

    if (!response.ok) {
      throw new Error('Erreur API RAWG')
    }

    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      const game = data.results[0]
      return NextResponse.json({
        id: game.id,
        name: game.name,
        background_image: game.background_image,
        released: game.released,
        rating: game.rating,
        rating_top: game.rating_top,
        genres: game.genres,
        platforms: game.platforms,
        description_raw: game.description_raw,
        metacritic: game.metacritic,
        playtime: game.playtime,
        esrb_rating: game.esrb_rating
      })
    }

    return NextResponse.json({ message: 'Jeu non trouvé' }, { status: 404 })
  } catch (error) {
    console.error('Erreur récupération détails jeu:', error)
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 })
  }
}
