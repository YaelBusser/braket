export const config = {
  database: {
    url: process.env.DATABASE_URL || 'mysql://username:password@localhost:3306/letournoi',
  },
  nextauth: {
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-here',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
}
