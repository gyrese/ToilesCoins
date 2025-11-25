# Guide d'accès Internet pour l'application

## Solution rapide avec ngrok

### 1. Installation de ngrok

**Windows (PowerShell en admin) :**
```powershell
choco install ngrok
```

**Ou téléchargement manuel :**
1. Allez sur https://ngrok.com/download
2. Téléchargez la version Windows
3. Extrayez le fichier `ngrok.exe`
4. Placez-le dans un dossier de votre PATH ou utilisez-le directement

### 2. Lancement

Ouvrez un nouveau terminal et exécutez :
```bash
ngrok http 3000
```

### 3. Résultat

Vous verrez quelque chose comme :
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Partagez l'URL `https://abc123.ngrok.io` pour accéder à votre app depuis n'importe où !**

## Alternative : Cloudflare Tunnel

```bash
# Installation
npm install -g cloudflared

# Lancement
cloudflared tunnel --url http://localhost:3000
```

## Notes importantes

- ⚠️ Ces solutions sont pour le développement/test
- ⚠️ L'URL change à chaque redémarrage (version gratuite)
- ⚠️ Pour une solution permanente, déployez sur Vercel/Netlify
- ✅ HTTPS automatique avec ngrok et Cloudflare
- ✅ Pas besoin de configuration réseau/routeur

## Déploiement permanent (Recommandé)

Pour une URL permanente, déployez sur **Vercel** :

```bash
# Installation de Vercel CLI
npm install -g vercel

# Déploiement
vercel
```

Suivez les instructions et vous aurez une URL permanente comme :
`https://votre-app.vercel.app`
