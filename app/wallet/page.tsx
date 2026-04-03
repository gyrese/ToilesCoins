"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Coins, ShoppingBag } from "lucide-react";

export default function Wallet() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    if (loading || !user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                <div className="skeleton skeleton-card" style={{ width: '200px', height: '40px' }} />
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="layout-container">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem' }}>

                    {/* Carte solde principale */}
                    <div className="dark-card dark-card--glow" style={{ width: '100%', maxWidth: '340px', textAlign: 'center', padding: '2.5rem 2rem' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <Coins size={32} style={{ color: 'var(--accent-gold)', margin: '0 auto' }} />
                        </div>
                        <div className="font-payback" style={{
                            fontSize: '3.5rem',
                            color: 'var(--accent-gold)',
                            lineHeight: 1,
                            marginBottom: '0.5rem',
                            textShadow: '0 0 30px rgba(255,200,69,0.3)',
                        }}>
                            {userData.balance ?? 0}
                        </div>
                        <div style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            color: 'var(--text-muted)',
                        }}>
                            ToilesCoins disponibles
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        onClick={() => router.push('/shop')}
                        style={{ width: 'auto' }}
                    >
                        <ShoppingBag size={16} />
                        Dépenser dans la boutique
                    </button>
                </div>
            </main>
            <Navbar />
        </>
    );
}
