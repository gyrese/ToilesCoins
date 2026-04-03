"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, increment, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { ShoppingBag, Coins, Archive, Clock, Ticket } from "lucide-react";

interface Reward {
    id: string;
    name: string;
    cost: number;
    icon: string;
    description: string;
    imageUrl?: string;
}

interface Coupon {
    id: string;
    code: string;
    reward: Reward;
    expiresAt: Date;
    status: "active" | "expired" | "used";
}

export default function Shop() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error">("success");
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [remaining, setRemaining] = useState<number>(0);
    const [isPurchasing, setIsPurchasing] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const q = query(collection(db, "rewards"), orderBy("cost", "asc"));
                const snapshot = await getDocs(q);
                setRewards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Reward[]);
            } catch (error) {
                console.error("Erreur chargement récompenses:", error);
            }
        };
        if (user) fetchRewards();
    }, [user]);

    useEffect(() => {
        if (!user || rewards.length === 0) return;
        const q = query(collection(db, "coupons"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded: Coupon[] = [];
            const now = Date.now();
            snapshot.forEach((couponDoc) => {
                const d = couponDoc.data();
                const reward = rewards.find(r => r.id === d.rewardId);
                if (reward) {
                    const expiresAt = new Date(d.expiresAt);
                    const isExpired = expiresAt.getTime() < now;
                    if (isExpired && d.status === "active") {
                        updateDoc(doc(db, "coupons", couponDoc.id), { status: "expired" }).catch(console.error);
                    }
                    loaded.push({ id: couponDoc.id, code: d.code, reward, expiresAt, status: isExpired ? "expired" : (d.status || "active") });
                }
            });
            setCoupons(loaded);
            const active = loaded.find(c => c.status === "active");
            if (active) {
                setRemaining(Math.max(0, Math.floor((active.expiresAt.getTime() - now) / 1000)));
            }
        });
        return () => unsubscribe();
    }, [user, rewards]);

    useEffect(() => {
        const active = coupons.find(c => c.status === "active");
        if (!active) return;
        const interval = setInterval(async () => {
            setRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    updateDoc(doc(db, "coupons", active.id), { status: "expired" }).catch(console.error);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [coupons]);

    const handlePurchase = async (reward: Reward) => {
        if (!user || !userData || isPurchasing) return;
        if (userData.balance < reward.cost) {
            setMessage("Solde insuffisant");
            setMessageType("error");
            setTimeout(() => setMessage(""), 3000);
            return;
        }
        setIsPurchasing(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { balance: increment(-reward.cost) });
            const array = new Uint8Array(6);
            crypto.getRandomValues(array);
            const code = Array.from(array, b => b.toString(36)).join('').toUpperCase().substring(0, 8);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            await addDoc(collection(db, "coupons"), {
                userId: user.uid, rewardId: reward.id, rewardName: reward.name,
                rewardIcon: reward.icon, rewardDescription: reward.description,
                code, status: "active", expiresAt: expiresAt.toISOString(), createdAt: new Date().toISOString(),
            });
            setSelectedReward(null);
            setMessage(`${reward.name} acheté !`);
            setMessageType("success");
            setTimeout(() => setMessage(""), 3000);
        } catch (error) {
            setMessage("Erreur lors de l'achat");
            setMessageType("error");
            setTimeout(() => setMessage(""), 5000);
        } finally {
            setIsPurchasing(false);
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

    const activeCoupon = coupons.find(c => c.status === "active");
    const expiredCoupons = coupons.filter(c => c.status === "expired");

    return (
        <>
            <Header />
            <main className="layout-container">

                {/* Titre */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h1 className="font-payback" style={{ fontSize: '2rem', color: 'var(--accent-gold)', margin: 0, letterSpacing: '0.04em' }}>
                        Boutique
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.35rem' }}>
                        Échangez vos ToilesCoins
                    </p>
                </div>

                {/* Toast message */}
                {message && (
                    <div style={{ position: 'fixed', top: 'calc(var(--header-height) + 0.75rem)', left: '50%', transform: 'translateX(-50%)', zIndex: 300, minWidth: '260px' }}>
                        <div className={message.includes("Erreur") || message.includes("insuffisant") ? "toast toast-error" : "toast toast-success"}>
                            {message}
                        </div>
                    </div>
                )}

                {/* Grille récompenses */}
                {rewards.length === 0 ? (
                    <div className="dark-card text-center" style={{ padding: '3rem 1.5rem' }}>
                        <ShoppingBag size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Stock épuisé...</p>
                    </div>
                ) : (
                    <div className="shop-grid mb-4">
                        {rewards.map((reward) => (
                            <div
                                key={reward.id}
                                onClick={() => setSelectedReward(reward)}
                                style={{
                                    width: '100%',
                                    maxWidth: '320px',
                                    cursor: 'pointer',
                                    position: 'relative',
                                }}
                            >
                                {/* Ombre décalée néo-brutal */}
                                <div style={{
                                    position: 'absolute', top: '8px', left: '8px',
                                    width: '100%', height: '100%',
                                    background: 'var(--accent-gold)',
                                    borderRadius: 'var(--radius-xl)',
                                    zIndex: 0,
                                }} />

                                <div style={{
                                    position: 'relative', zIndex: 1,
                                    background: 'var(--bg-surface)',
                                    border: '2px solid var(--accent-gold)',
                                    borderRadius: 'var(--radius-xl)',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '420px',
                                    transition: 'transform var(--transition-fast)',
                                }}
                                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'translate(-3px,-3px)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'translate(0,0)'}
                                >
                                    {/* Image */}
                                    <div style={{ height: '55%', position: 'relative', background: 'var(--bg-elevated)', borderBottom: '2px solid var(--accent-gold)' }}>
                                        {reward.imageUrl ? (
                                            <img src={reward.imageUrl} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
                                                {reward.icon}
                                            </div>
                                        )}
                                        {/* Badge prix */}
                                        <div style={{
                                            position: 'absolute', bottom: 0, right: 0,
                                            background: 'var(--bg-base)',
                                            color: 'var(--accent-gold)',
                                            borderTop: '2px solid var(--accent-gold)',
                                            borderLeft: '2px solid var(--accent-gold)',
                                            borderTopLeftRadius: 'var(--radius-md)',
                                            padding: '4px 12px',
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                        }}>
                                            {reward.cost} TC
                                        </div>
                                    </div>

                                    {/* Contenu */}
                                    <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                        <h3 style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: '1.05rem',
                                            color: 'var(--text-primary)',
                                            textTransform: 'uppercase',
                                            margin: '0 0 0.5rem',
                                        }}>
                                            {reward.name}
                                        </h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', flex: 1, lineHeight: 1.4 }}>
                                            {reward.description}
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handlePurchase(reward); }}
                                            disabled={!userData || userData.balance < reward.cost || isPurchasing}
                                            className="btn-primary"
                                            style={{ width: '100%', marginTop: '0.75rem' }}
                                        >
                                            <Coins size={15} />
                                            {isPurchasing ? "En cours..." : `Acheter · ${reward.cost} TC`}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Historique expiré */}
                {expiredCoupons.length > 0 && (
                    <div className="dark-card" style={{ marginTop: '1.5rem' }}>
                        <div className="section-title">
                            <Archive size={15} />
                            Historique des achats
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {expiredCoupons.map((coupon) => (
                                <div key={coupon.id} className="coupon-expired" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{coupon.reward.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{coupon.reward.name}</div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{coupon.code}</div>
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>Expiré</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Coupon actif flottant */}
            {activeCoupon && (
                <div style={{
                    position: 'fixed',
                    bottom: 'calc(var(--navbar-height) + 0.75rem)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'calc(100% - 2rem)',
                    maxWidth: '420px',
                    zIndex: 150,
                }}>
                    <div className="coupon-active" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <span style={{ fontSize: '2rem', flexShrink: 0 }}>{activeCoupon.reward.icon}</span>
                        <div className="flex-1 min-w-0">
                            <div style={{ fontWeight: 800, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                                {activeCoupon.reward.name}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-green)', letterSpacing: '0.1em' }}>
                                {activeCoupon.code}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Expire dans</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.2rem', color: 'var(--accent-red)' }}>
                                {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
        </>
    );
}
