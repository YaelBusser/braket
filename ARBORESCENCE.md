# Arborescence du site Braket - Navigation

## 📄 Liste des pages

### Pages publiques
- `/` - Accueil
- `/games` - Liste des jeux
- `/games/[gameName]` - Page d'un jeu
- `/tournaments` - Liste des tournois
- `/tournaments/[id]` - Page d'un tournoi
- `/tournaments/[id]/admin` - Admin tournoi (organisateur)
- `/teams` - Liste des équipes
- `/teams/[id]` - Page d'une équipe
- `/profile/[id]` - Profil utilisateur
- `/profile/[id]/overview` - Vue d'ensemble profil
- `/profile/[id]/tournaments` - Tournois d'un utilisateur
- `/profile/[id]/participations` - Participations d'un utilisateur
- `/profile/[id]/teams` - Équipes d'un utilisateur
- `/search` - Recherche globale
- `/not-found` - Page 404

### Pages authentifiées
- `/profile` - Mon profil
- `/profile/overview` - Vue d'ensemble
- `/profile/tournaments` - Mes tournois
- `/profile/participations` - Mes participations
- `/profile/teams` - Mes équipes
- `/settings` - Paramètres
- `/teams/create` - Créer une équipe

### Pages création tournoi (admin)
- `/tournaments/create` - Étape 1: Sélection du jeu
- `/tournaments/create/format` - Étape 2: Format
- `/tournaments/create/identity` - Étape 3: Identité
- `/tournaments/create/dates` - Étape 4: Dates
- `/tournaments/create/summary` - Étape 5: Résumé

---

## 🔗 Navigation entre les pages

### Depuis `/` (Accueil)
- → `/games` (via "Voir tout" jeux)
- → `/games/[gameName]` (clic sur un jeu)
- → `/tournaments` (via navigation)
- → `/tournaments/[id]` (clic sur un tournoi)
- → `/search` (via barre de recherche)

### Depuis `/games` (Liste jeux)
- → `/games/[gameName]` (clic sur un jeu)
- → `/` (retour accueil)

### Depuis `/games/[gameName]` (Page jeu)
- → `/tournaments/[id]` (clic sur un tournoi du jeu)
- → `/games` (retour liste jeux)

### Depuis `/tournaments` (Liste tournois)
- → `/tournaments/[id]` (clic sur un tournoi)
- → `/tournaments/create` (bouton créer - admin)

### Depuis `/tournaments/[id]` (Page tournoi)
- → `/profile/[id]` (clic sur un participant)
- → `/teams/[id]` (clic sur une équipe)
- → `/tournaments/[id]/admin` (bouton admin - organisateur)
- → `/tournaments` (retour liste)

### Depuis `/tournaments/[id]/admin` (Admin tournoi)
- → `/tournaments/[id]` (retour page tournoi)

### Création tournoi (workflow)
- `/tournaments/create` → `/tournaments/create/format`
- `/tournaments/create/format` → `/tournaments/create/identity`
- `/tournaments/create/identity` → `/tournaments/create/dates`
- `/tournaments/create/dates` → `/tournaments/create/summary`
- `/tournaments/create/summary` → `/tournaments/[id]` (après création)

### Depuis `/teams` (Liste équipes)
- → `/teams/[id]` (clic sur une équipe)
- → `/teams/create` (bouton créer - authentifié)

### Depuis `/teams/[id]` (Page équipe)
- → `/profile/[id]` (clic sur un membre)
- → `/tournaments/[id]` (clic sur un tournoi)
- → `/teams` (retour liste)

### Depuis `/teams/create` (Créer équipe)
- → `/teams/[id]` (après création)
- → `/teams` (annulation)

### Depuis `/profile` (Mon profil)
- → `/profile/overview`
- → `/profile/tournaments`
- → `/profile/participations`
- → `/profile/teams`
- → `/settings`
- → `/tournaments/[id]` (clic sur un tournoi)
- → `/teams/[id]` (clic sur une équipe)

### Depuis `/profile/[id]` (Profil utilisateur)
- → `/profile/[id]/overview`
- → `/profile/[id]/tournaments`
- → `/profile/[id]/participations`
- → `/profile/[id]/teams`
- → `/tournaments/[id]` (clic sur un tournoi)
- → `/teams/[id]` (clic sur une équipe)

### Depuis `/search` (Recherche)
- → `/tournaments/[id]` (résultat tournoi)
- → `/profile/[id]` (résultat utilisateur)
- → `/teams/[id]` (résultat équipe)
- → `/games/[gameName]` (résultat jeu)

### Depuis `/settings` (Paramètres)
- → `/profile` (retour profil)

---

## 🧭 Navigation globale (toujours accessible)

### Menu principal
- `/` - Accueil
- `/games` - Jeux
- `/tournaments` - Tournois
- `/teams` - Équipes
- `/search` - Recherche

### Menu utilisateur (si connecté)
- `/profile` - Mon profil
- `/settings` - Paramètres
- Déconnexion

### Liens contextuels
- Clic sur un tournoi → `/tournaments/[id]`
- Clic sur un jeu → `/games/[gameName]`
- Clic sur un utilisateur → `/profile/[id]`
- Clic sur une équipe → `/teams/[id]`
