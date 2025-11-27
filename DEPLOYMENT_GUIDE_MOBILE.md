# Guide de Déploiement Mobile - Android & iOS

Ce guide détaille les étapes pour publier votre application sur **Google Play Store** (Android) et **Apple App Store** (iOS).

---

## 📱 Déploiement Android (Google Play Store)

### Prérequis
- Un compte **Google Play Console** (25$ d'inscription unique)
- **Android Studio** installé sur votre PC Windows
- Un ordinateur Windows (vous l'avez déjà ✅)

### Étape 1 : Préparer l'application pour la production

1. **Activer le mode export statique** (sur votre PC local) :
   ```bash
   # Ouvrir next.config.ts et décommenter la ligne :
   output: 'export',
   ```

2. **Rebuild l'application** :
   ```bash
   npm run build
   npx cap sync android
   ```

### Étape 2 : Ouvrir le projet dans Android Studio

1. Lancez **Android Studio**
2. Cliquez sur **"Open"**
3. Sélectionnez le dossier : `c:\ai\monnaievirtuelle\android`
4. Attendez que Gradle synchronise le projet (première fois = quelques minutes)

### Étape 3 : Configurer l'application

1. **Modifier l'icône de l'app** :
   - Allez dans `android/app/src/main/res/`
   - Remplacez les icônes dans les dossiers `mipmap-*` par vos propres icônes
   - Ou utilisez **Image Asset Studio** (clic droit sur `res` > New > Image Asset)

2. **Modifier le nom de l'app** :
   - Ouvrez `android/app/src/main/res/values/strings.xml`
   - Changez `<string name="app_name">Monnaie Virtuelle</string>`

3. **Vérifier le package name** :
   - Ouvrez `android/app/build.gradle`
   - Vérifiez `applicationId "com.monnaievirtuelle.app"`
   - ⚠️ Ce nom doit être **unique** sur le Play Store (format : `com.votreentreprise.nomapp`)

### Étape 4 : Générer une clé de signature (Keystore)

Cette clé sert à signer votre application (obligatoire pour le Play Store).

1. Ouvrez un terminal dans Android Studio (en bas : **Terminal**)
2. Lancez cette commande :
   ```bash
   keytool -genkey -v -keystore monnaievirtuelle-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias monnaievirtuelle
   ```
3. Répondez aux questions :
   - **Mot de passe** : Choisissez un mot de passe sécurisé (NOTEZ-LE !)
   - **Nom, Organisation, Ville, etc.** : Remplissez avec vos informations
4. Le fichier `monnaievirtuelle-release-key.jks` sera créé.
5. **⚠️ IMPORTANT** : Sauvegardez ce fichier en lieu sûr (Dropbox, clé USB). Si vous le perdez, vous ne pourrez plus mettre à jour l'app !

### Étape 5 : Configurer la signature dans Android Studio

1. Créez le fichier `android/key.properties` :
   ```properties
   storePassword=VOTRE_MOT_DE_PASSE
   keyPassword=VOTRE_MOT_DE_PASSE
   keyAlias=monnaievirtuelle
   storeFile=../monnaievirtuelle-release-key.jks
   ```
   (Remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe choisi à l'étape 4)

2. Déplacez le fichier `.jks` dans le dossier `android/` (à côté de `key.properties`)

3. Modifiez `android/app/build.gradle` :
   - Cherchez la section `android {`
   - Ajoutez **avant** `buildTypes` :
   ```gradle
   def keystoreProperties = new Properties()
   def keystorePropertiesFile = rootProject.file('key.properties')
   if (keystorePropertiesFile.exists()) {
       keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
   }
   ```
   - Puis dans `buildTypes`, modifiez `release` :
   ```gradle
   release {
       signingConfig signingConfigs.release
       minifyEnabled false
       proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
   }
   ```
   - Et ajoutez **avant** `buildTypes` :
   ```gradle
   signingConfigs {
       release {
           keyAlias keystoreProperties['keyAlias']
           keyPassword keystoreProperties['keyPassword']
           storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
           storePassword keystoreProperties['storePassword']
       }
   }
   ```

### Étape 6 : Générer l'APK/AAB de production

1. Dans Android Studio, menu : **Build** > **Generate Signed Bundle / APK**
2. Sélectionnez **Android App Bundle** (AAB) - c'est le format requis par Google Play
3. Cliquez **Next**
4. Sélectionnez votre fichier `.jks` et entrez les mots de passe
5. Choisissez **release** et cochez **V1** et **V2**
6. Cliquez **Finish**
7. Le fichier `.aab` sera généré dans `android/app/release/`

### Étape 7 : Publier sur Google Play Console

1. Allez sur [Google Play Console](https://play.google.com/console)
2. Créez une nouvelle application
3. Remplissez les informations :
   - **Nom de l'app**
   - **Description courte et longue**
   - **Captures d'écran** (minimum 2, recommandé 8)
   - **Icône** (512x512 px)
   - **Bannière** (1024x500 px)
4. Dans **Production** > **Créer une version** :
   - Uploadez votre fichier `.aab`
   - Remplissez les notes de version
5. Soumettez pour examen (délai : 1 à 7 jours)

---

## 🍎 Déploiement iOS (Apple App Store)

### Prérequis
- Un **Mac** (obligatoire pour compiler une app iOS)
- Un compte **Apple Developer** (99$/an)
- **Xcode** installé (gratuit sur Mac App Store)

### ⚠️ Limitation Windows
Vous êtes sur **Windows**, donc vous ne pouvez **pas** compiler l'app iOS directement. Vous avez 3 options :

#### Option 1 : Utiliser un Mac (Recommandé)
- Empruntez un Mac ou utilisez un Mac en location (ex: MacStadium, MacinCloud)
- Transférez le dossier `ios/` sur le Mac
- Suivez les étapes ci-dessous

#### Option 2 : Utiliser un service de build cloud
- **Ionic Appflow** (payant, ~40$/mois)
- **EAS Build** (Expo, gratuit avec limitations)
- Ils compilent l'app pour vous sans avoir besoin d'un Mac

#### Option 3 : Attendre d'avoir accès à un Mac
- Gardez le dossier `ios/` prêt
- Quand vous aurez accès à un Mac, vous pourrez compiler

---

### Étapes sur Mac (si vous avez accès à un Mac)

### Étape 1 : Transférer le projet
1. Copiez le dossier `ios/` sur le Mac (via clé USB, GitHub, ou AirDrop)
2. Ouvrez un terminal sur le Mac et allez dans le dossier :
   ```bash
   cd /chemin/vers/monnaievirtuelle
   ```

### Étape 2 : Installer les dépendances
```bash
cd ios/App
pod install
```

### Étape 3 : Ouvrir dans Xcode
```bash
open App.xcworkspace
```

### Étape 4 : Configurer l'app dans Xcode

1. **Sélectionnez le projet** (icône bleue en haut à gauche)
2. Dans **General** :
   - **Display Name** : Nom affiché sous l'icône
   - **Bundle Identifier** : `com.monnaievirtuelle.app` (doit être unique)
   - **Version** : 1.0.0
   - **Build** : 1

3. Dans **Signing & Capabilities** :
   - Cochez **Automatically manage signing**
   - Sélectionnez votre **Team** (compte Apple Developer)

### Étape 5 : Créer l'icône de l'app
1. Allez dans `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Remplacez les images par vos icônes (différentes tailles requises)
3. Ou utilisez un outil comme [AppIcon.co](https://appicon.co) pour générer toutes les tailles

### Étape 6 : Tester sur un appareil réel
1. Branchez votre iPhone
2. Sélectionnez votre iPhone dans la barre du haut (à côté du nom de l'app)
3. Cliquez sur le bouton **Play** (▶️)
4. L'app s'installera sur votre iPhone

### Étape 7 : Créer une archive pour l'App Store
1. Menu : **Product** > **Archive**
2. Attendez la fin de la compilation
3. La fenêtre **Organizer** s'ouvre automatiquement
4. Sélectionnez votre archive et cliquez **Distribute App**
5. Choisissez **App Store Connect**
6. Suivez l'assistant (Upload)

### Étape 8 : Publier sur App Store Connect

1. Allez sur [App Store Connect](https://appstoreconnect.apple.com)
2. Créez une nouvelle app
3. Remplissez les informations :
   - **Nom**
   - **Sous-titre**
   - **Description**
   - **Captures d'écran** (iPhone 6.7" et 6.5" obligatoires)
   - **Icône** (1024x1024 px)
   - **Catégorie**
4. Dans **Build**, sélectionnez la version uploadée depuis Xcode
5. Soumettez pour examen (délai : 1 à 3 jours généralement)

---

## 🔄 Mises à jour futures

### Android
1. Modifiez le code en local
2. Incrémentez le **versionCode** et **versionName** dans `android/app/build.gradle`
3. Rebuild : `npm run build && npx cap sync android`
4. Générez un nouveau `.aab` signé
5. Uploadez sur Google Play Console

### iOS
1. Modifiez le code en local
2. Incrémentez **Version** et **Build** dans Xcode
3. Archive et upload vers App Store Connect
4. Soumettez pour examen

---

## 📋 Checklist avant publication

- [ ] L'app fonctionne correctement en local
- [ ] Les icônes sont configurées (toutes les tailles)
- [ ] Le nom de l'app est correct
- [ ] Les captures d'écran sont prêtes (minimum 2 par plateforme)
- [ ] La description est rédigée
- [ ] La politique de confidentialité est disponible (obligatoire)
- [ ] Les comptes développeur sont créés (Google Play + Apple Developer)
- [ ] La clé de signature Android est sauvegardée en lieu sûr
- [ ] L'app a été testée sur un appareil réel

---

## 💡 Conseils

- **Testez toujours sur un appareil réel** avant de publier
- **Préparez des captures d'écran de qualité** (utilisez des mockups)
- **Rédigez une description claire** qui explique ce que fait l'app
- **Respectez les guidelines** de Google et Apple (pas de contenu interdit)
- **Prévoyez 1 semaine** pour la première publication (délais d'examen)

---

Bonne chance pour la publication ! 🚀
