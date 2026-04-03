import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from './firebase-admin';

type AuthSuccess = { uid: string };

export async function verifyAuth(request: NextRequest): Promise<AuthSuccess | NextResponse> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    try {
        const decoded = await adminAuth.verifyIdToken(token);
        return { uid: decoded.uid };
    } catch {
        return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }
}

export async function verifyAdmin(request: NextRequest): Promise<AuthSuccess | NextResponse> {
    const authResult = await verifyAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    const userDoc = await adminDb.collection('users').doc(authResult.uid).get();
    if (!userDoc.exists || userDoc.data()?.role?.toUpperCase() !== 'ADMIN') {
        return NextResponse.json({ error: 'Accès refusé — droits admin requis' }, { status: 403 });
    }
    return authResult;
}
