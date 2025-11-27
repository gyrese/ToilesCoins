import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/app/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
    try {
        const { pseudo, wins, eventsCount } = await request.json();

        // Rechercher l'utilisateur par pseudo
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('pseudo', '==', pseudo));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json(
                { error: `Utilisateur ${pseudo} non trouvé` },
                { status: 404 }
            );
        }

        const userDoc = querySnapshot.docs[0];
        const userId = userDoc.id;
        const currentData = userDoc.data();

        // Calculer le niveau actuel
        const currentXP = ((currentData.wins || 0) * 500) + ((currentData.eventsCount || 0) * 100);
        const currentLevel = Math.min(50, Math.floor(currentXP / 1000) + 1);

        // Mettre à jour
        await updateDoc(doc(db, 'users', userId), {
            wins: wins,
            eventsCount: eventsCount,
        });

        // Calculer le nouveau niveau
        const newXP = (wins * 500) + (eventsCount * 100);
        const newLevel = Math.min(50, Math.floor(newXP / 1000) + 1);

        return NextResponse.json({
            success: true,
            user: pseudo,
            before: {
                wins: currentData.wins || 0,
                eventsCount: currentData.eventsCount || 0,
                level: currentLevel,
                xp: currentXP,
            },
            after: {
                wins,
                eventsCount,
                level: newLevel,
                xp: newXP,
            },
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
