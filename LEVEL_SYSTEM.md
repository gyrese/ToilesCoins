# 🎮 Système de Niveaux et Animations - ToilesCoins

## 📊 Calcul du Niveau

Le niveau est calculé selon la formule suivante :
- **1 Victoire** = 500 XP
- **1 Événement participé** = 100 XP
- **Niveau** = (XP total / 1000) + 1
- **Niveau maximum** = 50

### Formule
```javascript
const xp = ((userData.wins || 0) * 500) + ((userData.eventsCount || 0) * 100);
const level = Math.floor(xp / 1000) + 1;
const finalLevel = Math.min(50, level);
```

## 🎨 Paliers de Niveau et Effets Visuels

### Niveau 1-9 : **Novice**
- Taille : 2rem
- Couleur : Noir simple
- Aucune animation

### Niveau 10-19 : **Initié Bronze**
- Taille : 2.2rem
- Couleur : #333
- Ombre : Jaune (#FFC845)

### Niveau 20-24 : **Initié Argent**
- Taille : 2.4rem
- Couleur : #4a4a4a
- Ombre : Jaune avec glow léger
- Espacement des lettres : 1px

### Niveau 25-29 : **Initié Or**
- Taille : 2.5rem
- Couleur : #2c2c2c
- Ombre : Jaune avec glow moyen
- Espacement : 1.5px
- **Animation** : `subtle-glow` (pulsation douce)

### Niveau 30-34 : **Expert**
- Taille : 2.6rem
- Effet : Dégradé noir animé
- Ombre : Jaune avec drop-shadow
- **Animation** : `gradient-shift` (dégradé mobile)

### Niveau 35-39 : **Expert Confirmé**
- Taille : 2.7rem
- Effet : Dégradé noir/gris animé
- Ombre : Jaune avec glow fort
- **Animations** : `gradient-shift` + `float` (lévitation)

### Niveau 40-44 : **Légende**
- Taille : 2.8rem
- Couleur : Blanc avec contour noir
- Ombre : Jaune avec glow intense
- **Animations** : `float` + `glow-pulse` (pulsation lumineuse)

### Niveau 45-49 : **Légende Dorée**
- Taille : 3rem
- Couleur : #FFE55C avec contour noir (1.5px)
- Ombre : Jaune + Or avec glow très intense
- **Animations** : `float` (rapide) + `glow-pulse` (rapide)

### Niveau 50 : **MAX LEVEL - Legendary** 🏆
- Taille : 3.2rem
- Effet : Dégradé animé Or/Orange/Rouge
- Contour : Noir épais (2px)
- Ombre : Multiple (noir, or, rouge-orange)
- **Animations** : `pulse` + `shine` + `float` (triple animation)

## 🎬 Animations Disponibles

### `pulse`
Agrandissement/rétrécissement doux (scale 1 → 1.05 → 1)

### `float`
Lévitation verticale (-5px → 0 → -5px)

### `shine`
Déplacement du dégradé de fond (effet brillant)

### `gradient-shift`
Déplacement du dégradé de texte

### `glow-pulse`
Pulsation de l'intensité lumineuse des ombres

### `subtle-glow`
Pulsation douce de l'ombre jaune

## 🎯 Classes CSS Utilisées

Les classes sont appliquées dynamiquement via la fonction `getPseudoClass()` :

```tsx
const getPseudoClass = () => {
    if (level >= 50) return "pseudo-level-50";
    if (level >= 45) return "pseudo-level-45";
    if (level >= 40) return "pseudo-level-40";
    if (level >= 35) return "pseudo-level-35";
    if (level >= 30) return "pseudo-level-30";
    if (level >= 25) return "pseudo-level-25";
    if (level >= 20) return "pseudo-level-20";
    if (level >= 10) return "pseudo-level-10";
    return "pseudo-level-1";
};
```

## 📈 Progression Recommandée

Pour atteindre le niveau 50, un joueur doit accumuler **49 000 XP**, soit :
- **98 victoires** (98 × 500 = 49 000 XP)
- Ou **490 événements** (490 × 100 = 49 000 XP)
- Ou un mix (ex: 80 victoires + 90 événements = 49 000 XP)

## 🎨 Polices Utilisées

- **Pseudo** : `PaybAck` (police personnalisée) avec fallback sur `Black Ops One`
- **Classes** : Impact, Arial Black
- **Général** : Inter

## 🔧 Fichiers Concernés

- `app/profile/page.tsx` : Logique de calcul et styles inline
- `app/contexts/AuthContext.tsx` : Interface UserData
- `app/globals.css` : Classe `.font-payback`
- `public/fonts/PaybAck.ttf` : Fichier de police
