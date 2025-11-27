"use client";

import { useState } from "react";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function TestLevelPage() {
    const [pseudo, setPseudo] = useState("bobby");
    const [wins, setWins] = useState(98);
    const [eventsCount, setEventsCount] = useState(10);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        setResult(null);

        try {
            // Rechercher l'utilisateur
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("pseudo", "==", pseudo));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setResult({ error: `Utilisateur ${pseudo} non trouvé` });
                setLoading(false);
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userId = userDoc.id;
            const currentData = userDoc.data();

            // Calculer niveaux
            const currentXP = ((currentData.wins || 0) * 500) + ((currentData.eventsCount || 0) * 100);
            const currentLevel = Math.min(50, Math.floor(currentXP / 1000) + 1);

            // Mettre à jour
            await updateDoc(doc(db, "users", userId), {
                wins: wins,
                eventsCount: eventsCount,
            });

            const newXP = (wins * 500) + (eventsCount * 100);
            const newLevel = Math.min(50, Math.floor(newXP / 1000) + 1);

            setResult({
                success: true,
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
            setResult({ error: error.message });
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#FFC845] p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <h1 className="text-4xl font-black mb-6 text-center">🎮 TEST NIVEAU</h1>

                    <div className="space-y-4">
                        <div>
                            <label className="block font-bold mb-2">Pseudo:</label>
                            <input
                                type="text"
                                value={pseudo}
                                onChange={(e) => setPseudo(e.target.value)}
                                className="w-full p-3 border-3 border-black rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block font-bold mb-2">Victoires:</label>
                            <input
                                type="number"
                                value={wins}
                                onChange={(e) => setWins(parseInt(e.target.value))}
                                className="w-full p-3 border-3 border-black rounded-lg"
                            />
                        </div>

                        <div>
                            <label className="block font-bold mb-2">Événements:</label>
                            <input
                                type="number"
                                value={eventsCount}
                                onChange={(e) => setEventsCount(parseInt(e.target.value))}
                                className="w-full p-3 border-3 border-black rounded-lg"
                            />
                        </div>

                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="w-full bg-black text-[#FFC845] font-black text-xl py-4 rounded-lg border-4 border-black hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? "⏳ Mise à jour..." : "🚀 METTRE À JOUR"}
                        </button>
                    </div>

                    {result && (
                        <div className="mt-6 p-4 bg-gray-100 border-3 border-black rounded-lg">
                            {result.error ? (
                                <div className="text-red-600 font-bold">❌ {result.error}</div>
                            ) : (
                                <div>
                                    <div className="text-green-600 font-bold text-xl mb-4">✅ Succès !</div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-yellow-100 p-3 rounded border-2 border-black">
                                            <div className="font-bold mb-2">📊 AVANT:</div>
                                            <div>Victoires: {result.before.wins}</div>
                                            <div>Événements: {result.before.eventsCount}</div>
                                            <div>XP: {result.before.xp}</div>
                                            <div className="text-lg font-black">Niveau: {result.before.level}</div>
                                        </div>

                                        <div className="bg-green-100 p-3 rounded border-2 border-black">
                                            <div className="font-bold mb-2">📊 APRÈS:</div>
                                            <div>Victoires: {result.after.wins}</div>
                                            <div>Événements: {result.after.eventsCount}</div>
                                            <div>XP: {result.after.xp}</div>
                                            <div className="text-lg font-black">Niveau: {result.after.level}</div>
                                        </div>
                                    </div>

                                    {result.after.level === 50 && (
                                        <div className="mt-4 text-center text-2xl font-black text-purple-600 animate-pulse">
                                            🏆 NIVEAU 50 - LEGENDARY ! 🏆
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
