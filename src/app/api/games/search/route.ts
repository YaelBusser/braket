import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] })
    }

    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) {
      return NextResponse.json({ results: [], message: 'RAWG_API_KEY manquante' }, { status: 500 })
    }

    const url = `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=10`
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      return NextResponse.json({ results: [], message: 'Erreur RAWG' }, { status: 502 })
    }
    const data = await res.json()
    const results = (data?.results || []).map((g: any) => ({ id: g.id, name: g.name, background_image: g.background_image }))
    return NextResponse.json({ results })
  } catch (error) {
    console.error('Games search error:', error)
    return NextResponse.json({ results: [] }, { status: 500 })
  }
}


