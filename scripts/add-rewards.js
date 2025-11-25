const admin = require('firebase-admin');
const path = require('path');

// ⚠️ IMPORTANT : Vous devez télécharger votre clé privée depuis Firebase Console
// et la sauvegarder sous le nom "serviceAccountKey.json" à la racine du projet
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

try {
    admin.initializeApp({
        credential: admin.credential.cert(require(serviceAccountPath))
    });
} catch (error) {
    console.error('❌ ERREUR : Impossible de trouver "serviceAccountKey.json"');
    console.error('👉 Allez dans Firebase Console > Paramètres du projet > Comptes de service > Générer une nouvelle clé privée');
    console.error('👉 Renommez le fichier téléchargé en "serviceAccountKey.json" et placez-le à la racine du projet');
    process.exit(1);
}

const db = admin.firestore();

const rewards = [
    // Boissons & Snacks (100-300 TC)
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
        // 1. Supprimer les anciennes récompenses pour éviter les doublons
        const snapshot = await db.collection('rewards').get();
        if (!snapshot.empty) {
            console.log(`🗑️ Suppression de ${snapshot.size} anciennes récompenses...`);
            const batchDelete = db.batch();
            snapshot.docs.forEach((doc) => {
                batchDelete.delete(doc.ref);
            });
            await batchDelete.commit();
        }

        // 2. Ajouter les nouvelles récompenses
        console.log('📦 Ajout des nouvelles récompenses...');
        const batchAdd = db.batch();

        rewards.forEach((reward) => {
            const docRef = db.collection('rewards').doc();
            batchAdd.set(docRef, reward);
            console.log(`   + ${reward.icon} ${reward.name} (${reward.cost} TC)`);
        });

        await batchAdd.commit();
        console.log(`\n✅ SUCCÈS ! ${rewards.length} récompenses ont été mises à jour.`);
        console.log('\n📊 Répartition par catégorie:');
        console.log('   • Boissons & Snacks: 4 items (80-250 TC)');
        console.log('   • Nourriture: 4 items (350-550 TC)');
        console.log('   • Goodies & Avantages: 4 items (800-2500 TC)');
        console.log('   • Premium: 2 items (3000-5000 TC)');

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour :', error);
    }
}

updateRewards();
