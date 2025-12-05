# 🧪 Guide de Test - Système de Tournois

## Checklist de test complète

### ✅ Phase 1 : Accès et Navigation

- [ ] **Test 1.1** : Connexion en tant qu'admin
  - Aller sur `/login`
  - Se connecter avec un compte admin
  - Vérifier l'accès au dashboard

- [ ] **Test 1.2** : Accès au panneau admin
  - Aller sur `/admin`
  - Vérifier que la page charge correctement
  - Vérifier l'affichage des onglets

- [ ] **Test 1.3** : Navigation vers les types d'événements
  - Cliquer sur l'onglet "ÉVÉNEMENTS"
  - Cliquer sur le sous-onglet "TYPES"
  - Vérifier l'affichage des types existants

- [ ] **Test 1.4** : Bouton Tournoi visible
  - Vérifier la présence du bouton "🏆 TOURNOI" sur chaque type
  - Vérifier le style (vert avec hover)

### ✅ Phase 2 : Configuration du Tournoi

- [ ] **Test 2.1** : Accès à l'interface de tournoi
  - Cliquer sur "🏆 TOURNOI" pour un type d'événement
  - Vérifier la redirection vers `/tournaments?typeId=...&typeName=...`
  - Vérifier l'affichage du header avec le nom du type

- [ ] **Test 2.2** : Configuration initiale
  - Vérifier l'onglet "📋 CONFIGURATION" actif par défaut
  - Entrer un nom de tournoi (ex: "Test Championship 2025")
  - Sélectionner une date
  - Vérifier que les champs sont bien remplis

- [ ] **Test 2.3** : Bouton retour admin
  - Cliquer sur "RETOUR ADMIN"
  - Vérifier le retour à `/admin`

### ✅ Phase 3 : Gestion des Joueurs

- [ ] **Test 3.1** : Navigation vers l'onglet joueurs
  - Cliquer sur l'onglet "👥 JOUEURS"
  - Vérifier l'affichage du formulaire d'ajout

- [ ] **Test 3.2** : Recherche de joueurs inscrits
  - Taper un pseudo existant dans le champ de recherche
  - Vérifier l'affichage des résultats
  - Cliquer sur un résultat
  - Vérifier l'ajout du joueur avec badge "✅ Inscrit"

- [ ] **Test 3.3** : Ajout de joueurs non inscrits
  - Entrer un nom dans le champ "Joueur non inscrit"
  - Cliquer sur le bouton "+"
  - Vérifier l'ajout du joueur avec badge "👤 Invité"

- [ ] **Test 3.4** : Gestion de la liste
  - Ajouter au moins 4 joueurs (mélange inscrits/invités)
  - Vérifier le compteur "(X)" dans l'onglet
  - Retirer un joueur avec le bouton "RETIRER"
  - Vérifier la mise à jour de la liste

- [ ] **Test 3.5** : Validation minimum
  - Essayer de générer avec 0 joueur → Message d'erreur attendu
  - Essayer de générer avec 1 joueur → Message d'erreur attendu
  - Ajouter un 2ème joueur → Bouton "GÉNÉRER L'ARBRE" doit apparaître

### ✅ Phase 4 : Génération du Bracket

- [ ] **Test 4.1** : Génération avec 2 joueurs
  - Générer l'arbre avec 2 joueurs
  - Vérifier : 1 match, 1 round (FINALE)
  - Vérifier la redirection vers l'onglet "🏆 ARBRE"

- [ ] **Test 4.2** : Génération avec 4 joueurs
  - Recommencer avec 4 joueurs
  - Vérifier : 3 matchs, 2 rounds (DEMI-FINALES + FINALE)

- [ ] **Test 4.3** : Génération avec 8 joueurs
  - Recommencer avec 8 joueurs
  - Vérifier : 7 matchs, 3 rounds (QUARTS + DEMI + FINALE)

- [ ] **Test 4.4** : Génération avec nombre impair (5 joueurs)
  - Générer avec 5 joueurs
  - Vérifier : bracket de 8 (3 byes)
  - Vérifier que certains joueurs passent automatiquement

### ✅ Phase 5 : Gestion des Matchs

- [ ] **Test 5.1** : Affichage des matchs
  - Vérifier l'organisation par rounds
  - Vérifier les labels des rounds (QUARTS, DEMI, FINALE)
  - Vérifier l'affichage des noms de joueurs

- [ ] **Test 5.2** : Saisie des scores
  - Pour un match du premier round :
    - Entrer un score pour le joueur 1 (ex: 5)
    - Entrer un score pour le joueur 2 (ex: 3)
    - Cliquer sur "VALIDER"
    - Vérifier : bordure verte sur le vainqueur
    - Vérifier : message "✅ Vainqueur: [nom]"

- [ ] **Test 5.3** : Progression automatique
  - Terminer tous les matchs d'un round
  - Vérifier que les vainqueurs apparaissent dans le round suivant
  - Vérifier que les champs "TBD" sont remplacés

- [ ] **Test 5.4** : Scores égaux
  - Entrer des scores égaux (ex: 3-3)
  - Vérifier qu'aucun vainqueur n'est déterminé
  - Modifier pour avoir un vainqueur

- [ ] **Test 5.5** : Modification impossible après validation
  - Valider un match
  - Vérifier que les champs de score sont désactivés (disabled)

### ✅ Phase 6 : Finalisation du Tournoi

- [ ] **Test 6.1** : Terminer tous les matchs
  - Jouer tous les matchs jusqu'à la finale
  - Vérifier que tous les rounds sont complétés

