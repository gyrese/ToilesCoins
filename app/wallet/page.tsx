"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Coin from "../components/Coin";

export default function Wallet() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);
    if (loading || !user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="pixel-box">Chargement...</div>
            </div>
        );
    }

    return (
        <main className="pb-20">
            <div className="pixel-box pixel-box-warning text-center">
                <h1 className="text-xl mb-2">Portefeuille</h1>
            </div>

            <div className="pixel-box text-center py-8">
                <div className="text-4xl text-[#e52521] flex justify-center items-center gap-4">
                    <Coin />
                    <span>{userData.balance}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">ToilesCoins disponibles</p>
            </div>
            <Navbar />
        </main>
    );
}
