// Script pour passer le premier utilisateur en ADMIN
// Exécutez avec: node scripts/make-admin.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyD76tyqK8E3YxEVK_dN3yG29bOM9EID7h0",
    authDomain: "toilescoins.firebaseapp.com",
    projectId: "toilescoins",
    storageBucket: "toilescoins.firebasestorage.app",
    messagingSenderId: "8523289016",
    appId: "1:8523289016:web:10a1e30afdd98c84113f4d",
    measurementId: "G-75NXDXQ1FG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAdmin() {
    console.log('🔧 Recherche du premier utilisateur...\n');

    try {
        const usersSnapshot = await getDocs(collection(db, "users"));

        if (usersSnapshot.empty) {
            console.log('❌ Aucun utilisateur trouvé dans Firestore.');
            console.log('💡 Créez d\'abord un compte via l\'application.');
            process.exit(1);
        }

        const firstUser = usersSnapshot.docs[0];
        const userData = firstUser.data();

        console.log('👤 Utilisateur trouvé:');
        console.log(`   Email: ${userData.email}`);
        console.log(`   Pseudo: ${userData.pseudo}`);
        console.log(`   Rôle actuel: ${userData.role}`);
        console.log('');

        if (userData.role === 'ADMIN') {
            console.log('✅ Cet utilisateur est déjà ADMIN !');
            process.exit(0);
        }

        // Mettre à jour le rôle
        await updateDoc(doc(db, "users", firstUser.id), {
            role: "ADMIN"
        });

        console.log('✅ Rôle mis à jour avec succès !');
        console.log(`   ${userData.pseudo} est maintenant ADMIN`);
        console.log('');
        console.log('🎉 Vous pouvez maintenant accéder à /admin');
        console.log('💡 Rafraîchissez l\'application pour voir les changements');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        process.exit(1);
    }
}

makeAdmin();
