/**
 * Script de réinitialisation complète des badges
 * 
 * ⚠️ ATTENTION : Ce script supprime TOUS les badges de TOUS les utilisateurs
 * 
 * Utilisez ce script pour nettoyer la base de données après un bug d'attribution.
 * Les badges seront réattribués automatiquement lors des prochains événements.
 * 
 * Usage: node scripts/resetAllBadges.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetAllBadges() {
    console.log('🔥 RÉINITIALISATION COMPLÈTE DES BADGES');
    console.log('⚠️  ATTENTION : Tous les badges vont être supprimés\n');

    // Demander confirmation (commenté car on est en script)
    // En production, vous pouvez décommenter et utiliser readline
    console.log('Démarrage dans 3 secondes...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
        // Récupérer tous les utilisateurs
        const usersSnapshot = await db.collection('users').get();
        console.log(`📊 ${usersSnapshot.size} utilisateurs trouvés\n`);

        let totalDeleted = 0;
        let totalUsers = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const pseudo = userData.pseudo || userId;

            console.log(`👤 Traitement de ${pseudo}...`);

            // Récupérer tous les badges de cet utilisateur
            const badgesSnapshot = await db.collection('users').doc(userId).collection('badges').get();

            if (badgesSnapshot.empty) {
                console.log(`   ℹ️  Aucun badge à supprimer\n`);
                continue;
            }

            console.log(`   🗑️  ${badgesSnapshot.size} badge(s) trouvé(s)`);

            // Supprimer tous les badges
            const batch = db.batch();
            let batchCount = 0;

            for (const badgeDoc of badgesSnapshot.docs) {
                batch.delete(badgeDoc.ref);
                batchCount++;
                totalDeleted++;

                // Firestore limite à 500 opérations par batch
                if (batchCount >= 500) {
                    await batch.commit();
                    batchCount = 0;
                }
            }

            // Commit le dernier batch s'il reste des opérations
            if (batchCount > 0) {
                await batch.commit();
            }

            console.log(`   ✅ ${badgesSnapshot.size} badge(s) supprimé(s)\n`);
            totalUsers++;
        }

        console.log('═══════════════════════════════════════');
        console.log(`✨ Réinitialisation terminée !`);
        console.log(`🗑️  ${totalDeleted} badges supprimés au total`);
        console.log(`👥 ${totalUsers} utilisateurs affectés`);
        console.log('═══════════════════════════════════════');
        console.log('\n💡 Les badges seront réattribués lors des prochains événements');

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer la réinitialisation
resetAllBadges();
