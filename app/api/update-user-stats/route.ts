import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';
import { verifyAdmin } from '@/app/lib/auth-server';
import { rateLimit } from '@/app/lib/rate-limiter';

export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (auth instanceof NextResponse) return auth;

    // Max 30 updates par minute pour un admin
    if (!rateLimit(`update-stats:${auth.uid}`, 30, 60_000)) {
        return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    try {
        const { pseudo, wins, eventsCount } = await request.json();

        if (typeof pseudo !== 'string' || !pseudo.trim()) {
            return NextResponse.json({ error: 'Pseudo invalide' }, { status: 400 });
        }
        if (typeof wins !== 'number' || wins < 0 || !Number.isInteger(wins)) {
            return NextResponse.json({ error: 'Valeur wins invalide' }, { status: 400 });
        }
        if (typeof eventsCount !== 'number' || eventsCount < 0 || !Number.isInteger(eventsCount)) {
            return NextResponse.json({ error: 'Valeur eventsCount invalide' }, { status: 400 });
        }

        const snapshot = await adminDb.collection('users').where('pseudo', '==', pseudo).limit(1).get();

        if (snapshot.empty) {
            return NextResponse.json({ error: `Utilisateur ${pseudo} non trouvé` }, { status: 404 });
        }

        const userDoc = snapshot.docs[0];
        const currentData = userDoc.data();

        const currentXP = ((currentData.wins || 0) * 500) + ((currentData.eventsCount || 0) * 100);
        const currentLevel = Math.min(50, Math.floor(currentXP / 1000) + 1);

        await adminDb.collection('users').doc(userDoc.id).update({ wins, eventsCount });

        const newXP = (wins * 500) + (eventsCount * 100);
        const newLevel = Math.min(50, Math.floor(newXP / 1000) + 1);

        return NextResponse.json({
            success: true,
            user: pseudo,
            before: { wins: currentData.wins || 0, eventsCount: currentData.eventsCount || 0, level: currentLevel, xp: currentXP },
            after: { wins, eventsCount, level: newLevel, xp: newXP },
        });
    } catch (error: unknown) {
        console.error('Erreur update-user-stats:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
