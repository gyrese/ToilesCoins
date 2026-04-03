/**
 * Met à jour les URLs des badges dans Firestore pour pointer vers /badges/*.webp
 * (fichiers servis localement par Next.js depuis public/badges/)
 *
 * Stratégie : extrait le nom de fichier de l'URL distante, remplace .png/.jpg par .webp
 *
 * Usage:
 *   node scripts/migrateBadgesToLocal.js --dry-run   (aperçu sans modifier)
 *   node scripts/migrateBadgesToLocal.js              (applique les changements)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const DRY_RUN = process.argv.includes('--dry-run');

// Fichiers WebP disponibles localement
const LOCAL_BADGES_DIR = path.join(__dirname, '..', 'public', 'badges');
const localFiles = fs.readdirSync(LOCAL_BADGES_DIR);

function resolveLocalIcon(currentIcon) {
    if (!currentIcon || currentIcon.startsWith('/badges/')) return null; // déjà migré

    // Extraire le nom de fichier de l'URL
    const baseName = path.basename(currentIcon);
    // Remplacer l'extension par .webp
    const webpName = baseName.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp');

    if (localFiles.includes(webpName)) {
        return `/badges/${webpName}`;
    }

    // Essai sans changement d'extension (si déjà .webp dans l'URL)
    if (localFiles.includes(baseName)) {
        return `/badges/${baseName}`;
    }

    return null;
}

async function migrate() {
    console.log(`Migration badges → /badges/*.webp ${DRY_RUN ? '[DRY RUN]' : ''}\n`);
    console.log(`Fichiers locaux disponibles : ${localFiles.join(', ')}\n`);

    const snapshot = await db.collection('badges').get();
    let updated = 0;
    let skipped = 0;
    let notFound = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const newIcon = resolveLocalIcon(data.icon);

        if (!newIcon && data.icon?.startsWith('/badges/')) {
            console.log(`  ⏭  "${data.name}" déjà migré : ${data.icon}`);
            skipped++;
            continue;
        }

        if (!newIcon) {
            console.log(`  ⚠  "${data.name}" | icon: ${data.icon} → AUCUN FICHIER LOCAL CORRESPONDANT`);
            notFound++;
            continue;
        }

        console.log(`  ✓  "${data.name}" | ${data.icon} → ${newIcon}`);

        if (!DRY_RUN) {
            await db.collection('badges').doc(doc.id).update({ icon: newIcon });

            // Mettre à jour aussi dans les sous-collections users/{uid}/badges
            const usersSnap = await db.collection('users').get();
            for (const userDoc of usersSnap.docs) {
                const userBadgesSnap = await db.collection('users').doc(userDoc.id)
                    .collection('badges')
                    .where('name', '==', data.name)
                    .get();
                for (const ub of userBadgesSnap.docs) {
                    await ub.ref.update({ icon: newIcon });
                }
            }
        }
        updated++;
    }

    console.log(`\n--- Résumé ---`);
    console.log(`Mis à jour : ${updated} | Déjà migrés : ${skipped} | Non trouvés : ${notFound}`);
    if (DRY_RUN) console.log('\n⚠  Mode dry-run : aucune modification effectuée. Relancez sans --dry-run pour appliquer.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Erreur :', err);
    process.exit(1);
});
