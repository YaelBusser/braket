# Configuration du projet LeTournoi

## Configuration de la base de données

1. Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/letournoi"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

2. Remplacez les valeurs par vos propres configurations :
   - `username` et `password` : vos identifiants MariaDB
   - `your-secret-key-here` : une clé secrète aléatoire pour NextAuth.js
   - `your-google-client-id` et `your-google-client-secret` : vos identifiants Google OAuth

## Commandes utiles

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations à la base de données
npm run db:push

# Créer une nouvelle migration
npm run db:migrate

# Ouvrir Prisma Studio (interface graphique)
npm run db:studio
```

## Structure de la base de données

Le modèle `User` a été créé avec les champs suivants :
- `id` : Identifiant unique (CUID)
- `email` : Email unique
- `passwordHash` : Hash du mot de passe (nullable pour Google OAuth)
- `pseudo` : Nom d'utilisateur
- `type` : Type de compte (particulier, association, entreprise)
- `avatarUrl` : URL de l'avatar (optionnel)
- `createdAt` : Date de création
- `updatedAt` : Date de dernière modification
