# Index Firestore requis pour les coupons

Pour que la requête des coupons actifs fonctionne, vous devez créer un **index composite** dans Firestore.

## Méthode 1 : Création automatique (Recommandée)

1. Lancez l'application et allez sur la page Boutique
2. Ouvrez la console du navigateur (F12)
3. Firestore affichera un lien d'erreur avec un URL pour créer l'index automatiquement
4. Cliquez sur ce lien et confirmez la création de l'index

## Méthode 2 : Création manuelle

1. Allez dans la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Firestore Database** → **Indexes** → **Composite**
4. Cliquez sur **Create Index**
5. Configurez l'index comme suit :

```
Collection ID: coupons
Fields to index:
  - userId (Ascending)
  - expiresAt (Ascending)
Query scope: Collection
```

6. Cliquez sur **Create**

## Méthode 3 : Fichier firestore.indexes.json

Créez un fichier `firestore.indexes.json` à la racine du projet :

```json
{
  "indexes": [
    {
      "collectionGroup": "coupons",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "expiresAt",
          "order": "ASCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
```

Puis déployez avec :
```bash
firebase deploy --only firestore:indexes
```

## Vérification

Une fois l'index créé (cela peut prendre quelques minutes), la boutique chargera automatiquement les coupons actifs de l'utilisateur.
