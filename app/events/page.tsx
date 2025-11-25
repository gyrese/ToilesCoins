"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Coin from "../components/Coin";

interface Event {
    id: string;
    title: string;
    date: string;
    rewardAmount: number;
}

export default function Events() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const q = query(
                    collection(db, "events"),
                    orderBy("date", "asc")
                );
                const snapshot = await getDocs(q);
                const eventsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];
                setEvents(eventsData);
            } catch (error) {
                console.error("Erreur chargement événements:", error);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user]);

    if (loading || !user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="pixel-box">Chargement...</div>
            </div>
        );
    }

    const getEventEmoji = (title: string) => {
        if (title.toLowerCase().includes("kart")) return "🏎️";
        if (title.toLowerCase().includes("smash")) return "⚔️";
        if (title.toLowerCase().includes("blind")) return "🎵";
        if (title.toLowerCase().includes("karaoke") || title.toLowerCase().includes("karaoké")) return "🎤";
        if (title.toLowerCase().includes("quiz")) return "🧠";
        return "🎮";
    };

    return (
        <main className="pb-20">
            <div className="pixel-box pixel-box-primary text-center">
                <h1 className="text-xl mb-2">Événements</h1>
                <p className="text-xs">Participez et gagnez !</p>
            </div>

            <div className="p-4 space-y-4">
                {events.length === 0 ? (
                    <div className="pixel-box text-center text-xs text-gray-500">
                        Aucun événement à venir
                    </div>
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="pixel-box !m-0 !mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-2xl">{getEventEmoji(event.title)}</div>
                                <div className="bg-[#fbd000] px-2 py-1 text-xs border-2 border-black">
                                    {event.rewardAmount} coins
                                </div>
                            </div>
                            <h3 className="text-sm font-bold mb-1">{event.title}</h3>
                            <p className="text-xs text-gray-600 mb-3">
                                {new Date(event.date).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                            <button className="pixel-btn pixel-btn-green w-full text-center">
                                S'inscrire
                            </button>
                        </div>
                    ))
                )}
            </div>

            <Navbar />
        </main>
    );
}
