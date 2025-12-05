# 🎯 Système d'Accès aux Tournois depuis l'Historique des Événements

## Modifications Apportées

### 1. **Formulaire de Création d'Événement** (`/admin` → ÉVÉNEMENTS → CRÉATION)

Ajout d'un champ checkbox pour marquer un événement comme tournoi :

```tsx
<div className="p-4 bg-purple-100 border-2 border-purple-600">
    <label className="flex items-center gap-3 cursor-pointer">
        <input
            type="checkbox"
            name="isTournament"
            className="w-5 h-5 border-2 border-black"
        />
        <span className="font-bold text-sm uppercase">🏆 Cet événement est un TOURNOI</span>
    </label>
    <p className="text-xs mt-2 opacity-70">
        Cochez cette case si vous souhaitez gérer cet événement comme un tournoi avec bracket.
    </p>
</div>
```

**Fonctionnement :**
- Lorsque vous créez un événement, vous pouvez maintenant cocher cette case
- Le champ `isTournament: true` sera sauvegardé dans Firestore
- Cela permet de différencier les événements normaux des tournois

---

### 2. **Sauvegarde dans Firestore**

Le champ `isTournament` est maintenant inclus lors de la création :

```typescript
const isTournament = formData.get('isTournament') === 'on';

await addDoc(collection(db, "events"), {
    name: formData.get('eventName'),
    description: formData.get('eventDesc') || "",
    date: new Date(formData.get('eventDate') as string),
    place: formData.get('eventPlace') || "",
    typeId: selectedType?.id || null,
    typeName: selectedType?.name || null,
    typeEmoji: selectedType?.emoji || null,
    typeIcon: selectedType?.icon || null,
    imageUrl: finalImageUrl || null,
    link: eventLinkInput || null,
    isTournament: isTournament,  // ✅ NOUVEAU
    status: "upcoming",
    createdAt: serverTimestamp()
});
```

---

### 3. **Bouton "GÉRER TOURNOI" dans l'Historique** (`/admin` → ÉVÉNEMENTS → HISTORIQUE)

Ajout d'un bouton conditionnel pour accéder à la gestion du tournoi :

```tsx
{event.isTournament && event.status !== 'completed' && event.typeId && (
    <button
        onClick={() => router.push(`/tournaments?typeId=${event.typeId}&typeName=${encodeURIComponent(event.typeName || 'Tournoi')}&eventId=${event.id}`)}
        className="px-3 py-2 bg-purple-400 border-2 border-black font-bold text-sm hover:bg-purple-300 whitespace-nowrap"
    >
        🏆 GÉRER TOURNOI
    </button>
)}
```

**Conditions d'affichage du bouton :**
- ✅ `event.isTournament` : L'événement doit être marqué comme tournoi
- ✅ `event.status !== 'completed'` : Le tournoi ne doit pas être terminé
- ✅ `event.typeId` : Un type d'événement doit être associé

---

## Workflow Complet

### Étape 1 : Créer un Événement Tournoi

1. Aller dans **Admin** → **ÉVÉNEMENTS** → **CRÉATION**
2. Remplir le formulaire :
   - Choisir le **TYPE D'ÉVÉNEMENT** (ex: Mario Kart)
   - Entrer le **NOM** (ex: "Tournoi Mario Kart Décembre 2024")
   - Définir la **DATE**
   - Ajouter le **LIEU** (optionnel)
   - ✅ **COCHER** la case "🏆 Cet événement est un TOURNOI"
3. Cliquer sur **➕ AJOUTER L'ÉVÉNEMENT**

### Étape 2 : Accéder à la Gestion du Tournoi

1. Aller dans **Admin** → **ÉVÉNEMENTS** → **HISTORIQUE**
2. Trouver l'événement créé
3. Cliquer sur le bouton **🏆 GÉRER TOURNOI** (visible uniquement pour les tournois non terminés)
4. Vous serez redirigé vers `/tournaments?typeId=X&typeName=Y&eventId=Z`

### Étape 3 : Gérer le Tournoi

