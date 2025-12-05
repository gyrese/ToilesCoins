/**
 * Script de correction des types d'événements
 * 
 * Ce script parcourt tous les événements et tente d'assigner le bon typeId
 * en se basant sur le nom de l'événement.
 * 
 * Usage: node scripts/fixEventTypes.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixEventTypes() {
    console.log('🔧 CORRECTION DES TYPES D\'ÉVÉNEMENTS');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Récupérer tous les types d'événements
        console.log('🔍 Chargement des types d\'événements...');
        const typesSnapshot = await db.collection('eventTypes').get();
        const eventTypes = typesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name
        }));
        console.log(`✅ ${eventTypes.length} types trouvés :`);
        eventTypes.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));
        console.log('');

        // 2. Récupérer tous les événements
        console.log('🔍 Chargement des événements...');
        const eventsSnapshot = await db.collection('events').get();
        console.log(`✅ ${eventsSnapshot.size} événements trouvés\n`);

        let updatedCount = 0;

        // 3. Parcourir et mettre à jour
        for (const doc of eventsSnapshot.docs) {
            const event = doc.data();

            // Si l'événement a déjà un typeId, on le saute
            if (event.typeId) {
                continue;
            }

            let matchedType = null;

            // Essayer de trouver une correspondance par nom
            for (const type of eventTypes) {
                // Correspondance exacte ou partielle
                if (event.name && event.name.toLowerCase().includes(type.name.toLowerCase())) {
                    matchedType = type;
                    break;
                }

                // Règles de correspondance intelligentes
                // Si l'événement contient "Quiz" -> Apéro Quiz
                if (type.name.toLowerCase().includes("quiz") && event.name.toLowerCase().includes("quiz")) {
                    matchedType = type;
                    break;
                }
                // Si l'événement contient "Beer Pong" -> Beer Pong (Attention à ne pas écraser All Star si géré avant)
                if (type.name.toLowerCase().includes("beer pong") && event.name.toLowerCase().includes("beer pong")) {
                    // Si c'est un All Star, on vérifie si on a un type All Star
                    if (event.name.toLowerCase().includes("all star")) {
                        const allStarType = eventTypes.find(t => t.name.toLowerCase().includes("all star"));
                        if (allStarType) {
                            matchedType = allStarType;
                            break;
                        }
                    }
                    matchedType = type;
                    break;
                }
            }

            if (matchedType) {
                console.log(`🔧 Mise à jour de "${event.name}"`);
                console.log(`   → Type assigné : "${matchedType.name}" (ID: ${matchedType.id})`);

                await db.collection('events').doc(doc.id).update({
                    typeId: matchedType.id
                });
                updatedCount++;
            } else {
                console.log(`⚠️  Pas de type détecté pour "${event.name}"`);
            }
        }

        console.log('\n═══════════════════════════════════════');
        console.log(`✨ Correction terminée !`);
        console.log(`📝 ${updatedCount} événements mis à jour`);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer la correction
fixEventTypes();
