# Script d'Initialisation Firebase

Ce guide vous aide à configurer votre base de données Firestore avec des données de démonstration.

## 1. Configuration des Collections

Dans la console Firebase, créez les collections suivantes :

### Collection `users`
Créée automatiquement lors de l'inscription des utilisateurs.

### Collection `rewards` (Récompenses de la boutique)

Ajoutez ces documents manuellement :

**Document 1:**
```json
{
  "name": "Boisson Soft",
  "cost": 100,
  "icon": "🥤",
  "description": "Une boisson soft au choix"
}
```

**Document 2:**
```json
{
  "name": "Pinte Bière",
  "cost": 250,
  "icon": "🍺",
  "description": "Une pinte de bière"
}
```

**Document 3:**
```json
{
  "name": "Planche Mixte",
  "cost": 500,
  "icon": "🧀",
  "description": "Planche de fromages et charcuterie"
}
```

**Document 4:**
```json
{
  "name": "T-Shirt",
  "cost": 1500,
  "icon": "👕",
  "description": "T-shirt Les Toiles Noires"
}
```

**Document 5:**
```json
{
  "name": "Badge VIP",
  "cost": 5000,
  "icon": "👑",
  "description": "Statut VIP pour 1 mois"
}
```

**Document 6:**
```json
{
  "name": "Shot Mystère",
  "cost": 150,
  "icon": "🧪",
  "description": "Un shot surprise"
}
```

### Collection `events`
Les événements seront créés via l'interface Admin.

### Collection `tournaments`
Les résultats de tournois seront créés via l'interface Admin.

### Collection `transactions`
Créée automatiquement lors des transactions.

### Collection `unlocks` (Badges)
Pour ajouter des badges manuellement à un utilisateur, créez un document avec :
```json
{
  "userId": "UID_DE_L_UTILISATEUR",
  "name": "Champion",
  "icon": "🏆",
  "color": "bg-yellow-200"
}
```

## 2. Créer un Compte Admin

1. Inscrivez-vous normalement via l'application
2. Dans Firestore, trouvez votre document dans la collection `users`
3. Modifiez le champ `role` de `"USER"` à `"ADMIN"`
4. Rafraîchissez l'application

Vous aurez maintenant accès à `/admin` !

## 3. Règles de Sécurité Firestore (Recommandées)

Dans Firebase Console > Firestore Database > Règles, utilisez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs peuvent lire leur propre profil
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
    
    // Tout le monde peut lire les récompenses
    match /rewards/{rewardId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
    
    // Tout le monde peut lire les événements
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
    
    // Tout le monde peut lire les tournois
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
    
    // Utilisateurs peuvent lire leurs propres transactions
    match /transactions/{transactionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
    
    // Utilisateurs peuvent lire leurs propres badges
    match /unlocks/{unlockId} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "ADMIN";
    }
  }
}
```

## 4. Test de l'Application

1. Créez un compte utilisateur
2. Passez-le en ADMIN dans Firestore
3. Allez sur `/admin`
4. Créez un événement
5. Déclarez une victoire pour votre compte
6. Vérifiez que votre solde a augmenté
7. Achetez une récompense dans la boutique

✅ Votre application est prête !
