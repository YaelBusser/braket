# Guide des Composants UI - LeTournoi

## 🎨 Composants disponibles

### Button
Composant bouton avec différentes variantes et tailles.

```tsx
import { Button } from '../components/ui'

// Utilisation basique
<Button>Cliquer ici</Button>

// Avec variantes
<Button variant="primary">Primaire</Button>
<Button variant="secondary">Secondaire</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="success">Succès</Button>
<Button variant="warning">Attention</Button>
<Button variant="error">Erreur</Button>

// Avec tailles
<Button size="sm">Petit</Button>
<Button size="md">Moyen</Button>
<Button size="lg">Grand</Button>
<Button size="xl">Très grand</Button>

// Avec état de chargement
<Button loading={true}>Chargement...</Button>

// Avec props HTML
<Button onClick={handleClick} disabled={isDisabled}>
  Bouton
</Button>
```

### Input
Composant d'input avec validation et messages d'erreur.

```tsx
import { Input } from '../components/ui'

// Utilisation basique
<Input 
  type="email"
  name="email"
  label="Email"
  placeholder="votre@email.com"
  required
/>

// Avec validation
<Input
  type="password"
  name="password"
  label="Mot de passe"
  value={password}
  onChange={handleChange}
  error={errors.password}
  help="Minimum 6 caractères"
  required
/>

// Avec succès
<Input
  type="text"
  name="username"
  label="Nom d'utilisateur"
  value={username}
  onChange={handleChange}
  success="Nom d'utilisateur disponible"
/>
```

### Select
Composant de sélection avec options.

```tsx
import { Select } from '../components/ui'

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' }
]

// Utilisation basique
<Select
  name="category"
  label="Catégorie"
  options={options}
  placeholder="Sélectionner une catégorie"
  required
/>

// Avec validation
<Select
  name="type"
  label="Type de compte"
  value={type}
  onChange={handleChange}
  options={userTypeOptions}
  error={errors.type}
  required
/>
```

### Card
Composant de carte avec header, body et footer.

```tsx
import { Card, CardHeader, CardBody, CardFooter } from '../components/ui'

// Utilisation basique
<Card>
  <CardHeader>
    <h2>Titre de la carte</h2>
    <p>Sous-titre</p>
  </CardHeader>
  <CardBody>
    <p>Contenu de la carte</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>

// Avec variantes
<Card variant="elevated">Carte surélevée</Card>
<Card variant="flat">Carte plate</Card>
<Card variant="outlined">Carte avec bordure</Card>

// Avec tailles
<Card size="sm">Petite carte</Card>
<Card size="md">Carte moyenne</Card>
<Card size="lg">Grande carte</Card>
```

## 🎯 Props communes

### ButtonProps
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  children: React.ReactNode
  // + toutes les props HTML de button
}
```

### InputProps
```tsx
interface InputProps {
  label?: string
  error?: string
  help?: string
  success?: string
  required?: boolean
  // + toutes les props HTML de input
}
```

### SelectProps
```tsx
interface SelectProps {
  label?: string
  error?: string
  help?: string
  success?: string
  required?: boolean
  options: SelectOption[]
  placeholder?: string
  // + toutes les props HTML de select
}
```

## 🎨 Styles

Tous les composants utilisent des modules SASS avec :
- Variables SASS centralisées
- Classes CSS modulaires
- Responsive design
- États interactifs (hover, focus, disabled)
- Animations fluides

## 📱 Responsive

Les composants s'adaptent automatiquement aux différentes tailles d'écran :
- Mobile : Tailles compactes
- Tablet : Tailles moyennes
- Desktop : Tailles complètes

## ♿ Accessibilité

- Labels associés aux inputs
- Focus visible
- Support clavier
- ARIA attributes
- Contraste respecté

## 🚀 Utilisation dans les pages

```tsx
// Page d'inscription
import { Button, Input, Select, Card, CardHeader, CardBody } from '../components/ui'

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <h1>Inscription</h1>
      </CardHeader>
      <CardBody>
        <form>
          <Input
            name="email"
            label="Email"
            type="email"
            required
          />
          <Select
            name="type"
            label="Type de compte"
            options={userTypeOptions}
            required
          />
          <Button type="submit" variant="primary" size="lg">
            S'inscrire
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
```

## 🔧 Personnalisation

Pour personnaliser les styles, modifiez les fichiers `.module.scss` correspondants :

```scss
// Button.module.scss
@use '../../styles/variables.module' as vars;

.btn {
  // Styles personnalisés
  border-radius: vars.$radius-full;
  font-weight: vars.$font-weight-bold;
}
```

## 📋 Bonnes pratiques

1. **Utilisez les composants** plutôt que les classes CSS directes
2. **Validez les props** avec TypeScript
3. **Gérez les états** (loading, error, success)
4. **Respectez l'accessibilité** (labels, focus, etc.)
5. **Testez la responsivité** sur différentes tailles d'écran

Ces composants offrent une base solide et cohérente pour construire votre interface utilisateur ! 🎉
