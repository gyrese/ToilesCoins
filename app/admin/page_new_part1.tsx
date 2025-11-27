"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";

export default function Admin() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"points" | "events_old" | "wins" | "rewards" | "badges" | "events">("events");

    // Points State
    const [targetUser, setTargetUser] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    // Old Events State (à supprimer plus tard)
    const [eventTitle, setEventTitle] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [eventReward, setEventReward] = useState("");

    // Wins State
    const [winnerPseudo, setWinnerPseudo] = useState("");
    const [tournamentType, setTournamentType] = useState("Mario Kart");

    // Rewards Management State
    const [rewards, setRewards] = useState<any[]>([]);
    const [editingReward, setEditingReward] = useState<any>(null);
    const [rewardForm, setRewardForm] = useState({
        name: "",
        cost: "",
        icon: "",
        description: "",
        imageUrl: ""
    });

    // Badges Management State
    const [badges, setBadges] = useState<any[]>([]);
    const [editingBadge, setEditingBadge] = useState<any>(null);
    const [badgeForm, setBadgeForm] = useState({
        name: "",
        icon: "",
        description: "",
        conditionType: "wins",
        conditionValue: ""
    });

    // Events Management State (NOUVEAU SYSTÈME)
    const [events, setEvents] = useState<any[]>([]);
    const [eventTypes, setEventTypes] = useState<any[]>([]);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [eventForm, setEventForm] = useState({
        winner: "",
        secondPlace: "",
        winnerPoints: "100",
        secondPlacePoints: "50"
    });
    const [showAddEventType, setShowAddEventType] = useState(false);
    const [newEventType, setNewEventType] = useState({
        name: "",
        emoji: "",
        icon: "",
        color: "#FFC845"
    });

    // Auth Redirect
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Load data when tab changes
    useEffect(() => {
        const fetchData = async () => {
            if (activeTab === "rewards") {
                const q = query(collection(db, "rewards"));
                const snapshot = await getDocs(q);
                setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (activeTab === "badges") {
                const q = query(collection(db, "badges"));
                const snapshot = await getDocs(q);
                setBadges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } else if (activeTab === "events") {
                // Charger les événements
                const qEvents = query(collection(db, "events"));
                const snapshotEvents = await getDocs(qEvents);
                const eventsData = snapshotEvents.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                eventsData.sort((a: any, b: any) => {
                    const dateA = a.date?.toDate?.() || new Date(a.date);
                    const dateB = b.date?.toDate?.() || new Date(b.date);
                    return dateB - dateA;
                });
                setEvents(eventsData);

                // Charger les types d'événements
                const qTypes = query(collection(db, "eventTypes"));
                const snapshotTypes = await getDocs(qTypes);
                setEventTypes(snapshotTypes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };
        fetchData();
    }, [activeTab]);

    // Conditional Returns MUST be after all hooks
    if (loading || (user && !userData)) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">CHARGEMENT...</div>;
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

    // HANDLERS - Points
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
            await updateDoc(doc(db, "users", userDoc.id), {
                balance: increment(parseInt(amount))
            });
            setMessage(`✅ ${amount} TC ajoutés à ${targetUser}`);
            setTargetUser("");
            setAmount("");
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    // HANDLERS - Old Events (à garder pour compatibilité)
    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            await addDoc(collection(db, "events_old"), {
                title: eventTitle,
                date: new Date(eventDate),
                reward: parseInt(eventReward),
                createdAt: serverTimestamp()
            });
            setMessage(`✅ Événement "${eventTitle}" créé`);
            setEventTitle("");
            setEventDate("");
            setEventReward("");
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    // HANDLERS - Wins
    const handleAddWin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("pseudo", "==", winnerPseudo));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setMessage("❌ Utilisateur introuvable");
                return;
            }
            const userDoc = snapshot.docs[0];
            await updateDoc(doc(db, "users", userDoc.id), {
                wins: increment(1)
            });
            setMessage(`✅ Victoire ajoutée à ${winnerPseudo}`);
            setWinnerPseudo("");
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    // HANDLERS - Rewards
    const handleSaveReward = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            if (editingReward) {
                await updateDoc(doc(db, "rewards", editingReward.id), {
                    name: rewardForm.name,
                    cost: parseInt(rewardForm.cost),
                    icon: rewardForm.icon,
                    description: rewardForm.description,
                    imageUrl: rewardForm.imageUrl
                });
                setMessage("✅ Récompense modifiée");
            } else {
                await addDoc(collection(db, "rewards"), {
                    name: rewardForm.name,
                    cost: parseInt(rewardForm.cost),
                    icon: rewardForm.icon,
                    description: rewardForm.description,
                    imageUrl: rewardForm.imageUrl,
                    createdAt: serverTimestamp()
                });
                setMessage("✅ Récompense ajoutée");
            }
            setRewardForm({ name: "", cost: "", icon: "", description: "", imageUrl: "" });
            setEditingReward(null);
            const q = query(collection(db, "rewards"));
            const snapshot = await getDocs(q);
            setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    const handleDeleteReward = async (id: string) => {
        if (!confirm("Supprimer cette récompense ?")) return;
        setMessage("");
        try {
            await deleteDoc(doc(db, "rewards", id));
            setRewards(rewards.filter(r => r.id !== id));
            setMessage("✅ Récompense supprimée");
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    const startEditReward = (reward: any) => {
        setEditingReward(reward);
        setRewardForm({
            name: reward.name,
            cost: reward.cost.toString(),
            icon: reward.icon,
            description: reward.description,
            imageUrl: reward.imageUrl || ""
        });
    };

    // HANDLERS - Badges
    const handleSaveBadge = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            if (editingBadge) {
                await updateDoc(doc(db, "badges", editingBadge.id), {
                    name: badgeForm.name,
                    icon: badgeForm.icon,
                    description: badgeForm.description,
                    conditionType: badgeForm.conditionType,
                    conditionValue: parseInt(badgeForm.conditionValue)
                });
                setMessage("✅ Badge modifié");
            } else {
                await addDoc(collection(db, "badges"), {
                    name: badgeForm.name,
                    icon: badgeForm.icon,
                    description: badgeForm.description,
                    conditionType: badgeForm.conditionType,
                    conditionValue: parseInt(badgeForm.conditionValue),
                    createdAt: serverTimestamp()
                });
                setMessage("✅ Badge ajouté");
            }
            setBadgeForm({ name: "", icon: "", description: "", conditionType: "wins", conditionValue: "" });
            setEditingBadge(null);
            const q = query(collection(db, "badges"));
            const snapshot = await getDocs(q);
            setBadges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur technique");
        }
    };

    const handleDeleteBadge = async (id: string) => {
        if (!confirm("Supprimer ce badge ?")) return;
        setMessage("");
        try {
            await deleteDoc(doc(db, "badges", id));
            setBadges(badges.filter(b => b.id !== id));
            setMessage("✅ Badge supprimé");
        } catch (error) {
            console.error(error);
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
            conditionValue: badge.conditionValue.toString()
        });
    };

    // HANDLERS - Events (NOUVEAU SYSTÈME)
    const initializeEventTypes = async () => {
        setMessage("");
        try {
            const defaultTypes = [
                { name: "Tournoi", emoji: "🎮", icon: "https://api.dicebear.com/9.x/shapes/svg?seed=tournament&backgroundColor=ff6b35", color: "#FF6B35" },
                { name: "Blind Test", emoji: "🎵", icon: "https://api.dicebear.com/9.x/shapes/svg?seed=blindtest&backgroundColor=4ecdc4", color: "#4ECDC4" },
                { name: "Blindlotoquine", emoji: "🎲", icon: "https://api.dicebear.com/9.x/shapes/svg?seed=blindloto&backgroundColor=95e1d3", color: "#95E1D3" },
                { name: "Apéro Quiz", emoji: "🍻", icon: "https://api.dicebear.com/9.x/shapes/svg?seed=aperoquiz&backgroundColor=f38181", color: "#F38181" }
            ];

            for (const type of defaultTypes) {
                await addDoc(collection(db, "eventTypes"), type);
            }

            setMessage("✅ Types d'événements initialisés !");

            // Recharger
            const qTypes = query(collection(db, "eventTypes"));
            const snapshotTypes = await getDocs(qTypes);
            setEventTypes(snapshotTypes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Erreur: ${error.message}`);
        }
    };

    const handleAddEventType = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            await addDoc(collection(db, "eventTypes"), {
                name: newEventType.name,
                emoji: newEventType.emoji,
                icon: newEventType.icon || `https://api.dicebear.com/9.x/shapes/svg?seed=${newEventType.name}&backgroundColor=${newEventType.color.replace('#', '')}`,
                color: newEventType.color
            });

            setMessage(`✅ Type "${newEventType.name}" ajouté !`);
            setNewEventType({ name: "", emoji: "", icon: "", color: "#FFC845" });
            setShowAddEventType(false);

            // Recharger
            const qTypes = query(collection(db, "eventTypes"));
            const snapshotTypes = await getDocs(qTypes);
            setEventTypes(snapshotTypes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Erreur: ${error.message}`);
        }
    };

    const startEditEvent = (event: any) => {
        setEditingEvent(event);
        setEventForm({
            winner: event.winner || "",
            secondPlace: event.secondPlace || "",
            winnerPoints: event.winnerPoints?.toString() || "100",
            secondPlacePoints: event.secondPlacePoints?.toString() || "50"
        });
    };

    const saveEventResults = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingEvent) return;

        setMessage("");
        try {
            const eventRef = doc(db, "events", editingEvent.id);
            await updateDoc(eventRef, {
                winner: eventForm.winner,
                secondPlace: eventForm.secondPlace,
                winnerPoints: parseInt(eventForm.winnerPoints),
                secondPlacePoints: parseInt(eventForm.secondPlacePoints),
                status: "completed",
                completedAt: serverTimestamp()
            });

            // Attribuer points + victoire au gagnant
            if (eventForm.winner) {
                const usersRef = collection(db, "users");
                const qWinner = query(usersRef, where("pseudo", "==", eventForm.winner));
                const snapshotWinner = await getDocs(qWinner);

                if (!snapshotWinner.empty) {
                    const winnerDoc = snapshotWinner.docs[0];
                    await updateDoc(doc(db, "users", winnerDoc.id), {
                        balance: increment(parseInt(eventForm.winnerPoints)),
                        wins: increment(1)
                    });
                }
            }

            // Attribuer points au 2ème
            if (eventForm.secondPlace) {
                const usersRef = collection(db, "users");
                const qSecond = query(usersRef, where("pseudo", "==", eventForm.secondPlace));
                const snapshotSecond = await getDocs(qSecond);

                if (!snapshotSecond.empty) {
                    const secondDoc = snapshotSecond.docs[0];
                    await updateDoc(doc(db, "users", secondDoc.id), {
                        balance: increment(parseInt(eventForm.secondPlacePoints))
                    });
                }
            }

            setMessage(`✅ Résultats enregistrés ! ${eventForm.winner} remporte l'événement !`);
            setEditingEvent(null);
            setEventForm({ winner: "", secondPlace: "", winnerPoints: "100", secondPlacePoints: "50" });

            // Recharger
            const qEvents = query(collection(db, "events"));
            const snapshotEvents = await getDocs(qEvents);
            const eventsData = snapshotEvents.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            eventsData.sort((a: any, b: any) => {
                const dateA = a.date?.toDate?.() || new Date(a.date);
                const dateB = b.date?.toDate?.() || new Date(b.date);
                return dateB - dateA;
            });
            setEvents(eventsData);
        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Erreur: ${error.message}`);
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Supprimer cet événement ?")) return;
        setMessage("");
        try {
            await deleteDoc(doc(db, "events", id));
            setEvents(events.filter((e: any) => e.id !== id));
            setMessage("✅ Événement supprimé");
        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Erreur: ${error.message}`);
        }
    };

    const deleteEventType = async (id: string) => {
        if (!confirm("Supprimer ce type d'événement ?")) return;
        setMessage("");
        try {
            await deleteDoc(doc(db, "eventTypes", id));
            setEventTypes(eventTypes.filter((t: any) => t.id !== id));
            setMessage("✅ Type supprimé");
        } catch (error: any) {
            console.error(error);
            setMessage(`❌ Erreur: ${error.message}`);
        }
    };

    return (
        <>
            <Header />
            <main className="layout-container pb-32">
                <div className="mb-8">
                    <h1 className="text-3xl font-black uppercase italic mb-2">Admin Zone</h1>
                    <p className="font-bold opacity-70">Gérez le jeu.</p>
                </div>

                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => { setActiveTab("points"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "points" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Points
                    </button>
                    <button
                        onClick={() => { setActiveTab("events_old"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "events_old" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Événements (old)
                    </button>
                    <button
                        onClick={() => { setActiveTab("wins"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "wins" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Victoires
                    </button>
                    <button
                        onClick={() => { setActiveTab("rewards"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "rewards" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Récompenses
                    </button>
                    <button
                        onClick={() => { setActiveTab("badges"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "badges" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Badges
                    </button>
                    <button
                        onClick={() => { setActiveTab("events"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "events" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        🎉 Événements
                    </button>
                </div>

                <div className="neo-card">
                    {message && (
                        <div className={`p-4 border-2 border-black font-bold mb-6 text-center ${message.includes("✅") ? "bg-green-200" : "bg-red-200"}`}>
                            {message}
                        </div>
                    )}

                    {/* Onglet Points */}
                    {activeTab === "points" && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-6">Ajouter des Points</h2>
                            <form onSubmit={handleAddPoints} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Utilisateur</label>
                                    <input
                                        type="text"
                                        value={targetUser}
                                        onChange={(e) => setTargetUser(e.target.value)}
                                        className="neo-input w-full"
                                        placeholder="Pseudo"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Montant (TC)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="neo-input w-full"
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <button type="submit" className="neo-btn bg-green-400 hover:bg-green-300 w-full">
                                    AJOUTER LES POINTS
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Onglet Old Events */}
                    {activeTab === "events_old" && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-6">Créer un Événement (Old)</h2>
                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Titre</label>
                                    <input
                                        type="text"
                                        value={eventTitle}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        className="neo-input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Date</label>
                                    <input
                                        type="datetime-local"
                                        value={eventDate}
                                        onChange={(e) => setEventDate(e.target.value)}
                                        className="neo-input w-full"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Récompense (TC)</label>
                                    <input
                                        type="number"
                                        value={eventReward}
                                        onChange={(e) => setEventReward(e.target.value)}
                                        className="neo-input w-full"
                                        required
                                    />
                                </div>
                                <button type="submit" className="neo-btn bg-blue-400 hover:bg-blue-300 w-full">
                                    CRÉER L'ÉVÉNEMENT
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Onglet Wins */}
                    {activeTab === "wins" && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-6">Ajouter une Victoire</h2>
                            <form onSubmit={handleAddWin} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Gagnant</label>
                                    <input
                                        type="text"
                                        value={winnerPseudo}
                                        onChange={(e) => setWinnerPseudo(e.target.value)}
                                        className="neo-input w-full"
                                        placeholder="Pseudo"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Type de Tournoi</label>
                                    <select
                                        value={tournamentType}
                                        onChange={(e) => setTournamentType(e.target.value)}
                                        className="neo-input w-full"
                                    >
                                        <option>Mario Kart</option>
                                        <option>Smash Bros</option>
                                        <option>FIFA</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                                <button type="submit" className="neo-btn bg-yellow-400 hover:bg-yellow-300 w-full">
                                    AJOUTER LA VICTOIRE
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Onglet Rewards - Partie 1 sera dans le prochain message */}
                </div>
            </main>
            <Navbar />
        </>
    );
}
