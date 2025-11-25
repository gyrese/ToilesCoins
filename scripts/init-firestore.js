// Script d'initialisation de la base de données Firestore
// Exécutez ce script avec: node scripts/init-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyD76tyqK8E3YxEVK_dN3yG29bOM9EID7h0",
    authDomain: "toilescoins.firebaseapp.com",
    projectId: "toilescoins",
    storageBucket: "toilescoins.firebasestorage.app",
    messagingSenderId: "8523289016",
    appId: "1:8523289016:web:10a1e30afdd98c84113f4d",
    measurementId: "G-75NXDXQ1FG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initializeDatabase() {
    console.log('🚀 Initialisation de la base de données Firestore...\n');

    try {
        // 1. Ajouter les récompenses
        console.log('📦 Ajout des récompenses...');
        const rewards = [
            { name: "Boisson Soft", cost: 100, icon: "🥤", description: "Une boisson soft au choix" },
            { name: "Pinte Bière", cost: 250, icon: "🍺", description: "Une pinte de bière" },
            { name: "Planche Mixte", cost: 500, icon: "🧀", description: "Planche de fromages et charcuterie" },
            { name: "T-Shirt", cost: 1500, icon: "👕", description: "T-shirt Les Toiles Noires" },
            { name: "Badge VIP", cost: 5000, icon: "👑", description: "Statut VIP pour 1 mois" },
            { name: "Shot Mystère", cost: 150, icon: "🧪", description: "Un shot surprise" },
            { name: "Burger Maison", cost: 400, icon: "🍔", description: "Burger fait maison" },
            { name: "Nachos XXL", cost: 350, icon: "🌮", description: "Grande portion de nachos" },
        ];

        for (const reward of rewards) {
            await addDoc(collection(db, "rewards"), reward);
            console.log(`  ✅ ${reward.name} ajouté`);
        }

        // 2. Ajouter des événements exemples
        console.log('\n🎉 Ajout des événements...');
        const events = [
            {
                title: "Soirée Karaoké",
                date: new Date(Date.now() + 86400000).toISOString(), // Demain
                type: "karaoke",
                rewardAmount: 200
            },
            {
                title: "Tournoi Smash Bros",
                date: new Date(Date.now() + 172800000).toISOString(), // Dans 2 jours
                type: "tournament",
                rewardAmount: 1000
            },
            {
                title: "Quiz Star Wars",
                date: new Date(Date.now() + 259200000).toISOString(), // Dans 3 jours
                type: "quiz",
                rewardAmount: 300
            },
            {
                title: "Blindtest Disney",
                date: new Date(Date.now() + 345600000).toISOString(), // Dans 4 jours
                type: "blindtest",
                rewardAmount: 250
            },
        ];

        for (const event of events) {
            await addDoc(collection(db, "events"), event);
            console.log(`  ✅ ${event.title} ajouté`);
        }

        // 3. Ajouter des badges exemples
        console.log('\n🎖️ Ajout des badges disponibles...');
        const badges = [
            { name: "Champion", icon: "🏆", color: "bg-yellow-200", description: "Gagner 10 tournois" },
            { name: "Fidèle", icon: "❤️", color: "bg-red-200", description: "Participer à 20 événements" },
            { name: "Expert", icon: "🧠", color: "bg-blue-200", description: "Gagner 5 quiz" },
            { name: "Nocturne", icon: "🌙", color: "bg-purple-200", description: "Venir 10 fois après minuit" },
            { name: "Social", icon: "🎤", color: "bg-pink-200", description: "Participer à 5 karaoké" },
        ];

        for (const badge of badges) {
            await addDoc(collection(db, "badges"), badge);
            console.log(`  ✅ Badge ${badge.name} ajouté`);
        }

        console.log('\n✨ Base de données initialisée avec succès !');
        console.log('\n📝 Prochaines étapes :');
        console.log('1. Créez un compte utilisateur via l\'application');
        console.log('2. Dans Firestore, trouvez votre utilisateur et changez role: "USER" en role: "ADMIN"');
        console.log('3. Rechargez l\'application et accédez à /admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        process.exit(1);
    }
}

initializeDatabase();
