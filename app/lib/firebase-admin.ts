import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require('../../serviceAccountKey.json');

let adminApp: App;

if (!getApps().length) {
    adminApp = initializeApp({ credential: cert(serviceAccount) });
} else {
    adminApp = getApps()[0];
}

const adminAuth: Auth = getAuth(adminApp);
const adminDb: Firestore = getFirestore(adminApp);

export { adminAuth, adminDb };
