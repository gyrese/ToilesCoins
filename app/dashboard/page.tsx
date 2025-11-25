"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Shield } from "lucide-react";

interface TournamentResult {
    id: string;
    winner: string;
    tournament: string;
    date: string;
    reward: number;
}

export default function Dashboard() {
    const { user, userData, loading, signOut } = useAuth();
    const router = useRouter();
    const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
    const [level, setLevel] = useState(1);
    const [playerClass, setPlayerClass] = useState("Novice");

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        const fetchTournamentResults = async () => {
            try {
                const q = query(collection(db, "tournaments"), orderBy("date", "desc"), limit(3));
                const snapshot = await getDocs(q);
                setTournamentResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TournamentResult[]);
            } catch (error) { console.error(error); }
        };
        if (user) fetchTournamentResults();
    }, [user]);

    useEffect(() => {
        if (userData) {
            const wins = userData.wins || 0;
            const calculatedLevel = Math.floor(wins / 5) + 1;
            setLevel(calculatedLevel);

            if (calculatedLevel >= 50) setPlayerClass("Maître du Jeu");
            else if (calculatedLevel >= 20) setPlayerClass("Légende");
            else if (calculatedLevel >= 10) setPlayerClass("Vétéran");
            else if (calculatedLevel >= 5) setPlayerClass("Initié");
            else setPlayerClass("Novice");
        }
    }, [userData]);

    const handleSignOut = async () => { await signOut(); router.push("/login"); };

    if (loading || (user && !userData)) return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">CHARGEMENT...</div>;

    if (!user) return null;
    if (!userData) return <div className="min-h-screen flex items-center justify-center"><button onClick={handleSignOut} className="neo-btn">ERREUR - RECONNEXION</button></div>;

    const avatarUrl = userData.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo || 'user'}&backgroundColor=ffc845`;

    return (
        <>
            <Header />
            <main className="layout-container pb-32 pt-32">

                {/* --- 1. CARTE D'IDENTITÉ (Vraiment Petite) --- */}
                <div className="mx-auto mb-8 w-full max-w-[300px]">
                    <div className="bg-white border-2 border-black p-3 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 transform -rotate-1 hover:rotate-0 transition-transform">

                        {/* Photo Identité (Taille Forcée) */}
                        <div className="flex-shrink-0 border-2 border-black p-0.5 bg-white" style={{ width: '60px', height: '60px' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={avatarUrl}
                                alt="ID"
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        {/* Infos */}
                        <div className="flex-grow min-w-0 flex flex-col justify-center">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">ID CARD</div>
                            <div className="font-black text-lg uppercase leading-none truncate">{userData.pseudo}</div>
                            <div className="text-xs font-bold text-purple-700 uppercase mt-1 flex items-center gap-1">
                                <Shield size={10} /> {playerClass}
                            </div>
                        </div>

                        {/* Niveau */}
                        <div className="flex-shrink-0 flex flex-col items-center justify-center bg-black text-yellow-400 w-10 h-10 border-2 border-black rounded-md">
                            <span className="text-[8px] font-bold uppercase leading-none">LVL</span>
                            <span className="text-sm font-black leading-none">{level}</span>
                        </div>
                    </div>
                </div>



                {/* Balance Card - Big & Bold */}
                <div className="neo-card bg-black text-white mb-6 md:mb-8 !border-white">
                    <h2 className="text-xs md:text-sm font-bold uppercase tracking-widest mb-2 text-yellow-400">Votre Solde</h2>
                    <div className="flex items-center gap-2 md:gap-4">
                        <span className="text-4xl md:text-6xl font-black">{userData.balance}</span>
                        <span className="text-xl md:text-2xl font-bold bg-yellow-400 text-black px-2 rounded">TC</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="neo-card text-center flex flex-row md:flex-col justify-between md:justify-center items-center">
                        <span className="block text-3xl md:text-4xl font-black mb-0 md:mb-2">{userData.wins || 0}</span>
                        <span className="text-xs md:text-sm font-bold uppercase bg-gray-200 px-2 py-1 rounded">Victoires</span>
                    </div>
                    <div className="neo-card text-center flex flex-row md:flex-col justify-between md:justify-center items-center">
                        <span className="block text-3xl md:text-4xl font-black mb-0 md:mb-2">{userData.eventsCount || 0}</span>
                        <span className="text-xs md:text-sm font-bold uppercase bg-gray-200 px-2 py-1 rounded">Événements</span>
                    </div>
                </div>

                {/* Latest News */}
                <div>
                    <h3 className="text-xl md:text-2xl font-black uppercase mb-4 md:mb-6 border-b-4 border-black inline-block">Derniers Résultats</h3>

                    {tournamentResults.length === 0 ? (
                        <div className="neo-card opacity-50 text-center italic">
                            Rien à signaler pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tournamentResults.map((result) => (
                                <div key={result.id} className="neo-card flex flex-col md:flex-row justify-between items-start md:items-center !p-4 gap-2 md:gap-0">
                                    <div>
                                        <h4 className="font-black text-base md:text-lg uppercase">{result.tournament}</h4>
                                        <p className="text-xs md:text-sm font-bold">
                                            Vainqueur : <span className="bg-yellow-400 px-1">{result.winner}</span>
                                        </p>
                                    </div>
                                    <div className="text-left md:text-right w-full md:w-auto flex flex-row md:flex-col justify-between md:justify-end items-center md:items-end">
                                        <div className="text-lg md:text-xl font-black text-green-600">+{result.reward}</div>
                                        <div className="text-xs font-bold opacity-50">
                                            {new Date(result.date).toLocaleDateString('fr-FR')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Navbar />
        </>
    );
}
