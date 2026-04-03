import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;

if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (!privateKey || !clientEmail || !projectId) {
        throw new Error(
            'Variables Firebase Admin manquantes. Vérifiez FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL et NEXT_PUBLIC_FIREBASE_PROJECT_ID dans votre .env.local'
        );
    }

    adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey })
    });
} else {
    adminApp = getApps()[0];
}

const adminAuth: Auth = getAuth(adminApp);
const adminDb: Firestore = getFirestore(adminApp);

export { adminAuth, adminDb };
