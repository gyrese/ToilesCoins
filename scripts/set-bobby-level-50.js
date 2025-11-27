// Script pour mettre Bobby au niveau 50
// Exécuter avec: node scripts/set-bobby-level-50.js

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function setBobbyToLevel50() {
    try {
        // Rechercher Bobby dans la collection users
        const usersSnapshot = await db.collection('users')
            .where('pseudo', '==', 'bobby')
            .get();

        if (usersSnapshot.empty) {
            // Essayer avec Bobby (majuscule)
            const usersSnapshot2 = await db.collection('users')
                .where('pseudo', '==', 'Bobby')
                .get();

            if (usersSnapshot2.empty) {
                console.log('❌ Utilisateur Bobby non trouvé');
                console.log('Recherche de tous les utilisateurs...');

                const allUsers = await db.collection('users').get();
                console.log('\n📋 Utilisateurs disponibles:');
                allUsers.forEach(doc => {
                    const data = doc.data();
                    console.log(`- ${data.pseudo} (wins: ${data.wins || 0}, eventsCount: ${data.eventsCount || 0})`);
                });
                return;
            }

            const bobbyDoc = usersSnapshot2.docs[0];
            await updateBobby(bobbyDoc);
        } else {
            const bobbyDoc = usersSnapshot.empty[0];
            await updateBobby(bobbyDoc);
        }
    } catch (error) {
        console.error('❌ Erreur:', error);
    }
}

async function updateBobby(bobbyDoc) {
    const bobbyId = bobbyDoc.id;
    const currentData = bobbyDoc.data();

    console.log('\n📊 Données actuelles de Bobby:');
    console.log(`- Victoires: ${currentData.wins || 0}`);
    console.log(`- Événements: ${currentData.eventsCount || 0}`);
    console.log(`- Balance: ${currentData.balance || 0} TC`);

    // Calculer le niveau actuel
    const currentXP = ((currentData.wins || 0) * 500) + ((currentData.eventsCount || 0) * 100);
    const currentLevel = Math.min(50, Math.floor(currentXP / 1000) + 1);
    console.log(`- Niveau actuel: ${currentLevel}`);

    // Pour atteindre le niveau 50, il faut 49 000 XP
    // On va donner 98 victoires (98 * 500 = 49 000 XP)
    const newWins = 98;
    const newEventsCount = 10; // Quelques événements pour faire réaliste

    await db.collection('users').doc(bobbyId).update({
        wins: newWins,
        eventsCount: newEventsCount,
        balance: (currentData.balance || 0) + 5000 // Bonus de 5000 TC
    });

    const newXP = (newWins * 500) + (newEventsCount * 100);
    const newLevel = Math.min(50, Math.floor(newXP / 1000) + 1);

    console.log('\n✅ Bobby mis à jour !');
    console.log(`- Nouvelles victoires: ${newWins}`);
    console.log(`- Nouveaux événements: ${newEventsCount}`);
    console.log(`- XP total: ${newXP}`);
    console.log(`- Nouveau niveau: ${newLevel}`);
    console.log(`- Nouvelle balance: ${(currentData.balance || 0) + 5000} TC`);
    console.log('\n🎉 Bobby est maintenant NIVEAU 50 - LEGENDARY !');
}

setBobbyToLevel50();
