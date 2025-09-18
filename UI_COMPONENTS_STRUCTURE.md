# Structure des Composants UI - LeTournoi

## 📁 Organisation des dossiers

Chaque composant UI a maintenant son propre dossier avec des fichiers `index.tsx` et `index.module.scss` :

```
src/components/ui/
├── Button/
│   ├── index.tsx
│   └── index.module.scss
├── Input/
│   ├── index.tsx
│   └── index.module.scss
├── Card/
│   ├── index.tsx
│   └── index.module.scss
├── Select/
│   ├── index.tsx
│   └── index.module.scss
├── LoadingSpinner/
│   ├── index.tsx
│   └── index.module.scss
└── index.ts
```

## 🎯 Avantages de cette structure

### Organisation
- **Un composant = un dossier** : Structure claire et modulaire
- **Fichiers index** : Import simplifié avec `import { Button } from './Button'`
- **Styles isolés** : Chaque composant a ses propres styles
- **Maintenance facile** : Modifications localisées dans un seul dossier

### Développement
- **IntelliSense** : Meilleure autocomplétion dans l'IDE
- **Refactoring** : Renommage et déplacement simplifiés
- **Tests** : Tests unitaires plus faciles à organiser
- **Documentation** : Chaque composant peut avoir sa propre documentation

## 🔧 Utilisation

### Import des composants
```tsx
// Import simple
import { Button, Input, Card } from '../components/ui'

// Import spécifique
import Button from '../components/ui/Button'
import { CardHeader, CardBody } from '../components/ui/Card'
```

### Structure d'un composant
```tsx
// Button/index.tsx
import React from 'react'
import styles from './index.module.scss'

interface ButtonProps {
  // Props du composant
}

export default function Button({ ...props }: ButtonProps) {
  return (
    <button className={styles.btn}>
      {children}
    </button>
  )
}
```

```scss
// Button/index.module.scss
@use '../../../styles/variables.module' as vars;

.btn {
  // Styles du composant
}
```

## 📋 Composants disponibles

### Button
- **Variantes** : primary, secondary, outline, ghost, success, warning, error
- **Tailles** : sm, md, lg, xl
- **États** : loading, disabled
- **Props** : Toutes les props HTML de button

### Input
- **Types** : Tous les types HTML (text, email, password, etc.)
- **Validation** : error, success, help
- **Accessibilité** : label, required
- **Props** : Toutes les props HTML de input

### Card
- **Variantes** : default, elevated, flat, outlined
- **Tailles** : sm, md, lg
- **Sections** : CardHeader, CardBody, CardFooter
- **Interactions** : hover effects, animations

### Select
- **Options** : Array d'objets { value, label }
- **Validation** : error, success, help
- **Accessibilité** : label, required, placeholder
- **Props** : Toutes les props HTML de select

### LoadingSpinner
- **Tailles** : sm, md, lg
- **Texte** : Personnalisable
- **Animation** : CSS keyframes
- **Usage** : États de chargement

## 🎨 Styles

### Variables SASS
Tous les composants utilisent les variables centralisées :
```scss
@use '../../../styles/variables.module' as vars;

.myClass {
  color: vars.$primary;
  padding: vars.$spacing-4;
  border-radius: vars.$radius-lg;
}
```

### Classes CSS
Chaque composant a ses propres classes :
```scss
.btn { /* Styles de base */ }
.btn-primary { /* Variante primaire */ }
.btn-lg { /* Taille large */ }
.btn-loading { /* État de chargement */ }
```

## 🚀 Ajouter un nouveau composant

1. **Créer le dossier** :
```bash
mkdir src/components/ui/MyComponent
```

2. **Créer les fichiers** :
```tsx
// MyComponent/index.tsx
import React from 'react'
import styles from './index.module.scss'

interface MyComponentProps {
  // Props
}

export default function MyComponent({ ...props }: MyComponentProps) {
  return <div className={styles.container}>Content</div>
}
```

```scss
// MyComponent/index.module.scss
@use '../../../styles/variables.module' as vars;

.container {
  // Styles
}
```

3. **Exporter dans l'index** :
```tsx
// ui/index.ts
export { default as MyComponent } from './MyComponent'
```

## 📝 Bonnes pratiques

### Nommage
- **Dossiers** : PascalCase (ex: `Button`, `InputField`)
- **Fichiers** : `index.tsx` et `index.module.scss`
- **Classes CSS** : kebab-case (ex: `btn-primary`, `form-group`)

### Structure
- **Un composant par dossier** : Ne pas mélanger plusieurs composants
- **Fichiers index** : Toujours utiliser `index.tsx` pour l'export principal
- **Styles isolés** : Chaque composant a ses propres styles

### Props
- **TypeScript strict** : Toujours typer les props
- **Props HTML** : Étendre les props HTML natives
- **Props optionnelles** : Utiliser des valeurs par défaut sensées

### Styles
- **Variables SASS** : Utiliser les variables centralisées
- **Responsive** : Mobile-first approach
- **Accessibilité** : Focus states, contrastes

Cette structure garantit un code maintenable, évolutif et facile à comprendre ! 🎉
