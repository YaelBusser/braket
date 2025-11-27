# LeTournoi - Plateforme de gestion de tournois

Une plateforme moderne pour créer, organiser et participer à des tournois de jeux vidéo, sport et jeux de société.

## 🛠️ Stack technique

- **Frontend** : Next.js 15, React 19, TypeScript
- **Styling** : SASS, CSS Modules
- **Backend** : Next.js API Routes
- **Base de données** : MariaDB avec Prisma ORM
- **Authentification** : NextAuth.js

## 📦 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd letournoi
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de la base de données**
   - Créer un fichier `.env` à la racine du projet
   - Configurer la variable `DATABASE_URL`
   - Créer la base de données MariaDB

4. **Configuration des variables d'environnement**
   
   Créer un fichier `.env` à la racine du projet avec les variables suivantes :
   
   ```env
   # Base de données
   DATABASE_URL="mysql://user:password@localhost:3306/letournoi"
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=votre_secret_nextauth
   
   # Google OAuth (optionnel - voir CONFIGURATION_AUTH.md)
   GOOGLE_CLIENT_ID=votre_client_id_google
   GOOGLE_CLIENT_SECRET=votre_client_secret_google
   
   # Discord OAuth (optionnel - voir CONFIGURATION_AUTH.md)
   DISCORD_CLIENT_ID=votre_client_id_discord
   DISCORD_CLIENT_SECRET=votre_client_secret_discord
   ```
   
   **Générer NEXTAUTH_SECRET :**
   ```bash
   openssl rand -base64 32
   ```
   Ou en ligne : https://generate-secret.vercel.app/32


5. **Initialiser la base de données + seed des jeux**
```bash
# Générer le client Prisma
npm run db:generate

# Créer/appliquer les migrations (crée les tables dont `games`)
npm run db:push

# Peupler la table `games` avec les 10 jeux par défaut
npm run db:seed
```
Après ces commandes, la table `games` contient: CS 2, Valorant, Rocket League, League of Legends, Dota 2, Street Fighter 6, Fortnite, PUBG, Apex Legends, Call of Duty 7.

6. **Lancer le serveur de développement**
```bash
npm run dev
```

## 🔧 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run db:generate` - Générer le client Prisma
- `npm run db:push` - Appliquer les migrations
- `npm run db:migrate` - Créer une migration
- `npm run db:studio` - Interface Prisma Studio