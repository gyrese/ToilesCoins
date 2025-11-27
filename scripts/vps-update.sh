#!/bin/bash

# Script de mise à jour automatique pour VPS
# À lancer sur le serveur : ./scripts/vps-update.sh

echo "🚀 Démarrage de la mise à jour..."

# 1. Se placer dans le bon dossier
cd /var/www/monnaievirtuelle || exit

# 2. Réinitialiser les modifications locales pour éviter les conflits
echo "🧹 Nettoyage des modifications locales..."
git reset --hard HEAD

# 3. Récupérer la dernière version
echo "📥 Récupération du code..."
git pull

# 4. Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# 5. Nettoyer le build précédent (évite les erreurs de cache/permissions)
echo "🗑️ Suppression de l'ancien build..."
rm -rf .next

# 6. Construire l'application
echo "🏗️ Construction de l'application..."
npm run build

# 7. Redémarrer PM2
echo "🔄 Redémarrage du serveur..."
pm2 restart monnaievirtuelle

echo "✅ Mise à jour terminée avec succès !"
