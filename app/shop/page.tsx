"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs, doc, updateDoc, addDoc, increment, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Archive } from "lucide-react";

// --- TYPES ---
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
    // --- STATE & HOOKS ---
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [message, setMessage] = useState("");
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [remaining, setRemaining] = useState<number>(0);

    // --- AUTH CHECK ---
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const q = query(collection(db, "rewards"), orderBy("cost", "asc"));
                const snapshot = await getDocs(q);
                const rewardsData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Reward[];
                setRewards(rewardsData);
            } catch (error) {
                console.error("Erreur chargement récompenses:", error);
            }
        };

        if (user) {
            fetchRewards();
        }
    }, [user]);

    // --- COUPONS LISTENER ---
    useEffect(() => {
        if (!user || rewards.length === 0) return;

        const q = query(
            collection(db, "coupons"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedCoupons: Coupon[] = [];
            const now = Date.now();

            snapshot.forEach((couponDoc) => {
                const couponData = couponDoc.data();
                const reward = rewards.find(r => r.id === couponData.rewardId);

                if (reward) {
                    const expiresAt = new Date(couponData.expiresAt);
                    const isExpired = expiresAt.getTime() < now;

                    if (isExpired && couponData.status === "active") {
                        updateDoc(doc(db, "coupons", couponDoc.id), {
                            status: "expired"
                        }).catch(err => console.error("Erreur mise à jour:", err));
                    }

                    loadedCoupons.push({
                        id: couponDoc.id,
                        code: couponData.code,
                        reward,
                        expiresAt,
                        status: isExpired ? "expired" : (couponData.status || "active")
                    });
                }
            });

            setCoupons(loadedCoupons);

            const activeCoupon = loadedCoupons.find(c => c.status === "active");
            if (activeCoupon) {
                const secondsRemaining = Math.floor((activeCoupon.expiresAt.getTime() - now) / 1000);
                setRemaining(Math.max(0, secondsRemaining));
            }
        }, (error) => {
            console.error("Erreur chargement coupons:", error);
        });

        return () => unsubscribe();
    }, [user, rewards]);

    // --- COUNTDOWN ---
    useEffect(() => {
        const activeCoupon = coupons.find(c => c.status === "active");
        if (!activeCoupon) return;

        const interval = setInterval(async () => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    updateDoc(doc(db, "coupons", activeCoupon.id), {
                        status: "expired"
                    }).catch(err => console.error("Erreur mise à jour statut:", err));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [coupons]);

    // --- PURCHASE HANDLER ---
    const handlePurchase = async (reward: Reward) => {
        if (!user || !userData) return;

        if (userData.balance < reward.cost) {
            setMessage("Solde insuffisant");
            setTimeout(() => setMessage(""), 3000);
            return;
        }

        try {
            await updateDoc(doc(db, "users", user.uid), {
                balance: increment(-reward.cost),
            });

            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
            await addDoc(collection(db, "coupons"), {
                userId: user.uid,
                rewardId: reward.id,
                rewardName: reward.name,
                rewardIcon: reward.icon,
                rewardDescription: reward.description,
                code,
                status: "active",
                expiresAt: expiresAt.toISOString(),
                createdAt: new Date().toISOString(),
            });

            setSelectedReward(null);
            setMessage(`${reward.name} acheté avec succès !`);
            setTimeout(() => setMessage(""), 3000);
        } catch (error: any) {
            console.error("Erreur achat:", error);
            setMessage("Erreur lors de l'achat");
            setTimeout(() => setMessage(""), 5000);
        }
    };

    // --- LOADING STATE ---
    if (loading || (user && !userData)) {
        return (
            <div className="d-flex min-vh-100 align-items-center justify-content-center" style={{ backgroundColor: "#FFD95A" }}>
                <div className="h3 fw-bold text-uppercase">Chargement...</div>
            </div>
        );
    }

    if (!user) return null;

    const activeCoupon = coupons.find(c => c.status === "active");
    const expiredCoupons = coupons.filter(c => c.status === "expired");

    return (
        <>
            <Header />
            <main style={{ backgroundColor: "#FFD95A", minHeight: "100vh", paddingBottom: "150px", paddingTop: "50px" }}>

                {/* PAGE HEADER */}
                <div className="container text-center mb-5">
                    <h1 className="display-4 fw-bold fst-italic text-uppercase mb-3" style={{ letterSpacing: "-2px" }}>Boutique</h1>
                    <div className="mx-auto mb-4" style={{ height: "4px", width: "100px", backgroundColor: "black" }}></div>
                    <p className="fw-bold text-uppercase small" style={{ letterSpacing: "0.2em", opacity: 0.6 }}>
                        Échangez vos ToilesCoins
                    </p>
                </div>

                {/* FEEDBACK MESSAGE */}
                {message && (
                    <div className="position-fixed top-0 start-50 translate-middle-x mt-5 z-3">
                        <div className="alert alert-dark fw-bold text-uppercase shadow-lg rounded-pill px-5">
                            {message}
                        </div>
                    </div>
                )}

                {/* --- REWARDS GRID (BOOTSTRAP) --- */}
                <div className="container mb-5">
                    {/* ROW with G-5 for large gap */}
                    <div className="row g-5 justify-content-center">

                        {rewards.length === 0 ? (
                            <div className="col-12 text-center">
                                <div className="card border-4 border-dark rounded-4 p-5 shadow-sm">
                                    <h2 className="text-muted text-uppercase fw-bold">Stock épuisé...</h2>
                                </div>
                            </div>
                        ) : (
                            rewards.map((reward) => (
                                // COLUMNS: 1 on mobile (col-12), 2 on tablet (col-md-6), 3 on desktop (col-lg-4)
                                <div key={reward.id} className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">

                                    {/* CARD CONTAINER */}
                                    <div
                                        onClick={() => setSelectedReward(reward)}
                                        className="card border-0 bg-transparent"
                                        style={{ width: "100%", maxWidth: "350px", cursor: "pointer" }}
                                    >
                                        {/* Custom Card Design mimicking the Trading Card style but using Bootstrap structure */}
                                        <div className="position-relative">
                                            {/* Shadow element */}
                                            <div className="position-absolute w-100 h-100 bg-black rounded-top-5 rounded-bottom-3"
                                                style={{ top: "10px", left: "10px", zIndex: 0 }}></div>

                                            {/* Main Card Content */}
                                            <div className="position-relative bg-white border border-4 border-dark rounded-top-5 rounded-bottom-3 overflow-hidden d-flex flex-column"
                                                style={{ zIndex: 1, height: "500px" }}>

                                                {/* Image Section (Top 55%) */}
                                                <div className="position-relative border-bottom border-4 border-dark bg-light" style={{ height: "55%" }}>
                                                    {reward.imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={reward.imageUrl}
                                                            alt={reward.name}
                                                            className="w-100 h-100 object-fit-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-100 h-100 d-flex align-items-center justify-content-center text-secondary display-1">
                                                            {reward.icon}
                                                        </div>
                                                    )}

                                                    {/* Price Badge */}
                                                    <div className="position-absolute bottom-0 end-0 bg-black text-warning px-3 py-1 fw-bold border-top border-start border-4 border-dark rounded-top-left-3"
                                                        style={{ borderTopLeftRadius: "10px" }}>
                                                        <span className="h5 mb-0">{reward.cost} TC</span>
                                                    </div>
                                                </div>

                                                {/* Content Section (Bottom 45%) */}
                                                <div className="p-4 d-flex flex-column align-items-center text-center h-100" style={{ backgroundColor: "#FFD95A", height: "45%" }}>
                                                    <h3 className="h4 fw-bold text-uppercase mb-2 text-dark" style={{ transform: "rotate(-1deg)" }}>
                                                        {reward.name}
                                                    </h3>

                                                    <p className="small fw-bold fst-italic text-dark mb-auto px-2" style={{ opacity: 0.8 }}>
                                                        {reward.description}
                                                    </p>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handlePurchase(reward);
                                                        }}
                                                        disabled={!userData || userData.balance < reward.cost}
                                                        className={`btn btn-dark w-100 fw-bold text-uppercase rounded-3 mt-3 d-flex align-items-center justify-content-center gap-2 ${!userData || userData.balance < reward.cost ? "disabled opacity-50" : ""
                                                            }`}
                                                    >
                                                        Acheter
                                                        <span className="d-inline-block rounded-circle bg-warning border border-warning-subtle" style={{ width: "12px", height: "12px" }}></span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- ACTIVE COUPON MODAL --- */}
                {activeCoupon && (
                    <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 z-3 w-100" style={{ maxWidth: "450px" }}>
                        <div className="card border-4 border-dark shadow-lg rounded-4 overflow-hidden">
                            <div className="card-header bg-black text-warning text-center fw-bold text-uppercase small py-2">
                                Coupon Actif
                            </div>
                            <div className="card-body d-flex align-items-center gap-3 p-4 bg-white">
                                <div className="bg-light border border-2 border-dark rounded-3 p-3 display-6 d-flex align-items-center justify-content-center" style={{ width: "70px", height: "70px" }}>
                                    {activeCoupon.reward.icon}
                                </div>
                                <div className="flex-grow-1">
                                    <h5 className="fw-bold text-uppercase mb-1 lh-1">{activeCoupon.reward.name}</h5>
                                    <span className="badge bg-warning text-dark border border-dark fs-6 font-monospace">
                                        {activeCoupon.code}
                                    </span>
                                </div>
                                <div className="text-end">
                                    <div className="small fw-bold text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>Expire dans</div>
                                    <div className="h3 fw-bold text-danger mb-0 font-monospace">
                                        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, '0')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- HISTORY SECTION --- */}
                {expiredCoupons.length > 0 && (
                    <div className="container mt-5 pt-5 border-top border-dark border-opacity-25">
                        <div className="d-flex align-items-center justify-content-center gap-2 mb-4 opacity-50">
                            <Archive size={24} />
                            <h2 className="h4 fw-bold text-uppercase mb-0">Historique des achats</h2>
                        </div>
                        <div className="row g-3">
                            {expiredCoupons.map((coupon) => (
                                <div key={coupon.id} className="col-12 col-md-6 col-lg-4">
                                    <div className="card h-100 border-2 border-dark border-opacity-10 bg-white bg-opacity-50 p-3 d-flex flex-row align-items-center gap-3 grayscale opacity-75">
                                        <div className="fs-3">{coupon.reward.icon}</div>
                                        <div className="flex-grow-1 text-truncate">
                                            <div className="fw-bold text-uppercase small text-truncate">{coupon.reward.name}</div>
                                            <div className="small font-monospace text-muted">{coupon.code}</div>
                                        </div>
                                        <span className="badge border border-secondary text-secondary bg-transparent">Expiré</span>
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
