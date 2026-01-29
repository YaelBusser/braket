# Conception Technique (Partie Groupe)

## 1. Spécifications Techniques

Pour garantir la performance, la maintenabilité et l'évolutivité de la plateforme **[Nom du Projet]**, nous avons opté pour une stack technique moderne et robuste basée sur l'écosystème JavaScript/TypeScript.

### Stack Retenue

*   **Frontend & Backend (Framework Fullstack) : Next.js 15 (App Router)**
    *   *Justification* : Next.js nous permet d'unifier le développement front et back (API Routes) au sein d'un même repo, simplifiant le déploiement. La version 15 avec l'App Router offre des performances optimales grâce aux React Server Components (RSC) et une excellente gestion du SEO.
*   **Langage : TypeScript**
    *   *Justification* : Le typage statique réduit drastiquement les bugs à l'exécution et améliore l'expérience développeur (autocomplétion, refactoring sûr).
*   **Base de Données : MySQL**
    *   *Justification* : Choix d'une base relationnelle solide pour gérer des données structurées (utilisateurs, tournois, matchs) avec des contraintes d'intégrité strictes.
*   **ORM : Prisma**
    *   *Justification* : Prisma offre une sécurité native contre les injections SQL et une API intuitive. Il garantit que nos types TypeScript sont toujours synchronisés avec le schéma de la base de données.
*   **Authentification : NextAuth.js (v4)**
    *   *Justification* : Solution standard pour Next.js, gérant la complexité des sessions (JWT), la sécurité des cookies, et facilitant l'intégration de différents providers si nécessaire.
*   **Librairie Graphique : @xyflow/react + SCSS**
    *   *Justification* : Utilisé pour la visualisation interactive des arbres de tournoi (brackets), élément central de notre UX. SCSS permet une gestion modulaire des styles.

---

## 2. Architecture du Code

Le projet suit une architecture **monolithique modulaire** basée sur **Next.js App Router**, favorisant la séparation des responsabilités.

*   **Structure des dossiers (`src/`)** :
    *   `/app` : Contient les pages et les routes API (Architecture basée sur les routes).
    *   `/app/api` : Expose une **API RESTful** consommée par le front-end. Chaque dossier (`/auth`, `/tournaments`, `/matches`) correspond à une ressource métier.
    *   `/components` : Composants React réutilisables (Atomic Design simplifié).
    *   `/lib` : Configuration des outils tiers (Prisma Client, configuration Auth).
    *   `/utils` : Fonctions utilitaires pures et testables (formatage dates, calculs).

*   **Communication Client-Serveur** :
    *   Le front-end interagit avec le back-end via des appels `fetch` vers les routes API REST internes.
    *   Utilisation des *Server Components* pour récupérer les données directement sur le serveur quand c'est possible, réduisant la charge côté client.

---

## 3. Sécurisation

La sécurité a été intégrée dès la conception (Security by Design) :

1.  **Authentification & Sessions** :
    *   Utilisation de **Tokens JWT** chiffrés (JWE) gérés par NextAuth. Aucun stockage de session en base de données pour réduire latence et complexité.
    *   Protection des routes API via middleware vérifiant la validité du token session.
2.  **Protection des Données (RGPD)** :
    *   **Mots de passe** : Hachage fort avec **Bcrypt** avant stockage (jamais de clair).
    *   Minimisation des données collectées (Email, Username uniquement).
3.  **Prévention des Failles Web** :
    *   **Injection SQL** : Totalement prévenue par l'utilisation de l'ORM **Prisma** qui échappe automatiquement les paramètres.
    *   **XSS (Cross-Site Scripting)** : React échappe nativement les contenus rendus. Validation des entrées API pour rejeter les scripts malveillants.
    *   **CSRF** : Protection native de NextAuth sur les routes de mutation (POST/PUT/DELETE).
4.  **Configuration** :
    *   Sécrets (API Keys, URL BDD, Secret JWT) stockés exclusivement dans les variables d'environnement (`.env`), jamais commités dans le code source.

---

## 4. Méthode de Testing

Pour assurer la stabilité du produit, nous avons mis en place une stratégie de tests hybride :

1.  **Tests Unitaires (Automatisés)** :
    *   **Outil** : **Jest** + **ts-jest**.
    *   **Cible** : Les fonctions utilitaires critiques (ex: calculs de dates, logique de génération de bracket) sont testées unitairement pour garantir qu'elles retournent les résultats attendus sans effets de bord.
    *   *État* : Les tests sont exécutables via `npm test` et couvrent les utilitaires principaux (`src/utils`).

2.  **Tests d'API (Manuels/Scriptés)** :
    *   Utilisation de fichiers `.http` (client REST IntelliJ/VSCode) pour valider les endpoints API (création tournoi, inscription user) indépendamment de l'interface graphique.

3.  **Tests Fonctionnels (Recette)** :
    *   Parcours utilisateurs complets réalisés manuellement sur l'environnement de développement pour valider l'intégration Front/Back.

---

## 5. PV de Recette (Synthèse)

Le tableau suivant synthétise la validation des fonctionnalités critiques du MVP pour la version actuelle (v0.1.0).

| ID  | Fonctionnalité Clé | Scénario de Test | Résultat Attendu | Résultat | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Authentification** | Inscription d'un nouvel utilisateur puis connexion. | L'utilisateur accède à son dashboard privé. Session active. | OK | ✅ **Validé** |
| **F-02** | **Création de Tournoi** | Un organisateur crée un tournoi avec 8 équipes et le publie. | Le tournoi apparaît dans la liste publique et en base de données. | OK | ✅ **Validé** |
| **F-03** | **Arbre de Tournoi** | Génération automatique des matchs pour un tournoi à 8 participants. | L'arbre (Bracket) s'affiche correctement avec les quarts de finale. | OK | ✅ **Validé** |

> **Conclusion** : Le cœur fonctionnel de l'application est opérationnel et sécurisé. Les tests unitaires valident la logique métier de base.
