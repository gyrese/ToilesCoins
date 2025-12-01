# 🧹 Guide Rapide : Gestion des Badges

## ⚠️ Trois scripts disponibles

### 1️⃣ Nettoyage des doublons uniquement
**Script** : `scripts/cleanDuplicateBadges.js`
- Garde le premier exemplaire de chaque badge
- Supprime uniquement les doublons
- Recommandé pour un nettoyage léger

### 2️⃣ Réinitialisation complète
**Script** : `scripts/resetAllBadges.js`
- ⚠️ **SUPPRIME TOUS LES BADGES de TOUS les utilisateurs**
- Repart sur une base propre
- **Utilisez celui-ci si les nouveaux utilisateurs ont tous les badges**

### 3️⃣ Réattribution intelligente (RECOMMANDÉ après reset)
**Script** : `scripts/reattributeBadges.js`
- ✅ Analyse l'historique des événements
- ✅ Vérifie les statistiques (victoires, solde, participations)
- ✅ Attribue les badges "première victoire par type"
- ✅ Attribue les badges basés sur les stats
- **Utilisez celui-ci après avoir réinitialisé les badges**

---

## Étapes à suivre

### 1️⃣ Obtenir la clé de service Firebase

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez votre projet **ToilesCoins**
3. Cliquez sur ⚙️ → **Paramètres du projet**
4. Onglet **Comptes de service**
5. Cliquez sur **Générer une nouvelle clé privée**
6. Téléchargez le fichier JSON
7. **Renommez-le en `serviceAccountKey.json`**
8. **Placez-le à la racine du projet** (même niveau que `package.json`)

### 2️⃣ Choisir et lancer le script

#### 🎯 Workflow recommandé (nettoyage complet)

Si vous voulez repartir sur une base saine :

```bash
# Étape 1 : Supprimer tous les badges
node scripts/resetAllBadges.js

# Étape 2 : Réattribuer intelligemment les badges
node scripts/reattributeBadges.js
```

#### Options individuelles

**Option A : Réinitialisation complète**
```bash
node scripts/resetAllBadges.js
```

**Option B : Nettoyage des doublons uniquement**
```bash
node scripts/cleanDuplicateBadges.js
```

**Option C : Réattribution intelligente**
```bash
node scripts/reattributeBadges.js
```

### 3️⃣ Vérifier les résultats

Le script affichera :
- ✅ Nombre de badges supprimés
- 👥 Nombre d'utilisateurs affectés
- 📊 Détails pour chaque utilisateur

### 4️⃣ Vérifier sur le site

1. Rechargez la page de profil
2. Les nouveaux utilisateurs n'ont plus aucun badge ✅
3. Les badges seront attribués lors des prochains événements

## ⚠️ Important

- Le fichier `serviceAccountKey.json` est déjà dans `.gitignore`
- **NE LE PARTAGEZ JAMAIS** et ne le commitez pas sur Git
- Vous pouvez supprimer ce fichier après utilisation du script

## 🔄 Si vous avez besoin de relancer le script

Les scripts peuvent être exécutés autant de fois que nécessaire. Ils sont **idempotents** : si vous les relancez, ils ne feront que nettoyer/supprimer ce qui doit l'être.
