"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Calendar, Trophy, MapPin } from "lucide-react";

interface Event {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    date?: any;
    imageUrl?: string;
    coverImage?: string;
    place?: string;
    link?: string;
    eventType?: { name: string; emoji: string; icon: string; };
    winner?: string;
    secondPlace?: string;
    winnerPoints?: number;
    secondPlacePoints?: number;
    status?: string;
}

export default function Events() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const q = query(collection(db, "events"), orderBy("date", "desc"));
                const snapshot = await getDocs(q);
                setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Event[]);
            } catch (error) {
                console.error("Erreur chargement événements:", error);
            }
        };
        if (user) fetchEvents();
    }, [user]);

    if (loading || (user && !userData)) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                <div className="skeleton skeleton-card" style={{ width: '200px', height: '40px' }} />
            </div>
        );
    }

    if (!user) return null;

    const getEventEmoji = (event: Event) => {
        if (event.eventType?.emoji) return event.eventType.emoji;
        const title = (event.name || event.title || "").toLowerCase();
        if (title.includes("kart")) return "🏎️";
        if (title.includes("smash")) return "⚔️";
        if (title.includes("blind")) return "🎵";
        if (title.includes("karaoke") || title.includes("karaoké")) return "🎤";
        if (title.includes("quiz")) return "🧠";
        return "🎮";
    };

    const resolveDate = (dateValue: any) => {
        if (!dateValue) return null;
        if (dateValue.toDate) return dateValue.toDate();
        return new Date(dateValue);
    };

    const formatDate = (dateValue: any) => {
        const date = resolveDate(dateValue);
        if (!date || isNaN(date.getTime())) return "Date à confirmer";
        return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const now = new Date();
    const isPast = (event: Event) => {
        if (event.status === "completed" || event.winner) return true;
        const date = resolveDate(event.date);
        return date && !isNaN(date.getTime()) && date.getTime() < now.getTime();
    };

    const upcomingEvents = events.filter(e => !isPast(e));
    const pastEvents = events.filter(isPast);

    return (
        <>
            <Header />
            <main className="layout-container">

                {/* Titre */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h1 className="font-payback" style={{ fontSize: '2rem', color: 'var(--accent-gold)', margin: 0 }}>Événements</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.35rem' }}>
                        Participez et gagnez des ToilesCoins
                    </p>
                </div>

                {/* À venir */}
                {upcomingEvents.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div className="section-title">
                            <Calendar size={15} />
                            À venir
                        </div>
                        <div className="shop-grid">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} style={{ width: '100%', maxWidth: '320px', position: 'relative' }}>
                                    {/* Ombre */}
                                    <div style={{
                                        position: 'absolute', top: '8px', left: '8px',
                                        width: '100%', height: '100%',
                                        background: 'var(--accent-gold)',
                                        borderRadius: 'var(--radius-xl)',
                                    }} />
                                    <div style={{
                                        position: 'relative',
                                        background: 'var(--bg-surface)',
                                        border: '2px solid var(--accent-gold)',
                                        borderRadius: 'var(--radius-xl)',
                                        overflow: 'hidden',
                                        height: '420px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}>
                                        {/* Image */}
                                        <div style={{ position: 'relative', flex: '0 0 60%', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                                            {event.imageUrl || event.coverImage ? (
                                                <img
                                                    src={event.imageUrl || event.coverImage}
                                                    alt={event.name || event.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                                                    {getEventEmoji(event)}
                                                </div>
                                            )}
                                            {/* Badge statut */}
                                            <div style={{
                                                position: 'absolute', top: '0.75rem', right: '0.75rem',
                                                background: 'rgba(34,197,94,0.2)',
                                                border: '1px solid var(--accent-green)',
                                                color: 'var(--accent-green)',
                                                borderRadius: 'var(--radius-pill)',
                                                padding: '2px 10px',
                                                fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase',
                                            }}>
                                                Ouvert
                                            </div>
                                            {/* Gradient overlay */}
                                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--bg-surface), transparent)' }} />
                                        </div>

                                        {/* Contenu */}
                                        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--accent-gold)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                                                {event.name || event.title || "Événement mystère"}
                                            </h3>
                                            <div className="flex items-center gap-1" style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                                <Calendar size={12} />
                                                <span>{formatDate(event.date)}</span>
                                            </div>
                                            {event.place && (
                                                <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                                                    <MapPin size={12} />
                                                    <span>{event.place}</span>
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }} />
                                            {event.link ? (
                                                <a href={event.link} target="_blank" rel="noreferrer" className="btn-primary" style={{ textDecoration: 'none', width: '100%', display: 'flex' }}>
                                                    S'inscrire
                                                </a>
                                            ) : (
                                                <button className="btn-ghost" disabled style={{ width: '100%', opacity: 0.5 }}>
                                                    Lien bientôt dispo
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Passés */}
                {pastEvents.length > 0 && (
                    <div>
                        <div className="section-title" style={{ opacity: 0.7 }}>
                            <Trophy size={15} />
                            Événements passés
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pastEvents.map((event) => (
                                <div key={event.id} className="dark-card" style={{ filter: 'grayscale(0.5)', opacity: 0.75 }}>
                                    <div className="flex gap-3 items-start">
                                        <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{getEventEmoji(event)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div style={{ fontWeight: 700, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                                                {event.name || event.title}
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(event.date)}</div>

                                            {event.winner && (
                                                <div style={{ marginTop: '0.625rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                                    <div className="flex items-center gap-2">
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(255,200,69,0.15)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold-border)', borderRadius: 'var(--radius-pill)', padding: '1px 8px' }}>🥇 1er</span>
                                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{event.winner}</span>
                                                        {event.winnerPoints && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{event.winnerPoints} TC</span>}
                                                    </div>
                                                    {event.secondPlace && (
                                                        <div className="flex items-center gap-2">
                                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(160,160,160,0.1)', color: 'var(--text-secondary)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-pill)', padding: '1px 8px' }}>🥈 2ème</span>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{event.secondPlace}</span>
                                                            {event.secondPlacePoints && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{event.secondPlacePoints} TC</span>}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* État vide */}
                {events.length === 0 && (
                    <div className="dark-card text-center" style={{ padding: '3rem 1.5rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Aucun événement pour le moment
                        </p>
                    </div>
                )}
            </main>
            <Navbar />
        </>
    );
}
