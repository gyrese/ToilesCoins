# ToilesCoins

Application de fidélité Pixel Art pour le bar "Les Toiles Noires".

## Démarrage Rapide

1.  Installer les dépendances :
    ```bash
    npm install
    ```

2.  Lancer le serveur de développement :
    ```bash
    npm run dev
    ```

3.  Ouvrir [http://localhost:3000](http://localhost:3000)

## Configuration Firebase

Pour activer le backend complet :

1.  Créez un projet sur [Firebase Console](https://console.firebase.google.com/).
2.  Activez **Authentication** (Email/Password) et **Firestore Database**.
3.  Copiez les clés de configuration dans un fichier `.env.local` à la racine du projet (voir `.env.example` pour le format).

## Fonctionnalités

-   **Design Pixel Art** : Interface rétro style Mario.
-   **Portefeuille** : Suivi des gains et dépenses.
-   **Événements** : Liste des tournois et animations.
-   **Boutique** : Échange de points contre récompenses.
-   **Profil** : Badges, statistiques et classement.
-   **Admin** : Gestion des points et événements (accessible via `/admin`).
-   **🏆 Tournois** : Système complet de gestion de tournois avec bracket, scores et récompenses automatiques.

## Système de Tournois

Le système de tournois permet aux administrateurs de créer et gérer des compétitions complètes :

-   **Création de tournois** personnalisés par type d'événement
-   **Ajout de joueurs** inscrits ou invités
-   **Génération automatique** d'arbre de tournoi (bracket)
-   **Gestion des matchs** avec saisie de scores en temps réel
-   **Attribution automatique** de récompenses (500/300/150 TC)
-   **Enregistrement** des résultats dans Firebase

### Accès rapide
1. Aller sur `/admin`
2. Onglet **ÉVÉNEMENTS** → **TYPES**
3. Cliquer sur **🏆 TOURNOI** pour n'importe quel type

### Documentation complète
- 📚 **[TOURNAMENT_INDEX.md](./TOURNAMENT_INDEX.md)** - Index de navigation
- 🚀 **[TOURNAMENT_SUMMARY.md](./TOURNAMENT_SUMMARY.md)** - Résumé exécutif
- 📘 **[TOURNAMENT_SYSTEM.md](./TOURNAMENT_SYSTEM.md)** - Guide d'utilisation
- 🧪 **[TOURNAMENT_TESTING.md](./TOURNAMENT_TESTING.md)** - Guide de test
- 💻 **[TOURNAMENT_EXAMPLES.md](./TOURNAMENT_EXAMPLES.md)** - Exemples de code


## Technologies

-   Next.js 14
-   Tailwind CSS (pour la mise en page) + CSS Custom (pour le style Pixel Art)
-   Firebase (Auth & Firestore)
-   Lucide React (Icônes)
