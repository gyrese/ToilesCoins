/**
 * Script de nettoyage des badges en double
 * 
 * Ce script parcourt tous les utilisateurs et supprime les badges en double
 * en ne gardant que le premier exemplaire de chaque badge (par nom).
 * 
 * Usage: node scripts/cleanDuplicateBadges.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanDuplicateBadges() {
    console.log('🧹 Démarrage du nettoyage des badges en double...\n');

    try {
        // Récupérer tous les utilisateurs
        const usersSnapshot = await db.collection('users').get();
        console.log(`📊 ${usersSnapshot.size} utilisateurs trouvés\n`);

        let totalCleaned = 0;
        let totalUsers = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            console.log(`👤 Vérification de ${userData.pseudo || userId}...`);

            // Récupérer tous les badges de cet utilisateur
            const badgesSnapshot = await db.collection('users').doc(userId).collection('badges').get();

            if (badgesSnapshot.empty) {
                console.log(`   ℹ️  Aucun badge\n`);
                continue;
            }

            // Grouper les badges par nom
            const badgesByName = new Map();

            for (const badgeDoc of badgesSnapshot.docs) {
                const badgeData = badgeDoc.data();
                const badgeName = badgeData.name;

                if (!badgesByName.has(badgeName)) {
                    // Premier exemplaire : on le garde
                    badgesByName.set(badgeName, []);
                } else {
                    // Doublon : on l'ajoute à la liste des doublons à supprimer
                    badgesByName.get(badgeName).push(badgeDoc.id);
                }
            }

            // Supprimer les doublons
            let userCleaned = 0;
            for (const [badgeName, duplicateIds] of badgesByName.entries()) {
                if (duplicateIds.length > 0) {
                    console.log(`   🗑️  Badge "${badgeName}" : ${duplicateIds.length} doublon(s) trouvé(s)`);

                    for (const duplicateId of duplicateIds) {
                        await db.collection('users').doc(userId).collection('badges').doc(duplicateId).delete();
                        userCleaned++;
                        totalCleaned++;
                    }
                }
            }

            if (userCleaned > 0) {
                console.log(`   ✅ ${userCleaned} doublon(s) supprimé(s)\n`);
                totalUsers++;
            } else {
                console.log(`   ✓ Aucun doublon\n`);
            }
        }

        console.log('═══════════════════════════════════════');
        console.log(`✨ Nettoyage terminé !`);
        console.log(`📊 ${totalCleaned} badges en double supprimés`);
        console.log(`👥 ${totalUsers} utilisateurs affectés`);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer le nettoyage
cleanDuplicateBadges();
