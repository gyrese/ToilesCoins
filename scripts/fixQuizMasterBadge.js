/**
 * Script de correction du badge "Quiz Master"
 * 
 * Ce script trouve l'ID réel du type d'événement "Apéro Quiz"
 * et met à jour le badge "Quiz Master" pour remplacer la valeur "6".
 * 
 * Usage: node scripts/fixQuizMasterBadge.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixQuizMasterBadge() {
    console.log('🔧 CORRECTION DU BADGE "QUIZ MASTER"');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Trouver le type d'événement "Apéro Quiz"
        console.log('🔍 Recherche du type d\'événement "Apéro Quiz"...');

        // On cherche large pour être sûr de trouver
        const typesSnapshot = await db.collection('eventTypes').get();
        const quizType = typesSnapshot.docs.find(doc =>
            doc.data().name.toLowerCase().includes("quiz")
        );

        if (!quizType) {
            console.error('❌ Type d\'événement "Quiz" non trouvé !');
            process.exit(1);
        }

        const realTypeId = quizType.id;
        console.log(`✅ Type trouvé : "${quizType.data().name}" (ID: ${realTypeId})\n`);

        // 2. Trouver le badge "Quiz Master"
        console.log('🔍 Recherche du badge "Quiz Master"...');

        const badgesSnapshot = await db.collection('badges')
            .where('name', '==', 'Quiz Master')
            .get();

        if (badgesSnapshot.empty) {
            console.error('❌ Badge "Quiz Master" non trouvé !');
            process.exit(1);
        }

        const badgeDoc = badgesSnapshot.docs[0];
        console.log(`✅ Badge trouvé : "${badgeDoc.data().name}"`);
        console.log(`   Ancienne valeur : ${badgeDoc.data().conditionValue}`);

        // 3. Mettre à jour le badge
        await db.collection('badges').doc(badgeDoc.id).update({
            conditionValue: realTypeId
        });

        console.log(`   Nouvelle valeur : ${realTypeId}`);
        console.log('\n✅ Badge "Quiz Master" corrigé avec succès !');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer la correction
fixQuizMasterBadge();
