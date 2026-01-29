# Dossier Technique - Braket (LeTournoi)
**Focus : Développement Full Stack & Architecture**

---

## 1. Architecture et Choix Techniques

### 1.1 Stack Technique Détaillée
L'architecture a été pensée pour répondre aux exigences de performance (Core Web Vitals) et de maintenabilité (Type Safety).

*   **Runtime & Framework** : [Next.js 15](https://nextjs.org/) (App Router).
    *   *Pourquoi ?* Unification du Backend et Frontend, SSR (Server-Side Rendering) pour le SEO des pages tournois, et Server Actions pour la gestion des mutations de données sans API REST verbeuse.
*   **Langage** : **TypeScript**.
    *   *Usage* : Typage strict de toutes les props composants, des retours d'API et du schéma de base de données.
    *   *Strict Mode* : Activé pour éviter les `any` implicites.
*   **Base de Données** : **MariaDB** (hébergée via Docker en dev, Cloud en prod).
    *   *Usage* : Stockage relationnel. Intégrité référentielle forte (Foreign Keys) indispensable pour la cohérence des tournois/matchs.
*   **ORM** : **Prisma**.
    *   *Usage* : Migrations déclaratives (`schema.prisma`) et requêtes typées. Évite les erreurs de syntaxe SQL manuelles.
*   **Authentification** : **NextAuth.js**.
    *   *Stratégie* : "Database Strategy". Les sessions sont stockées en BDD pour permettre une invalidation immédiate (banissement, vol de compte). Middleware de protection sur les routes `/admin` et `/profile`.

### 1.2 Modèle de Données (Implémentation)
Le schéma BDD (`schema.prisma`) est la clé de voute du projet.
*   **Core Logic** :
    *   Relation `Tournament` -> `Match` -> `Team` : Structure hiérarchique permettant de reconstruire l'arbre du tournoi.
    *   Relation `User` <-> `Team` : Many-to-Many gérée via table de jointure `TeamMember` avec attributs (ex: `isCaptain` pour gérer les droits dans l'équipe).

## 2. Solutions Techniques Déployées

### 2.1 Algorithme de Génération de Bracket
Le défi majeur du développement backend.
*   **Problème** : Générer un arbre équilibré pour $N$ équipes (où $N$ n'est pas forcément une puissance de 2).
*   **Solution Implémentée** :
    1.  Calcul du "Next Power of 2" pour déterminer la taille de l'arbre.
    2.  Distribution des équipes via un algorithme de "Seeding" (têtes de série) ou aléatoire.
    3.  Gestion des "Byes" (équipes qualifiées d'office au round suivant) pour combler les trous.
    4.  Création transactionnelle (Prisma `$transaction`) de tous les matchs `PENDING` à l'initialisation du tournoi.

### 2.2 Système de Chat Temps Réel (Optimiste)
*   Implémentation via **Server Actions** et revalidation de chemin (`revalidatePath`).
*   Pour simuler le temps réel sans WebSocket lourd (MVP), utilisation de l'UI Optimiste (`useOptimistic` hook de React 19) : le message s'affiche immédiatement pour l'expéditeur avant même la confirmation serveur.

### 2.3 Sécurisation des Données
*   **Validation des Entrées** : Utilisation de `Zod` (si installé) ou validation manuelle dans les Server Actions pour vérifier les types et formats avant toute requête DB.
*   **Authorisation (RBAC)** :
    *   Vérification systématique `if (session.user.id !== tournament.organizerId)` avant toute modification de tournoi.
    *   Vérification `isCaptain` avant toute modification d'équipe.
*   **Protection XSS** : React échappe par défaut les contenus. Vigilance sur les inputs riches (description tournoi).

## 3. Qualité et Industrialisation

### 3.1 Environnement de Développement
*   **Linter** : ESLint configuré avec règles strictes (`no-unused-vars`, `react-hooks/rules-of-hooks`).
*   **Formateur** : Prettier pour assurer un style de code uniforme.
*   **Git Flow** : Branches `feature/*` et Pull Requests obligatoires pour merger sur `main`.

### 3.2 Protocole de Recette (Dev)
Tests techniques réalisés avant livraison :
1.  **Unitaires** : Vérification des helpers (ex: fonction de formatage de dates, calcul de scores).
2.  **Intégration** : Test du flux complet "Création Tournoi -> Inscription Équipe -> Génération Arbre" en local.
3.  **Performance** : Audit via Lighthouse (Chrome DevTools). Objectif : LCP < 2.5s sur la page d'accueil.

## 4. PV de Recette (Extrait Dev)

| ID | Module | Test Technique | Résultat |
|----|--------|----------------|----------|
| TECH-01 | DB | Migration Prisma clean (`db:push`) sur base vierge | ✅ OK |
| TECH-02 | Auth | Persistance session après refresh | ✅ OK |
| TECH-03 | Sécu | Tentative d'accès `/admin` sans droits | ✅ OK (Redirect 403) |
| TECH-04 | Perf | Chargement liste tournois (100 items) | ✅ OK (< 500ms server time) |
