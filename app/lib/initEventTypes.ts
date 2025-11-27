// Script pour initialiser les types d'événements dans Firestore
// À exécuter une seule fois pour créer les types d'événements par défaut

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const defaultEventTypes = [
    {
        name: "Tournoi",
        emoji: "🎮",
        icon: "https://api.dicebear.com/9.x/shapes/svg?seed=tournament&backgroundColor=ff6b35",
        color: "#FF6B35"
    },
    {
        name: "Blind Test",
        emoji: "🎵",
        icon: "https://api.dicebear.com/9.x/shapes/svg?seed=blindtest&backgroundColor=4ecdc4",
        color: "#4ECDC4"
    },
    {
        name: "Blindlotoquine",
        emoji: "🎲",
        icon: "https://api.dicebear.com/9.x/shapes/svg?seed=blindloto&backgroundColor=95e1d3",
        color: "#95E1D3"
    },
    {
        name: "Apéro Quiz",
        emoji: "🍻",
        icon: "https://api.dicebear.com/9.x/shapes/svg?seed=aperoquiz&backgroundColor=f38181",
        color: "#F38181"
    }
];

export async function initializeEventTypes() {
    try {
        for (const eventType of defaultEventTypes) {
            await addDoc(collection(db, "eventTypes"), eventType);
        }
        console.log("✅ Types d'événements initialisés");
    } catch (error) {
        console.error("❌ Erreur:", error);
    }
}

// Pour exécuter : appeler initializeEventTypes() depuis un composant