Une fois sur la page `/tournaments`, vous pouvez :
- Ajouter des joueurs (inscrits ou invités)
- Générer l'arbre du tournoi
- Entrer les scores des matchs
- Finaliser le tournoi et distribuer les récompenses

---

## Structure de Données Firestore

### Collection `events`

```javascript
{
  id: "abc123",
  name: "Tournoi Mario Kart Décembre 2024",
  description: "Grand tournoi de fin d'année",
  date: Timestamp,
  place: "Bar Le Pixel",
  typeId: "xyz789",
  typeName: "Mario Kart",
  typeEmoji: "🏎️",
  typeIcon: "https://...",
  imageUrl: "https://...",
  link: "https://facebook.com/...",
  isTournament: true,  // ✅ NOUVEAU CHAMP
  status: "upcoming",  // "upcoming" | "completed"
  createdAt: Timestamp,
  
  // Champs optionnels (remplis après le tournoi)
  winner: "Pseudo1",
  secondPlace: "Pseudo2",
  winnerPoints: 500,
  secondPlacePoints: 300,
  completedAt: Timestamp
}
```

---

## Avantages de ce Système

### ✅ Flexibilité
- Tous les événements ne sont pas forcément des tournois
- Vous pouvez créer des événements simples sans bracket

### ✅ Traçabilité
- L'historique montre tous les événements (tournois et non-tournois)
- Le bouton "GÉRER TOURNOI" n'apparaît que quand c'est pertinent

### ✅ Workflow Intuitif
1. Créer l'événement avec le type approprié
2. Marquer comme tournoi si nécessaire
3. Accéder à la gestion depuis l'historique
4. Gérer le bracket et les résultats

### ✅ Sécurité
- Le bouton disparaît une fois le tournoi terminé
- Impossible d'accéder à la gestion d'un tournoi déjà complété

---

## Exemples d'Utilisation

### Exemple 1 : Tournoi Mario Kart

```
1. Créer événement :
   - Type: Mario Kart
   - Nom: "Championship Mario Kart 2024"
   - Date: 2024-12-15 20:00
   - ✅ Cocher "Tournoi"

2. Dans l'historique :
   - Voir l'événement avec badge "⏳ À VENIR"
   - Cliquer sur "🏆 GÉRER TOURNOI"

3. Sur /tournaments :
   - Ajouter 8 joueurs
   - Générer bracket
   - Entrer les scores
   - Terminer le tournoi

4. Retour à l'historique :
   - Badge devient "✅ TERMINÉ"
   - Bouton "GÉRER TOURNOI" disparaît
```

### Exemple 2 : Événement Simple (Non-Tournoi)

```
1. Créer événement :
   - Type: Karaoké
   - Nom: "Soirée Karaoké"
   - Date: 2024-12-20 21:00
   - ❌ NE PAS cocher "Tournoi"

2. Dans l'historique :
   - Voir l'événement
   - PAS de bouton "GÉRER TOURNOI"
   - Seulement "✏️ MODIFIER" et "SUPP"
```

---

## Notes Techniques

### Correction de Lint
- Ajout de `typeId: ""` dans le reset du formulaire d'édition
- Correction de l'erreur TypeScript sur `setEventForm`

### Compatibilité
- Fonctionne avec les événements existants (pas de migration nécessaire)
- Les événements sans `isTournament` sont considérés comme non-tournois

### URL de Redirection
```
/tournaments?typeId=${event.typeId}&typeName=${encodeURIComponent(event.typeName)}&eventId=${event.id}
```

**Paramètres :**
- `typeId` : ID du type d'événement
- `typeName` : Nom du type (encodé pour l'URL)
- `eventId` : ID de l'événement (pour lier le tournoi à l'événement)

---

## Prochaines Améliorations Possibles

- [ ] Lier automatiquement le tournoi terminé à l'événement
- [ ] Afficher le bracket dans l'historique pour les tournois terminés
- [ ] Permettre de reprendre un tournoi en cours
- [ ] Statistiques par type de tournoi
- [ ] Export PDF des résultats du tournoi

---

**Créé le** : 2025-12-05  
**Version** : 1.1  
**Fichier modifié** : `app/admin/page.tsx`
