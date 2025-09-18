# Guide SASS - LeTournoi

## 🎨 Structure des modules SASS

Le projet utilise maintenant la syntaxe SASS moderne avec `@use` et les modules SASS.

### 📁 Organisation des fichiers

```
src/styles/
├── _variables.module.scss    # Variables globales (couleurs, typographie, espacements)
├── globals.scss              # Styles globaux et utilitaires
└── components/               # Composants SASS modulaires
    ├── _buttons.scss         # Styles des boutons
    ├── _forms.scss           # Styles des formulaires
    ├── _cards.scss           # Styles des cartes
    └── index.scss            # Import de tous les composants
```

### 🔧 Syntaxe @use

#### Import des variables
```scss
@use '../variables.module' as vars;

.my-class {
  color: vars.$primary;
  padding: vars.$spacing-4;
  font-size: vars.$font-size-lg;
}
```

#### Import des composants
```scss
@use 'buttons';
@use 'forms';
@use 'cards';
```

### 📝 Règles de nommage

#### Variables
- **Couleurs** : `$primary`, `$secondary`, `$text-primary`
- **Espacements** : `$spacing-4`, `$spacing-6`, `$spacing-8`
- **Typographie** : `$font-size-lg`, `$font-weight-bold`
- **Rayons** : `$radius-lg`, `$radius-xl`
- **Ombres** : `$shadow-sm`, `$shadow-md`, `$shadow-lg`

#### Classes CSS
- **Boutons** : `.btn`, `.btn-primary`, `.btn-lg`
- **Formulaires** : `.form-input`, `.form-label`, `.form-group`
- **Cartes** : `.card`, `.card-header`, `.card-body`

### 🎯 Utilisation dans les composants

#### Page component
```tsx
import styles from './page.module.scss'

export default function MyPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mon titre</h1>
    </div>
  )
}
```

#### Fichier SASS correspondant
```scss
@use '../../styles/variables.module' as vars;

.container {
  padding: vars.$spacing-8;
  background: vars.$bg-primary;
}

.title {
  font-size: vars.$font-size-2xl;
  color: vars.$text-primary;
  margin-bottom: vars.$spacing-4;
}
```

### 🚀 Avantages de cette approche

1. **Modularité** : Chaque composant a ses propres styles
2. **Réutilisabilité** : Variables et composants partagés
3. **Performance** : CSS optimisé et tree-shaking
4. **Maintenabilité** : Code organisé et facile à maintenir
5. **Type Safety** : IntelliSense pour les classes CSS

### 📋 Bonnes pratiques

1. **Toujours utiliser @use** au lieu de @import
2. **Préfixer les variables** avec le namespace (ex: `vars.$primary`)
3. **Organiser les styles** par composant
4. **Utiliser les variables** plutôt que les valeurs hardcodées
5. **Nommer les classes** de manière descriptive

### 🔍 Exemples d'utilisation

#### Bouton personnalisé
```scss
@use '../variables.module' as vars;

.custom-button {
  @extend .btn;
  @extend .btn-primary;
  
  background: linear-gradient(135deg, vars.$primary 0%, vars.$accent 100%);
  border-radius: vars.$radius-full;
  padding: vars.$spacing-4 vars.$spacing-8;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: vars.$shadow-lg;
  }
}
```

#### Formulaire responsive
```scss
@use '../variables.module' as vars;

.form-container {
  display: grid;
  gap: vars.$spacing-6;
  grid-template-columns: 1fr;
  
  @media (min-width: vars.$breakpoint-md) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (min-width: vars.$breakpoint-lg) {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
```

### 🛠️ Commandes utiles

```bash
# Compiler SASS en mode watch
npm run dev

# Build de production
npm run build

# Vérifier les erreurs SASS
npm run lint
```

Cette structure SASS moderne garantit un code maintenable, performant et évolutif pour votre projet LeTournoi ! 🎉
