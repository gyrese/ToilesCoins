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

    const [activeTab, setActiveTab] = useState<"points" | "events" | "wins" | "rewards" | "badges" | "events">("events");



    // Points State

    const [targetUser, setTargetUser] = useState("");

    const [amount, setAmount] = useState("");

    const [message, setMessage] = useState("");







    // Wins State

    const [winnerPseudo, setWinnerPseudo] = useState("");

    const [eventType, seteventType] = useState("Mario Kart");



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

        conditionType: "wins", // wins, balance, events

        conditionValue: ""

    });



    // Events Management State (anciennement events)

    const [facebookEvents, setFacebookEvents] = useState<any[]>([]);

    const [events, setEvents] = useState<any[]>([]);

    const [eventTypes, setEventTypes] = useState<any[]>([]);

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
    const [editingEventType, setEditingEventType] = useState<any>(null);



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

                const q = query(collection(db, "events"));

                const snapshot = await getDocs(q);

                const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Trier par date décroissante

                eventsData.sort((a: any, b: any) => {

                    const dateA = a.date?.toDate?.() || new Date(a.date);

                    const dateB = b.date?.toDate?.() || new Date(b.date);

                    return dateB - dateA;

                });

                setEvents(eventsData);

                const typesSnapshot = await getDocs(collection(db, "eventTypes"));
                const typesData = typesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEventTypes(typesData);

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



    // Handlers

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

            setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

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

                conditionValue: parseInt(badgeForm.conditionValue)

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

            setBadgeForm({ name: "", icon: "", description: "", conditionType: "wins", conditionValue: "" });

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



    // events Handlers

    const fetchFacebookEvents = async () => {

        setLoadingFbEvents(true);

        setMessage("");

        try {

            const response = await fetch('/api/facebook-events');

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

            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            eventsData.sort((a: any, b: any) => {

                const dateA = a.date?.toDate?.() || new Date(a.date);

                const dateB = b.date?.toDate?.() || new Date(b.date);

                return dateB - dateA;

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
                typeId: eventForm.typeId || null
            });

            // Attribuer les points et victoires aux gagnants (support multi-joueurs)
            if (eventForm.winner) {
                // Découper les pseudos par virgule et nettoyer les espaces
                const winners = eventForm.winner.split(',').map(w => w.trim()).filter(w => w);
                const totalPoints = parseInt(eventForm.winnerPoints);
                // Diviser les points (arrondi à l'inférieur)
                const pointsPerPlayer = winners.length > 0 ? Math.floor(totalPoints / winners.length) : 0;

                const usersRef = collection(db, "users");

                // Boucle sur chaque gagnant
                for (const winnerPseudo of winners) {
                    const qWinner = query(usersRef, where("pseudo", "==", winnerPseudo));
                    const snapshotWinner = await getDocs(qWinner);

                    if (!snapshotWinner.empty) {
                        const winnerDoc = snapshotWinner.docs[0];

                        // 1. Mise à jour Solde et Victoires
                        await updateDoc(doc(db, "users", winnerDoc.id), {
                            balance: increment(pointsPerPlayer),
                            wins: increment(1)
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
                                                rarity: "rare",
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
                                                        rarity: "rare",
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
                    }
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

                        balance: increment(parseInt(eventForm.secondPlacePoints))

                    });

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

            const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            eventsData.sort((a: any, b: any) => {

                const dateA = a.date?.toDate?.() || new Date(a.date);

                const dateB = b.date?.toDate?.() || new Date(b.date);

                return dateB - dateA;

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

        const response = await fetch("/api/admin/upload-image", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Impossible de téléverser l'image.");
        }

        const data = await response.json();
        return data.url as string;
    };



    const deleteEvent = async (id: string) => {

        if (!confirm("Supprimer cet ÉVÉNEMENT ?")) return;

        setMessage("");

        try {

            await deleteDoc(doc(db, "events", id));

            setEvents(events.filter(t => t.id !== id));

            setMessage("✅ ÉVÉNEMENT supprimé");

        } catch (error) {

            console.error(error);

            setMessage("❌ Erreur technique");

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

                        🏆 ÉVÉNEMENTS

                    </button>

                </div>



                <div className="neo-card">

                    {message && (

                        <div className={`p-4 border-2 border-black font-bold mb-6 text-center ${message.includes("✅") ? "bg-green-200" : "bg-red-200"}`}>

                            {message}

                        </div>

                    )}



                    {activeTab === "points" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">Ajouter des Points</h2>

                            <form onSubmit={handleAddPoints} className="space-y-4">

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Utilisateur</label>

                                    <input

                                        type="text"

                                        className="neo-input"

                                        placeholder="Pseudo"

                                        value={targetUser}

                                        onChange={e => setTargetUser(e.target.value)}

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Montant</label>

                                    <input

                                        type="number"

                                        className="neo-input"

                                        placeholder="500"

                                        value={amount}

                                        onChange={e => setAmount(e.target.value)}

                                        required

                                    />

                                </div>

                                <button type="submit" className="neo-btn w-full">Envoyer</button>

                            </form>

                        </div>

                    )}







                    {activeTab === "wins" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">Déclarer une Victoire</h2>

                            <form onSubmit={handleDeclareWin} className="space-y-4">

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Vainqueur</label>

                                    <input

                                        type="text"

                                        className="neo-input"

                                        placeholder="Pseudo"

                                        value={winnerPseudo}

                                        onChange={e => setWinnerPseudo(e.target.value)}

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Type</label>

                                    <select

                                        className="neo-input"

                                        value={eventType}

                                        onChange={e => seteventType(e.target.value)}

                                    >

                                        <option>Mario Kart</option>

                                        <option>Smash Bros</option>

                                        <option>Blindtest</option>

                                        <option>Karaoké</option>

                                        <option>Autre</option>

                                    </select>

                                </div>

                                <button type="submit" className="neo-btn w-full">Valider</button>

                            </form>

                        </div>

                    )}



                    {activeTab === "rewards" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">

                                {editingReward ? "Modifier Récompense" : "Ajouter Récompense"}

                            </h2>



                            {/* Formulaire */}

                            <form onSubmit={handleSaveReward} className="space-y-4 mb-8 bg-gray-50 p-4 border-2 border-black">

                                <div className="grid grid-cols-2 gap-4">

                                    <div>

                                        <label className="block font-bold mb-1 uppercase text-sm">Nom</label>

                                        <input

                                            type="text"

                                            className="neo-input"

                                            value={rewardForm.name}

                                            onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}

                                            required

                                        />

                                    </div>

                                    <div>

                                        <label className="block font-bold mb-1 uppercase text-sm">Coût (TC)</label>

                                        <input

                                            type="number"

                                            className="neo-input"

                                            value={rewardForm.cost}

                                            onChange={e => setRewardForm({ ...rewardForm, cost: e.target.value })}

                                            required

                                        />

                                    </div>

                                </div>

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Description</label>

                                    <textarea

                                        className="neo-input"

                                        value={rewardForm.description}

                                        onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })}

                                        required

                                    />

                                </div>

                                <div className="flex gap-2">

                                    <button type="submit" className="neo-btn flex-1 bg-green-400 hover:bg-green-300">

                                        {editingReward ? "Mettre à jour" : "Créer"}

                                    </button>

                                    {editingReward && (

                                        <button

                                            type="button"

                                            onClick={() => {

                                                setEditingReward(null);

                                                setRewardForm({ name: "", cost: "", icon: "", description: "", imageUrl: "" });

                                            }}

                                            className="neo-btn bg-gray-200"

                                        >

                                            Annuler

                                        </button>

                                    )}

                                </div>

                            </form>



                            {/* Liste */}

                            <h3 className="font-black uppercase mb-4 border-t-2 border-black pt-4">Liste des Récompenses ({rewards.length})</h3>

                            <div className="space-y-4">

                                {rewards.map((reward) => (

                                    <div key={reward.id} className="flex items-center justify-between p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

                                        <div className="flex items-center gap-4">

                                            <div className="text-2xl">{reward.icon}</div>

                                            <div>

                                                <div className="font-black uppercase">{reward.name}</div>

                                                <div className="text-sm font-mono">{reward.cost} TC</div>

                                            </div>

                                        </div>

                                        <div className="flex gap-2">

                                            <button

                                                onClick={() => startEdit(reward)}

                                                className="px-3 py-1 bg-blue-400 border-2 border-black font-bold text-sm hover:bg-blue-300"

                                            >

                                                EDIT

                                            </button>

                                            <button

                                                onClick={() => handleDeleteReward(reward.id)}

                                                className="px-3 py-1 bg-red-400 border-2 border-black font-bold text-sm hover:bg-red-300"

                                            >

                                                SUPP

                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    )}



                    {activeTab === "badges" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">

                                {editingBadge ? "Modifier Badge" : "Ajouter Badge"}

                            </h2>



                            {/* Formulaire Badge */}

                            <form onSubmit={handleSaveBadge} className="space-y-4 mb-8 bg-gray-50 p-4 border-2 border-black">

                                <div className="grid grid-cols-2 gap-4">

                                    <div>

                                        <label className="block font-bold mb-1 uppercase text-sm">Nom</label>

                                        <input

                                            type="text"

                                            className="neo-input"

                                            value={badgeForm.name}

                                            onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })}

                                            required

                                        />

                                    </div>

                                    <div>

                                        <label className="block font-bold mb-1 uppercase text-sm">Image URL</label>

                                        <input

                                            type="text"

                                            className="neo-input"

                                            value={badgeForm.icon}

                                            onChange={e => setBadgeForm({ ...badgeForm, icon: e.target.value })}

                                            placeholder="https://example.com/image.png"

                                            required

                                        />

                                    </div>

                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <div>

                                        <label className="block font-bold mb-1 uppercase text-sm">Condition Type</label>

                                        <select
                                            className="neo-input"
                                            value={badgeForm.conditionType}
                                            onChange={e => setBadgeForm({ ...badgeForm, conditionType: e.target.value })}
                                        >
                                            <option value="wins">Victoires</option>
                                            <option value="balance">Solde (TC)</option>
                                            <option value="events">Participations</option>
                                            <option value="first_victory_type">Première Victoire (Type)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-bold mb-1 uppercase text-sm">Valeur Requise</label>
                                        {badgeForm.conditionType === "first_victory_type" ? (
                                            <select
                                                className="neo-input"
                                                value={badgeForm.conditionValue}
                                                onChange={e => setBadgeForm({ ...badgeForm, conditionValue: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Choisir un type --</option>
                                                {eventTypes.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="number"
                                                className="neo-input"
                                                value={badgeForm.conditionValue}
                                                onChange={e => setBadgeForm({ ...badgeForm, conditionValue: e.target.value })}
                                                required
                                            />
                                        )}
                                    </div>

                                </div>

                                <div>

                                    <label className="block font-bold mb-1 uppercase text-sm">Description</label>

                                    <textarea

                                        className="neo-input"

                                        value={badgeForm.description}

                                        onChange={e => setBadgeForm({ ...badgeForm, description: e.target.value })}

                                        required

                                    />

                                </div>

                                <div className="flex gap-2">

                                    <button type="submit" className="neo-btn flex-1 bg-green-400 hover:bg-green-300">

                                        {editingBadge ? "Mettre à jour" : "Créer"}

                                    </button>

                                    {editingBadge && (

                                        <button

                                            type="button"

                                            onClick={() => {

                                                setEditingBadge(null);

                                                setBadgeForm({ name: "", icon: "", description: "", conditionType: "wins", conditionValue: "" });

                                            }}

                                            className="neo-btn bg-gray-200"

                                        >

                                            Annuler

                                        </button>

                                    )}

                                </div>

                            </form>



                            {/* Liste Badges */}

                            <h3 className="font-black uppercase mb-4 border-t-2 border-black pt-4">Liste des Badges ({badges.length})</h3>

                            <div className="space-y-4">

                                {badges.map((badge) => (

                                    <div key={badge.id} className="flex items-center justify-between p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

                                        <div className="flex items-center gap-4">

                                            <div className="flex-shrink-0" style={{ width: '64px', height: '64px' }}>

                                                <img

                                                    src={badge.icon}

                                                    alt={badge.name}

                                                    className="w-100 h-100"

                                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}

                                                    onError={(e) => {

                                                        (e.target as HTMLImageElement).style.display = 'none';

                                                    }}

                                                />

                                            </div>

                                            <div>

                                                <div className="font-black uppercase">{badge.name}</div>

                                                <div className="text-sm font-mono opacity-70">

                                                    {badge.conditionType === 'wins' && `🏆 ${badge.conditionValue} Victoires`}
                                                    {badge.conditionType === 'balance' && `💰 ${badge.conditionValue} TC`}
                                                    {badge.conditionType === 'events' && `📅 ${badge.conditionValue} Événements`}
                                                    {badge.conditionType === 'first_victory_type' && `🥇 Première Victoire : ${eventTypes.find(t => t.id === badge.conditionValue)?.name || 'Type inconnu'}`}

                                                </div>

                                            </div>

                                        </div>

                                        <div className="flex gap-2">

                                            <button

                                                onClick={() => startEditBadge(badge)}

                                                className="px-3 py-1 bg-blue-400 border-2 border-black font-bold text-sm hover:bg-blue-300"

                                            >

                                                EDIT

                                            </button>

                                            <button

                                                onClick={() => handleDeleteBadge(badge.id)}

                                                className="px-3 py-1 bg-red-400 border-2 border-black font-bold text-sm hover:bg-red-300"

                                            >

                                                SUPP

                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    )}



                    {activeTab === "events" && (

                        <div>

                            <h2 className="text-xl font-black uppercase mb-6">🏆 Gestion des ÉVÉNEMENTS</h2>

                            <div className="flex gap-2 mb-6 flex-wrap">
                                <button
                                    onClick={() => setEventSubTab("types")}
                                    className={`neo-btn ${eventSubTab === "types" ? "bg-black text-white" : "bg-white text-black"}`}
                                >
                                    🏷️ TYPES
                                </button>
                                <button
                                    onClick={() => setEventSubTab("creation")}
                                    className={`neo-btn ${eventSubTab === "creation" ? "bg-black text-white" : "bg-white text-black"}`}
                                >
                                    ➕ CRÉATION
                                </button>
                                <button
                                    onClick={() => setEventSubTab("history")}
                                    className={`neo-btn ${eventSubTab === "history" ? "bg-black text-white" : "bg-white text-black"}`}
                                >
                                    📜 HISTORIQUE
                                </button>
                            </div>



                            {eventSubTab === "types" && (
                                <div className="mb-8 p-6 bg-white border-2 border-black">
                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                                        <h3 className="font-black uppercase">📁 Types d'événements ({eventTypes.length})</h3>
                                        <button
                                            onClick={() => setShowAddEventType(!showAddEventType)}
                                            className="neo-btn bg-yellow-200 hover:bg-yellow-100"
                                        >
                                            {showAddEventType ? "Fermer le formulaire" : "➕ Ajouter un type"}
                                        </button>
                                    </div>

                                    {showAddEventType && (
                                        <form onSubmit={handleAddEventType} className="grid gap-3 mb-6 md:grid-cols-3">
                                            {editingEventType && (
                                                <div className="md:col-span-3 flex items-center justify-between bg-yellow-50 border-2 border-black px-3 py-2">
                                                    <span className="font-bold text-sm uppercase">✏️ Édition du type: {editingEventType.name}</span>
                                                    <button
                                                        type="button"
                                                        className="neo-btn bg-gray-200 text-xs"
                                                        onClick={() => {
                                                            setEditingEventType(null);
                                                            setNewEventType({ name: "", icon: "", emoji: "" });
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <label className="font-bold text-xs uppercase mb-1">Nom *</label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    value={newEventType.name}
                                                    onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="font-bold text-xs uppercase mb-1">Emoji</label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    value={newEventType.emoji}
                                                    onChange={(e) => setNewEventType({ ...newEventType, emoji: e.target.value })}
                                                    placeholder="🎮"
                                                    maxLength={4}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <label className="font-bold text-xs uppercase mb-1">Icône (URL)</label>
                                                <input
                                                    type="text"
                                                    className="neo-input"
                                                    value={newEventType.icon}
                                                    onChange={(e) => setNewEventType({ ...newEventType, icon: e.target.value })}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="md:col-span-3 grid md:grid-cols-2 gap-2">
                                                <button type="submit" className="neo-btn w-full bg-green-400 hover:bg-green-300">
                                                    {editingEventType ? "Mettre à jour le type" : "Enregistrer le type"}
                                                </button>
                                                {editingEventType && (
                                                    <button
                                                        type="button"
                                                        className="neo-btn w-full bg-gray-200"
                                                        onClick={() => {
                                                            setEditingEventType(null);
                                                            setNewEventType({ name: "", icon: "", emoji: "" });
                                                            setShowAddEventType(false);
                                                        }}
                                                    >
                                                        Fermer
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    )}

                                    {eventTypes.length === 0 ? (
                                        <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-black">
                                            Aucun type pour l'instant. Ajoutez-en un !
                                        </div>
                                    ) : (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            {eventTypes.map((type: any) => (
                                                <div key={type.id} className="flex items-center gap-4 p-4 border-2 border-black bg-gray-50">
                                                    <div className="w-16 h-16 border-2 border-black flex items-center justify-center bg-white">
                                                        {type.icon ? (
                                                            <img
                                                                src={type.icon}
                                                                alt={type.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                                                            />
                                                        ) : (
                                                            <span className="text-3xl">{type.emoji || "🎮"}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-black uppercase">{type.name}</div>
                                                        {type.emoji && <div className="text-2xl">{type.emoji}</div>}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => router.push(`/tournaments?typeId=${type.id}&typeName=${encodeURIComponent(type.name)}`)}
                                                            className="neo-btn bg-green-400 hover:bg-green-300"
                                                        >
                                                            🏆 TOURNOI
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingEventType(type);
                                                                setNewEventType({
                                                                    name: type.name || "",
                                                                    icon: type.icon || "",
                                                                    emoji: type.emoji || ""
                                                                });
                                                                setShowAddEventType(true);
                                                            }}
                                                            className="neo-btn bg-blue-200 hover:bg-blue-100"
                                                        >
                                                            EDIT
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEventType(type.id)}
                                                            className="neo-btn bg-red-200 hover:bg-red-100"
                                                        >
                                                            SUPP
                                                        </button>
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

                                    <div className="mb-8 p-6 bg-yellow-100 border-2 border-black">

                                        <h3 className="font-black uppercase mb-4">➕ Ajouter un ÉVÉNEMENT</h3>

                                        <form onSubmit={async (e) => {

                                            e.preventDefault();

                                            const formData = new FormData(e.currentTarget);

                                            try {

                                                const typeId = formData.get('eventTypeId') as string;

                                                const selectedType = eventTypes.find((type: any) => type.id === typeId);

                                                const imageUrlInput = ((formData.get('eventImageUrl') as string) || "").trim();
                                                const eventLinkInput = ((formData.get('eventLink') as string) || "").trim();

                                                const imageFile = formData.get('eventImageFile') as File | null;

                                                let finalImageUrl = imageUrlInput;

                                                if (imageFile && imageFile.size > 0) {

                                                    finalImageUrl = await uploadEventImage(imageFile);

                                                }

                                                const isTournament = formData.get('isTournament') === 'on';

                                                await addDoc(collection(db, "events"), {

                                                    name: formData.get('eventName'),

                                                    description: formData.get('eventDesc') || "",

                                                    date: new Date(formData.get('eventDate') as string),

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



                                                // Recharger les ÉVÉNEMENTS

                                                const q = query(collection(db, "events"));

                                                const snapshot = await getDocs(q);

                                                const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                                                eventsData.sort((a: any, b: any) => {

                                                    const dateA = a.date?.toDate?.() || new Date(a.date);

                                                    const dateB = b.date?.toDate?.() || new Date(b.date);

                                                    return dateB - dateA;

                                                });

                                                setEvents(eventsData);



                                                // Réinitialiser le formulaire

                                                (e.target as HTMLFormElement).reset();

                                            } catch (error: any) {

                                                console.error('Erreur complète:', error);

                                                setMessage(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);

                                            }

                                        }} className="space-y-3">

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">TYPE D'ÉVÉNEMENT *</label>

                                                {eventTypes.length === 0 ? (

                                                    <div className="p-3 bg-white border-2 border-black text-sm">

                                                        Aucun type disponible. Ajoutez-en dans l'onglet Types.

                                                    </div>

                                                ) : (

                                                    <select

                                                        name="eventTypeId"

                                                        required

                                                        className="w-full p-2 border-2 border-black text-sm uppercase"

                                                        defaultValue={eventTypes[0]?.id}

                                                    >

                                                        {eventTypes.map((type: any) => (

                                                            <option key={type.id} value={type.id}>

                                                                {type.emoji || "🎮"} {type.name}

                                                            </option>

                                                        ))}

                                                    </select>

                                                )}

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">NOM DE L'ÉVÉNEMENT *</label>

                                                <input

                                                    type="text"

                                                    name="eventName"

                                                    required

                                                    className="w-full p-2 border-2 border-black"

                                                    placeholder="Ex: ÉVÉNEMENT Mario Kart Décembre 2024"

                                                />

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">DATE *</label>

                                                <input

                                                    type="datetime-local"

                                                    name="eventDate"

                                                    required

                                                    className="w-full p-2 border-2 border-black"

                                                />

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">LIEU</label>

                                                <input

                                                    type="text"

                                                    name="eventPlace"

                                                    className="w-full p-2 border-2 border-black"

                                                    placeholder="Ex: Bar Le Pixel"

                                                />

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">Lien de l'événement</label>

                                                <input

                                                    type="url"

                                                    name="eventLink"

                                                    className="w-full p-2 border-2 border-black"

                                                    placeholder="https://www.facebook.com/..."

                                                />

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">DESCRIPTION</label>

                                                <textarea

                                                    name="eventDesc"

                                                    className="w-full p-2 border-2 border-black"

                                                    rows={3}

                                                    placeholder="Décrivez l'événement..."

                                                />

                                            </div>

                                            <div>

                                                <label className="block font-bold mb-1 text-sm">IMAGE (URL ou fichier)</label>

                                                <input

                                                    type="text"

                                                    name="eventImageUrl"

                                                    className="w-full p-2 border-2 border-black mb-2"

                                                    placeholder="https://..."

                                                />

                                                <input

                                                    type="file"

                                                    name="eventImageFile"

                                                    accept="image/*"

                                                    className="w-full p-2 border-2 border-black text-sm"

                                                />

                                            </div>

                                            <div className="p-4 bg-purple-100 border-2 border-purple-600">

                                                <label className="flex items-center gap-3 cursor-pointer">

                                                    <input

                                                        type="checkbox"

                                                        name="isTournament"

                                                        className="w-5 h-5 border-2 border-black"

                                                    />

                                                    <span className="font-bold text-sm uppercase">🏆 Cet événement est un TOURNOI</span>

                                                </label>

                                                <p className="text-xs mt-2 opacity-70">Cochez cette case si vous souhaitez gérer cet événement comme un tournoi avec bracket.</p>

                                            </div>

                                            <button type="submit" className="neo-btn bg-green-400 hover:bg-green-300 w-full">

                                                ➕ AJOUTER L'ÉVÉNEMENT

                                            </button>

                                        </form>

                                    </div>
                                </>
                            )}



                            {/* Modal d'édition des résultats */}

                            {editingEvent && (

                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                                    <div className="bg-white border-4 border-black p-6 w-full max-w-md md:max-w-4xl">

                                        <h3 className="font-black text-xl mb-4">✏️ MODIFIER L'ÉVÉNEMENT</h3>

                                        <p className="font-bold mb-4">{editingEvent.name}</p>

                                        <form onSubmit={saveEventResults} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">

                                            {/* SECTION DETAILS */}
                                            <div className="bg-gray-100 p-3 border-2 border-black mb-4">
                                                <h4 className="font-bold border-b-2 border-black mb-2">📝 DÉTAILS</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block font-bold text-xs uppercase">Nom</label>
                                                        <input
                                                            type="text"
                                                            value={eventForm.name}
                                                            onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block font-bold text-xs uppercase">Date</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={eventForm.date}
                                                            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block font-bold text-xs uppercase">Lieu</label>
                                                        <input
                                                            type="text"
                                                            value={eventForm.place}
                                                            onChange={(e) => setEventForm({ ...eventForm, place: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block font-bold text-xs uppercase">Image URL</label>
                                                        <input
                                                            type="text"
                                                            value={eventForm.imageUrl}
                                                            onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block font-bold text-xs uppercase">Lien de l'événement</label>
                                                        <input
                                                            type="url"
                                                            value={eventForm.link}
                                                            onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                            placeholder="https://www.facebook.com/..."
                                                        />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className="block font-bold text-xs uppercase">Description</label>
                                                        <textarea
                                                            value={eventForm.description}
                                                            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                                            className="w-full p-1 border border-black text-sm"
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* SECTION RESULTATS */}
                                            <div className="bg-yellow-50 p-3 border-2 border-black">
                                                <h4 className="font-bold border-b-2 border-black mb-2">🏆 RÉSULTATS (Optionnel)</h4>
                                                <div className="space-y-2">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block font-bold text-xs uppercase">🥇 Gagnant(s) (séparer par virgule)</label>
                                                            <input
                                                                type="text"
                                                                value={eventForm.winner}
                                                                onChange={(e) => setEventForm({ ...eventForm, winner: e.target.value })}
                                                                className="w-full p-1 border border-black text-sm"
                                                                placeholder="Pseudo1, Pseudo2..."
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block font-bold text-xs uppercase">Points</label>
                                                            <input
                                                                type="number"
                                                                value={eventForm.winnerPoints}
                                                                onChange={(e) => setEventForm({ ...eventForm, winnerPoints: e.target.value })}
                                                                className="w-full p-1 border border-black text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="block font-bold text-xs uppercase">🥈 2ème</label>
                                                            <input
                                                                type="text"
                                                                value={eventForm.secondPlace}
                                                                onChange={(e) => setEventForm({ ...eventForm, secondPlace: e.target.value })}
                                                                className="w-full p-1 border border-black text-sm"
                                                                placeholder="Pseudo"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block font-bold text-xs uppercase">Points</label>
                                                            <input
                                                                type="number"
                                                                value={eventForm.secondPlacePoints}
                                                                onChange={(e) => setEventForm({ ...eventForm, secondPlacePoints: e.target.value })}
                                                                className="w-full p-1 border border-black text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button type="submit" className="neo-btn bg-green-400 hover:bg-green-300 flex-1">
                                                    ✅ ENREGISTRER
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingEvent(null)}
                                                    className="neo-btn bg-gray-300 hover:bg-gray-200 flex-1"
                                                >
                                                    ANNULER
                                                </button>
                                            </div>

                                        </form>

                                    </div>

                                </div>

                            )}



                            {eventSubTab === "history" && (
                                <div>

                                    <h3 className="font-black uppercase mb-4">📋 HISTORIQUE DES ÉVÉNEMENTS</h3>

                                    {events.length === 0 ? (

                                        <div className="text-center p-8 bg-gray-100 border-2 border-black">

                                            <p className="font-bold">Aucun ÉVÉNEMENT enregistré</p>

                                            <p className="text-sm mt-2">Ajoutez votre premier ÉVÉNEMENT ci-dessus !</p>

                                        </div>

                                    ) : (

                                        <div className="space-y-4">

                                            {events.map((event: any) => (

                                                <div key={event.id} className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">

                                                    {(event.imageUrl || event.coverImage) && (
                                                        <div className="mb-3 border-2 border-black overflow-hidden rounded-sm max-h-48">
                                                            <img
                                                                src={event.imageUrl || event.coverImage}
                                                                alt={event.name || "Illustration de l'événement"}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-start justify-between">

                                                        <div className="flex-1">

                                                            <div className="flex items-center gap-2 mb-2">

                                                                <h4 className="font-black text-lg">{event.name}</h4>

                                                                <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${event.status === 'completed' ? 'bg-green-200' : 'bg-yellow-200'

                                                                    }`}>

                                                                    {event.status === 'completed' ? '✅ TERMINÉ' : '⏳ À VENIR'}

                                                                </span>

                                                            </div>

                                                            <div className="text-sm space-y-1">

                                                                <p><strong>📅 Date:</strong> {event.date?.toDate?.()?.toLocaleDateString('fr-FR') || new Date(event.date).toLocaleDateString('fr-FR')}</p>

                                                                {event.place && <p><strong>📍 Lieu:</strong> {event.place}</p>}

                                                                {event.winner && (

                                                                    <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-600">

                                                                        <p><strong>🥇 Gagnant:</strong> {event.winner} (+{event.winnerPoints} TC)</p>

                                                                        {event.secondPlace && (

                                                                            <p><strong>🥈 2ème:</strong> {event.secondPlace} (+{event.secondPlacePoints} TC)</p>

                                                                        )}

                                                                    </div>

                                                                )}

                                                            </div>

                                                        </div>

                                                        <div className="flex flex-col gap-2 ml-4">

                                                            {event.isTournament && event.status !== 'completed' && event.typeId && (
                                                                <button
                                                                    onClick={() => router.push(`/tournaments?typeId=${event.typeId}&typeName=${encodeURIComponent(event.typeName || 'Tournoi')}&eventId=${event.id}`)}
                                                                    className="px-3 py-2 bg-purple-400 border-2 border-black font-bold text-sm hover:bg-purple-300 whitespace-nowrap"
                                                                >
                                                                    🏆 GÉRER TOURNOI
                                                                </button>
                                                            )}

                                                            <button
                                                                onClick={() => startEditEvent(event)}
                                                                className="px-3 py-1 bg-green-400 border-2 border-black font-bold text-sm hover:bg-green-300"
                                                            >
                                                                ✏️ MODIFIER
                                                            </button>

                                                            <button

                                                                onClick={() => deleteEvent(event.id)}

                                                                className="px-3 py-1 bg-red-400 border-2 border-black font-bold text-sm hover:bg-red-300"

                                                            >

                                                                SUPP

                                                            </button>

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

                </div >

            </main >

            <Navbar />

        </>

    );

}

