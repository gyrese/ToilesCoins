# 📋 TODO - Système de Tournoi ToilesCoins

## ✅ Fonctionnalités Implémentées

### Gestion du Tournoi
- [x] Création de tournoi à partir d'un événement
- [x] Ajout de joueurs (inscrits ou non-inscrits)
- [x] Recherche de joueurs inscrits par pseudo
- [x] Suppression de joueurs
- [x] Choix du format : Élimination directe ou Poules + Playoffs
- [x] Sauvegarde automatique avec debounce (1s)
- [x] Sauvegarde manuelle avec bouton
- [x] Boutons de réinitialisation (Tableau seul / Tout)

### Génération du Bracket
- [x] Génération automatique des matchs
- [x] Gestion des byes (exempts) pour nombre impair de joueurs
- [x] Système de seeding aléatoire
- [x] Propagation automatique des byes en cascade
- [x] Liaison des matchs avec nextMatchId

### Scores et Propagation
- [x] Saisie des scores par match
- [x] Détermination automatique du vainqueur
- [x] Propagation du vainqueur vers le match suivant
- [x] Système de slots basé sur l'index du match (pair→player1, impair→player2)
- [x] Bouton RECALCULER pour forcer la propagation
- [x] Points de poule (3 pts victoire, 1 pt nul)

### Phase de Poules
- [x] Génération des poules équilibrées
- [x] Matchs round-robin dans chaque poule
- [x] Classement automatique
- [x] Qualification du top 2 par poule
- [x] Génération du bracket knockout depuis les poules

### Page Publique
- [x] URL unique avec publicId
- [x] QR Code pour accès facile
- [x] Design Bootstrap responsive
- [x] Mise à jour en temps réel (Firestore listener)
- [x] Affichage avatars joueurs inscrits
- [x] Podium champion avec 2ème et 3ème

### Récompenses
- [x] Distribution ToilesCoins automatique :
  - 🥇 1er : 500 TC
  - 🥈 2ème : 300 TC  
  - 🥉 3ème : 150 TC
- [x] Transaction enregistrée dans l'historique
- [x] Incrémentation des stats (wins, eventsCount)
- [x] Attribution automatique des badges :
  - Badge "first_victory_type" (première victoire par type)
  - Badges basés sur wins, balance, events

### Interface Admin
- [x] Design neo-brutalist jaune
- [x] Onglets : Accueil, Joueurs, Matchs, Résultats
- [x] Visualisation des rounds (Quarts, Demis, Finale)
- [x] Containers étroits (max-w-2xl) pour meilleure lisibilité
- [x] Boutons lisibles (fond blanc, texte noir)

---

## 🔄 Améliorations Futures Possibles

### Priorité Haute
- [ ] Affichage visuel du bracket en arbre (style tournoi classique)
- [ ] Petite finale (match pour la 3ème place)
- [ ] Mode spectateur temps réel amélioré avec animations
- [ ] Notifications push quand un match est terminé

### Priorité Moyenne
- [ ] Historique des tournois passés
- [ ] Export PDF du bracket
- [ ] Seeding manuel (drag & drop)
- [ ] Double élimination (bracket winner + loser)
- [ ] Swiss system pour grands tournois
- [ ] Minuteur par match

### Priorité Basse
- [ ] Prédictions des spectateurs
- [ ] Commentaires live sur la page publique
- [ ] Intégration Discord/Twitch alerts
- [ ] Statistiques joueurs (ratio victoires, historique)
- [ ] Mode multi-admins

---

## 🐛 Bugs Connus

- [ ] Le `confirm()` natif est bloqué par certains navigateurs (contourné en le supprimant)
- [ ] Si on modifie un score après propagation, il faut cliquer RECALCULER

---

## 📁 Fichiers Principaux

- `app/tournaments/page.tsx` - Page admin gestion tournoi
- `app/tournament/[publicId]/page.tsx` - Page publique spectateurs
- Collection Firestore : `tournaments`
- Collection Firestore : `badges` (pour attribution)

---

*Dernière mise à jour : 10/12/2024*
