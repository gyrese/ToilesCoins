"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Calendar, Trophy } from "lucide-react";

interface Event {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    date?: any;
    imageUrl?: string;
    coverImage?: string;
    place?: string;
    eventType?: {
        name: string;
        emoji: string;
        icon: string;
    };
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
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const q = query(
                    collection(db, "events"),
                    orderBy("date", "desc")
                );
                const snapshot = await getDocs(q);
                const eventsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Event[];
                setEvents(eventsData);
            } catch (error) {
                console.error("Erreur chargement événements:", error);
            }
        };

        if (user) {
            fetchEvents();
        }
    }, [user]);

    if (loading || (user && !userData)) {
        return (
            <div className="d-flex min-vh-100 align-items-center justify-content-center" style={{ backgroundColor: "#FFD95A" }}>
                <div className="h3 fw-bold text-uppercase">Chargement...</div>
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

    const formatDate = (dateValue: any) => {
        if (!dateValue) return "Date à confirmer";

        let date: Date;
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        } else if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else {
            date = new Date(dateValue);
        }

        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const upcomingEvents = events.filter(e => e.status === "upcoming" || !e.winner);
    const pastEvents = events.filter(e => e.status === "completed" || e.winner);

    return (
        <>
            <Header />
            <main style={{ backgroundColor: "#FFD95A", minHeight: "100vh", paddingBottom: "150px", paddingTop: "50px" }}>

                {/* PAGE HEADER */}
                <div className="container text-center mb-5">
                    <h1 className="display-4 fw-bold fst-italic text-uppercase mb-3" style={{ letterSpacing: "-2px" }}>Événements</h1>
                    <div className="mx-auto mb-4" style={{ height: "4px", width: "100px", backgroundColor: "black" }}></div>
                    <p className="fw-bold text-uppercase small" style={{ letterSpacing: "0.2em", opacity: 0.6 }}>
                        Participez et gagnez des ToilesCoins
                    </p>
                </div>

                {/* UPCOMING EVENTS */}
                {upcomingEvents.length > 0 && (
                    <div className="container mb-5">
                        <div className="d-flex align-items-center gap-2 mb-4">
                            <Calendar size={28} strokeWidth={3} />
                            <h2 className="h3 fw-bold text-uppercase mb-0">À venir</h2>
                        </div>

                        <div className="row g-5 justify-content-center">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
                                    <div className="card border-0 bg-transparent" style={{ width: "100%", maxWidth: "350px", height: "500px" }}>
                                        <div className="position-relative w-100 h-100">
                                            {/* Shadow */}
                                            <div className="position-absolute w-100 h-100 bg-black rounded-4"
                                                style={{ top: "10px", left: "10px", zIndex: 0 }}></div>

                                            {/* Main Card */}
                                            <div className="position-relative w-100 h-100 bg-dark border border-4 border-dark rounded-4 overflow-hidden d-flex flex-column"
                                                style={{ zIndex: 1 }}>

                                                {/* Image Background */}
                                                {event.imageUrl || event.coverImage ? (
                                                    <img
                                                        src={event.imageUrl || event.coverImage}
                                                        alt={event.name || event.title}
                                                        className="position-absolute w-100 h-100 object-fit-cover"
                                                        style={{ filter: "brightness(0.8)" }}
                                                    />
                                                ) : (
                                                    <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-secondary bg-gradient">
                                                        <div className="display-1">{getEventEmoji(event)}</div>
                                                    </div>
                                                )}

                                                {/* Gradient Overlay */}
                                                <div className="position-absolute bottom-0 w-100"
                                                    style={{
                                                        height: "70%",
                                                        background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, transparent 100%)"
                                                    }}>
                                                </div>

                                                {/* Status Badge */}
                                                <div className="position-absolute top-0 end-0 m-3">
                                                    <span className="badge bg-success text-white border border-2 border-white px-3 py-2 fw-bold shadow-sm">
                                                        OUVERT
                                                    </span>
                                                </div>

                                                {/* Content Overlay */}
                                                <div className="position-absolute bottom-0 w-100 p-4 text-white mt-auto">
                                                    <h3 className="h3 fw-bold text-uppercase mb-2 text-warning" style={{ textShadow: "2px 2px 0px #000" }}>
                                                        {event.name || event.title || "Événement mystère"}
                                                    </h3>

                                                    {event.description && (
                                                        <p className="small fw-bold text-white-50 mb-3 line-clamp-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {event.description}
                                                        </p>
                                                    )}

                                                    <div className="d-flex align-items-center gap-2 mb-2 text-white">
                                                        <Calendar size={18} className="text-warning" />
                                                        <span className="fw-bold">{formatDate(event.date)}</span>
                                                    </div>

                                                    {event.place && (
                                                        <div className="small fw-bold text-white mb-4">
                                                            📍 {event.place}
                                                        </div>
                                                    )}

                                                    <button
                                                        className="btn btn-warning w-100 fw-bold text-uppercase rounded-3 border-2 border-black py-2 hover-scale"
                                                        style={{ boxShadow: "4px 4px 0px #000", transition: "all 0.2s" }}
                                                    >
                                                        S'inscrire
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* PAST EVENTS */}
                {pastEvents.length > 0 && (
                    <div className="container mt-5 pt-5 border-top border-dark border-opacity-25">
                        <div className="d-flex align-items-center gap-2 mb-4 opacity-75">
                            <Trophy size={28} strokeWidth={3} />
                            <h2 className="h3 fw-bold text-uppercase mb-0">Événements passés</h2>
                        </div>

                        <div className="row g-4">
                            {pastEvents.map((event) => (
                                <div key={event.id} className="col-12 col-md-6 col-lg-4">
                                    <div className="card h-100 border-2 border-dark border-opacity-10 bg-white bg-opacity-50 p-4 grayscale opacity-75">
                                        <div className="d-flex align-items-start gap-3 mb-3">
                                            <div className="fs-2">{getEventEmoji(event)}</div>
                                            <div className="flex-grow-1">
                                                <h4 className="fw-bold text-uppercase small mb-1">{event.name || event.title}</h4>
                                                <div className="small text-muted">{formatDate(event.date)}</div>
                                            </div>
                                        </div>

                                        {event.winner && (
                                            <div className="border-top border-dark border-opacity-10 pt-3">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <span className="badge bg-warning text-dark border border-dark">🥇 1er</span>
                                                    <span className="fw-bold">{event.winner}</span>
                                                    {event.winnerPoints && (
                                                        <span className="ms-auto small text-muted">{event.winnerPoints} TC</span>
                                                    )}
                                                </div>
                                                {event.secondPlace && (
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="badge bg-secondary text-white border border-dark">🥈 2ème</span>
                                                        <span className="fw-bold">{event.secondPlace}</span>
                                                        {event.secondPlacePoints && (
                                                            <span className="ms-auto small text-muted">{event.secondPlacePoints} TC</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EMPTY STATE */}
                {events.length === 0 && (
                    <div className="container">
                        <div className="card border-4 border-dark rounded-4 p-5 shadow-sm text-center">
                            <div className="display-1 mb-3">🎮</div>
                            <h2 className="text-muted text-uppercase fw-bold">Aucun événement pour le moment</h2>
                            <p className="text-muted">Revenez bientôt pour découvrir les prochains événements !</p>
                        </div>
                    </div>
                )}
            </main>
            <Navbar />
        </>
    );
}
