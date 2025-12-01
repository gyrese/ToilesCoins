/**
 * Script de correction du badge "All Star"
 * 
 * Ce script trouve l'ID du type d'événement "All Star Beer Pong"
 * et met à jour le badge "All Star" avec le bon conditionValue.
 * 
 * Usage: node scripts/fixAllStarBadge.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixAllStarBadge() {
    console.log('🔧 CORRECTION DU BADGE "ALL STAR"');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Trouver le type d'événement "All Star Beer Pong"
        console.log('🔍 Recherche du type d\'événement "All Star Beer Pong"...');

        const typesSnapshot = await db.collection('eventTypes')
            .where('name', '==', 'All Star Beer Pong')
            .get();

        if (typesSnapshot.empty) {
            console.error('❌ Type d\'événement "All Star Beer Pong" non trouvé !');
            console.log('\n📋 Types disponibles :');

            const allTypes = await db.collection('eventTypes').get();
            allTypes.docs.forEach(doc => {
                console.log(`   - ${doc.data().name} (ID: ${doc.id})`);
            });

            process.exit(1);
        }

        const eventTypeDoc = typesSnapshot.docs[0];
        const eventTypeId = eventTypeDoc.id;

        console.log(`✅ Type trouvé : "${eventTypeDoc.data().name}" (ID: ${eventTypeId})\n`);

        // 2. Trouver le badge "All Star"
        console.log('🔍 Recherche du badge "All Star"...');

        const badgesSnapshot = await db.collection('badges')
            .where('name', '==', 'All Star')
            .get();

        if (badgesSnapshot.empty) {
            console.error('❌ Badge "All Star" non trouvé !');
            process.exit(1);
        }

        const badgeDoc = badgesSnapshot.docs[0];
        console.log(`✅ Badge trouvé : "${badgeDoc.data().name}"\n`);

        // 3. Mettre à jour le badge avec le bon conditionValue
        console.log(`🔧 Mise à jour du badge...`);
        console.log(`   Ancienne valeur : ${badgeDoc.data().conditionValue}`);
        console.log(`   Nouvelle valeur : ${eventTypeId}`);

        await db.collection('badges').doc(badgeDoc.id).update({
            conditionValue: eventTypeId
        });

        console.log('\n✅ Badge "All Star" corrigé avec succès !');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer la correction
fixAllStarBadge();
