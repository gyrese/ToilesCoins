"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Settings, Trophy, Coins, User, Zap, Download, Save } from "lucide-react";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Profile() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [badges, setBadges] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [lastEvent, setLastEvent] = useState<any>(null);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // AI Avatar states
    const [generatedImage, setGeneratedImage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const particlesRef = useRef<HTMLDivElement>(null);

    // Edit profile states
    const [editAvatar, setEditAvatar] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editPseudo, setEditPseudo] = useState("");
    const [editThemeColor, setEditThemeColor] = useState("#FFC845"); // Couleur par défaut

    // Level calculation (1-50)
    const calculateLevel = () => {
        if (!userData) return 1;
        const xpWins = (userData.wins || 0) * 500;
        const xpBadges = badges.length * 200; // Approximate if we don't have user's badges count directly here, but we fetched 'badges' collection. 
        // Better: use userData.badges?.length if available, or just rely on wins for now as main driver + events.
        // Let's assume 1 win = 500 XP, 1 event = 100 XP. Level up every 1000 XP.

        const xp = ((userData.wins || 0) * 500) + ((userData.eventsCount || 0) * 100);
        const lvl = Math.floor(xp / 1000) + 1;
        return Math.min(50, lvl);
    };

    const level = calculateLevel();
    const playerClass = level < 10 ? "Novice" : level < 25 ? "Initié" : level < 40 ? "Expert" : "Légende";

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
            return;
        }
        if (userData) {
            setCurrentAvatar(userData.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo}&backgroundColor=ffc845`);
            setEditAvatar(userData.photoURL || "");
            setEditBio(userData.bio || "");
            setEditPseudo(userData.pseudo || "");
            const themeColor = userData.themeColor || "#FFC845";
            setEditThemeColor(themeColor);
            // Appliquer la couleur au body
            document.body.style.backgroundColor = themeColor;
        }
    }, [user, loading, router, userData]);

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!user || !userData) return;

            try {
                // 1. Récupérer les badges de l'utilisateur
                const userBadgesSnap = await getDocs(collection(db, "users", user.uid, "badges"));
                setBadges(userBadgesSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // NOTE: L'attribution automatique des badges a été désactivée
                // Les badges sont maintenant attribués uniquement via :
                // 1. Les événements (dans app/admin/page.tsx - saveEventResults)
                // 2. Un script manuel de mise à jour si nécessaire

                // Ancienne logique d'attribution automatique (désactivée) :
                /*
                const allBadgesSnap = await getDocs(collection(db, "badges"));
                const allBadges = allBadgesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                
                for (const badge of allBadges) {
                    if (badge.conditionType === "first_victory_type") continue;
                    
                    const userBadgeQuery = query(
                        collection(db, "users", user.uid, "badges"),
                        where("name", "==", badge.name)
                    );
                    const existingBadgeSnap = await getDocs(userBadgeQuery);
                    if (!existingBadgeSnap.empty) continue;
                    
                    let conditionMet = false;
                    const conditionValue = parseInt(badge.conditionValue);
                    
                    switch (badge.conditionType) {
                        case "wins":
                            conditionMet = (userData.wins || 0) >= conditionValue;
                            break;
                        case "balance":
                            conditionMet = (userData.balance || 0) >= conditionValue;
                            break;
                        case "events":
                            conditionMet = (userData.eventsCount || 0) >= conditionValue;
                            break;
                    }
                    
                    if (conditionMet) {
                        await addDoc(collection(db, "users", user.uid, "badges"), {
                            name: badge.name,
                            description: badge.description,
                            icon: badge.icon,
                            rarity: "rare",
                            obtainedAt: serverTimestamp()
                        });
                    }
                }
                */

                // 5. Leaderboard
                const usersSnap = await getDocs(query(collection(db, "users"), orderBy("wins", "desc"), limit(10)));
                setLeaderboard(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));

                // 6. Last Event (Participation or Win)
                const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("date", "desc"), limit(20)));
                const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const myLastEvent = events.find((e: any) => e.winner === userData.pseudo || e.secondPlace === userData.pseudo);
                setLastEvent(myLastEvent);

            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, [user, userData]);

    const handleGenerateAvatar = async () => {
        if (!aiPrompt.trim()) {
            alert("🕹️ Entre une description !");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage("");
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + Math.random() * 2;
            });
        }, 100);

        try {
            const response = await fetch('/api/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            if (!response.ok) throw new Error("Erreur de génération");

            const data = await response.json();
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => {
                setGeneratedImage(data.imageUrl);
                setEditAvatar(data.imageUrl);
                setIsGenerating(false);
            }, 500);

        } catch (error) {
            clearInterval(interval);
            setIsGenerating(false);
            alert("⚠️ Erreur de génération");
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;

        // Validation du pseudo
        if (!editPseudo || editPseudo.trim().length < 3) {
            alert("Le pseudo doit contenir au moins 3 caractères");
            return;
        }

        try {
            await updateDoc(doc(db, "users", user.uid), {
                pseudo: editPseudo.trim(),
                photoURL: editAvatar || currentAvatar,
                bio: editBio,
                themeColor: editThemeColor
            });
            // Appliquer la nouvelle couleur immédiatement
            document.body.style.backgroundColor = editThemeColor;
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert("Erreur sauvegarde");
        }
    };

    const getPseudoClass = () => {
        if (level >= 50) return "pseudo-level-50";
        if (level >= 45) return "pseudo-level-45";
        if (level >= 40) return "pseudo-level-40";
        if (level >= 35) return "pseudo-level-35";
        if (level >= 30) return "pseudo-level-30";
        if (level >= 25) return "pseudo-level-25";
        if (level >= 20) return "pseudo-level-20";
        if (level >= 10) return "pseudo-level-10";
        return "pseudo-level-1";
    };

    if (loading || !userData) return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">CHARGEMENT...</div>;

    return (
        <>
            <style jsx global>{`
                .profile-card {
                    position: relative;
                    background-color: white;
                    border: 5px solid black;
                    border-radius: 30px;
                    box-shadow: 10px 10px 0px 0px #FFC845;
                }
                .level-badge {
                    position: absolute;
                    top: -20px;
                    left: -10px;
                    background-color: #FFC845;
                    border: 4px solid black;
                    border-radius: 50px;
                    padding: 5px 20px;
                    font-family: Impact, sans-serif;
                    font-size: 1.2rem;
                    z-index: 10;
                }
                .avatar-container {
                    border: 5px solid black;
                    border-radius: 20px;
                    overflow: hidden;
                    background-color: white;
                    aspect-ratio: 1/1;
                }
                .solde-bar {
                    background-color: black;
                    border-radius: 50px;
                    color: #FFC845;
                    border: 5px solid black;
                }
                .trophies-section {
                    background-color: black;
                    border-radius: 30px;
                    border: 5px solid black;
                    overflow: hidden;
                }
                .trophies-title {
                    writing-mode: vertical-rl;
                    transform: rotate(180deg);
                    color: #FFC845;
                    font-family: Impact, sans-serif;
                    font-size: 2rem;
                    text-align: center;
                    padding: 10px 0;
                    border-left: 2px solid #FFC845;
                }
                .activity-card {
                    background-color: #FFC845;
                    border: 5px solid black;
                    border-radius: 30px;
                }
                .admin-btn {
                    background-color: black;
                    color: #FFC845;
                    border: 4px solid black;
                    border-radius: 50px;
                    font-family: Impact, sans-serif;
                    font-size: 1.5rem;
                    padding: 10px 40px;
                    transition: transform 0.2s;
                }
                .admin-btn:hover {
                    transform: scale(1.05);
                    color: white;
                }
                
                /* RPG Effects - Level 1 to 50 */
                [class^="pseudo-level-"] {
                    font-family: 'PaybAck', 'Black Ops One', cursive;
                    transition: all 0.3s ease;
                }

                /* Levels 1-9: Novice */
                .pseudo-level-1 { 
                    font-size: 2rem; 
                    color: black;
                }
                
                /* Levels 10-19: Initié Bronze */
                .pseudo-level-10 { 
                    font-size: 2.2rem; 
                    color: #333;
                    text-shadow: 2px 2px 0px #FFC845;
                }

                /* Levels 20-29: Initié Argent */
                .pseudo-level-20 { 
                    font-size: 2.4rem; 
                    color: #4a4a4a;
                    text-shadow: 3px 3px 0px #FFC845, 0 0 10px rgba(0,0,0,0.2);
                    letter-spacing: 1px;
                }

                /* Levels 25-29: Initié Or */
                .pseudo-level-25 { 
                    font-size: 2.5rem; 
                    color: #2c2c2c;
                    text-shadow: 3px 3px 0px #FFC845, 0 0 15px rgba(255, 200, 69, 0.4);
                    letter-spacing: 1.5px;
                    animation: subtle-glow 3s ease-in-out infinite;
                }

                /* Levels 30-39: Expert */
                .pseudo-level-30 { 
                    font-size: 2.6rem; 
                    background: linear-gradient(45deg, #000, #444, #000);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(3px 3px 0px #FFC845) drop-shadow(0 0 8px rgba(0,0,0,0.4));
                    animation: gradient-shift 4s ease infinite;
                }

                .pseudo-level-35 { 
                    font-size: 2.7rem; 
                    background: linear-gradient(45deg, #000, #555, #000);
                    background-size: 200% 200%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    filter: drop-shadow(4px 4px 0px #FFC845) drop-shadow(0 0 12px rgba(255, 200, 69, 0.5));
                    animation: gradient-shift 3s ease infinite, float 4s ease-in-out infinite;
                }

                /* Levels 40-49: Légende */
                .pseudo-level-40 { 
                    font-size: 2.8rem; 
                    color: white;
                    -webkit-text-stroke: 1px black;
                    text-shadow: 4px 4px 0px #000, 0 0 15px #FFC845, 0 0 25px rgba(255, 200, 69, 0.3);
                    animation: float 3s ease-in-out infinite, glow-pulse 2s ease-in-out infinite;
                }

                .pseudo-level-45 { 
                    font-size: 3rem; 
                    color: #FFE55C;
                    -webkit-text-stroke: 1.5px black;
                    text-shadow: 4px 4px 0px #000, 0 0 20px #FFC845, 0 0 30px #FFD700;
                    animation: float 2.5s ease-in-out infinite, glow-pulse 1.8s ease-in-out infinite;
                }

                /* Level 50: MAX LEVEL - Legendary */
                .pseudo-level-50 { 
                    font-size: 3.2rem; 
                    background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700, #FF4500);
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    -webkit-text-stroke: 2px black;
                    filter: drop-shadow(5px 5px 0px #000) drop-shadow(0 0 20px #FFD700) drop-shadow(0 0 40px #FF4500);
                    animation: pulse 2s infinite, shine 3s linear infinite, float 4s ease-in-out infinite;
                }
                
                /* Animations */
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                @keyframes shine {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes gradient-shift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes glow-pulse {
                    0%, 100% { filter: drop-shadow(4px 4px 0px #000) drop-shadow(0 0 15px #FFC845); }
                    50% { filter: drop-shadow(4px 4px 0px #000) drop-shadow(0 0 25px #FFC845) drop-shadow(0 0 35px rgba(255, 200, 69, 0.5)); }
                }

                @keyframes subtle-glow {
                    0%, 100% { text-shadow: 3px 3px 0px #FFC845, 0 0 15px rgba(255, 200, 69, 0.4); }
                    50% { text-shadow: 3px 3px 0px #FFC845, 0 0 20px rgba(255, 200, 69, 0.6); }
                }
            `}</style>

            <Header />

            <main className="container py-5 mt-5" style={{ maxWidth: '600px' }}>
                <div className="profile-card p-4 mb-4">
                    <div className="level-badge">LEVEL {level}</div>
                    <button
                        className="position-absolute top-0 end-0 m-3 btn btn-dark rounded-circle d-flex align-items-center justify-content-center"
                        style={{
                            width: '50px',
                            height: '50px',
                            zIndex: 10,
                            border: '3px solid #FFC845',
                            boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onClick={() => setIsEditing(true)}
                    >
                        <Settings size={24} color="#FFC845" strokeWidth={2.5} />
                    </button>
                    <div className="row align-items-center">
                        <div className="col-5">
                            <div className="avatar-container">
                                {currentAvatar && (
                                    <img src={currentAvatar} alt="Avatar" className="img-fluid w-100 h-100 object-fit-cover" />
                                )}
                            </div>
                        </div>
                        <div className="col-7">
                            <h1 className={`font-payback text-uppercase mb-0 ${getPseudoClass()}`}>{userData?.pseudo}</h1>
                            <div className="font-weight-bold text-uppercase mb-2">{playerClass}</div>
                            <p className="font-italic mb-0 small">
                                "{userData?.bio || "Pas de devise"}"
                            </p>
                        </div>
                    </div>
                </div>

                <div className="solde-bar d-flex justify-content-between align-items-center px-4 py-2 mb-4">
                    <span className="font-impact h2 mb-0">SOLDE</span>
                    <span className="font-impact h2 mb-0">{userData?.balance || 0} TC</span>
                </div>

                <div className="trophies-section d-flex mb-4">
                    <div className="trophies-title d-flex align-items-center justify-content-center bg-black px-2">
                        BADGES
                    </div>
                    <div className="flex-grow-1 d-flex flex-nowrap align-items-center py-3 px-2 gap-3 hide-scrollbar" style={{ overflowX: 'auto' }}>
                        {badges.length > 0 ? (
                            badges.map((badge) => (
                                <div key={badge.id} className="text-center flex-shrink-0" style={{ width: '120px', cursor: 'pointer' }} onClick={() => setSelectedBadge(badge)}>
                                    <div className="mb-2" style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                                        <img src={badge.icon} alt={badge.name} className="w-100 h-100 object-fit-contain" onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerText = '🏆';
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFD95A' }}>
                                        {badge.name}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-white opacity-50 text-center w-100 small">Aucun badge disponible</div>
                        )}
                        {badges.length < 4 && (
                            <div className="text-center opacity-25 flex-shrink-0" style={{ width: '120px' }}>
                                <div className="h1 mb-0" style={{ fontSize: '2.5rem' }}>🔒</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="activity-card p-0 mb-5 overflow-hidden">
                    <div className="text-center border-bottom border-dark border-3 py-2">
                        <h2 className="font-impact mb-0">DERNIERE ACTIVITE</h2>
                    </div>
                    {lastEvent ? (
                        <div className="d-flex align-items-center p-3">
                            <div className="me-3">
                                {lastEvent.imageUrl ? (
                                    <div style={{ width: '80px', height: '80px', backgroundColor: 'white', border: '3px solid black', borderRadius: '10px', overflow: 'hidden' }}>
                                        <img src={lastEvent.imageUrl} alt="" className="w-100 h-100 object-fit-cover" />
                                    </div>
                                ) : (
                                    <div style={{ width: '80px', height: '80px', backgroundColor: 'white', border: '3px solid black', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                        {lastEvent.eventType?.emoji || "🏆"}
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow-1">
                                <div className="font-bold text-uppercase">{lastEvent.name}</div>
                                <div className="small opacity-75">{lastEvent.date?.toDate ? new Date(lastEvent.date.toDate()).toLocaleDateString() : "Date inconnue"}</div>
                            </div>
                            <div className="text-end">
                                <span className="font-impact display-4">
                                    {lastEvent.winner === userData?.pseudo ? "1er" : "2ème"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center opacity-50 font-bold">
                            Aucune activité récente
                        </div>
                    )}
                </div>

                {/* CLASSEMENT / LEADERBOARD */}
                <div className="activity-card p-0 mb-5 overflow-hidden">
                    <div className="text-center border-bottom border-dark border-3 py-2 bg-black text-[#FFC845]">
                        <h2 className="font-impact mb-0 text-[#FFC845]">CLASSEMENT</h2>
                    </div>
                    <div className="p-0">
                        {leaderboard.map((player, index) => (
                            <div key={player.id} className={`d-flex align-items-center p-3 border-bottom border-dark ${player.pseudo === userData?.pseudo ? 'bg-warning bg-opacity-25' : ''}`}>
                                <div className="font-impact h3 mb-0 me-3 w-10 text-center">
                                    #{index + 1}
                                </div>
                                <div className="me-3">
                                    <img
                                        src={player.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${player.pseudo}&backgroundColor=ffc845`}
                                        alt={player.pseudo}
                                        className="rounded-circle border border-2 border-dark"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="font-bold text-uppercase">{player.pseudo}</div>
                                    <div className="small font-monospace">Niveau {Math.floor((player.wins || 0) / 5) + 1}</div>
                                </div>
                                <div className="text-end font-bold">
                                    {player.wins} 🏆
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center mb-5">
                    <button className="btn admin-btn" onClick={() => router.push('/admin')}>ADMIN</button>
                </div>
            </main>

            {selectedBadge && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }} onClick={() => setSelectedBadge(null)}>
                    <div className="bg-white p-4 text-center position-relative" style={{ maxWidth: '90%', width: '350px', border: '5px solid black', borderRadius: '20px', boxShadow: '10px 10px 0px 0px #FFD95A' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-2 btn-close" onClick={() => setSelectedBadge(null)}></button>
                        <div className="mb-3 mx-auto" style={{ width: '100px', height: '100px' }}>
                            <img src={selectedBadge.icon} alt={selectedBadge.name} className="w-100 h-100 object-fit-contain" />
                        </div>
                        <h2 className="font-black text-uppercase mb-2" style={{ fontFamily: 'Impact, sans-serif' }}>{selectedBadge.name}</h2>
                        <div className="border-top border-dark border-2 w-50 mx-auto mb-3"></div>
                        <p className="font-weight-bold mb-4">{selectedBadge.description}</p>
                        <div className="bg-black text-warning p-2 rounded font-monospace small">
                            CONDITION: {selectedBadge.conditionType === 'wins' && `🏆 ${selectedBadge.conditionValue} Victoires`}
                            {selectedBadge.conditionType === 'balance' && `💰 ${selectedBadge.conditionValue} TC`}
                            {selectedBadge.conditionType === 'events' && `📅 ${selectedBadge.conditionValue} Événements`}
                        </div>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1055 }} onClick={() => setIsEditing(false)}>
                    <div className="bg-white p-4 position-relative" style={{ maxWidth: '90%', width: '450px', border: '5px solid black', borderRadius: '20px', boxShadow: '10px 10px 0px 0px #FFD95A' }} onClick={(e) => e.stopPropagation()}>
                        <button className="position-absolute top-0 end-0 m-2 btn-close" onClick={() => setIsEditing(false)}></button>
                        <h2 className="font-impact text-center mb-4">ÉDITER LE PROFIL</h2>

                        {/* AI Avatar Generator */}
                        <div className="mb-3 p-3 border border-dark border-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                            <label className="form-label font-weight-bold d-flex align-items-center gap-2">
                                <span>🎨</span> GÉNÉRER AVATAR IA
                            </label>
                            <input
                                type="text"
                                className="form-control border-2 border-dark mb-2"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ex: un chat cyberpunk avec des lunettes..."
                                disabled={isGenerating}
                            />
                            <button
                                className="btn btn-warning w-100 font-weight-bold border-2 border-dark"
                                onClick={handleGenerateAvatar}
                                disabled={isGenerating}
                            >
                                {isGenerating ? '⏳ Génération en cours...' : '✨ Générer avec IA'}
                            </button>

                            {/* Barre de progression */}
                            {isGenerating && (
                                <div className="mt-3">
                                    <div className="progress" style={{ height: '25px', border: '3px solid black', borderRadius: '10px' }}>
                                        <div
                                            className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                                            role="progressbar"
                                            style={{ width: '100%', fontSize: '0.9rem', fontWeight: 'bold', color: 'black' }}
                                        >
                                            🎨 Création de votre avatar magique veuillez patienter...
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview */}
                            {generatedImage && (
                                <div className="mt-3 text-center">
                                    <img src={generatedImage} alt="Avatar généré" className="img-fluid rounded border border-dark border-3" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                                    <div className="small text-success mt-2 font-weight-bold">✅ Avatar généré ! Il sera utilisé automatiquement.</div>
                                </div>
                            )}
                        </div>

                        <div className="mb-3">
                            <label className="form-label font-weight-bold">PSEUDO</label>
                            <input
                                type="text"
                                className="form-control border-3 border-dark"
                                value={editPseudo}
                                onChange={(e) => setEditPseudo(e.target.value)}
                                placeholder="Votre pseudo"
                                minLength={3}
                                required
                            />
                            <div className="form-text small">Minimum 3 caractères</div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label font-weight-bold">AVATAR (URL)</label>
                            <input
                                type="text"
                                className="form-control border-3 border-dark"
                                value={editAvatar}
                                onChange={(e) => setEditAvatar(e.target.value)}
                                placeholder="https://..."
                            />
                            <div className="form-text small">Ou collez un lien d'image existant</div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label font-weight-bold">DEVISE (BIO)</label>
                            <textarea
                                className="form-control border-3 border-dark"
                                rows={3}
                                value={editBio}
                                onChange={(e) => setEditBio(e.target.value)}
                                placeholder="Votre phrase fétiche..."
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label className="form-label font-weight-bold d-flex align-items-center gap-2">
                                🎨 COULEUR DU SITE
                            </label>
                            <div className="d-flex gap-3 justify-content-center">
                                <button
                                    type="button"
                                    onClick={() => setEditThemeColor("#FFC845")}
                                    className={`btn border-3 border-dark ${editThemeColor === "#FFC845" ? "border-5" : ""}`}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        backgroundColor: "#FFC845",
                                        boxShadow: editThemeColor === "#FFC845" ? "0 0 0 3px #000" : "none"
                                    }}
                                    title="Jaune (défaut)"
                                >
                                    {editThemeColor === "#FFC845" && <span className="font-weight-bold" style={{ fontSize: "2rem" }}>✓</span>}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEditThemeColor("#5E9398")}
                                    className={`btn border-3 border-dark ${editThemeColor === "#5E9398" ? "border-5" : ""}`}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        backgroundColor: "#5E9398",
                                        boxShadow: editThemeColor === "#5E9398" ? "0 0 0 3px #000" : "none"
                                    }}
                                    title="Bleu-vert"
                                >
                                    {editThemeColor === "#5E9398" && <span className="font-weight-bold text-white" style={{ fontSize: "2rem" }}>✓</span>}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setEditThemeColor("#8E2510")}
                                    className={`btn border-3 border-dark ${editThemeColor === "#8E2510" ? "border-5" : ""}`}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        backgroundColor: "#8E2510",
                                        boxShadow: editThemeColor === "#8E2510" ? "0 0 0 3px #000" : "none"
                                    }}
                                    title="Rouge brique"
                                >
                                    {editThemeColor === "#8E2510" && <span className="font-weight-bold text-white" style={{ fontSize: "2rem" }}>✓</span>}
                                </button>
                            </div>
                            <div className="form-text small text-center mt-2">Choisissez la couleur de fond du site</div>
                        </div>

                        <button className="btn btn-dark w-100 font-impact py-2" style={{ fontSize: '1.2rem' }} onClick={handleSaveProfile}>
                            SAUVEGARDER
                        </button>
                    </div>
                </div>
            )}
            <Navbar />
        </>
    );
}
