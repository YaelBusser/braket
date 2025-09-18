# Configuration LeTournoi

## 🔧 Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/letournoi"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# Google OAuth (optionnel pour le développement)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🚀 Démarrage rapide

1. **Configurer la base de données**
   ```bash
   # Créer la base de données MariaDB
   mysql -u root -p
   CREATE DATABASE letournoi;
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Prisma**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Lancer l'application**
   ```bash
   npm run dev
   ```

## 🔍 Résolution des problèmes

### Erreur 500 sur l'API
- Vérifiez que la base de données est accessible
- Vérifiez que les tables Prisma existent
- Regardez les logs du serveur pour plus de détails

### Erreur NextAuth
- Vérifiez que `NEXTAUTH_SECRET` est défini
- Vérifiez que `NEXTAUTH_URL` correspond à votre URL locale

### Erreur Prisma
- Supprimez `node_modules/.prisma` et relancez `npm run db:generate`
- Vérifiez que `DATABASE_URL` est correcte

## 📝 Notes de développement

- Google OAuth est temporairement désactivé pour simplifier le développement
- L'adapter Prisma est temporairement désactivé pour éviter les erreurs
- Les sessions utilisent JWT en mode développement

## 🎯 Prochaines étapes

1. Configurer Google OAuth pour la production
2. Réactiver l'adapter Prisma
3. Ajouter la validation des variables d'environnement
4. Configurer les webhooks Stripe
