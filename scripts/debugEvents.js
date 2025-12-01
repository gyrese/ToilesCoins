/**
 * Script de diagnostic pour vérifier la structure des événements
 * 
 * Ce script affiche la structure des événements pour comprendre
 * pourquoi les badges ne sont pas attribués.
 * 
 * Usage: node scripts/debugEvents.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function debugEvents() {
    console.log('🔍 DIAGNOSTIC DES ÉVÉNEMENTS');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Récupérer tous les événements
        const eventsSnapshot = await db.collection('events').limit(5).get();
        console.log(`📋 ${eventsSnapshot.size} événements trouvés (limite: 5)\n`);

        eventsSnapshot.docs.forEach((doc, index) => {
            const eventData = doc.data();
            console.log(`\n📌 Événement ${index + 1}: ${eventData.name || 'Sans nom'}`);
            console.log(`   ID: ${doc.id}`);
            console.log(`   Champs disponibles:`);

            Object.keys(eventData).forEach(key => {
                let value = eventData[key];

                // Formater les dates
                if (value && typeof value.toDate === 'function') {
                    value = value.toDate().toISOString();
                }

                // Limiter la longueur des valeurs
                if (typeof value === 'string' && value.length > 50) {
                    value = value.substring(0, 50) + '...';
                }

                console.log(`      - ${key}: ${JSON.stringify(value)}`);
            });
        });

        // 2. Récupérer tous les types d'événements
        console.log('\n\n🏷️  TYPES D\'ÉVÉNEMENTS DISPONIBLES');
        console.log('═══════════════════════════════════════\n');

        const typesSnapshot = await db.collection('eventTypes').get();
        console.log(`📋 ${typesSnapshot.size} types trouvés\n`);

        typesSnapshot.docs.forEach((doc, index) => {
            const typeData = doc.data();
            console.log(`${index + 1}. ${typeData.name || 'Sans nom'}`);
            console.log(`   ID: ${doc.id}`);
            console.log(`   Emoji: ${typeData.emoji || 'N/A'}`);
            console.log(`   Icon: ${typeData.icon || 'N/A'}\n`);
        });

        // 3. Récupérer tous les badges
        console.log('\n🎖️  BADGES CONFIGURÉS');
        console.log('═══════════════════════════════════════\n');

        const badgesSnapshot = await db.collection('badges').get();
        console.log(`📋 ${badgesSnapshot.size} badges trouvés\n`);

        badgesSnapshot.docs.forEach((doc, index) => {
            const badgeData = doc.data();
            console.log(`${index + 1}. ${badgeData.name || 'Sans nom'}`);
            console.log(`   Type: ${badgeData.conditionType}`);
            console.log(`   Valeur: ${badgeData.conditionValue}`);
            console.log(`   Description: ${badgeData.description || 'N/A'}\n`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer le diagnostic
debugEvents();
