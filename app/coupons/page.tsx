"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Ticket, Clock, Archive, Sparkles, ShoppingBag } from "lucide-react";

interface Reward {
    id: string;
    name: string;
    cost: number;
    icon: string;
    description: string;
}

interface Coupon {
    id: string;
    code: string;
    reward: Reward;
    expiresAt: Date;
    status: "active" | "expired" | "used";
    createdAt: Date;
}

export default function Coupons() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [remaining, setRemaining] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, "coupons"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: Coupon[] = [];
            const now = Date.now();
            const newRemaining: { [key: string]: number } = {};

            snapshot.forEach((couponDoc) => {
                const d = couponDoc.data();
                const expiresAt = new Date(d.expiresAt);
                const isExpired = expiresAt.getTime() < now;
                if (isExpired && d.status === "active") {
                    updateDoc(doc(db, "coupons", couponDoc.id), { status: "expired" }).catch(console.error);
                }
                loaded.push({
                    id: couponDoc.id,
                    code: d.code,
                    reward: { id: d.rewardId, name: d.rewardName, icon: d.rewardIcon, description: d.rewardDescription, cost: 0 },
                    expiresAt,
                    createdAt: new Date(d.createdAt),
                    status: isExpired ? "expired" : (d.status || "active"),
                });
                if (!isExpired && d.status === "active") {
                    newRemaining[couponDoc.id] = Math.max(0, Math.floor((expiresAt.getTime() - now) / 1000));
                }
            });

            setCoupons(loaded);
            setRemaining(newRemaining);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(async (id) => {
                    if (updated[id] > 0) {
                        updated[id]--;
                    } else {
                        try {
                            await updateDoc(doc(db, "coupons", id), { status: "expired" });
                        } catch (err) {
                            console.error(err);
                        }
                    }
                });
                return updated;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAsUsed = async (couponId: string) => {
        try {
            await updateDoc(doc(db, "coupons", couponId), { status: "used" });
        } catch (error) {
            console.error("Erreur:", error);
        }
    };

    if (loading || (user && !userData)) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                <div className="skeleton skeleton-card" style={{ width: '200px', height: '40px' }} />
            </div>
        );
    }

    if (!user) return null;

    const activeCoupons = coupons.filter(c => c.status === "active");
    const usedCoupons = coupons.filter(c => c.status === "used");
    const expiredCoupons = coupons.filter(c => c.status === "expired");

    return (
        <>
            <Header />
            <main className="layout-container">

                {/* Titre */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 className="font-payback" style={{ fontSize: '1.8rem', color: 'var(--accent-gold)', margin: 0 }}>
                        Mes Coupons
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        Actifs, utilisés et archivés
                    </p>
                </div>

                {/* Coupons actifs */}
                {activeCoupons.length > 0 ? (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="section-title">
                            <Sparkles size={15} style={{ color: 'var(--accent-green)' }} />
                            Actifs ({activeCoupons.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activeCoupons.map((coupon) => (
                                <div key={coupon.id} className="coupon-active" style={{ padding: '1.25rem' }}>
                                    {/* Header coupon */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span style={{ fontSize: '2.5rem', flexShrink: 0 }}>{coupon.reward.icon}</span>
                                        <div>
                                            <h3 style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                                                {coupon.reward.name}
                                            </h3>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0', fontStyle: 'italic' }}>
                                                {coupon.reward.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Code */}
                                    <div style={{
                                        background: 'var(--bg-base)',
                                        border: '1px solid var(--border-strong)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '0.875rem',
                                        marginBottom: '0.875rem',
                                    }}>
                                        <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>Code coupon</span>
                                            <Ticket size={12} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                        <div style={{
                                            fontFamily: 'monospace',
                                            fontSize: '1.6rem',
                                            fontWeight: 800,
                                            letterSpacing: '0.15em',
                                            color: 'var(--accent-green)',
                                            textAlign: 'center',
                                        }}>
                                            {coupon.code}
                                        </div>

                                        {/* Countdown */}
                                        <div className="flex items-center justify-center gap-2" style={{ marginTop: '0.625rem' }}>
                                            <Clock size={13} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent-red)' }}>
                                                Expire dans {Math.floor((remaining[coupon.id] || 0) / 60)}m {(remaining[coupon.id] || 0) % 60}s
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleMarkAsUsed(coupon.id)}
                                        className="btn-ghost"
                                        style={{ width: '100%', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}
                                    >
                                        ✓ Marquer comme utilisé
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="dark-card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', marginBottom: '1.5rem' }}>
                        <Ticket size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <h3 style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            Aucun coupon actif
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            Achète des récompenses dans la boutique
                        </p>
                        <button className="btn-primary" onClick={() => router.push("/shop")} style={{ width: 'auto', margin: '0 auto' }}>
                            <ShoppingBag size={15} />
                            Boutique
                        </button>
                    </div>
                )}

                {/* Coupons utilisés */}
                {usedCoupons.length > 0 && (
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="section-title">
                            <Ticket size={15} style={{ color: 'var(--accent-blue)' }} />
                            Utilisés ({usedCoupons.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {usedCoupons.map((coupon) => (
                                <div key={coupon.id} className="dark-card" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.875rem 1rem' }}>
                                    <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{coupon.reward.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{coupon.reward.name}</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{coupon.code}</div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent-blue)', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 'var(--radius-pill)', padding: '2px 8px', flexShrink: 0 }}>
                                        Utilisé
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Archives expirés */}
                {expiredCoupons.length > 0 && (
                    <div>
                        <div className="section-title">
                            <Archive size={15} />
                            Archives ({expiredCoupons.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {expiredCoupons.map((coupon) => (
                                <div key={coupon.id} className="coupon-expired" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{coupon.reward.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{coupon.reward.name}</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{coupon.code}</div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                                        Exp. {coupon.expiresAt.toLocaleDateString('fr-FR')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Navbar />
        </>
    );
}
