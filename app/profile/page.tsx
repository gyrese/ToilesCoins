"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, getDocs, doc, updateDoc, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Settings, Trophy, Zap, Save } from "lucide-react";

export default function Profile() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [badges, setBadges] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [lastEvent, setLastEvent] = useState<any>(null);
    const [selectedBadge, setSelectedBadge] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [generatedImage, setGeneratedImage] = useState("");
    const [currentAvatar, setCurrentAvatar] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const [editAvatar, setEditAvatar] = useState("");
    const [editBio, setEditBio] = useState("");
    const [editPseudo, setEditPseudo] = useState("");
    const [editThemeColor, setEditThemeColor] = useState("#FFC845");

    const calculateLevel = () => {
        if (!userData) return 1;
        const xp = ((userData.wins || 0) * 500) + ((userData.eventsCount || 0) * 100);
        return Math.min(50, Math.floor(xp / 1000) + 1);
    };

    const calculateXpProgress = () => {
        if (!userData) return 0;
        const xp = ((userData.wins || 0) * 500) + ((userData.eventsCount || 0) * 100);
        return Math.round((xp % 1000) / 10);
    };

    const level = calculateLevel();
    const xpProgress = calculateXpProgress();
    const playerClass = level < 10 ? "Novice" : level < 25 ? "Initié" : level < 40 ? "Expert" : "Légende";

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

    useEffect(() => {
        if (!loading && !user) { router.push("/login"); return; }
        if (userData) {
            setCurrentAvatar(userData.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo}&backgroundColor=141414`);
            setEditAvatar(userData.photoURL || "");
            setEditBio(userData.bio || "");
            setEditPseudo(userData.pseudo || "");
            const themeColor = userData.themeColor || "#FFC845";
            setEditThemeColor(themeColor);
            document.documentElement.style.setProperty('--accent-gold', themeColor);
        }
    }, [user, loading, router, userData]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !userData) return;
            try {
                const userBadgesSnap = await getDocs(collection(db, "users", user.uid, "badges"));
                setBadges(userBadgesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const usersSnap = await getDocs(query(collection(db, "users"), orderBy("wins", "desc"), limit(10)));
                setLeaderboard(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                const eventsSnap = await getDocs(query(collection(db, "events"), orderBy("date", "desc"), limit(20)));
                const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const myLastEvent = events.find((e: any) => e.winner === userData.pseudo || e.secondPlace === userData.pseudo);
                setLastEvent(myLastEvent);
            } catch (error) { console.error(error); }
        };
        fetchData();
    }, [user, userData]);

    const handleGenerateAvatar = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setGeneratedImage("");
        setProgress(0);
        const interval = setInterval(() => setProgress(prev => prev >= 95 ? prev : prev + Math.random() * 2), 100);
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ prompt: aiPrompt })
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => { setGeneratedImage(data.imageUrl); setEditAvatar(data.imageUrl); setIsGenerating(false); }, 500);
        } catch { clearInterval(interval); setIsGenerating(false); }
    };

    const handleSaveProfile = async () => {
        if (!user || !editPseudo || editPseudo.trim().length < 3) return;
        try {
            await updateDoc(doc(db, "users", user.uid), {
                pseudo: editPseudo.trim(),
                photoURL: editAvatar || currentAvatar,
                bio: editBio,
                themeColor: editThemeColor
            });
            document.documentElement.style.setProperty('--accent-gold', editThemeColor);
            setIsEditing(false);
        } catch (error) { console.error(error); }
    };

    if (loading || !userData) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-base)' }}>
                <div style={{ color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Chargement...</div>
            </div>
        );
    }

    const themeColors = [
        { value: "#FFC845", label: "Or" },
        { value: "#60A5FA", label: "Bleu" },
        { value: "#22C55E", label: "Vert" },
        { value: "#A855F7", label: "Violet" },
        { value: "#FF4444", label: "Rouge" },
        { value: "#FB923C", label: "Orange" },
    ];

    return (
        <>
            <Header />

            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '1rem', paddingTop: 'calc(56px + 1rem)', paddingBottom: 'calc(68px + 1.5rem)' }}>

                {/* ── Hero Card ── */}
                <div style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--accent-gold-border)',
                    borderRadius: '18px',
                    padding: '1.5rem',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 20px rgba(255,200,69,0.15)',
                    position: 'relative',
                    marginBottom: '1rem',
                }}>
                    {/* Badge niveau */}
                    <div style={{
                        position: 'absolute', top: '-12px', left: '1.25rem',
                        background: 'var(--accent-gold)', color: '#000',
                        borderRadius: '999px', padding: '3px 14px',
                        fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase',
                        letterSpacing: '0.06em', fontFamily: 'var(--font-display)',
                    }}>
                        LVL {level} · {playerClass}
                    </div>

                    {/* Bouton édition */}
                    <button onClick={() => setIsEditing(true)} style={{
                        position: 'absolute', top: '0.875rem', right: '0.875rem',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                        borderRadius: '50%', width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s',
                    }}>
                        <Settings size={16} />
                    </button>

                    {/* Contenu : avatar + infos côte à côte */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', paddingTop: '0.5rem' }}>
                        {/* Avatar */}
                        <div style={{ flexShrink: 0 }}>
                            <img
                                src={currentAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo}`}
                                alt="Avatar"
                                width={88}
                                height={88}
                                style={{
                                    width: '88px', height: '88px',
                                    borderRadius: '14px',
                                    border: '2px solid var(--accent-gold)',
                                    boxShadow: '0 0 14px rgba(255,200,69,0.25)',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo}`;
                                }}
                            />
                        </div>

                        {/* Infos */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h1 className={`font-payback ${getPseudoClass()}`} style={{ marginBottom: '0.25rem', lineHeight: 1.1 }}>
                                {userData.pseudo}
                            </h1>
                            {userData.bio && (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', margin: '0 0 0.75rem' }}>
                                    "{userData.bio}"
                                </p>
                            )}
                            {/* XP bar */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                        <Zap size={10} /> XP
                                    </span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{xpProgress}%</span>
                                </div>
                                <div style={{ height: '5px', background: 'var(--bg-elevated)', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${xpProgress}%`, background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-neon))', borderRadius: '999px', boxShadow: '0 0 6px rgba(255,200,69,0.5)', transition: 'width 0.8s ease' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stats Bar ── */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    background: 'var(--border-default)', gap: '1px',
                    border: '1px solid var(--border-default)', borderRadius: '18px',
                    overflow: 'hidden', marginBottom: '1rem',
                }}>
                    {[
                        { value: userData.wins || 0, label: 'Victoires' },
                        { value: userData.eventsCount || 0, label: 'Events' },
                        { value: userData.balance || 0, label: 'TC' },
                    ].map(({ value, label }) => (
                        <div key={label} style={{ background: 'var(--bg-surface)', padding: '0.875rem 0.5rem', textAlign: 'center' }}>
                            <span style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--accent-gold)', lineHeight: 1 }}>{value}</span>
                            <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* ── Badges ── */}
                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: '28px', padding: '1.25rem', marginBottom: '1rem',
                    overflow: 'hidden',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--accent-gold)' }}>
                            <Trophy size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                            Badges
                        </span>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '999px' }}>
                            {badges.length} obtenu{badges.length > 1 ? 's' : ''}
                        </span>
                    </div>

                    {badges.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '0.625rem' }}>
                            {badges.map((badge) => (
                                <div
                                    key={badge.id}
                                    onClick={() => setSelectedBadge(badge)}
                                    data-rarity={badge.rarity || 'common'}
                                    data-name={badge.name}
                                    style={{
                                        position: 'relative', aspectRatio: '1/1', cursor: 'pointer',
                                        borderRadius: '12px', background: 'var(--bg-elevated)',
                                        border: badge.rarity === 'legendary' ? '1px solid var(--accent-gold)'
                                            : badge.rarity === 'epic' ? '1px solid rgba(168,85,247,0.5)'
                                            : badge.rarity === 'rare' ? '1px solid rgba(96,165,250,0.5)'
                                            : badge.rarity === 'uncommon' ? '1px solid rgba(34,197,94,0.5)'
                                            : '1px solid var(--border-default)',
                                        padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'transform 0.15s',
                                        boxSizing: 'border-box',
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'}
                                >
                                    <img
                                        src={badge.icon || undefined}
                                        alt={badge.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                        onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                            const parent = img.parentElement;
                                            if (parent && !parent.querySelector('.badge-fallback')) {
                                                const fb = document.createElement('span');
                                                fb.className = 'badge-fallback';
                                                fb.textContent = '🏅';
                                                fb.style.cssText = 'font-size:1.5rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%';
                                                parent.appendChild(fb);
                                            }
                                        }}
                                    />
                                </div>
                            ))}
                            {badges.length < 4 && Array.from({ length: 4 - badges.length }).map((_, i) => (
                                <div key={`l-${i}`} style={{
                                    aspectRatio: '1/1', borderRadius: '12px', background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-default)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', opacity: 0.2, fontSize: '1.25rem',
                                    boxSizing: 'border-box',
                                }}>🔒</div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>Aucun badge pour l'instant</p>
                    )}
                </div>

                {/* ── Dernière activité ── */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', padding: '1.25rem', marginBottom: '1rem' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--accent-gold)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} /> Dernière activité
                    </div>
                    {lastEvent ? (
                        <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-strong)', flexShrink: 0, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                {lastEvent.imageUrl
                                    ? <img src={lastEvent.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : lastEvent.eventType?.emoji || "🏆"
                                }
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{lastEvent.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    {lastEvent.date?.toDate ? new Date(lastEvent.date.toDate()).toLocaleDateString('fr-FR') : ""}
                                </div>
                            </div>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--accent-gold)', flexShrink: 0 }}>
                                {lastEvent.winner === userData.pseudo ? "1er" : "2ème"}
                            </div>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Aucune activité récente</p>
                    )}
                </div>

                {/* ── Classement ── */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '18px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--accent-gold)' }}>
                        <Trophy size={14} /> Classement
                    </div>
                    {leaderboard.map((player, index) => (
                        <div key={player.id} style={{
                            display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', gap: '0.875rem',
                            borderBottom: '1px solid var(--border-default)',
                            background: player.pseudo === userData.pseudo ? 'var(--accent-gold-dim)' : 'transparent',
                            borderLeft: player.pseudo === userData.pseudo ? '3px solid var(--accent-gold)' : '3px solid transparent',
                        }}>
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: index < 3 ? 'var(--accent-gold)' : 'var(--text-muted)', minWidth: '2rem', textAlign: 'center' }}>
                                #{index + 1}
                            </span>
                            <img
                                src={player.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${player.pseudo}`}
                                alt={player.pseudo}
                                width={36} height={36}
                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-strong)', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', color: player.pseudo === userData.pseudo ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                                    {player.pseudo}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                    Niv. {Math.floor((player.wins || 0) / 5) + 1}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-secondary)', flexShrink: 0 }}>
                                {player.wins} 🏆
                            </div>
                        </div>
                    ))}
                </div>

                {userData.role === "ADMIN" && (
                    <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                        <button onClick={() => router.push('/admin')} style={{
                            background: 'transparent', border: '1px solid var(--border-strong)',
                            borderRadius: '12px', padding: '0.625rem 1.25rem',
                            fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase',
                            color: 'var(--text-secondary)', cursor: 'pointer',
                        }}>
                            Panel Admin
                        </button>
                    </div>
                )}
            </main>

            {/* ── Modale Badge ── */}
            {selectedBadge && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setSelectedBadge(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-surface)',
                            border: `2px solid ${selectedBadge.rarity === 'legendary' ? 'var(--accent-gold)' : selectedBadge.rarity === 'epic' ? '#A855F7' : selectedBadge.rarity === 'rare' ? '#60A5FA' : selectedBadge.rarity === 'uncommon' ? '#22C55E' : 'var(--border-strong)'}`,
                            borderRadius: '28px', padding: '2rem 1.5rem 1.5rem',
                            width: '100%', maxWidth: '300px', textAlign: 'center', position: 'relative',
                            animation: 'scaleIn 200ms ease',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setSelectedBadge(null)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✕</button>
                        <div style={{ width: '100px', height: '100px', margin: '0 auto 1rem', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '16px' }}>
                            <img src={selectedBadge.icon || undefined} alt={selectedBadge.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                img.insertAdjacentHTML('afterend', '<span style="font-size:3rem;display:flex;align-items:center;justify-content:center;width:100%;height:100%">🏅</span>');
                            }} />
                        </div>
                        {selectedBadge.rarity && (
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 10px', borderRadius: '999px', border: '1px solid currentColor', color: selectedBadge.rarity === 'legendary' ? 'var(--accent-gold)' : selectedBadge.rarity === 'epic' ? '#A855F7' : '#60A5FA' }}>
                                    {selectedBadge.rarity}
                                </span>
                            </div>
                        )}
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>{selectedBadge.name}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>{selectedBadge.description}</p>
                        {selectedBadge.conditionType && (
                            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '0.625rem', fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                                {selectedBadge.conditionType === 'wins' && `🏆 ${selectedBadge.conditionValue} Victoires`}
                                {selectedBadge.conditionType === 'balance' && `💰 ${selectedBadge.conditionValue} TC`}
                                {selectedBadge.conditionType === 'events' && `📅 ${selectedBadge.conditionValue} Événements`}
                                {selectedBadge.conditionType === 'first_victory_type' && `⚡ Première victoire`}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Modale Édition ── */}
            {isEditing && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
                    onClick={() => setIsEditing(false)}
                >
                    <div
                        style={{ background: 'var(--bg-surface)', border: '2px solid var(--accent-gold)', borderRadius: '18px', boxShadow: '4px 4px 0px 0px var(--accent-gold)', padding: '1.5rem', width: 'calc(100% - 8px)', maxWidth: '420px', marginTop: '1rem', marginBottom: '2rem', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setIsEditing(false)} style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>✕</button>
                        <h2 className="font-payback" style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', textAlign: 'center', marginBottom: '1.25rem' }}>Éditer le Profil</h2>

                        {/* Générateur IA */}
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Générer Avatar IA</div>
                            <input type="text" className="dark-input" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ex: un chat cyberpunk..." disabled={isGenerating} style={{ marginBottom: '0.5rem' }} />
                            <button onClick={handleGenerateAvatar} disabled={isGenerating} style={{ width: '100%', padding: '0.65rem', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', cursor: 'pointer', opacity: isGenerating ? 0.6 : 1 }}>
                                {isGenerating ? '⏳ Génération...' : '✨ Générer'}
                            </button>
                            {isGenerating && <div style={{ height: '4px', background: 'var(--bg-surface)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}><div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent-gold)', transition: 'width 0.1s' }} /></div>}
                            {generatedImage && <div style={{ marginTop: '0.75rem', textAlign: 'center' }}><img src={generatedImage} alt="Avatar généré" style={{ maxWidth: '140px', borderRadius: '12px', border: '2px solid var(--accent-gold)' }} /></div>}
                        </div>

                        {/* Pseudo */}
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label className="dark-label">Pseudo</label>
                            <input type="text" className="dark-input" value={editPseudo} onChange={e => setEditPseudo(e.target.value)} placeholder="Votre pseudo" minLength={3} />
                        </div>

                        {/* Avatar URL */}
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label className="dark-label">Avatar (URL)</label>
                            <input type="text" className="dark-input" value={editAvatar} onChange={e => setEditAvatar(e.target.value)} placeholder="https://..." />
                        </div>

                        {/* Bio */}
                        <div style={{ marginBottom: '0.875rem' }}>
                            <label className="dark-label">Devise</label>
                            <textarea className="dark-input" rows={2} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Votre phrase fétiche..." style={{ resize: 'vertical', minHeight: '60px' }} />
                        </div>

                        {/* Couleurs */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="dark-label">Couleur d'accent</label>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {themeColors.map(({ value, label }) => (
                                    <button key={value} title={label} onClick={() => setEditThemeColor(value)} style={{
                                        width: '40px', height: '40px', borderRadius: '10px', background: value,
                                        border: editThemeColor === value ? '3px solid var(--text-primary)' : '2px solid var(--border-strong)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {editThemeColor === value && <span style={{ fontSize: '1rem', color: value === '#FFC845' ? '#000' : '#fff' }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSaveProfile} style={{ width: '100%', padding: '0.75rem', background: 'var(--accent-gold)', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <Save size={16} /> Sauvegarder
                        </button>
                    </div>
                </div>
            )}

            <Navbar />
        </>
    );
}
