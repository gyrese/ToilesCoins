/**
 * Script de réattribution intelligente des badges
 * 
 * Ce script analyse l'historique des événements et les statistiques de chaque utilisateur
 * pour réattribuer correctement tous les badges qu'ils devraient avoir.
 * 
 * Badges attribués :
 * 1. Badges basés sur les stats (wins, balance, events)
 * 2. Badges "première victoire par type d'événement"
 * 
 * Usage: node scripts/reattributeBadges.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialiser Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function reattributeBadges() {
    console.log('🎖️  RÉATTRIBUTION INTELLIGENTE DES BADGES');
    console.log('═══════════════════════════════════════\n');

    try {
        // 1. Récupérer tous les badges disponibles
        const badgesSnapshot = await db.collection('badges').get();
        const allBadges = badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`📋 ${allBadges.length} badges disponibles dans le système\n`);

        // 2. Récupérer tous les utilisateurs
        const usersSnapshot = await db.collection('users').get();
        console.log(`👥 ${usersSnapshot.size} utilisateurs à traiter\n`);

        let totalBadgesAwarded = 0;
        let totalUsersAwarded = 0;

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();
            const pseudo = userData.pseudo || userId;

            console.log(`\n👤 Traitement de ${pseudo}...`);
            console.log(`   📊 Stats: ${userData.wins || 0} victoires, ${userData.balance || 0} TC, ${userData.eventsCount || 0} événements`);

            let userBadgesAwarded = 0;

            // 3. Traiter chaque badge
            for (const badge of allBadges) {
                // Vérifier si l'utilisateur a déjà ce badge
                const existingBadgeQuery = await db.collection('users').doc(userId).collection('badges')
                    .where('name', '==', badge.name)
                    .get();

                if (!existingBadgeQuery.empty) {
                    // Badge déjà attribué, passer au suivant
                    continue;
                }

                let shouldAward = false;

                // 4. Vérifier les conditions selon le type de badge
                if (badge.conditionType === 'wins') {
                    // Badge basé sur les victoires
                    const requiredWins = parseInt(badge.conditionValue);
                    if ((userData.wins || 0) >= requiredWins) {
                        shouldAward = true;
                    }
                } else if (badge.conditionType === 'balance') {
                    // Badge basé sur le solde
                    const requiredBalance = parseInt(badge.conditionValue);
                    if ((userData.balance || 0) >= requiredBalance) {
                        shouldAward = true;
                    }
                } else if (badge.conditionType === 'events') {
                    // Badge basé sur les participations
                    const requiredEvents = parseInt(badge.conditionValue);
                    if ((userData.eventsCount || 0) >= requiredEvents) {
                        shouldAward = true;
                    }
                } else if (badge.conditionType === 'first_victory_type') {
                    // Badge "première victoire par type d'événement"
                    const eventTypeId = badge.conditionValue.toString(); // Convertir en string pour comparaison

                    console.log(`   🔍 Recherche victoires pour type "${eventTypeId}" (badge: ${badge.name})...`);

                    // Chercher si l'utilisateur a gagné au moins un événement de ce type
                    const eventsQuery = await db.collection('events')
                        .where('typeId', '==', eventTypeId)
                        .get();

                    console.log(`      → ${eventsQuery.size} événement(s) de ce type trouvé(s)`);

                    for (const eventDoc of eventsQuery.docs) {
                        const eventData = eventDoc.data();
                        // Vérifier si l'utilisateur est dans les gagnants (support multi-gagnants)
                        const winners = eventData.winner ? eventData.winner.split(',').map(w => w.trim()) : [];

                        if (winners.includes(pseudo)) {
                            console.log(`      → ✅ Victoire trouvée dans "${eventData.name}"`);
                            shouldAward = true;
                            break;
                        }
                    }

                    if (!shouldAward && eventsQuery.size > 0) {
                        console.log(`      → ❌ Aucune victoire trouvée pour ${pseudo}`);
                    }
                }

                // 5. Attribuer le badge si les conditions sont remplies
                if (shouldAward) {
                    await db.collection('users').doc(userId).collection('badges').add({
                        name: badge.name,
                        description: badge.description,
                        icon: badge.icon,
                        rarity: 'rare',
                        obtainedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    console.log(`   ✅ Badge attribué: "${badge.name}"`);
                    userBadgesAwarded++;
                    totalBadgesAwarded++;
                }
            }

            if (userBadgesAwarded > 0) {
                console.log(`   🎖️  Total: ${userBadgesAwarded} badge(s) attribué(s)`);
                totalUsersAwarded++;
            } else {
                console.log(`   ℹ️  Aucun nouveau badge à attribuer`);
            }
        }

        console.log('\n═══════════════════════════════════════');
        console.log(`✨ Réattribution terminée !`);
        console.log(`🎖️  ${totalBadgesAwarded} badges attribués au total`);
        console.log(`👥 ${totalUsersAwarded} utilisateurs ont reçu des badges`);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Erreur lors de la réattribution:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Lancer la réattribution
reattributeBadges();
