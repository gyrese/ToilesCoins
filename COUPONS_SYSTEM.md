# 🎟️ Système de Coupons

## Vue d'ensemble

Le système de coupons permet aux utilisateurs d'acheter des récompenses dans la boutique et de recevoir des coupons temporaires qu'ils peuvent utiliser.

## Flux de vie d'un coupon

```
ACHAT → ACTIF (15min) → UTILISÉ ou EXPIRÉ
```

### 1. **Création** (Status: `active`)
- L'utilisateur achète une récompense dans `/shop`
- Un coupon est généré avec :
  - Code unique (8 caractères alphanumériques)
  - Validité de 15 minutes
  - Status `active`
- Le coupon est stocké dans Firestore
- Transaction enregistrée dans l'historique

### 2. **Utilisation** (Status: `used`)
- L'utilisateur va sur `/coupons`
- Clique sur "✅ Marquer comme utilisé"
- Le coupon passe en status `used`
- Affiché dans la section "Utilisés" (bleu)

### 3. **Expiration** (Status: `expired`)
- Si le timer atteint 0 avant utilisation
- Le coupon passe automatiquement en `expired`
- Affiché dans la section "Archives" (gris)

## Structure de données

### Coupon (Firestore)
```typescript
{
  userId: string;           // UID de l'utilisateur
  rewardId: string;         // ID de la récompense
  rewardName: string;       // Nom de la récompense
  rewardIcon: string;       // Emoji de la récompense
  rewardDescription: string;// Description
  code: string;             // Code unique (ex: "A3F9K2L8")
  status: "active" | "expired" | "used";
  expiresAt: string;        // ISO timestamp
  createdAt: string;        // ISO timestamp
}
```

## Pages

### `/shop` - Boutique
- Affiche les récompenses disponibles
- Permet l'achat avec déduction du solde
- Génère un coupon actif
- Affiche le coupon actif en bas de page

### `/coupons` - Mes Coupons
- **Section Actifs** : Coupons valides avec timer et bouton "Marquer comme utilisé"
- **Section Utilisés** : Coupons marqués comme utilisés (bleu)
- **Section Archives** : Coupons expirés (gris)
- Synchronisation temps réel entre appareils

## Synchronisation temps réel

Le système utilise `onSnapshot` de Firestore pour :
- Mettre à jour automatiquement l'affichage sur tous les appareils
- Synchroniser les changements de statut instantanément
- Afficher les nouveaux coupons dès leur création

## Règles de sécurité Firestore

```javascript
match /coupons/{couponId} {
  // Lecture : uniquement ses propres coupons
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  
  // Création : uniquement pour soi-même
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  
  // Mise à jour : uniquement le champ status
  allow update: if request.auth != null && 
                   resource.data.userId == request.auth.uid &&
                   request.resource.data.status in ['active', 'expired', 'used'];
  
  // Suppression : interdite
  allow delete: if false;
}
```

## Index Firestore requis

Pour les requêtes de coupons, créez cet index composite :

**Collection** : `coupons`
- `userId` : Ascending
- `createdAt` : Descending

## Améliorations futures possibles

1. **QR Code** : Générer un QR code pour chaque coupon
2. **Notification** : Alerter l'utilisateur 2 minutes avant expiration
3. **Historique détaillé** : Date d'utilisation, lieu, etc.
4. **Partage** : Permettre le transfert de coupons entre utilisateurs
5. **Statistiques** : Taux d'utilisation, coupons les plus populaires
6. **Extension de durée** : Possibilité de prolonger un coupon (avec coût)
