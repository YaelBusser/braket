# Analyse de la Conduite de Projet - Volet Développement
**MBA Développeur Full Stack - Analyse Réflexive**

---

## 1. Méthodologie de Développement

### 1.1 Cycle de Vie du Code (Git Flow)
La gestion du code source a été le pilier de notre organisation technique :
*   **Main Branch** : Code de production, stable.
*   **Feature Branches** : Développement des fonctionnalités isolées (`feat/auth-system`, `feat/tournament-bracket`).
*   **Code Review** : Relecture (même sommaire) avant merge pour détecter les erreurs de logique ou de typage.
*   **Gestion des Conflits** : Résolution locale des conflits Git (particulièrement sur `schema.prisma` et les fichiers de routing Next.js).

### 1.2 Outils du Développeur
*   **VS Code** : IDE principal avec extensions partagées (ESLint, Prisma, Tailwind CSS IntelliSense).
*   **Notion** : Utilisé comme Kanban technique. Colonnes : *Backlog Dev*, *In Progress*, *Testing*, *Done*. Chaque ticket incluait les critères techniques d'acceptation (ex: "La table Match doit avoir une FK vers Tournament").
*   **Discord** : Canal `#dev` pour le partage de snippets et le debugging synchrone.
*   **Prisma Studio** : Pour la vérification rapide des données en base sans écrire de SQL.

## 2. Analyse Critique Technique

### 2.1 Puntos Forts (Réussites Techniques)
*   **Vélocité Next.js** : L'utilisation des Server Components a permis d'accéder à la BDD directement dans les composants, supprimant le besoin de créer une API REST complète pour le frontend. Gain de temps estimé : 30%.
*   **Robustesse du Typage** : L'investissement initial sur TypeScript (définition des interfaces `User`, `Tournament`) a payé lors de l'intégration des composants complexes (Arbre de tournoi), évitant de nombreux crashs au runtime.

### 2.2 Dette Technique et Dysfonctionnements
*   **Dysfonctionnement 1 : Migrations BDD conflictuelles**
    *   *Symptôme* : Plusieurs devs modifiant `schema.prisma` en même temps, cassant la synchro locale.
    *   *Cause* : Manque d'une base de données de dev centralisée ou de communication avant modif schéma.
    *   *Action Corrective* : Annonce systématique sur Discord avant touche au schéma + `db:push` réguliers.
*   **Dysfonctionnement 2 : Composants trop larges**
    *   *Symptôme* : Difficulté à maintenir les pages `/tournaments/[id]` (fichiers > 400 lignes).
    *   *Cause* : Mauvais découpage initial des composants UI.
    *   *Action Corrective* : Refactoring en cours pour extraire `BracketView`, `TournamentHeader`, etc.

## 3. Propositions d'Amélioration (Dev Experience)

### 3.1 Industrialisation (CI/CD)
Mise en place d'un pipeline d'intégration continue (GitHub Actions) :
*   **Lint & Type Check** : Refuser tout push sur `main` qui ne passe pas `npm run lint` et `tsc --noEmit`.
*   **Tests Auto** : Lancer une batterie de tests unitaires critiques à chaque PR.

### 3.2 Montée en Compétence de l'Équipe
*   **Atelier "Clean Code"** : Uniformiser les pratiques de nommage et de structure de dossiers.
*   **Veille Techno** : Point bi-mensuel sur les updates Next.js (ex: passage à Next 15, Turbopack) pour ne pas accumuler de retard technique.

## 4. Bilan Personnel (Rôle Tech Lead / Dev)
Ce projet m'a permis de valider ma capacité à architecturer une application Full Stack complexe de zéro. J'ai pris la responsabilité des choix structurants (Prisma, NextAuth) et assuré le support technique pour les autres membres (intégration CSS, logique métier). La principale leçon apprise est l'importance de "freezer" le modèle de données le plus tôt possible pour éviter les refontes en cascade.
