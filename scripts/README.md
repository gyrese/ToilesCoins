# Script de Nettoyage des Badges en Double

## Prérequis

1. **Clé de service Firebase Admin** : Vous devez avoir un fichier `serviceAccountKey.json` à la racine du projet.

### Comment obtenir la clé de service :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur l'icône ⚙️ (Paramètres) → **Paramètres du projet**
4. Allez dans l'onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Enregistrez le fichier JSON téléchargé sous le nom `serviceAccountKey.json` à la racine du projet

⚠️ **IMPORTANT** : Ne commitez JAMAIS ce fichier sur Git ! Il est déjà dans `.gitignore`.

## Installation

Installez Firebase Admin SDK si ce n'est pas déjà fait :

```bash
npm install firebase-admin
```

## Utilisation

Depuis la racine du projet, exécutez :

```bash
node scripts/cleanDuplicateBadges.js
```

## Ce que fait le script

1. ✅ Parcourt tous les utilisateurs de la base de données
2. ✅ Pour chaque utilisateur, récupère tous ses badges
3. ✅ Identifie les badges en double (même nom)
4. ✅ Garde le premier exemplaire de chaque badge
5. ✅ Supprime tous les doublons
6. ✅ Affiche un rapport détaillé

## Exemple de sortie

```
🧹 Démarrage du nettoyage des badges en double...

📊 5 utilisateurs trouvés

👤 Vérification de Bobby...
   🗑️  Badge "TOP 1" : 2 doublon(s) trouvé(s)
   ✅ 2 doublon(s) supprimé(s)

👤 Vérification de Alice...
   ✓ Aucun doublon

═══════════════════════════════════════
✨ Nettoyage terminé !
📊 2 badges en double supprimés
👥 1 utilisateurs affectés
═══════════════════════════════════════
```

## Sécurité

- Le script ne supprime que les doublons (badges avec le même nom)
- Le premier exemplaire de chaque badge est toujours conservé
- Aucune donnée utilisateur n'est modifiée
- Le script est en lecture seule pour les données utilisateurs (pseudo, wins, etc.)
