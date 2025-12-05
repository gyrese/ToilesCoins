# 🏆 Système de Gestion de Tournois

## Vue d'ensemble

Le système de gestion de tournois permet aux administrateurs de créer et gérer des tournois complets avec :
- Création de tournois personnalisés
- Ajout de joueurs (inscrits ou non sur l'application)
- Génération automatique d'arbre de tournoi (bracket)
- Gestion des matchs et scores en temps réel
- Attribution automatique de badges et monnaie aux vainqueurs

## Comment accéder à l'interface de tournoi

1. **Depuis le panneau Admin** (`/admin`)
2. Aller dans l'onglet **ÉVÉNEMENTS**
3. Sous-onglet **TYPES**
4. Sur chaque type d'événement, cliquer sur le bouton **🏆 TOURNOI**

## Étapes de création d'un tournoi

### 1. Configuration (Onglet 📋 CONFIGURATION)

- **Nom du Tournoi** : Donnez un nom descriptif (ex: "Championship Mario Kart 2025")
- **Date** : Sélectionnez la date et l'heure du tournoi
- Le type d'événement est automatiquement pré-rempli

### 2. Ajout des Joueurs (Onglet 👥 JOUEURS)

Vous avez deux options pour ajouter des joueurs :

#### Option A : Joueurs inscrits sur l'application
- Tapez le pseudo dans le champ de recherche
- Sélectionnez le joueur dans les résultats
- Les joueurs inscrits recevront automatiquement leurs récompenses

#### Option B : Joueurs non inscrits
- Entrez le nom du joueur dans le champ "Joueur non inscrit"
- Cliquez sur le bouton **+** ou appuyez sur Entrée
- Ces joueurs apparaîtront dans les résultats mais ne recevront pas de récompenses

**Important** : Il faut au minimum **2 joueurs** pour générer un tournoi.

Une fois tous les joueurs ajoutés, cliquez sur **🎯 GÉNÉRER L'ARBRE**

### 3. Gestion du Bracket (Onglet 🏆 ARBRE)

L'arbre est généré automatiquement avec :
- **Distribution aléatoire** des joueurs
- **Rounds organisés** : Quarts, Demi-finales, Finale
- **Matchs à compléter** progressivement

#### Entrer les scores

Pour chaque match :
1. Entrez le score du **Joueur 1** dans le champ de droite
2. Entrez le score du **Joueur 2** dans le champ de droite
3. Cliquez sur **VALIDER**
4. Le vainqueur est automatiquement déterminé et passe au tour suivant

**Astuce** : Les matchs se remplissent automatiquement au fur et à mesure que les vainqueurs sont déterminés.

### 4. Finalisation (Bouton TERMINER LE TOURNOI)

Une fois **tous les matchs terminés** et la **finale jouée** :
1. Cliquez sur **TERMINER LE TOURNOI**
2. Le système enregistre automatiquement :
   - Le tournoi dans la base de données
   - Les résultats (1er, 2ème, 3ème place)
   - Les récompenses pour les joueurs inscrits

### 5. Résultats (Onglet 🏅 RÉSULTATS)

Affiche :
- **Champion** : +500 TC
- **2ème place** : +300 TC
- **3ème place** : +150 TC
- Statistiques du tournoi (participants, matchs, rounds)

## Récompenses automatiques

### Pour les joueurs inscrits uniquement :

| Position | Monnaie (TC) | Victoires | Événements |
|----------|--------------|-----------|------------|
| 1er      | +500         | +1        | +1         |
| 2ème     | +300         | 0         | +1         |
| 3ème     | +150         | 0         | +1         |

### Enregistrement dans la base de données

Le système crée automatiquement :
- Un document dans `tournaments` avec tous les détails
- Des transactions pour chaque joueur récompensé
- Un événement dans `events` pour l'historique

## Structure de l'arbre (Bracket)

Le système génère un **bracket à élimination directe** :
- Taille du bracket = prochaine puissance de 2 (2, 4, 8, 16, 32...)
- Si nécessaire, des "byes" sont ajoutés automatiquement
- Exemple : 
  - 5 joueurs → bracket de 8 (3 byes)
  - 10 joueurs → bracket de 16 (6 byes)

## Exemples d'utilisation

### Tournoi Mario Kart (8 joueurs)
1. Créer le tournoi "Mario Kart Championship"
2. Ajouter 8 joueurs (mélange d'inscrits et non-inscrits)
3. Générer l'arbre → 3 rounds (Quarts, Demi, Finale)
4. Entrer les scores au fur et à mesure
5. Terminer et distribuer les récompenses

### Tournoi FIFA (16 joueurs)
1. Créer le tournoi "FIFA World Cup"
2. Ajouter 16 joueurs
3. Générer l'arbre → 4 rounds
4. Gérer les 15 matchs
5. Finaliser

## Notes importantes

⚠️ **Une fois l'arbre généré**, vous ne pouvez plus :
- Ajouter de joueurs
- Retirer des joueurs
- Modifier la configuration

✅ **Vous pouvez** :
- Modifier les scores tant que le match n'est pas validé
- Revenir en arrière dans les onglets
- Quitter et revenir (les données sont en mémoire)

🔒 **Sécurité** :
- Seuls les administrateurs peuvent accéder à cette interface
- Les récompenses ne sont distribuées qu'une seule fois
- Tous les changements sont enregistrés dans Firestore

## Firestore Collections utilisées

### `tournaments`
```javascript
{
  name: string,
  eventTypeId: string,
  eventTypeName: string,
  date: Date,
  status: 'setup' | 'ongoing' | 'completed',
  players: Player[],
  matches: Match[],
  winner: Player,
  secondPlace: Player,
  thirdPlace: Player,
  createdAt: Timestamp,
  completedAt: Timestamp
}
```

### `events` (créé automatiquement)
```javascript
{
  name: string,
  typeId: string,
  typeName: string,
  date: Date,
  winner: string,
  secondPlace: string,
  winnerPoints: 500,
  secondPlacePoints: 300,
  status: "completed",
  tournamentId: string,
  createdAt: Timestamp
}
```

### `transactions` (pour chaque récompense)
```javascript
{
  userId: string,
  amount: number,
  type: "EARN",
  description: string,
  date: string
}
```

## Améliorations futures possibles

- [ ] Sauvegarde automatique en temps réel dans Firestore
- [ ] Historique des tournois passés
- [ ] Statistiques par joueur
- [ ] Différents formats (double élimination, round-robin)
- [ ] Streaming en direct des résultats
- [ ] Notifications aux joueurs inscrits
- [ ] Export PDF des résultats
- [ ] Classement ELO

---

**Créé le** : 2025-12-05  
**Version** : 1.0  
**Interface** : `/tournaments`
