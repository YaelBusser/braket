/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const GAMES = [
  { 
    id: 'cs-2', 
    name: 'CS 2', 
    slug: 'cs-2', 
    imageUrl: '/images/games/cs-2.jpg', 
    logoUrl: '/images/gamesLogo/cs2.webp', 
    posterUrl: '/images/gamesPoster/cs2.webp' 
  },
  { 
    id: 'valorant', 
    name: 'Valorant', 
    slug: 'valorant', 
    imageUrl: '/images/games/valorant.jpg', 
    logoUrl: '/images/gamesLogo/valorant.png', 
    posterUrl: '/images/gamesPoster/valorant.webp' 
  },
  { 
    id: 'rocket-league', 
    name: 'Rocket League', 
    slug: 'rocket-league', 
    imageUrl: '/images/games/rocket-league.jpg', 
    logoUrl: '/images/gamesLogo/rocket-league.webp', 
    posterUrl: '/images/gamesPoster/rocket-league.webp' 
  },
  { 
    id: 'league-of-legends', 
    name: 'League of Legends', 
    slug: 'league-of-legends', 
    imageUrl: '/images/games/league-of-legends.jpg', 
    logoUrl: '/images/gamesLogo/league-of-legends.png', 
    posterUrl: '/images/gamesPoster/league-of-legends.webp' 
  },
  { 
    id: 'dota-2', 
    name: 'Dota 2', 
    slug: 'dota-2', 
    imageUrl: '/images/games/dota-2.jpg', 
    logoUrl: '/images/gamesLogo/dota-2.png', 
    posterUrl: '/images/gamesPoster/dota-2.webp' 
  },
  { 
    id: 'street-fighter-6', 
    name: 'Street Fighter 6', 
    slug: 'street-fighter-6', 
    imageUrl: '/images/games/street-fighter-6.png', 
    logoUrl: '/images/gamesLogo/street-fighter-6.png', 
    posterUrl: '/images/gamesPoster/street-fighter-6.webp' 
  },
  { 
    id: 'fortnite', 
    name: 'Fortnite', 
    slug: 'fortnite', 
    imageUrl: '/images/games/fortnite.jpg', 
    logoUrl: '/images/gamesLogo/fortnite.png', 
    posterUrl: '/images/gamesPoster/fortnite.webp' 
  },
  { 
    id: 'pubg', 
    name: 'pubg', 
    slug: 'pubg', 
    imageUrl: '/images/games/pubg.jpg', 
    logoUrl: '/images/gamesLogo/pubg.png', 
    posterUrl: '/images/gamesPoster/pubg.webp' 
  },
  { 
    id: 'apex-legends', 
    name: 'Apex Legends', 
    slug: 'apex-legends', 
    imageUrl: '/images/games/apex-legends.jpg', 
    logoUrl: '/images/gamesLogo/apex.png', 
    posterUrl: '/images/gamesPoster/apex-legends.webp' 
  },
  { 
    id: 'call-of-duty-7', 
    name: 'Call of Duty 7', 
    slug: 'call-of-duty-7', 
    imageUrl: '/images/games/call-of-duty-7.jpg', 
    logoUrl: '/images/gamesLogo/call-of-duty-7.png', 
    posterUrl: '/images/gamesPoster/call-of-duty-bo-7.webp' 
  }
]

async function main() {
  console.log('Seeding games...')
  for (const g of GAMES) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        imageUrl: g.imageUrl,
        logoUrl: g.logoUrl,
        posterUrl: g.posterUrl
      },
      create: {
        id: g.id,
        name: g.name,
        slug: g.slug,
        imageUrl: g.imageUrl,
        logoUrl: g.logoUrl,
        posterUrl: g.posterUrl
      }
    })
  }
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


