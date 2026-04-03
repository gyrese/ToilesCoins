/**
 * Migration des URLs des badges
 * lestoilesnoires.re/badge → lestoilesnoires.re/ressource/badges
 *
 * Usage: node scripts/migrateBadgeUrls.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const OLD_PATH = 'lestoilesnoires.re/Badges';
const NEW_PATH = 'lestoilesnoires.re/ressource/badges';

async function migrate() {
    console.log('Migration URLs badges : /badge → /ressource/badges\n');

    let updatedBadges = 0;
    let updatedUserBadges = 0;

    // 1. Collection /badges (catalogue global)
    const badgesSnapshot = await db.collection('badges').get();
    for (const docSnap of badgesSnapshot.docs) {
        const data = docSnap.data();
        if (data.icon && data.icon.includes(OLD_PATH)) {
            const newIcon = data.icon.replaceAll(OLD_PATH, NEW_PATH);
            await db.collection('badges').doc(docSnap.id).update({ icon: newIcon });
            console.log(`[badges] ${docSnap.id} : ${data.icon} → ${newIcon}`);
            updatedBadges++;
        }
    }

    // 2. Sous-collections /users/{uid}/badges
    const usersSnapshot = await db.collection('users').get();
    for (const userDoc of usersSnapshot.docs) {
        const userBadgesSnapshot = await db.collection('users').doc(userDoc.id).collection('badges').get();
        for (const badgeDoc of userBadgesSnapshot.docs) {
            const data = badgeDoc.data();
            if (data.icon && data.icon.includes(OLD_PATH)) {
                const newIcon = data.icon.replaceAll(OLD_PATH, NEW_PATH);
                await db.collection('users').doc(userDoc.id).collection('badges').doc(badgeDoc.id).update({ icon: newIcon });
                console.log(`[users/${userDoc.id}/badges] ${badgeDoc.id} : ${data.icon} → ${newIcon}`);
                updatedUserBadges++;
            }
        }
    }

    console.log(`\nTerminé : ${updatedBadges} badge(s) global(aux), ${updatedUserBadges} badge(s) utilisateur mis à jour.`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('Erreur :', err);
    process.exit(1);
});
