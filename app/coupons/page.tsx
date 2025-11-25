"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Ticket, Clock, Archive, Sparkles } from "lucide-react";

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
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Real-time listener for coupons
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "coupons"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );


        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const loadedCoupons: Coupon[] = [];
            const now = Date.now();

            snapshot.forEach((couponDoc) => {
                const couponData = couponDoc.data();
                const expiresAt = new Date(couponData.expiresAt);
                const isExpired = expiresAt.getTime() < now;

                // Si le coupon est expiré mais marqué comme actif, le mettre à jour dans Firestore
                if (isExpired && couponData.status === "active") {
                    updateDoc(doc(db, "coupons", couponDoc.id), {
                        status: "expired"
                    }).catch(err => console.error("Erreur mise à jour:", err));
                }

                loadedCoupons.push({
                    id: couponDoc.id,
                    code: couponData.code,
                    reward: {
                        id: couponData.rewardId,
                        name: couponData.rewardName,
                        icon: couponData.rewardIcon,
                        description: couponData.rewardDescription,
                        cost: 0
                    },
                    expiresAt,
                    createdAt: new Date(couponData.createdAt),
                    status: isExpired ? "expired" : (couponData.status || "active")
                });
            });

            setCoupons(loadedCoupons);

            // Calculate remaining time for active coupons
            const newRemaining: { [key: string]: number } = {};
            loadedCoupons.forEach(coupon => {
                if (coupon.status === "active") {
                    const secondsLeft = Math.floor((coupon.expiresAt.getTime() - now) / 1000);
                    newRemaining[coupon.id] = Math.max(0, secondsLeft);
                }
            });
            setRemaining(newRemaining);
        });

        return () => unsubscribe();
    }, [user]);

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setRemaining(prev => {
                const updated = { ...prev };
                Object.keys(updated).forEach(async (id) => {
                    if (updated[id] > 0) {
                        updated[id]--;
                    } else if (updated[id] === 0) {
                        // Mark as expired in Firestore when timer reaches 0
                        try {
                            await updateDoc(doc(db, "coupons", id), {
                                status: "expired"
                            });
                        } catch (err) {
                            console.error("Erreur mise à jour statut:", err);
                        }
                    }
                });
                return updated;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (loading || (user && !userData)) {
        return (
            <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">
                CHARGEMENT...
            </div>
        );
    }

    if (!user) return null;

    const activeCoupons = coupons.filter(c => c.status === "active");
    const usedCoupons = coupons.filter(c => c.status === "used");
    const expiredCoupons = coupons.filter(c => c.status === "expired");

    const handleMarkAsUsed = async (couponId: string) => {
        try {
            await updateDoc(doc(db, "coupons", couponId), {
                status: "used"
            });
        } catch (error) {
            console.error("Erreur:", error);
            alert("Erreur lors de la mise à jour du coupon");
        }
    };

    return (
        <>
            <Header />
            <main className="layout-container pb-32">
                <div className="mb-8">
                    <h1 className="text-4xl font-black uppercase italic mb-2">🎟️ Mes Coupons</h1>
                    <p className="font-bold opacity-70">Tous tes coupons actifs et archivés</p>
                </div>

                {/* Active Coupons */}
                {activeCoupons.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="text-green-600" size={24} />
                            <h2 className="text-2xl font-black uppercase">Actifs</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeCoupons.map((coupon) => (
                                <div
                                    key={coupon.id}
                                    className="neo-card !bg-gradient-to-br from-green-400 to-emerald-500 !border-green-600 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="text-6xl">{coupon.reward.icon}</div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-black uppercase text-white">{coupon.reward.name}</h3>
                                                <p className="text-sm text-white/80">{coupon.reward.description}</p>
                                            </div>
                                        </div>
                                        <div className="bg-white/90 backdrop-blur rounded-lg p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold opacity-70">CODE COUPON</span>
                                                <Ticket size={16} />
                                            </div>
                                            <div className="bg-black text-white px-4 py-2 rounded font-mono text-center text-2xl mb-3">
                                                {coupon.code}
                                            </div>
                                            <div className="flex items-center justify-center gap-2 text-sm font-bold mb-3">
                                                <Clock size={16} className="text-red-600" />
                                                <span className="text-red-600">
                                                    Expire dans: {Math.floor((remaining[coupon.id] || 0) / 60)}m {(remaining[coupon.id] || 0) % 60}s
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleMarkAsUsed(coupon.id)}
                                                className="neo-btn !bg-blue-500 !border-blue-600 hover:!bg-blue-400 w-full text-sm"
                                            >
                                                ✅ Marquer comme utilisé
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Active Coupons */}
                {activeCoupons.length === 0 && (
                    <div className="neo-card text-center mb-8">
                        <Ticket size={48} className="mx-auto mb-4 opacity-30" />
                        <h3 className="text-xl font-black mb-2">Aucun coupon actif</h3>
                        <p className="opacity-70 mb-4">Va dans la boutique pour acheter des récompenses !</p>
                        <button
                            onClick={() => router.push("/shop")}
                            className="neo-btn !bg-green-500 !border-green-600 hover:!bg-green-400"
                        >
                            🛒 Aller à la boutique
                        </button>
                    </div>
                )}

                {/* Used Coupons */}
                {usedCoupons.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Ticket className="text-blue-600" size={24} />
                            <h2 className="text-2xl font-black uppercase">Utilisés ({usedCoupons.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {usedCoupons.map((coupon) => (
                                <div key={coupon.id} className="neo-card !bg-blue-100 !border-blue-400">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{coupon.reward.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-black uppercase text-sm">{coupon.reward.name}</h3>
                                            <p className="font-mono text-xs text-gray-600">{coupon.code}</p>
                                            <p className="text-xs text-blue-600 font-bold mt-1">
                                                ✅ Utilisé
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Expired Coupons Archive */}
                {expiredCoupons.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Archive size={20} />
                            <h2 className="text-2xl font-black uppercase">Archives ({expiredCoupons.length})</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expiredCoupons.map((coupon) => (
                                <div key={coupon.id} className="neo-card !bg-gray-200 !border-gray-400 opacity-75">
                                    <div className="flex items-center gap-4">
                                        <div className="text-4xl">{coupon.reward.icon}</div>
                                        <div className="flex-1">
                                            <h3 className="font-black uppercase text-sm">{coupon.reward.name}</h3>
                                            <p className="font-mono text-xs text-gray-600">{coupon.code}</p>
                                            <p className="text-xs text-red-600 font-bold mt-1">
                                                ❌ Expiré le {coupon.expiresAt.toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    </div>
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
