# Configuration CSR (Client Side Rendering) - LeTournoi

## 🎯 Configuration actuelle

### Pages en SSR (Server Side Rendering)
- **Page d'accueil** (`/`) : Rendu côté serveur pour le SEO et les performances

### Pages en CSR (Client Side Rendering)
- **Connexion** (`/login`) : Rendu côté client
- **Inscription** (`/register`) : Rendu côté client  
- **Profil** (`/profile`) : Rendu côté client

## 🔧 Composants créés

### ClientPageWrapper
Composant wrapper qui :
- Détecte si le code s'exécute côté client
- Affiche un spinner de chargement pendant l'hydratation
- Évite les erreurs d'hydratation Next.js

```tsx
<ClientPageWrapper>
  <YourPageComponent />
</ClientPageWrapper>
```

### LoadingSpinner
Composant de chargement avec :
- 3 tailles : `sm`, `md`, `lg`
- Texte personnalisable
- Animation CSS fluide

```tsx
<LoadingSpinner size="md" text="Chargement..." />
```

### Navigation
Barre de navigation responsive avec :
- Logo LeTournoi
- Menu utilisateur (connecté/déconnecté)
- Liens vers les pages principales
- Design sticky

## 📁 Structure des pages

```
src/app/
├── page.tsx              # SSR - Page d'accueil
├── login/
│   └── page.tsx          # CSR - Connexion
├── register/
│   └── page.tsx          # CSR - Inscription
└── profile/
    └── page.tsx          # CSR - Profil
```

## 🚀 Avantages du CSR

### Performance
- **Chargement initial rapide** : Seule la page d'accueil est rendue côté serveur
- **Navigation fluide** : Les autres pages se chargent instantanément
- **Cache navigateur** : Les composants sont mis en cache

### Développement
- **État local** : Gestion d'état simplifiée avec useState/useEffect
- **Interactions** : Pas de problème d'hydratation
- **API calls** : Appels API côté client plus simples

### SEO
- **Page d'accueil optimisée** : Contenu statique pour les moteurs de recherche
- **Méta-données** : Configuration Next.js pour le SEO

## ⚙️ Configuration Next.js

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Configuration des rewrites pour les pages client
}
```

## 🔍 Détection côté client

```tsx
// Dans ClientPageWrapper
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

if (!isClient) {
  return <LoadingSpinner />
}
```

## 📱 Responsive Design

Tous les composants s'adaptent automatiquement :
- **Mobile** : Navigation compacte, boutons empilés
- **Tablet** : Layout intermédiaire
- **Desktop** : Layout complet avec sidebar

## 🎨 Styles

- **Modules SASS** : Styles isolés par composant
- **Variables centralisées** : Design system cohérent
- **Responsive** : Mobile-first approach
- **Animations** : Transitions fluides

## 🚀 Utilisation

### Ajouter une nouvelle page CSR
```tsx
'use client'

import ClientPageWrapper from '../../components/ClientPageWrapper'

function MyPage() {
  // Votre logique de page
  return <div>Ma page</div>
}

export default function Page() {
  return (
    <ClientPageWrapper>
      <MyPage />
    </ClientPageWrapper>
  )
}
```

### Ajouter une page SSR
```tsx
// Pas de 'use client'
export default function MyPage() {
  // Votre logique de page
  return <div>Ma page</div>
}
```

## 🔧 Dépannage

### Erreur d'hydratation
- Vérifiez que `'use client'` est présent
- Utilisez `ClientPageWrapper` pour les pages dynamiques

### Performance lente
- Vérifiez que les pages lourdes sont en CSR
- Optimisez les imports et les composants

### SEO manquant
- Gardez le contenu important en SSR
- Utilisez les méta-données Next.js

Cette configuration offre le meilleur des deux mondes : performance et SEO ! 🎉
