/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const GAMES = [
  { id: 'cs-2', name: 'CS 2', slug: 'cs-2', imageUrl: '/images/games/cs-2.jpg' },
  { id: 'valorant', name: 'Valorant', slug: 'valorant', imageUrl: '/images/games/valorant.jpg' },
  { id: 'rocket-league', name: 'Rocket League', slug: 'rocket-league', imageUrl: '/images/games/rocket-league.jpg' },
  { id: 'league-of-legends', name: 'League of Legends', slug: 'league-of-legends', imageUrl: '/images/games/league-of-legends.jpg' },
  { id: 'dota-2', name: 'Dota 2', slug: 'dota-2', imageUrl: '/images/games/dota-2.jpg' },
  { id: 'street-fighter-6', name: 'Street Fighter 6', slug: 'street-fighter-6', imageUrl: '/images/games/street-fighter-6.png' },
  { id: 'fortnite', name: 'Fortnite', slug: 'fortnite', imageUrl: '/images/games/fortnite.jpg' },
  { id: 'pubg', name: 'pubg', slug: 'pubg', imageUrl: '/images/games/pubg.jpg' },
  { id: 'apex-legends', name: 'Apex Legends', slug: 'apex-legends', imageUrl: '/images/games/apex-legends.jpg' },
  { id: 'call-of-duty-7', name: 'Call of Duty 7', slug: 'call-of-duty-7', imageUrl: '/images/games/call-of-duty-7.jpg' }
]

async function main() {
  console.log('Seeding games...')
  for (const g of GAMES) {
    await prisma.game.upsert({
      where: { slug: g.slug },
      update: {
        name: g.name,
        imageUrl: g.imageUrl
      },
      create: {
        id: g.id,
        name: g.name,
        slug: g.slug,
        imageUrl: g.imageUrl
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


