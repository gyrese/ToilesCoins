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
    const [activeTab, setActiveTab] = useState<"points" | "events" | "wins" | "rewards">("points");

    // Points State
    const [targetUser, setTargetUser] = useState("");
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");

    // Events State
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

    // Auth Redirect
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Load rewards when tab changes
    useEffect(() => {
        const fetchRewards = async () => {
            if (activeTab === "rewards") {
                const q = query(collection(db, "rewards"));
                const snapshot = await getDocs(q);
                setRewards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        };
        fetchRewards();
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

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage("");
        try {
            await addDoc(collection(db, "events"), {
                title: eventTitle,
                date: new Date(eventDate).toISOString(),
                reward: parseInt(eventReward),
                createdAt: serverTimestamp()
            });
            setMessage("✅ Événement créé");
            setEventTitle("");
            setEventDate("");
            setEventReward("");
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
            await addDoc(collection(db, "tournaments"), {
                winner: winnerPseudo,
                tournament: tournamentType,
                date: new Date().toISOString(),
                reward: rewardAmount
            });
            await addDoc(collection(db, "transactions"), {
                userId,
                amount: rewardAmount,
                type: "EARN",
                description: `Victoire ${tournamentType}`,
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
                        onClick={() => { setActiveTab("events"); setMessage(""); }}
                        className={`neo-btn whitespace-nowrap ${activeTab === "events" ? "bg-black text-white" : "bg-white text-black"}`}
                    >
                        Événements
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

                    {activeTab === "events" && (
                        <div>
                            <h2 className="text-xl font-black uppercase mb-6">Créer un Événement</h2>
                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Titre</label>
                                    <input
                                        type="text"
                                        className="neo-input"
                                        placeholder="Tournoi Mario Kart"
                                        value={eventTitle}
                                        onChange={e => setEventTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Date</label>
                                    <input
                                        type="datetime-local"
                                        className="neo-input"
                                        value={eventDate}
                                        onChange={e => setEventDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold mb-1 uppercase text-sm">Récompense</label>
                                    <input
                                        type="number"
                                        className="neo-input"
                                        placeholder="1000"
                                        value={eventReward}
                                        onChange={e => setEventReward(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="neo-btn w-full">Créer</button>
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
                                        value={tournamentType}
                                        onChange={e => setTournamentType(e.target.value)}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold mb-1 uppercase text-sm">Icône (Emoji)</label>
                                        <input
                                            type="text"
                                            className="neo-input"
                                            value={rewardForm.icon}
                                            onChange={e => setRewardForm({ ...rewardForm, icon: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 uppercase text-sm">Image URL (Optionnel)</label>
                                        <input
                                            type="text"
                                            className="neo-input"
                                            value={rewardForm.imageUrl}
                                            onChange={e => setRewardForm({ ...rewardForm, imageUrl: e.target.value })}
                                            placeholder="https://..."
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
                </div>
            </main>
            <Navbar />
        </>
    );
}