- [ ] **Test 6.2** : Bouton "TERMINER LE TOURNOI"
  - Vérifier l'apparition du bouton après la finale
  - Cliquer sur "TERMINER LE TOURNOI"
  - Vérifier le message de succès

- [ ] **Test 6.3** : Redirection vers résultats
  - Vérifier la redirection automatique vers l'onglet "🏅 RÉSULTATS"
  - Vérifier l'apparition du nouvel onglet dans la navigation

### ✅ Phase 7 : Affichage des Résultats

- [ ] **Test 7.1** : Podium
  - Vérifier l'affichage du champion (fond jaune, trophée)
  - Vérifier l'affichage de la 2ème place (fond gris)
  - Vérifier l'affichage de la 3ème place (fond orange)

- [ ] **Test 7.2** : Récompenses affichées
  - Champion : "+500 TC" visible
  - 2ème : "+300 TC" visible
  - 3ème : "+150 TC" visible
  - Vérifier que seuls les joueurs inscrits ont les récompenses affichées

- [ ] **Test 7.3** : Statistiques
  - Vérifier le nombre de participants
  - Vérifier le nombre de matchs
  - Vérifier le nombre de rounds

### ✅ Phase 8 : Vérification Base de Données

- [ ] **Test 8.1** : Collection `tournaments`
  - Aller dans Firebase Console
  - Vérifier la création du document dans `tournaments`
  - Vérifier les champs : name, players, matches, winner, etc.
  - Vérifier le statut : "completed"

- [ ] **Test 8.2** : Collection `events`
  - Vérifier la création d'un événement
  - Vérifier : winner, secondPlace, winnerPoints, tournamentId

- [ ] **Test 8.3** : Collection `transactions`
  - Vérifier 3 transactions (une par position)
  - Vérifier les montants : 500, 300, 150
  - Vérifier le type : "EARN"
  - Vérifier les descriptions

- [ ] **Test 8.4** : Collection `users`
  - Pour le champion inscrit :
    - Vérifier `balance` : +500
    - Vérifier `wins` : +1
    - Vérifier `eventsCount` : +1
  - Pour les 2ème et 3ème inscrits :
    - Vérifier `balance` : +300 et +150
    - Vérifier `eventsCount` : +1

### ✅ Phase 9 : Tests de Sécurité

- [ ] **Test 9.1** : Accès non-admin
  - Se déconnecter
  - Se connecter avec un compte non-admin
  - Essayer d'accéder à `/tournaments`
  - Vérifier : message "ACCÈS REFUSÉ"

- [ ] **Test 9.2** : Accès sans connexion
  - Se déconnecter
  - Essayer d'accéder à `/tournaments`
  - Vérifier : redirection vers `/login`

- [ ] **Test 9.3** : Paramètres URL manquants
  - Accéder à `/tournaments` sans paramètres
  - Vérifier le comportement (champs vides ou erreur)

### ✅ Phase 10 : Tests de Performance

- [ ] **Test 10.1** : Grand tournoi (16 joueurs)
  - Créer un tournoi avec 16 joueurs
  - Générer le bracket (15 matchs)
  - Vérifier que l'interface reste fluide
  - Terminer tous les matchs

- [ ] **Test 10.2** : Grand tournoi (32 joueurs)
  - Créer un tournoi avec 32 joueurs
  - Générer le bracket (31 matchs)
  - Vérifier les performances

- [ ] **Test 10.3** : Temps de sauvegarde
  - Mesurer le temps de finalisation
  - Vérifier que c'est < 5 secondes

### ✅ Phase 11 : Tests Edge Cases

- [ ] **Test 11.1** : Caractères spéciaux
  - Nom de tournoi avec émojis : "🏆 Test 2025"
  - Nom de joueur avec accents : "François"
  - Vérifier l'affichage correct

- [ ] **Test 11.2** : Noms très longs
  - Nom de tournoi de 100 caractères
  - Nom de joueur de 50 caractères
  - Vérifier le comportement (troncature ou scroll)

- [ ] **Test 11.3** : Scores extrêmes
  - Score de 0
  - Score de 999
  - Vérifier le calcul du vainqueur

- [ ] **Test 11.4** : Doublons
  - Essayer d'ajouter le même joueur deux fois
  - Vérifier : message d'erreur

### ✅ Phase 12 : Tests Responsive

- [ ] **Test 12.1** : Mobile (375px)
  - Vérifier l'affichage sur petit écran
  - Vérifier que les boutons sont cliquables
  - Vérifier le scroll horizontal absent

- [ ] **Test 12.2** : Tablet (768px)
  - Vérifier la grille 2 colonnes pour les matchs
  - Vérifier la navigation

- [ ] **Test 12.3** : Desktop (1920px)
  - Vérifier la grille 3 colonnes
  - Vérifier l'espacement

## 📊 Résultats Attendus

### Succès Total
- ✅ Tous les tests passent
- ✅ Aucune erreur console
- ✅ Données correctement enregistrées
- ✅ Interface fluide et responsive

### Critères de Validation
- **Fonctionnalité** : 100% des features opérationnelles
- **Sécurité** : Accès restreint aux admins
- **Performance** : < 5s pour finalisation
- **UX** : Interface intuitive et claire
- **Data** : Intégrité des données garantie

## 🐛 Bugs Connus

_Aucun bug connu pour le moment_

## 📝 Notes de Test

- Tester avec différents navigateurs (Chrome, Firefox, Safari)
- Tester avec différentes connexions (Wi-Fi, 4G)
- Tester avec plusieurs admins simultanément
- Vérifier les logs Firebase pour les erreurs

---

**Date de création** : 2025-12-05  
**Version testée** : 1.0  
**Testeur** : _À compléter_  
**Statut** : _À compléter_
