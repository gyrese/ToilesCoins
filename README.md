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

## Technologies

-   Next.js 14
-   Tailwind CSS (pour la mise en page) + CSS Custom (pour le style Pixel Art)
-   Firebase (Auth & Firestore)
-   Lucide React (Icônes)
