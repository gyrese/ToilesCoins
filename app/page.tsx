"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import { Shield, ChevronRight } from "lucide-react";

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [level, setLevel] = useState(1);
  const [playerClass, setPlayerClass] = useState("Novice");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFC845] text-black">
        <div className="text-xl font-black uppercase animate-pulse">Chargement...</div>
      </div>
    );
  }

  if (!userData) return null;

  const avatarUrl = userData.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo || 'user'}&backgroundColor=ffc845`;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#FFD95A] text-black pb-32 pt-32 px-4 font-sans">

        <div className="max-w-md mx-auto">

          {/* --- 1. BANDEAU PROFIL COMPACT (Demandé précédemment) --- */}
          <div className="bg-white border-2 border-black rounded-full p-2 pr-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3 mb-8">
            <div className="w-12 h-12 flex-shrink-0 rounded-full border-2 border-black overflow-hidden bg-gray-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Profil" className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow leading-tight">
              <div className="font-black uppercase text-sm">{userData.pseudo}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                <Shield size={10} /> {playerClass}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-black text-[#FFD95A] w-10 h-10 rounded-full border-2 border-black">
              <span className="text-[6px] font-bold uppercase">LVL</span>
              <span className="text-sm font-black leading-none">{level}</span>
            </div>
          </div>



          {/* --- 3. STATS CARDS (Style Image) --- */}
          <div className="flex flex-col gap-4 mb-8">

            {/* Carte SOLDE (Noire) */}
            <div className="bg-black text-white p-6 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
              <h3 className="text-lg font-bold uppercase mb-1">VOTRE SOLDE</h3>
              <div className="text-4xl font-black">{userData.balance}</div>
            </div>

            {/* Carte VICTOIRES (Blanche) */}
            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <span className="text-2xl font-black">{userData.wins}</span>
              <span className="font-bold uppercase text-sm tracking-wider">VICTOIRES</span>
            </div>

            {/* Carte ÉVÉNEMENTS (Blanche) */}
            <div className="bg-white border-2 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
              <span className="text-2xl font-black">{userData.eventsCount || 0}</span>
              <span className="font-bold uppercase text-sm tracking-wider">ÉVÉNEMENTS</span>
            </div>

          </div>

          {/* --- 4. DERNIERS RÉSULTATS --- */}
          <div>
            <h2 className="text-lg font-black uppercase border-b-4 border-black inline-block mb-4">
              DERNIERS RÉSULTATS
            </h2>

            {/* Placeholder pour les résultats (vide pour l'instant) */}
            <div className="opacity-50 text-sm font-bold italic">
              Aucun résultat récent...
            </div>
          </div>

        </div>

      </main>
      <Navbar />
    </>
  );
}
