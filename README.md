# LeTournoi - Plateforme de gestion de tournois

Une plateforme moderne pour créer, organiser et participer à des tournois de jeux vidéo, sport et jeux de société.

## 🚀 Fonctionnalités

- **Authentification complète** : Inscription/connexion avec email et Google OAuth
- **Gestion des profils** : Profils utilisateurs avec types (particulier, association, entreprise)
- **Design moderne** : Interface utilisateur responsive avec SASS et CSS modules
- **Base de données** : Prisma ORM avec MariaDB
- **Sécurité** : NextAuth.js avec JWT et sessions sécurisées

## 🛠️ Stack technique

- **Frontend** : Next.js 15, React 19, TypeScript
- **Styling** : SASS, CSS Modules
- **Backend** : Next.js API Routes
- **Base de données** : MariaDB avec Prisma ORM
- **Authentification** : NextAuth.js
- **Déploiement** : Vercel (recommandé)

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
   - Créer un fichier `.env.local` à la racine du projet
   - Configurer la variable `DATABASE_URL` (voir SETUP.md)
   - Créer la base de données MariaDB

4. **Configuration NextAuth.js**
   - Ajouter les variables d'environnement pour Google OAuth
   - Configurer `NEXTAUTH_SECRET`

5. **Initialiser la base de données**
```bash
npm run db:push
```

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

## 📁 Structure du projet

```
src/
├── app/                    # Pages Next.js
│   ├── api/               # API Routes
│   ├── login/             # Page de connexion
│   ├── register/          # Page d'inscription
│   └── profile/           # Page profil
├── components/            # Composants React
├── lib/                   # Utilitaires et configuration
├── styles/                # Styles SASS
│   ├── components/        # Styles des composants
│   ├── _variables.scss    # Variables SASS
│   └── globals.scss       # Styles globaux
└── prisma/                # Schéma Prisma
```

## 🎨 Design System

Le projet utilise un design system moderne avec :
- **Variables SASS** : Couleurs, typographie, espacements
- **Composants réutilisables** : Boutons, formulaires, cartes
- **Responsive design** : Mobile-first approach
- **Accessibilité** : Focus states, ARIA labels

## 🔐 Authentification

- **Email/Password** : Inscription et connexion classiques
- **Google OAuth** : Connexion via Google
- **Sessions JWT** : Gestion sécurisée des sessions
- **Protection des routes** : Middleware d'authentification

## 📝 Prochaines étapes

- [ ] Gestion des tournois
- [ ] Système de paiements Stripe
- [ ] Notifications email
- [ ] Interface d'administration
- [ ] API mobile

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
