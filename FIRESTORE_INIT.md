# 🔥 Guide d'Initialisation Firestore

## Étape 1 : Configurer les Règles de Sécurité

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet **ToilesCoins**
3. Dans le menu, cliquez sur **Firestore Database**
4. Cliquez sur l'onglet **Règles**
5. Remplacez les règles par celles du fichier `firestore.rules`
6. Cliquez sur **Publier**

## Étape 2 : Ajouter les Récompenses

Dans Firestore Database, créez une collection `rewards` et ajoutez ces documents :

### Document 1
```
name: "Boisson Soft"
cost: 100
icon: "🥤"
description: "Une boisson soft au choix"
```

### Document 2
```
name: "Pinte Bière"
cost: 250
icon: "🍺"
description: "Une pinte de bière"
```

### Document 3
```
name: "Planche Mixte"
cost: 500
icon: "🧀"
description: "Planche de fromages et charcuterie"
```

### Document 4
```
name: "T-Shirt"
cost: 1500
icon: "👕"
description: "T-shirt Les Toiles Noires"
```

### Document 5
```
name: "Badge VIP"
cost: 5000
icon: "👑"
description: "Statut VIP pour 1 mois"
```

### Document 6
```
name: "Shot Mystère"
cost: 150
icon: "🧪"
description: "Un shot surprise"
```

### Document 7
```
name: "Burger Maison"
cost: 400
icon: "🍔"
description: "Burger fait maison"
```

### Document 8
```
name: "Nachos XXL"
cost: 350
icon: "🌮"
description: "Grande portion de nachos"
```

## Étape 3 : Créer un Compte Admin

1. Allez sur http://localhost:3000/login
2. Créez un compte avec votre email
3. Dans Firestore, allez dans la collection `users`
4. Trouvez votre document utilisateur
5. Modifiez le champ `role` de `"USER"` à `"ADMIN"`
6. Rafraîchissez l'application

## Étape 4 : Tester l'Application

1. Connectez-vous à l'application
2. Allez sur `/admin`
3. Créez un événement
4. Déclarez une victoire pour votre compte
5. Vérifiez que votre solde a augmenté
6. Achetez une récompense dans la boutique

## 📝 Collections Firestore

Votre base de données aura ces collections :

- **users** : Créée automatiquement lors de l'inscription
- **rewards** : À créer manuellement (voir ci-dessus)
- **events** : Créée via l'interface admin
- **tournaments** : Créée automatiquement lors de la déclaration de victoires
- **transactions** : Créée automatiquement lors des transactions
- **unlocks** : Pour les badges (optionnel)

## 🎯 Alternative Rapide

Si vous préférez, vous pouvez aussi :
1. Créer juste 2-3 récompenses pour tester
2. Créer votre compte admin
3. Utiliser l'interface admin pour tout gérer ensuite

L'essentiel est d'avoir au moins quelques récompenses dans la collection `rewards` pour que la boutique fonctionne !
