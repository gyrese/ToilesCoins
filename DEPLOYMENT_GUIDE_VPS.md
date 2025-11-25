# Guide de Déploiement VPS (OVH) - Monnaie Virtuelle

Ce guide détaille les étapes pour déployer votre application Next.js sur un serveur VPS (Ubuntu 22.04/24.04) en utilisant un utilisateur standard avec les droits `sudo`.

## 1. Prérequis
*   Un serveur VPS.
*   L'adresse IP du serveur.
*   Un utilisateur avec droits sudo (souvent `ubuntu` ou `debian` par défaut, ou `root` si vous en créez un autre).

## 2. Connexion au Serveur
Ouvrez votre terminal et connectez-vous avec votre utilisateur (exemple : `ubuntu` ou `admin`) :
```bash
ssh utilisateur@VOTRE_IP_VPS
# Entrez le mot de passe si demandé
```

## 3. Installation des Outils (Node.js, Nginx, PM2)
Lancez ces commandes une par une (le mot de passe `sudo` vous sera demandé la première fois) :

```bash
# 1. Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# 2. Installer Curl et Git
sudo apt install curl git -y

# 3. Installer Node.js (Version 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 4. Installer PM2 (pour garder l'appli allumée)
sudo npm install -g pm2

# 5. Installer Nginx (Serveur Web)
sudo apt install nginx -y
```

## 4. Installation de l'Application

### A. Récupérer le code
Nous allons installer le site dans `/var/www`. Il faut d'abord donner les droits à votre utilisateur.
```bash
# Donner les droits à votre utilisateur sur le dossier /var/www
sudo chown -R $USER:$USER /var/www

cd /var/www
git clone VOTRE_URL_GITHUB monnaievirtuelle
cd monnaievirtuelle
```

### B. Configuration
Créez le fichier des variables d'environnement :
```bash
nano .env.local
```
Collez-y le contenu de votre `.env.local` actuel.
Sauvegardez (`Ctrl+X`, `Y`, `Entrée`).

### C. Ajustement Next.js (Important)
Pour le mode serveur (VPS), nous devons désactiver l'export statique.
Ouvrez `next.config.ts` :
```bash
nano next.config.ts
```
Modifiez le fichier pour commenter ou retirer `output: 'export'` :
```typescript
const nextConfig: NextConfig = {
  // output: 'export',  <-- Mettre en commentaire pour le VPS
  images: {
    unoptimized: true,
  },
};
```
Sauvegardez (`Ctrl+X`, `Y`, `Entrée`).

### D. Installation et Build
```bash
npm install
npm run build
```

## 5. Lancement avec PM2
PM2 permet à votre site de tourner en arrière-plan.

```bash
pm2 start npm --name "monnaievirtuelle" -- start
pm2 save
# Cette commande va vous donner une ligne à copier/coller pour activer le lancement au démarrage
pm2 startup
```

## 6. Configuration Nginx (Reverse Proxy)
Configuration du serveur web pour rendre le site accessible.

1.  Supprimer la config par défaut :
    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```
2.  Créer une nouvelle config :
    ```bash
    sudo nano /etc/nginx/sites-available/monnaievirtuelle
    ```
3.  Collez ceci (remplacez `votre-domaine.com` par votre domaine ou l'IP) :
    ```nginx
    server {
        listen 80;
        server_name votre-domaine.com www.votre-domaine.com; # Ou mettez juste l'IP ici : server_name _;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
4.  Activer le site et redémarrer Nginx :
    ```bash
    sudo ln -s /etc/nginx/sites-available/monnaievirtuelle /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

## 7. HTTPS (Sécurisation)
Si vous avez un nom de domaine :

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

---

## Mettre à jour le site plus tard
```bash
cd /var/www/monnaievirtuelle
git pull
npm install
npm run build
pm2 restart monnaievirtuelle
```
