// Script pour ajouter/mettre à jour les récompenses dans Firestore
// Version simplifiée sans dépendances externes

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Lire .env.local manuellement
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

// Configuration Firebase
const firebaseConfig = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rewards = [
    // Boissons & Snacks (80-300 TC)
    { name: "Café Espresso", cost: 80, icon: "☕", description: "Un café espresso bien serré" },
    { name: "Boisson Soft", cost: 100, icon: "🥤", description: "Une boisson soft au choix" },
    { name: "Shot Mystère", cost: 150, icon: "🧪", description: "Un shot surprise du barman" },
    { name: "Pinte Bière", cost: 250, icon: "🍺", description: "Une pinte de bière pression" },

    // Nourriture (300-600 TC)
    { name: "Nachos XXL", cost: 350, icon: "🌮", description: "Grande portion de nachos" },
    { name: "Burger Maison", cost: 400, icon: "🍔", description: "Burger fait maison avec frites" },
    { name: "Planche Mixte", cost: 500, icon: "🧀", description: "Planche fromages et charcuterie" },
    { name: "Pizza Margherita", cost: 550, icon: "🍕", description: "Pizza margherita artisanale" },

    // Goodies & Avantages (800-2000 TC)
    { name: "Casquette TN", cost: 800, icon: "🧢", description: "Casquette Les Toiles Noires" },
    { name: "T-Shirt Collector", cost: 1500, icon: "👕", description: "T-shirt édition limitée" },
    { name: "Entrée Gratuite", cost: 1200, icon: "🎫", description: "1 entrée gratuite pour un événement" },
    { name: "Pack Soirée VIP", cost: 2500, icon: "🎉", description: "Table VIP + 2 bouteilles" },

    // Premium (3000+ TC)
    { name: "Badge VIP Mensuel", cost: 3000, icon: "👑", description: "Statut VIP pour 1 mois" },
    { name: "Soirée Privée", cost: 5000, icon: "🎊", description: "Organisation d'une soirée privée" }
];

async function updateRewards() {
    console.log('🚀 Démarrage de la mise à jour des récompenses...');

    try {
        // 1. Supprimer les anciennes récompenses
        const snapshot = await getDocs(collection(db, 'rewards'));
        if (!snapshot.empty) {
            console.log(`🗑️ Suppression de ${snapshot.size} anciennes récompenses...`);
            for (const doc of snapshot.docs) {
                await deleteDoc(doc.ref);
            }
        }

        // 2. Ajouter les nouvelles récompenses
        console.log('📦 Ajout des nouvelles récompenses...');
        for (const reward of rewards) {
            await addDoc(collection(db, 'rewards'), reward);
            console.log(`   + ${reward.icon} ${reward.name} (${reward.cost} TC)`);
        }

        console.log(`\n✅ SUCCÈS ! ${rewards.length} récompenses ont été mises à jour.`);
        console.log('\n📊 Répartition par catégorie:');
        console.log('   • Boissons & Snacks: 4 items (80-250 TC)');
        console.log('   • Nourriture: 4 items (350-550 TC)');
        console.log('   • Goodies & Avantages: 4 items (800-2500 TC)');
        console.log('   • Premium: 2 items (3000-5000 TC)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour :', error);
        process.exit(1);
    }
}

updateRewards();
