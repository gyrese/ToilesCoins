"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";

// --- TYPES ---
interface Reward {
    id: string;
    name: string;
    cost: number;
    icon: string;
    description: string;
    imageUrl?: string;
}

interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    conditionType: 'wins' | 'balance' | 'events' | 'first_victory_type';
    conditionValue: number;
    rarity?: string;
}

interface EventType {
    id: string;
    name: string;
    icon: string;
    emoji: string;
    color?: string;
}

interface Event {
    id: string;
    name: string;
    description?: string;
    date: { toDate?: () => Date } | string;
    place?: string;
    imageUrl?: string;
    link?: string;
    winner?: string;
    secondPlace?: string;
    winnerPoints?: number;
    secondPlacePoints?: number;
    eventType?: { name: string; emoji: string; icon: string };
    typeId?: string;
}

interface FacebookEvent {
    id: string;
    name: string;
    start_time?: string;
    description?: string;
}



export default function Admin() {

    const { user, userData, loading } = useAuth();

    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"points" | "events" | "wins" | "rewards" | "badges" | "events">("events");



    // Points State

    const [targetUser, setTargetUser] = useState("");

    const [amount, setAmount] = useState("");

    const [message, setMessage] = useState("");







    // Wins State

    const [winnerPseudo, setWinnerPseudo] = useState("");

    const [eventType, seteventType] = useState("Mario Kart");



    // Rewards Management State

    const [rewards, setRewards] = useState<Reward[]>([]);

    const [editingReward, setEditingReward] = useState<Reward | null>(null);

    const [rewardForm, setRewardForm] = useState({

        name: "",

        cost: "",

        icon: "",

        description: "",

        imageUrl: ""

    });



    // Badges Management State

    const [badges, setBadges] = useState<Badge[]>([]);

    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    const [badgeForm, setBadgeForm] = useState({

        name: "",

        icon: "",

        description: "",

        conditionType: "wins", // wins, balance, events

        conditionValue: "",

        rarity: "common" // common, uncommon, rare, epic, legendary

    });



    // Events Management State (anciennement events)

    const [facebookEvents, setFacebookEvents] = useState<FacebookEvent[]>([]);

    const [events, setEvents] = useState<Event[]>([]);

    const [eventTypes, setEventTypes] = useState<EventType[]>([]);

    const [loadingFbEvents, setLoadingFbEvents] = useState(false);

    const [editingEvent, setEditingEvent] = useState<any>(null);

    const [eventForm, setEventForm] = useState({
        name: "",
        description: "",
        date: "",
        place: "",
        imageUrl: "",
        link: "",
        winner: "",
        secondPlace: "",
        winnerPoints: "100",
        secondPlacePoints: "50",
        typeId: ""
    });

    const [eventSubTab, setEventSubTab] = useState<"types" | "creation" | "history">("history");
    const [showAddEventType, setShowAddEventType] = useState(false);

    const [newEventType, setNewEventType] = useState({

        name: "",

        icon: "",

        emoji: ""

    });
    const [editingEventType, setEditingEventType] = useState<EventType | null>(null);

    // Delete confirmation modal state
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; eventId: string | null; eventName: string }>({
        show: false,
        eventId: null,
        eventName: ""
    });



    useEffect(() => {

        if (!loading && !user) router.push("/login");

    }, [user, loading, router]);



    // Load data when tab changes

    useEffect(() => {

        const fetchData = async () => {

            if (activeTab === "rewards") {

                const q = query(collection(db, "rewards"));

                const snapshot = await getDocs(q);

                setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward)));

            } else if (activeTab === "badges") {

                const q = query(collection(db, "badges"));

                const snapshot = await getDocs(q);

                setBadges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge)));

            } else if (activeTab === "events") {

                const q = query(collection(db, "events"));

                const snapshot = await getDocs(q);

                const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

                // Trier par date décroissante

                eventsData.sort((a: any, b: any) => {

                    const dateA = a.date?.toDate?.() || new Date(a.date);

                    const dateB = b.date?.toDate?.() || new Date(b.date);

                    return dateB - dateA;

                });

                setEvents(eventsData);

                const typesSnapshot = await getDocs(collection(db, "eventTypes"));
                const typesData = typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventType));
                setEventTypes(typesData);

            }

        };

        fetchData();

    }, [activeTab]);



    // Conditional Returns MUST be after all hooks

    if (loading || (user && !userData)) {

        return <div className="min-h-screen flex items-center justify-center font-bold text-xl" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>Chargement...</div>;

    }



    if (!user) return null;



    if (!userData || userData.role.toUpperCase() !== "ADMIN") {

        return (

            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">

                <h1 className="mb-4 text-2xl font-black">ACCÈS REFUSÉ</h1>

                <p className="font-bold mb-8">Zone réservée aux administrateurs.</p>

                <button onClick={() => router.push("/dashboard")} className="neo-btn">RETOUR</button>

            </div>

        );

    }



    // Handlers

    // Vérifie et attribue tous les badges stats (balance, wins, events) après un changement de profil
    const checkAllStatBadges = async (userId: string) => {
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) return;
            const { balance = 0, wins = 0, eventsCount = 0 } = userDoc.data() as { balance?: number; wins?: number; eventsCount?: number };

            const allBadges = await getDocs(query(
                collection(db, "badges"),
                where("conditionType", "in", ["balance", "wins", "events"])
            ));

            for (const badgeDoc of allBadges.docs) {
                const bd = badgeDoc.data();
                const met =
                    (bd.conditionType === "balance" && balance >= bd.conditionValue) ||
                    (bd.conditionType === "wins" && wins >= bd.conditionValue) ||
                    (bd.conditionType === "events" && eventsCount >= bd.conditionValue);
                if (!met) continue;

                const userBadgesRef = collection(db, "users", userId, "badges");
                const existing = await getDocs(query(userBadgesRef, where("name", "==", bd.name)));
                if (existing.empty) {
                    await addDoc(userBadgesRef, {
                        name: bd.name,
                        description: bd.description,
                        icon: bd.icon,
                        rarity: bd.rarity || "common",
                        obtainedAt: serverTimestamp()
                    });
                    setMessage(prev => (prev ? prev + " " : "") + `🏅 Badge "${bd.name}" débloqué !`);
                }
            }
        } catch (err) {
            console.error("Erreur vérification badges stats:", err);
        }
    };

    const handleResetProfile = async (pseudo: string) => {
        if (!confirm(`Remettre à 0 le profil de "${pseudo}" ? (balance, wins, eventsCount + tous les badges)`)) return;
        setMessage("");
        try {
            const snap = await getDocs(query(collection(db, "users"), where("pseudo", "==", pseudo.trim())));
            if (snap.empty) { setMessage("❌ Utilisateur introuvable"); return; }
            const userDoc = snap.docs[0];
            const uid = userDoc.id;
            await updateDoc(doc(db, "users", uid), { balance: 0, wins: 0, eventsCount: 0 });
            const badgesSnap = await getDocs(collection(db, "users", uid, "badges"));
            for (const b of badgesSnap.docs) {
                await deleteDoc(doc(db, "users", uid, "badges", b.id));
            }
            setMessage(`✅ Profil "${pseudo}" remis à 0 (${badgesSnap.size} badge(s) supprimé(s))`);
            setTimeout(() => setMessage(""), 5000);
        } catch (err) {
            console.error(err);
            setMessage("❌ Erreur technique");
        }
    };

    const handleAddPoints = async (e: React.FormEvent) => {

        e.preventDefault();

        setMessage("");

        try {

            const usersRef = collection(db, "users");

            const q = query(usersRef, where("pseudo", "==", targetUser));

            const snapshot = await getDocs(q);

            if (snapshot.empty) {

                setMessage("❌ Utilisateur introuvable");

                return;

            }

            const userDoc = snapshot.docs[0];

            const userId = userDoc.id;

            const pts = parseInt(amount);

            await updateDoc(doc(db, "users", userId), {

                balance: increment(pts)

            });

            await addDoc(collection(db, "transactions"), {

                userId,

                amount: pts,

                type: "EARN",

                description: "Ajout manuel (Admin)",

                date: new Date().toISOString()

            });

            setMessage(`✅ ${pts} TC ajoutés à ${targetUser}`);
            await checkAllStatBadges(userId);

            setTargetUser("");

            setAmount("");

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };







    const handleDeclareWin = async (e: React.FormEvent) => {

        e.preventDefault();

        setMessage("");

        try {

            const usersRef = collection(db, "users");

            const q = query(usersRef, where("pseudo", "==", winnerPseudo));

            const snapshot = await getDocs(q);

            if (snapshot.empty) {

                setMessage("❌ Joueur introuvable");

                return;

            }

            const userDoc = snapshot.docs[0];

            const userId = userDoc.id;

            const rewardAmount = 500;

            await updateDoc(doc(db, "users", userId), {

                wins: increment(1),

                balance: increment(rewardAmount),

                eventsCount: increment(1)

            });

            await addDoc(collection(db, "events"), {

                winner: winnerPseudo,

                event: eventType,

                date: new Date().toISOString(),

                reward: rewardAmount

            });

            await addDoc(collection(db, "transactions"), {

                userId,

                amount: rewardAmount,

                type: "EARN",

                description: `Victoire ${eventType}`,

                date: new Date().toISOString()

            });

            setMessage(`✅ Victoire validée pour ${winnerPseudo}`);
            await checkAllStatBadges(userId);

            setWinnerPseudo("");

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };



    const handleSaveReward = async (e: React.FormEvent) => {

        e.preventDefault();

        setMessage("");

        try {

            const rewardData = {

                name: rewardForm.name,

                cost: parseInt(rewardForm.cost),

                icon: rewardForm.icon,

                description: rewardForm.description,

                imageUrl: rewardForm.imageUrl || null

            };



            if (editingReward) {

                await updateDoc(doc(db, "rewards", editingReward.id), rewardData);

                setMessage("✅ Récompense mise à jour");

            } else {

                await addDoc(collection(db, "rewards"), rewardData);

                setMessage("✅ Récompense créée");

            }



            // Reset form and reload

            setEditingReward(null);

            setRewardForm({ name: "", cost: "", icon: "", description: "", imageUrl: "" });

            const q = query(collection(db, "rewards"));

            const snapshot = await getDocs(q);

            setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward)));

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };



    const handleDeleteReward = async (id: string) => {

        if (!confirm("Supprimer cette récompense ?")) return;

        try {

            await deleteDoc(doc(db, "rewards", id));

            setRewards(rewards.filter(r => r.id !== id));

            setMessage("✅ Récompense supprimée");

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };



    const migrateShopImages = async () => {
        const mapping: { keywords: string[]; file: string }[] = [
            { keywords: ['soft', 'soda', 'boisson', 'coca', 'jus'], file: '/shop/soft.webp' },
            { keywords: ['bière', 'biere', 'beer', 'pinte'],        file: '/shop/beer.webp' },
            { keywords: ['burger', 'sandwich'],                      file: '/shop/burger.webp' },
            { keywords: ['nachos', 'chips', 'snack', 'planche'],    file: '/shop/nachos.webp' },
            { keywords: ['shot', 'cocktail'],                        file: '/shop/shot.webp' },
            { keywords: ['fifa', 'jeu', 'game', 'partie'],           file: '/shop/fifa.webp' },
        ];
        const find = (name = '', icon = '') => {
            const t = (name + ' ' + icon).toLowerCase();
            return mapping.find(m => m.keywords.some(k => t.includes(k)))?.file || null;
        };
        let updated = 0;
        for (const reward of rewards) {
            const image = find(reward.name, reward.icon);
            if (image && reward.imageUrl !== image) {
                await updateDoc(doc(db, 'rewards', reward.id), { imageUrl: image });
                updated++;
            }
        }
        setMessage(`✅ ${updated} image(s) associée(s)`);
        setTimeout(() => setMessage(''), 4000);
    };

    const startEdit = (reward: any) => {

        setEditingReward(reward);

        setRewardForm({

            name: reward.name,

            cost: reward.cost.toString(),

            icon: reward.icon,

            description: reward.description,

            imageUrl: reward.imageUrl || ""

        });

    };



    // BADGES HANDLERS

    const handleSaveBadge = async (e: React.FormEvent) => {

        e.preventDefault();

        setMessage("");

        try {

            const badgeData = {
                name: badgeForm.name,
                icon: badgeForm.icon,
                description: badgeForm.description,
                conditionType: badgeForm.conditionType,
                conditionValue: badgeForm.conditionType === "first_victory_type" || badgeForm.conditionType === "type"
                    ? badgeForm.conditionValue
                    : parseInt(badgeForm.conditionValue) || 0,
                rarity: badgeForm.rarity
            };



            if (editingBadge) {

                await updateDoc(doc(db, "badges", editingBadge.id), badgeData);

                setMessage("✅ Badge mis à jour");

            } else {

                await addDoc(collection(db, "badges"), badgeData);

                setMessage("✅ Badge créé");

            }



            // Reset form and reload

            setEditingBadge(null);

            setBadgeForm({ name: "", icon: "", description: "", conditionType: "wins", conditionValue: "", rarity: "common" });

            const q = query(collection(db, "badges"));

            const snapshot = await getDocs(q);

            setBadges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Badge)));

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };



    const handleDeleteBadge = async (id: string) => {

        if (!confirm("Supprimer ce badge ?")) return;

        try {

            await deleteDoc(doc(db, "badges", id));

            setBadges(badges.filter(b => b.id !== id));

            setMessage("✅ Badge supprimé");

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

        }

    };



    const handleAwardBadge = async (badge: any) => {
        const pseudo = prompt(`Attribuer le badge "${badge.name}" à quel pseudo ?`);
        if (!pseudo?.trim()) return;
        try {
            const q = query(collection(db, "users"), where("pseudo", "==", pseudo.trim()));
            const snap = await getDocs(q);
            if (snap.empty) {
                setMessage(`❌ Pseudo "${pseudo}" introuvable`);
                setTimeout(() => setMessage(""), 4000);
                return;
            }
            const userDoc = snap.docs[0];
            const userBadgesRef = collection(db, "users", userDoc.id, "badges");
            const existing = await getDocs(query(userBadgesRef, where("name", "==", badge.name)));
            if (!existing.empty) {
                setMessage(`⚠️ ${pseudo} possède déjà le badge "${badge.name}"`);
                setTimeout(() => setMessage(""), 4000);
                return;
            }
            await addDoc(userBadgesRef, {
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                rarity: badge.rarity || "common",
                obtainedAt: serverTimestamp()
            });
            setMessage(`✅ Badge "${badge.name}" attribué à ${pseudo} !`);
            setTimeout(() => setMessage(""), 4000);
        } catch (err) {
            console.error(err);
            setMessage("❌ Erreur technique");
        }
    };

    const startEditBadge = (badge: any) => {

        setEditingBadge(badge);

        setBadgeForm({

            name: badge.name,

            icon: badge.icon,

            description: badge.description,

            conditionType: badge.conditionType,

            conditionValue: badge.conditionValue.toString(),

            rarity: badge.rarity || "common"

        });

    };



    // events Handlers

    const fetchFacebookEvents = async () => {

        setLoadingFbEvents(true);

        setMessage("");

        try {

            const token = await user?.getIdToken();
            const response = await fetch('/api/facebook-events', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json();



            if (!response.ok) {

                setMessage(`❌ ${data.error || 'Erreur lors de la récupération des événements'}`);

                setFacebookEvents([]);

                return;

            }



            setFacebookEvents(data.events || []);

            setMessage(`✅ ${data.events?.length || 0} événements récupérés`);

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur de connexion à Facebook");

            setFacebookEvents([]);

        } finally {

            setLoadingFbEvents(false);

        }

    };



    const addeventFromFacebook = async (fbEvent: any) => {

        setMessage("");

        try {

            await addDoc(collection(db, "events"), {

                name: fbEvent.name,

                description: fbEvent.description || "",

                date: new Date(fbEvent.start_time),

                facebookId: fbEvent.id,

                place: fbEvent.place?.name || "",

                coverImage: fbEvent.cover?.source || "",

                status: "upcoming", // upcoming, completed

                createdAt: serverTimestamp()

            });



            setMessage(`✅ ÉVÉNEMENT "${fbEvent.name}" ajouté`);



            // Recharger les ÉVÉNEMENTs

            const q = query(collection(db, "events"));

            const snapshot = await getDocs(q);

            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

            eventsData.sort((a, b) => {

                const dateA = (a.date as { toDate?: () => Date })?.toDate?.() || new Date(a.date as string);

                const dateB = (b.date as { toDate?: () => Date })?.toDate?.() || new Date(b.date as string);

                return dateB.getTime() - dateA.getTime();

            });

            setEvents(eventsData);

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur lors de l'ajout de l'ÉVÉNEMENT");

        }

    };



    const startEditEvent = (event: any) => {
        setEditingEvent(event);
        setEventForm({
            name: event.name || "",
            description: event.description || "",
            date: event.date ? new Date(event.date.toDate ? event.date.toDate() : event.date).toISOString().slice(0, 16) : "",
            place: event.place || "",
            imageUrl: event.imageUrl || event.coverImage || "",
            link: event.link || "",
            winner: event.winner || "",
            secondPlace: event.secondPlace || "",
            winnerPoints: event.winnerPoints?.toString() || "100",
            secondPlacePoints: event.secondPlacePoints?.toString() || "50",
            typeId: event.typeId || ""
        });
    };



    const saveEventResults = async (e: React.FormEvent) => {

        e.preventDefault();

        if (!editingEvent) return;



        setMessage("");

        try {

            // Mettre à jour l'ÉVÉNEMENT

            const eventRef = doc(db, "events", editingEvent.id);

            await updateDoc(eventRef, {
                name: eventForm.name,
                description: eventForm.description,
                date: new Date(eventForm.date).toISOString(),
                place: eventForm.place,
                imageUrl: eventForm.imageUrl,
                link: eventForm.link || null,
                winner: eventForm.winner,
                secondPlace: eventForm.secondPlace,
                winnerPoints: parseInt(eventForm.winnerPoints),
                secondPlacePoints: parseInt(eventForm.secondPlacePoints),
                status: eventForm.winner ? "completed" : "upcoming",
                completedAt: eventForm.winner ? serverTimestamp() : null,
                typeId: eventForm.typeId || null,
                typeName: eventTypes.find(t => t.id === eventForm.typeId)?.name || null,
                typeEmoji: eventTypes.find(t => t.id === eventForm.typeId)?.emoji || null,
                typeIcon: eventTypes.find(t => t.id === eventForm.typeId)?.icon || null
            });

            // Attribuer les points et victoires aux gagnants (support multi-joueurs)
            if (eventForm.winner) {
                // Découper les pseudos par virgule et nettoyer les espaces
                const winners = eventForm.winner.split(',').map(w => w.trim()).filter(w => w);
                const totalPoints = parseInt(eventForm.winnerPoints);
                // Diviser les points (arrondi à l'inférieur)
                const pointsPerPlayer = winners.length > 0 ? Math.floor(totalPoints / winners.length) : 0;

                const usersRef = collection(db, "users");
                const notFoundPseudos: string[] = [];

                // Boucle sur chaque gagnant
                for (const winnerPseudo of winners) {
                    const qWinner = query(usersRef, where("pseudo", "==", winnerPseudo));
                    const snapshotWinner = await getDocs(qWinner);

                    if (snapshotWinner.empty) {
                        notFoundPseudos.push(winnerPseudo);
                    } else {
                        const winnerDoc = snapshotWinner.docs[0];

                        // 1. Mise à jour Solde et Victoires
                        await updateDoc(doc(db, "users", winnerDoc.id), {
                            balance: increment(pointsPerPlayer),
                            wins: increment(1),
                            eventsCount: increment(1)
                        });

                        // 2. Logique Badge (pour CE gagnant spécifique)
                        if (eventForm.typeId) {
                            try {
                                const eventTypeId = eventForm.typeId.toString(); // Conversion explicite
                                const qBadgeConfig = query(
                                    collection(db, "badges"),
                                    where("conditionType", "==", "first_victory_type"),
                                    where("conditionValue", "==", eventTypeId)
                                );
                                const snapshotBadgeConfig = await getDocs(qBadgeConfig);

                                if (!snapshotBadgeConfig.empty) {
                                    for (const badgeDoc of snapshotBadgeConfig.docs) {
                                        const badgeData = badgeDoc.data();

                                        // Vérifier si CE user a déjà le badge
                                        const userBadgesRef = collection(db, "users", winnerDoc.id, "badges");
                                        const qUserBadge = query(userBadgesRef, where("name", "==", badgeData.name));
                                        const snapshotUserBadge = await getDocs(qUserBadge);

                                        if (snapshotUserBadge.empty) {
                                            await addDoc(userBadgesRef, {
                                                name: badgeData.name,
                                                description: badgeData.description,
                                                icon: badgeData.icon,
                                                rarity: badgeData.rarity || "rare",
                                                obtainedAt: serverTimestamp()
                                            });
                                            // On ajoute au message global
                                            setMessage(prev => (prev || "") + ` + Badge "${badgeData.name}" pour ${winnerPseudo} !`);
                                        }
                                    }
                                } else {
                                    // Fallback: essayer avec conditionValue en nombre si c'est un nombre
                                    if (!isNaN(Number(eventTypeId))) {
                                        const qBadgeConfigNum = query(
                                            collection(db, "badges"),
                                            where("conditionType", "==", "first_victory_type"),
                                            where("conditionValue", "==", Number(eventTypeId))
                                        );
                                        const snapshotBadgeConfigNum = await getDocs(qBadgeConfigNum);

                                        if (!snapshotBadgeConfigNum.empty) {
                                            for (const badgeDoc of snapshotBadgeConfigNum.docs) {
                                                const badgeData = badgeDoc.data();
                                                const userBadgesRef = collection(db, "users", winnerDoc.id, "badges");
                                                const qUserBadge = query(userBadgesRef, where("name", "==", badgeData.name));
                                                const snapshotUserBadge = await getDocs(qUserBadge);

                                                if (snapshotUserBadge.empty) {
                                                    await addDoc(userBadgesRef, {
                                                        name: badgeData.name,
                                                        description: badgeData.description,
                                                        icon: badgeData.icon,
                                                        rarity: badgeData.rarity || "rare",
                                                        obtainedAt: serverTimestamp()
                                                    });
                                                    setMessage(prev => (prev || "") + ` + Badge "${badgeData.name}" pour ${winnerPseudo} !`);
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error(`Erreur badge pour ${winnerPseudo}:`, err);
                            }
                        }
                        await checkAllStatBadges(winnerDoc.id);
                    } // fin else snapshotWinner non vide
                }

                if (notFoundPseudos.length > 0) {
                    setMessage(prev => {
                        const base = prev && !prev.startsWith("❌") ? prev + " — " : "";
                        return base + `⚠️ Pseudo(s) introuvable(s) : ${notFoundPseudos.join(', ')}`;
                    });
                }
            }

            // Attribuer les points au 2ème
            if (eventForm.secondPlace) {

                const usersRef = collection(db, "users");

                const qSecond = query(usersRef, where("pseudo", "==", eventForm.secondPlace));

                const snapshotSecond = await getDocs(qSecond);



                if (!snapshotSecond.empty) {

                    const secondDoc = snapshotSecond.docs[0];

                    await updateDoc(doc(db, "users", secondDoc.id), {

                        balance: increment(parseInt(eventForm.secondPlacePoints)),

                        eventsCount: increment(1)

                    });

                    await checkAllStatBadges(secondDoc.id);

                }

            }



            setMessage(prev => prev ? prev + " ✅ Événement mis à jour !" : "✅ Événement mis à jour !");
            setEditingEvent(null);
            setEventForm({
                name: "",
                description: "",
                date: "",
                place: "",
                imageUrl: "",
                link: "",
                winner: "",
                secondPlace: "",
                winnerPoints: "100",
                secondPlacePoints: "50",
                typeId: ""
            });



            // Recharger les ÉVÉNEMENTs

            const q = query(collection(db, "events"));

            const snapshot = await getDocs(q);

            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));

            eventsData.sort((a, b) => {

                const dateA = (a.date as { toDate?: () => Date })?.toDate?.() || new Date(a.date as string);

                const dateB = (b.date as { toDate?: () => Date })?.toDate?.() || new Date(b.date as string);

                return dateB.getTime() - dateA.getTime();

            });

            setEvents(eventsData);

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur lors de l'enregistrement");

        }

    };



    const handleAddEventType = async (e: React.FormEvent) => {

        e.preventDefault();

        const payload = {
            name: newEventType.name.trim(),
            icon: newEventType.icon.trim(),
            emoji: newEventType.emoji.trim() || "🎮"
        };

        if (!payload.name) {
            setMessage("❌ Nom du type requis");
            return;
        }

        try {
            if (editingEventType) {
                await updateDoc(doc(db, "eventTypes", editingEventType.id), payload);
                setEventTypes(prev => prev.map((type) => type.id === editingEventType.id ? { ...type, ...payload } : type));
                setMessage("✅ Type d'événement mis à jour");
            } else {
                const docRef = await addDoc(collection(db, "eventTypes"), payload);
                setEventTypes(prev => [...prev, { id: docRef.id, ...payload }]);
                setMessage("✅ Type d'événement ajouté");
            }
            setNewEventType({ name: "", icon: "", emoji: "" });
            setEditingEventType(null);
            setShowAddEventType(false);
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur lors de l'enregistrement du type");
        }
    };



    const handleDeleteEventType = async (id: string) => {

        if (!confirm("Supprimer ce type d'événement ?")) return;

        try {
            await deleteDoc(doc(db, "eventTypes", id));
            setEventTypes(prev => prev.filter((type) => type.id !== id));
            if (editingEventType?.id === id) {
                setEditingEventType(null);
                setNewEventType({ name: "", icon: "", emoji: "" });
            }
            setMessage("✅ Type supprimé");
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur lors de la suppression du type");
        }
    };



    const uploadEventImage = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = await user?.getIdToken();
        const response = await fetch("/api/admin/upload-image", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Impossible de téléverser l'image.");
        }

        const data = await response.json();
        return data.url as string;
    };



    // Show delete confirmation modal
    const askDeleteEvent = (eventId: string, eventName: string) => {
        setDeleteConfirm({ show: true, eventId, eventName });
    };

    // Actually delete the event after confirmation
    const confirmDeleteEvent = async () => {
        if (!deleteConfirm.eventId) return;

        const id = deleteConfirm.eventId;
        setDeleteConfirm({ show: false, eventId: null, eventName: "" });
        setMessage("");

        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(events.filter(t => t.id !== id));
            setMessage("✅ ÉVÉNEMENT supprimé");
        } catch (error) {
            console.error("Delete error:", error);
            setMessage("❌ Erreur technique: " + (error as Error).message);
        }
    };

    // Cancel delete
    const cancelDeleteEvent = () => {
        setDeleteConfirm({ show: false, eventId: null, eventName: "" });
    };


    return (
        <>
            <Header />

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '2px solid var(--accent-red)', borderRadius: '18px', padding: '1.5rem', maxWidth: '400px', width: '100%' }}>
                        <h3 className="font-payback" style={{ color: 'var(--accent-red)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>⚠️ Confirmer la suppression</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                            Supprimer <strong style={{ color: 'var(--text-primary)' }}>"{deleteConfirm.eventName}"</strong> ?
                            <br /><span style={{ color: 'var(--accent-red)', fontSize: '0.75rem', fontWeight: 700 }}>Cette action est irréversible.</span>
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={cancelDeleteEvent} style={{ flex: 1, padding: '0.65rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>
                            <button onClick={confirmDeleteEvent} style={{ flex: 1, padding: '0.65rem', background: 'var(--accent-red)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>🗑️ Supprimer</button>
                        </div>
                    </div>
                </div>
            )}

            <main style={{ maxWidth: '720px', margin: '0 auto', padding: '1rem', paddingTop: 'calc(56px + 1rem)', paddingBottom: 'calc(68px + 1.5rem)' }}>

                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 className="font-payback" style={{ fontSize: '1.6rem', color: 'var(--accent-gold)', marginBottom: '0.25rem' }}>⚙️ Admin</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Gérez le jeu.</p>
                </div>

                {/* Tabs */}
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '4px' }}>
                    {([
                        { key: "points", label: "💰 Points" },
                        { key: "wins", label: "🏅 Victoires" },
                        { key: "rewards", label: "🎁 Récomp." },
                        { key: "badges", label: "🛡️ Badges" },
                        { key: "events", label: "🏆 Événem." },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key as any); setMessage(""); }}
                            style={{
                                flexShrink: 0,
                                padding: '0.5rem 0.875rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                border: activeTab === tab.key ? '1.5px solid var(--accent-gold)' : '1.5px solid var(--border-strong)',
                                background: activeTab === tab.key ? 'var(--accent-gold)' : 'var(--bg-elevated)',
                                color: activeTab === tab.key ? '#000' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Message toast */}
                {message && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        background: message.includes("✅") ? 'rgba(34,197,94,0.12)' : 'rgba(255,68,68,0.12)',
                        border: message.includes("✅") ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,68,68,0.3)',
                        color: message.includes("✅") ? '#4ade80' : '#ff8080',
                    }}>
                        {message}
                    </div>
                )}



                    {activeTab === "points" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '1.25rem' }}>
                                <h2 className="font-payback" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '1rem' }}>💰 Ajouter des Points</h2>
                                <form onSubmit={handleAddPoints} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    <div><label className="dark-label">Utilisateur</label><input type="text" className="dark-input" placeholder="Pseudo" value={targetUser} onChange={e => setTargetUser(e.target.value)} required /></div>
                                    <div><label className="dark-label">Montant</label><input type="number" className="dark-input" placeholder="500" value={amount} onChange={e => setAmount(e.target.value)} required /></div>
                                    <button type="submit" className="btn-primary">Envoyer</button>
                                </form>
                            </div>

                            {/* Reset profil */}
                            <div style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '18px', padding: '1.25rem' }}>
                                <h2 className="font-payback" style={{ color: 'var(--accent-red)', fontSize: '1rem', marginBottom: '0.75rem' }}>🗑️ Reset Profil</h2>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Remet balance, victoires et events à 0. Supprime tous les badges.</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="dark-input"
                                        placeholder="Pseudo à reset"
                                        id="reset-pseudo-input"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('reset-pseudo-input') as HTMLInputElement;
                                            if (input?.value) handleResetProfile(input.value);
                                        }}
                                        style={{ padding: '0.65rem 1rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', borderRadius: '10px', color: 'var(--accent-red)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', whiteSpace: 'nowrap' }}
                                    >
                                        Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}






                    {activeTab === "wins" && (
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '1.25rem' }}>
                            <h2 className="font-payback" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '1rem' }}>🏅 Déclarer une Victoire</h2>
                            <form onSubmit={handleDeclareWin} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                <div><label className="dark-label">Vainqueur</label><input type="text" className="dark-input" placeholder="Pseudo" value={winnerPseudo} onChange={e => setWinnerPseudo(e.target.value)} required /></div>
                                <div><label className="dark-label">Type</label>
                                    <select className="dark-input" value={eventType} onChange={e => seteventType(e.target.value)}>
                                        <option>Mario Kart</option><option>Smash Bros</option><option>Blindtest</option><option>Karaoké</option><option>Autre</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary">Valider</button>
                            </form>
                        </div>
                    )}



                    {activeTab === "rewards" && (
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '1.25rem' }}>
                            <h2 className="font-payback" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '1rem' }}>{editingReward ? "✏️ Modifier Récompense" : "🎁 Ajouter Récompense"}</h2>
                            <form onSubmit={handleSaveReward} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div><label className="dark-label">Nom</label><input type="text" className="dark-input" value={rewardForm.name} onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })} required /></div>
                                    <div><label className="dark-label">Coût (TC)</label><input type="number" className="dark-input" value={rewardForm.cost} onChange={e => setRewardForm({ ...rewardForm, cost: e.target.value })} required /></div>
                                </div>
                                <div><label className="dark-label">Description</label><textarea className="dark-input" value={rewardForm.description} onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })} required style={{ resize: 'vertical', minHeight: '60px' }} /></div>
                                <div>
                                    <label className="dark-label">Image locale (ex: /shop/soft.webp)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input type="text" className="dark-input" value={rewardForm.imageUrl} onChange={e => setRewardForm({ ...rewardForm, imageUrl: e.target.value })} placeholder="/shop/soft.webp" style={{ flex: 1 }} />
                                        {rewardForm.imageUrl && <img src={rewardForm.imageUrl} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-strong)', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                    </div>
                                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                                        {[
                                            { label: '🥤 Soft', val: '/shop/soft.webp' },
                                            { label: '🍺 Bière', val: '/shop/beer.webp' },
                                            { label: '🍔 Burger', val: '/shop/burger.webp' },
                                            { label: '🌮 Nachos', val: '/shop/nachos.webp' },
                                            { label: '🧪 Shot', val: '/shop/shot.webp' },
                                            { label: '⚽ FIFA', val: '/shop/fifa.webp' },
                                        ].map(({ label, val }) => (
                                            <button key={val} type="button" onClick={() => setRewardForm({ ...rewardForm, imageUrl: val })}
                                                style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', background: rewardForm.imageUrl === val ? 'var(--accent-gold)' : 'var(--bg-elevated)', color: rewardForm.imageUrl === val ? '#000' : 'var(--text-muted)', border: `1px solid ${rewardForm.imageUrl === val ? 'var(--accent-gold)' : 'var(--border-strong)'}` }}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" style={{ flex: 1, padding: '0.65rem', background: 'var(--accent-green)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>{editingReward ? "Mettre à jour" : "Créer"}</button>
                                    {editingReward && (<button type="button" onClick={() => { setEditingReward(null); setRewardForm({ name: "", cost: "", icon: "", description: "", imageUrl: "" }); }} style={{ padding: '0.65rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>)}
                                </div>
                            </form>
                            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>Liste ({rewards.length})</h3>
                                    <button onClick={migrateShopImages} type="button" style={{ padding: '4px 12px', background: 'rgba(255,200,69,0.12)', border: '1px solid var(--accent-gold-border)', borderRadius: '999px', color: 'var(--accent-gold)', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', textTransform: 'uppercase' }}>
                                        🖼️ Auto-assigner images
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {rewards.map((reward) => (
                                        <div key={reward.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                                                {reward.imageUrl
                                                    ? <img src={reward.imageUrl} alt={reward.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-strong)', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                                                    : <span style={{ fontSize: '1.5rem' }}>{reward.icon}</span>
                                                }
                                                <div><div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{reward.name}</div><div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-gold)' }}>{reward.cost} TC</div></div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                <button onClick={() => startEdit(reward)} style={{ padding: '0.35rem 0.65rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#60A5FA', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>EDIT</button>
                                                <button onClick={() => handleDeleteReward(reward.id)} style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#ff8080', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>SUPP</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}



                            {/* Cleanup duplicate block */}



                    {activeTab === "badges" && (
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '1.25rem' }}>
                            <h2 className="font-payback" style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginBottom: '1rem' }}>

                                {editingBadge ? "Modifier Badge" : "Ajouter Badge"}

                            </h2>



                                                        {/* Formulaire Badge */}
                            <form onSubmit={handleSaveBadge} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div><label className="dark-label">Nom</label><input type="text" className="dark-input" value={badgeForm.name} onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })} required /></div>
                                    <div><label className="dark-label">Image URL</label><input type="text" className="dark-input" value={badgeForm.icon} onChange={e => setBadgeForm({ ...badgeForm, icon: e.target.value })} placeholder="https://..." required /></div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <label className="dark-label">Condition Type</label>
                                        <select className="dark-input" value={badgeForm.conditionType} onChange={e => setBadgeForm({ ...badgeForm, conditionType: e.target.value })}>
                                            <option value="wins">Victoires</option><option value="balance">Solde (TC)</option><option value="events">Participations</option><option value="first_victory_type">Première Victoire (Type)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="dark-label">Valeur Requise</label>
                                        {badgeForm.conditionType === "first_victory_type" ? (
                                            <select className="dark-input" value={badgeForm.conditionValue} onChange={e => setBadgeForm({ ...badgeForm, conditionValue: e.target.value })} required>
                                                <option value="">-- Choisir --</option>
                                                {eventTypes.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                            </select>
                                        ) : (
                                            <input type="number" className="dark-input" value={badgeForm.conditionValue} onChange={e => setBadgeForm({ ...badgeForm, conditionValue: e.target.value })} required />
                                        )}
                                    </div>
                                </div>
                                <div><label className="dark-label">Description</label><textarea className="dark-input" value={badgeForm.description} onChange={e => setBadgeForm({ ...badgeForm, description: e.target.value })} required style={{ resize: 'vertical', minHeight: '60px' }} /></div>
                                <div>
                                    <label className="dark-label">Rareté</label>
                                    <select className="dark-input" value={badgeForm.rarity} onChange={e => setBadgeForm({ ...badgeForm, rarity: e.target.value })}>
                                        <option value="common">⚪ Commun</option>
                                        <option value="uncommon">🟢 Peu commun</option>
                                        <option value="rare">🔵 Rare</option>
                                        <option value="epic">🟣 Épique</option>
                                        <option value="legendary">🟡 Légendaire</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button type="submit" style={{ flex: 1, padding: '0.65rem', background: 'var(--accent-green)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer' }}>{editingBadge ? "Mettre à jour" : "Créer"}</button>
                                    {editingBadge && (<button type="button" onClick={() => { setEditingBadge(null); setBadgeForm({ name: '', icon: '', description: '', conditionType: 'wins', conditionValue: '', rarity: 'common' }); }} style={{ padding: '0.65rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Annuler</button>)}
                                </div>
                            </form>

{/* Liste Badges */}
                            <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '1rem' }}>
                                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.06em' }}>Liste ({badges.length})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {badges.map((badge) => (
                                        <div key={badge.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border-default)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                                                <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                                                    {badge.icon && <img src={badge.icon} alt={badge.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                                                        <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{badge.name}</div>
                                                        {badge.rarity && (
                                                            <span style={{
                                                                fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', padding: '1px 7px', borderRadius: '999px', flexShrink: 0,
                                                                color: badge.rarity === 'legendary' ? '#FFC845' : badge.rarity === 'epic' ? '#A855F7' : badge.rarity === 'rare' ? '#60A5FA' : badge.rarity === 'uncommon' ? '#22C55E' : 'var(--text-muted)',
                                                                border: `1px solid ${badge.rarity === 'legendary' ? '#FFC845' : badge.rarity === 'epic' ? '#A855F7' : badge.rarity === 'rare' ? '#60A5FA' : badge.rarity === 'uncommon' ? '#22C55E' : 'var(--border-strong)'}`,
                                                                background: badge.rarity === 'legendary' ? 'rgba(255,200,69,0.1)' : badge.rarity === 'epic' ? 'rgba(168,85,247,0.1)' : badge.rarity === 'rare' ? 'rgba(96,165,250,0.1)' : badge.rarity === 'uncommon' ? 'rgba(34,197,94,0.1)' : 'transparent',
                                                            }}>{badge.rarity}</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                        {badge.conditionType === 'wins' && `🏆 ${badge.conditionValue} Victoires`}
                                                        {badge.conditionType === 'balance' && `💰 ${badge.conditionValue} TC`}
                                                        {badge.conditionType === 'events' && `📅 ${badge.conditionValue} Événements`}
                                                        {badge.conditionType === 'first_victory_type' && `🥇 Première Victoire`}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                <button onClick={() => handleAwardBadge(badge)} style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,200,69,0.15)', border: '1px solid rgba(255,200,69,0.3)', borderRadius: '8px', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>🏅 AWARD</button>
                                                <button onClick={() => startEditBadge(badge)} style={{ padding: '0.35rem 0.65rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#60A5FA', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>EDIT</button>
                                                <button onClick={() => handleDeleteBadge(badge.id)} style={{ padding: '0.35rem 0.65rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#ff8080', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>SUPP</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    )}

                    {activeTab === "events" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">🏆 Gestion des ÉVÉNEMENTS</h2>

                            <div className="flex gap-2 mb-6 flex-wrap">
                                <button
                                    onClick={() => setEventSubTab("types")}
                                    className={`neo-btn ${eventSubTab === "types" ? "!bg-[var(--accent-gold)] !text-black" : "!bg-[var(--bg-elevated)] !text-[var(--text-muted)] !border-[var(--border-strong)] !shadow-none"}`}
                                >
                                    🏷️ TYPES
                                </button>
                                <button
                                    onClick={() => setEventSubTab("creation")}
                                    className={`neo-btn ${eventSubTab === "creation" ? "!bg-[var(--accent-gold)] !text-black" : "!bg-[var(--bg-elevated)] !text-[var(--text-muted)] !border-[var(--border-strong)] !shadow-none"}`}
                                >
                                    ➕ CRÉATION
                                </button>
                                <button
                                    onClick={() => setEventSubTab("history")}
                                    className={`neo-btn ${eventSubTab === "history" ? "!bg-[var(--accent-gold)] !text-black" : "!bg-[var(--bg-elevated)] !text-[var(--text-muted)] !border-[var(--border-strong)] !shadow-none"}`}
                                >
                                    📜 HISTORIQUE
                                </button>
                            </div>



                            {eventSubTab === "types" && (
                                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em' }}>📁 Types ({eventTypes.length})</h3>
                                        <button onClick={() => setShowAddEventType(!showAddEventType)} style={{ padding: '0.5rem 0.75rem', background: 'var(--accent-green)', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                                            {showAddEventType ? "Fermer" : "➕ Ajouter"}
                                        </button>
                                    </div>

                                    {showAddEventType && (
                                        <form onSubmit={handleAddEventType} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                            {editingEventType && (
                                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 128, 0, 0.1)', border: '1px solid rgba(255, 128, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                                    <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--accent-gold)' }}>✏️ Édition: {editingEventType.name}</span>
                                                    <button type="button" onClick={() => { setEditingEventType(null); setNewEventType({ name: '', icon: '', emoji: '' }); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>Annuler</button>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Nom *</label><input type="text" className="dark-input" value={newEventType.name} onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })} required /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Emoji</label><input type="text" className="dark-input" value={newEventType.emoji} onChange={(e) => setNewEventType({ ...newEventType, emoji: e.target.value })} placeholder="🎮" maxLength={4} /></div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Icône URL</label><input type="text" className="dark-input" value={newEventType.icon} onChange={(e) => setNewEventType({ ...newEventType, icon: e.target.value })} placeholder="https://..." /></div>
                                            
                                            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '0.5rem' }}>
                                                <button type="submit" style={{ flex: 1, padding: '0.65rem', background: 'var(--accent-green)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                                                    {editingEventType ? "Mettre à jour" : "Enregistrer"}
                                                </button>
                                                {editingEventType && (
                                                    <button type="button" onClick={() => { setEditingEventType(null); setNewEventType({ name: '', icon: '', emoji: '' }); setShowAddEventType(false); }} style={{ padding: '0.65rem 1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                                                        Fermer
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    )}

                                    {eventTypes.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            Aucun type pour l'instant. Ajoutez-en un !
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                            {eventTypes.map((type) => (
                                                <div key={type.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '12px' }}>
                                                    {/* Header: Icon + Name */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {type.icon ? (
                                                                <img src={type.icon} alt={type.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                                                            ) : (
                                                                <span style={{ fontSize: '1.5rem' }}>{type.emoji || "🕹️"}</span>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', color: 'var(--text-primary)', wordBreak: 'break-word', lineHeight: '1.2' }}>{type.name}</div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Footer: Actions */}
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                                        <button onClick={() => router.push(`/tournaments?typeId=${type.id}&typeName=${encodeURIComponent(type.name)}`)} style={{ flex: 1, padding: '0.5rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#C084FC', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>🏆 TOURNOI</button>
                                                        <button onClick={() => { setEditingEventType(type); setNewEventType({ name: type.name || "", icon: type.icon || "", emoji: type.emoji || "" }); setShowAddEventType(true); }} style={{ padding: '0.5rem 0.75rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#60A5FA', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>EDIT</button>
                                                        <button onClick={() => handleDeleteEventType(type.id)} style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#ff8080', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>SUPP</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {eventSubTab === "creation" && (
                                <>
                                    {/* Formulaire d'ajout manuel de VNEMENT */}
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                                        <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.06em' }}>➕ Ajouter un ÉVÉNEMENT</h3>
                                        <form onSubmit={async (e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            try {
                                                const typeId = formData.get('eventTypeId');
                                                const selectedType = eventTypes.find((type) => type.id === typeId);
                                                const imageUrlInput = ((formData.get('eventImageUrl')) || "").trim();
                                                const eventLinkInput = ((formData.get('eventLink')) || "").trim();
                                                const imageFile = formData.get('eventImageFile');
                                                let finalImageUrl = imageUrlInput;
                                                if (imageFile && imageFile.size > 0) {
                                                    finalImageUrl = await uploadEventImage(imageFile);
                                                }
                                                const isTournament = formData.get('isTournament') === 'on';
                                                const newEventRef = await addDoc(collection(db, "events"), {
                                                    name: formData.get('eventName'),
                                                    description: formData.get('eventDesc') || "",
                                                    date: new Date(formData.get('eventDate')),
                                                    place: formData.get('eventPlace') || "",
                                                    typeId: selectedType?.id || null,
                                                    typeName: selectedType?.name || null,
                                                    typeEmoji: selectedType?.emoji || null,
                                                    typeIcon: selectedType?.icon || null,
                                                    imageUrl: finalImageUrl || null,
                                                    link: eventLinkInput || null,
                                                    isTournament: isTournament,
                                                    status: "upcoming",
                                                    createdAt: serverTimestamp()
                                                });
                                                setMessage("✅ ÉVÉNEMENT ajouté !");
                                                // Recharger les Événements
                                                const q = query(collection(db, "events"));
                                                const snapshot = await getDocs(q);
                                                const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                                                eventsData.sort((a, b) => {
                                                    const dateA = (a.date)?.toDate?.() || new Date(a.date);
                                                    const dateB = (b.date)?.toDate?.() || new Date(b.date);
                                                    return dateB.getTime() - dateA.getTime();
                                                });
                                                setEvents(eventsData);
                                                (e.target as HTMLFormElement).reset();

                                                // Ouvrir la modale d'édition pour le nouvel événement créé
                                                const newlyCreatedEvent = eventsData.find(ev => ev.id === newEventRef.id);
                                                if (newlyCreatedEvent) {
                                                    setEventSubTab("history");
                                                    startEditEvent(newlyCreatedEvent);
                                                }
                                            } catch (error) {
                                                console.error('Erreur complète:', error);
                                                setMessage(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
                                            }
                                        }} style={{ display: 'grid', gap: '0.875rem' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.75rem' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <label className="dark-label">Type d'Événement *</label>
                                                    {eventTypes.length === 0 ? (
                                                        <div style={{ padding: '0.5rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aucun type disponible.</div>
                                                    ) : (
                                                        <select name="eventTypeId" required className="dark-input" defaultValue={eventTypes[0]?.id}>
                                                            {eventTypes.map((type) => (
                                                                <option key={type.id} value={type.id}>{type.emoji || "🎮"} {type.name}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Nom de l'événement *</label><input type="text" name="eventName" required className="dark-input" placeholder="Ex: Mario Kart Décembre 2024" /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Date *</label><input type="datetime-local" name="eventDate" required className="dark-input" /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Lieu</label><input type="text" name="eventPlace" className="dark-input" placeholder="Ex: Bar Le Pixel" /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Lien de l'événement</label><input type="url" name="eventLink" className="dark-input" placeholder="https://www.facebook.com/..." /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Image (URL)</label><input type="text" name="eventImageUrl" className="dark-input" placeholder="https://..." /></div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Image (Fichier)</label><input type="file" name="eventImageFile" accept="image/*" className="dark-input" style={{ padding: '0.4rem' }} /></div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Description</label><textarea name="eventDesc" className="dark-input" rows={3} placeholder="Décrivez l'événement..." style={{ resize: 'vertical' }} /></div>
                                            <div style={{ padding: '0.75rem', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                    <input type="checkbox" name="isTournament" style={{ width: '1.25rem', height: '1.25rem', accentColor: '#C084FC' }} />
                                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', color: '#C084FC' }}>🏆 TOURNOI (Utiliser les brackets)</span>
                                                </label>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cochez si cet événement doit gérer un arbre de tournoi complet.</p>
                                            </div>
                                            <button type="submit" style={{ padding: '0.85rem', background: 'var(--accent-green)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', cursor: 'pointer', marginTop: '0.5rem' }}>
                                                ➕ Ajouter l'événement
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}



                            {/* Modal d'édition des résultats */}
                            {editingEvent && (
                                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '16px', padding: '1.5rem', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-default)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>✏️ MODIFIER L'ÉVÉNEMENT</h3>
                                                <p style={{ color: 'var(--accent-gold)', fontWeight: 700, margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{editingEvent.name}</p>
                                            </div>
                                            <button onClick={() => setEditingEvent(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                                        </div>
                                        
                                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                                            <form onSubmit={saveEventResults} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                                {/* SECTION DETAILS */}
                                                <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-default)' }}>
                                                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '1rem' }}>📝 DÉTAILS</h4>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Nom</label><input type="text" className="dark-input" value={eventForm.name} onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })} required /></div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Date</label><input type="datetime-local" className="dark-input" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} required /></div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Lieu</label><input type="text" className="dark-input" value={eventForm.place} onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })} /></div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Image URL</label><input type="text" className="dark-input" value={eventForm.imageUrl} onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })} /></div>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Lien de l'événement</label><input type="url" className="dark-input" value={eventForm.link} onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })} placeholder="https://..." /></div>
                                                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column' }}><label className="dark-label">Description</label><textarea className="dark-input" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} rows={2} style={{ resize: 'vertical' }} /></div>
                                                    </div>
                                                </div>

                                                {/* SECTION RESULTATS */}
                                                <div style={{ background: 'rgba(234, 179, 8, 0.05)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                                                    <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#facc15', letterSpacing: '0.06em', marginBottom: '1rem' }}>🏆 RÉSULTATS (Optionnel)</h4>
                                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label" style={{ color: '#facc15' }}>🥇 Gagnant(s)</label><input type="text" className="dark-input" value={eventForm.winner} onChange={(e) => setEventForm({ ...eventForm, winner: e.target.value })} placeholder="Pseudo1, Pseudo2..." /></div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Points</label><input type="number" className="dark-input" value={eventForm.winnerPoints} onChange={(e) => setEventForm({ ...eventForm, winnerPoints: e.target.value })} /></div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">🥈 2ème</label><input type="text" className="dark-input" value={eventForm.secondPlace} onChange={(e) => setEventForm({ ...eventForm, secondPlace: e.target.value })} placeholder="Pseudo" /></div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}><label className="dark-label">Points</label><input type="number" className="dark-input" value={eventForm.secondPlacePoints} onChange={(e) => setEventForm({ ...eventForm, secondPlacePoints: e.target.value })} /></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                    <button type="submit" style={{ flex: 2, padding: '0.85rem', background: 'var(--accent-green)', border: 'none', borderRadius: '10px', color: '#000', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', cursor: 'pointer' }}>✅ ENREGISTRER</button>
                                                    <button type="button" onClick={() => setEditingEvent(null)} style={{ flex: 1, padding: '0.85rem', background: 'var(--bg-surface)', border: '1px solid var(--border-strong)', borderRadius: '10px', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>ANNULER</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )}



                            {eventSubTab === "history" && (
                                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                                    <h3 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem', letterSpacing: '0.06em' }}>📋 HISTORIQUE DES ÉVÉNEMENTS</h3>
                                    {events.length === 0 ? (
                                        <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-surface)', border: '1px dashed var(--border-strong)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                                            <p style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase' }}>Aucun ÉVÉNEMENT enregistré</p>
                                            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Ajoutez votre premier événement ci-dessus !</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                                            {events.map((event) => (
                                                <div key={event.id} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '10px' }}>
                                                    {(event.imageUrl || event.coverImage) && (
                                                        <div style={{ width: '100%', height: '120px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem', background: '#000' }}>
                                                            <img src={event.imageUrl || event.coverImage} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target).style.display = 'none'; }} />
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                                <h4 style={{ fontWeight: 800, fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>{event.name}</h4>
                                                                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: event.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)', color: event.status === 'completed' ? '#4ade80' : '#facc15', border: event.status === 'completed' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(234, 179, 8, 0.3)' }}>
                                                                    {event.status === 'completed' ? '✅ TERMINÉ' : '⏳ À VENIR'}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                                <p style={{ margin: 0 }}><strong>📅 Date:</strong> {event.date?.toDate?.()?.toLocaleDateString('fr-FR') || new Date(event.date).toLocaleDateString('fr-FR')}</p>
                                                                {event.place && <p style={{ margin: 0 }}><strong>📍 Lieu:</strong> {event.place}</p>}
                                                            </div>
                                                            {event.winner && (
                                                                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px' }}>
                                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#facc15' }}><strong>🥇 Gagnant:</strong> {event.winner} <span style={{ opacity: 0.8 }}>(+{event.winnerPoints} TC)</span></p>
                                                                    {event.secondPlace && (
                                                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}><strong>🥈 2ème:</strong> {event.secondPlace} <span style={{ opacity: 0.8 }}>(+{event.secondPlacePoints} TC)</span></p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                                                            {event.isTournament && event.status !== 'completed' && event.typeId && (
                                                                <button onClick={() => router.push(`/tournaments?typeId=${event.typeId}&typeName=${encodeURIComponent(event.typeName || 'Tournoi')}&eventId=${event.id}`)} style={{ padding: '0.4rem 0.75rem', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', color: '#C084FC', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>🏆 GÉRER TOURNOI</button>
                                                            )}
                                                            <button onClick={() => startEditEvent(event)} style={{ padding: '0.4rem 0.75rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#60A5FA', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>EDIT</button>
                                                            <button type="button" onClick={() => askDeleteEvent(event.id, event.name)} style={{ padding: '0.4rem 0.75rem', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', borderRadius: '8px', color: '#ff8080', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer' }}>SUPP</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    )}

            </main>

            <Navbar />

        </>
    );
}
