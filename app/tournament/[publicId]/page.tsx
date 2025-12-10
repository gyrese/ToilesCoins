"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Player {
    id: string;
    name: string;
    isRegistered: boolean;
    userId?: string;
    groupId?: string;
    groupPoints?: number;
    groupWins?: number;
    groupLosses?: number;
}

interface Match {
    id: string;
    round: number;
    matchNumber: number;
    player1?: Player;
    player2?: Player;
    winner?: Player;
    score1?: number;
    score2?: number;
    nextMatchId?: string;
    phase: 'group' | 'knockout';
    groupId?: string;
    isThirdPlace?: boolean;
}

interface Group {
    id: string;
    name: string;
    players: Player[];
}

interface Tournament {
    id: string;
    name: string;
    eventTypeName: string;
    date: any;
    place?: string;
    imageUrl?: string;
    status: 'setup' | 'ongoing' | 'completed';
    format: 'elimination' | 'groups';
    players: Player[];
    matches: Match[];
    groups: Group[];
    publicId: string;
    winner?: Player;
    secondPlace?: Player;
    thirdPlace?: Player;
}

export default function PublicTournament() {
    const params = useParams();
    const publicId = params.publicId as string;

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentUrl, setCurrentUrl] = useState("");
    const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({});

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        if (!tournament) return;
        const loadAvatars = async () => {
            const avatars: Record<string, string> = {};
            for (const player of tournament.players) {
                if (player.isRegistered && player.userId) {
                    try {
                        const userDoc = await getDoc(doc(db, "users", player.userId));
                        if (userDoc.exists() && userDoc.data().avatarUrl) {
                            avatars[player.id] = userDoc.data().avatarUrl;
                        }
                    } catch (err) { /* ignore */ }
                }
            }
            setPlayerAvatars(avatars);
        };
        loadAvatars();
    }, [tournament?.players]);

    useEffect(() => {
        if (!publicId) return;
        const q = query(collection(db, "tournaments"), where("publicId", "==", publicId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setError("Tournoi introuvable");
                setLoading(false);
                return;
            }
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            setTournament({
                id: docSnap.id,
                ...data,
                date: data.date?.toDate?.() || new Date(data.date)
            } as Tournament);
            setLoading(false);
        }, () => {
            setError("Erreur de chargement");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [publicId]);

    const PlayerAvatar = ({ player, size = 40 }: { player?: Player; size?: number }) => {
        if (!player || player.name === 'TBD') {
            return (
                <div
                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                    style={{ width: size, height: size, fontSize: size * 0.4 }}
                >?</div>
            );
        }

        // Registered player with saved avatar
        const avatarUrl = playerAvatars[player.id];
        if (avatarUrl) {
            return (
                <img
                    src={avatarUrl}
                    alt={player.name}
                    className="rounded-circle"
                    style={{ width: size, height: size, objectFit: 'cover' }}
                />
            );
        }

        // For non-registered players or those without avatar, use DiceBear
        // Generate a consistent avatar based on their name using fun style
        const diceBearUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(player.name)}&size=${size}`;

        return (
            <img
                src={diceBearUrl}
                alt={player.name}
                className="rounded-circle"
                style={{ width: size, height: size, objectFit: 'cover', background: '#f0f0f0' }}
            />
        );
    };

    if (loading) {
        return (
            <>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
                <div className="min-vh-100 d-flex align-items-center justify-content-center bg-warning">
                    <div className="text-center">
                        <div className="spinner-border text-dark mb-3" style={{ width: '3rem', height: '3rem' }} />
                        <h4 className="fw-bold">Chargement du tournoi...</h4>
                    </div>
                </div>
            </>
        );
    }

    if (error || !tournament) {
        return (
            <>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
                <div className="min-vh-100 d-flex align-items-center justify-content-center bg-warning p-4">
                    <div className="card text-center p-5 shadow-lg">
                        <h1 className="display-1 mb-3">❌</h1>
                        <h3 className="fw-bold mb-3">{error || "Tournoi introuvable"}</h3>
                        <a href="/" className="btn btn-dark btn-lg">Retour à l'accueil</a>
                    </div>
                </div>
            </>
        );
    }

    const knockoutMatches = tournament.matches.filter(m => m.phase === 'knockout' && !m.isThirdPlace);
    const thirdPlaceMatch = tournament.matches.find(m => m.isThirdPlace);
    const totalKnockoutRounds = knockoutMatches.length > 0 ? Math.max(...knockoutMatches.map(m => m.round)) : 0;
    const getMatchesByRound = (round: number) => knockoutMatches.filter(m => m.round === round);
    const getGroupMatches = (groupId: string) => tournament.matches.filter(m => m.phase === 'group' && m.groupId === groupId);

    const getRoundName = (round: number) => {
        if (round === totalKnockoutRounds) return '🏆 Finale';
        if (round === totalKnockoutRounds - 1) return '⚔️ Demi-finales';
        if (round === totalKnockoutRounds - 2) return '🎯 Quarts de finale';
        return `Tour ${round}`;
    };

    return (
        <>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" />
            <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet" />

            <div className="min-vh-100" style={{ backgroundColor: '#FFC845' }}>
                {/* Header */}
                <div className="bg-dark text-white">
                    {tournament.imageUrl && (
                        <div style={{ height: '200px', overflow: 'hidden' }}>
                            <img src={tournament.imageUrl} alt="" className="w-100 h-100" style={{ objectFit: 'cover', opacity: 0.5 }} />
                        </div>
                    )}

                    <div className="container py-4">
                        <div className="row align-items-center">
                            <div className="col-md-8">
                                <div className="d-flex gap-2 mb-2 flex-wrap">
                                    <span className="badge bg-warning text-dark">{tournament.eventTypeName}</span>
                                    {tournament.status === 'ongoing' && (
                                        <span className="badge bg-danger">
                                            <i className="bi bi-broadcast me-1"></i> EN DIRECT
                                        </span>
                                    )}
                                    {tournament.status === 'completed' && (
                                        <span className="badge bg-success">
                                            <i className="bi bi-check-circle me-1"></i> Terminé
                                        </span>
                                    )}
                                </div>
                                <h1 className="display-5 fw-bold mb-3">{tournament.name}</h1>
                                <div className="d-flex gap-4 text-white-50 flex-wrap">
                                    <span><i className="bi bi-calendar3 me-1"></i> {new Date(tournament.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                    {tournament.place && <span><i className="bi bi-geo-alt me-1"></i> {tournament.place}</span>}
                                    <span><i className="bi bi-people me-1"></i> {tournament.players.length} joueurs</span>
                                </div>
                            </div>
                            <div className="col-md-4 text-center text-md-end mt-4 mt-md-0">
                                <div className="bg-white d-inline-block p-2 rounded">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(currentUrl || `https://toilescoins.com/tournament/${publicId}`)}`}
                                        alt="QR Code"
                                        style={{ width: 100, height: 100 }}
                                    />
                                </div>
                                <div className="text-white-50 small mt-2">📱 Scannez pour suivre</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container py-4">
                    {/* Champion */}
                    {tournament.status === 'completed' && tournament.winner && (
                        <div className="card bg-warning border-0 shadow-lg mb-4">
                            <div className="card-body text-center py-5">
                                <h2 className="display-1 mb-2">🏆</h2>
                                <h3 className="text-uppercase text-muted mb-3">Champion</h3>
                                <div className="d-flex align-items-center justify-content-center gap-3 mb-4">
                                    <PlayerAvatar player={tournament.winner} size={60} />
                                    <h2 className="display-6 fw-bold mb-0">{tournament.winner.name}</h2>
                                </div>

                                {(tournament.secondPlace || tournament.thirdPlace) && (
                                    <div className="d-flex justify-content-center gap-4 flex-wrap">
                                        {tournament.secondPlace && (
                                            <div className="d-flex align-items-center gap-2 bg-white bg-opacity-50 px-4 py-2 rounded">
                                                <span className="fs-4">🥈</span>
                                                <PlayerAvatar player={tournament.secondPlace} size={32} />
                                                <span className="fw-bold">{tournament.secondPlace.name}</span>
                                            </div>
                                        )}
                                        {tournament.thirdPlace && (
                                            <div className="d-flex align-items-center gap-2 bg-white bg-opacity-50 px-4 py-2 rounded">
                                                <span className="fs-4">🥉</span>
                                                <PlayerAvatar player={tournament.thirdPlace} size={32} />
                                                <span className="fw-bold">{tournament.thirdPlace.name}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Matchs */}
                    {knockoutMatches.length > 0 && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-dark text-white">
                                <h5 className="mb-0"><i className="bi bi-trophy me-2"></i>Matchs</h5>
                            </div>
                            <div className="card-body">
                                {Array.from({ length: totalKnockoutRounds }, (_, i) => totalKnockoutRounds - i).map(round => (
                                    <div key={round} className="mb-4">
                                        <h6 className="text-muted text-uppercase mb-3">{getRoundName(round)}</h6>

                                        <div className="row g-3">
                                            {getMatchesByRound(round).map(match => (
                                                <div key={match.id} className={round === totalKnockoutRounds ? 'col-12 col-md-8 mx-auto' : 'col-12 col-md-6'}>
                                                    <div className={`card ${round === totalKnockoutRounds ? 'border-warning border-3' : ''}`}>
                                                        <div className="card-body p-0">
                                                            {/* Player 1 */}
                                                            <div className={`d-flex align-items-center p-3 ${match.winner?.id === match.player1?.id ? 'bg-success bg-opacity-10' : ''}`}>
                                                                <PlayerAvatar player={match.player1} size={40} />
                                                                <div className="ms-3 flex-grow-1">
                                                                    <span className={`fw-semibold ${match.winner?.id === match.player1?.id ? 'text-success' : ''}`}>
                                                                        {match.player1?.name || <span className="text-muted">En attente...</span>}
                                                                    </span>
                                                                    {match.player1?.isRegistered && (
                                                                        <span className="badge bg-primary ms-2" style={{ fontSize: '10px' }}>Membre</span>
                                                                    )}
                                                                </div>
                                                                <span className={`fs-3 fw-bold ${match.winner?.id === match.player1?.id ? 'text-success' : 'text-muted'}`}>
                                                                    {match.score1 ?? '-'}
                                                                </span>
                                                            </div>

                                                            <hr className="my-0" />

                                                            {/* Player 2 */}
                                                            <div className={`d-flex align-items-center p-3 ${match.winner?.id === match.player2?.id ? 'bg-success bg-opacity-10' : ''}`}>
                                                                <PlayerAvatar player={match.player2} size={40} />
                                                                <div className="ms-3 flex-grow-1">
                                                                    <span className={`fw-semibold ${match.winner?.id === match.player2?.id ? 'text-success' : ''}`}>
                                                                        {match.player2?.name || <span className="text-muted">En attente...</span>}
                                                                    </span>
                                                                    {match.player2?.isRegistered && (
                                                                        <span className="badge bg-primary ms-2" style={{ fontSize: '10px' }}>Membre</span>
                                                                    )}
                                                                </div>
                                                                <span className={`fs-3 fw-bold ${match.winner?.id === match.player2?.id ? 'text-success' : 'text-muted'}`}>
                                                                    {match.score2 ?? '-'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* 3rd Place Match */}
                                {thirdPlaceMatch && (
                                    <div className="mb-4">
                                        <h6 className="text-muted text-uppercase mb-3">🥉 Petite Finale (3ème place)</h6>
                                        <div className="row g-3">
                                            <div className="col-12 col-md-8 mx-auto">
                                                <div className="card border-warning border-2" style={{ background: 'linear-gradient(135deg, #f6e6c9 0%, #d9b38c 100%)' }}>
                                                    <div className="card-body p-0">
                                                        {/* Player 1 */}
                                                        <div className={`d-flex align-items-center p-3 ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player1?.id ? 'bg-warning bg-opacity-25' : ''}`}>
                                                            <PlayerAvatar player={thirdPlaceMatch.player1} size={40} />
                                                            <div className="ms-3 flex-grow-1">
                                                                <span className={`fw-semibold ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player1?.id ? 'text-success' : ''}`}>
                                                                    {thirdPlaceMatch.player1?.name || <span className="text-muted">En attente...</span>}
                                                                </span>
                                                            </div>
                                                            <span className={`fs-3 fw-bold ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player1?.id ? 'text-success' : 'text-muted'}`}>
                                                                {thirdPlaceMatch.score1 ?? '-'}
                                                            </span>
                                                        </div>
                                                        <hr className="my-0" />
                                                        {/* Player 2 */}
                                                        <div className={`d-flex align-items-center p-3 ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player2?.id ? 'bg-warning bg-opacity-25' : ''}`}>
                                                            <PlayerAvatar player={thirdPlaceMatch.player2} size={40} />
                                                            <div className="ms-3 flex-grow-1">
                                                                <span className={`fw-semibold ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player2?.id ? 'text-success' : ''}`}>
                                                                    {thirdPlaceMatch.player2?.name || <span className="text-muted">En attente...</span>}
                                                                </span>
                                                            </div>
                                                            <span className={`fs-3 fw-bold ${thirdPlaceMatch.winner?.id === thirdPlaceMatch.player2?.id ? 'text-success' : 'text-muted'}`}>
                                                                {thirdPlaceMatch.score2 ?? '-'}
                                                            </span>
                                                        </div>
                                                        {thirdPlaceMatch.winner && (
                                                            <div className="card-footer text-center bg-warning bg-opacity-50">
                                                                <span className="fw-bold">🥉 3ème : {thirdPlaceMatch.winner.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Poules */}
                    {tournament.format === 'groups' && tournament.groups.length > 0 && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-dark text-white">
                                <h5 className="mb-0"><i className="bi bi-grid-3x3-gap me-2"></i>Phase de Poules</h5>
                            </div>
                            <div className="card-body">
                                <div className="row g-4">
                                    {tournament.groups.map(group => (
                                        <div key={group.id} className="col-12 col-lg-6">
                                            <div className="card">
                                                <div className="card-header bg-secondary text-white fw-bold">
                                                    {group.name}
                                                </div>
                                                <div className="card-body p-0">
                                                    <table className="table table-sm mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>#</th>
                                                                <th>Joueur</th>
                                                                <th className="text-center">V</th>
                                                                <th className="text-center">D</th>
                                                                <th className="text-center">Pts</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tournament.players
                                                                .filter(p => p.groupId === group.id)
                                                                .sort((a, b) => (b.groupPoints || 0) - (a.groupPoints || 0))
                                                                .map((player, idx) => (
                                                                    <tr key={player.id} className={idx < 2 ? 'table-success' : ''}>
                                                                        <td className="fw-bold">{idx + 1}</td>
                                                                        <td>
                                                                            <div className="d-flex align-items-center gap-2">
                                                                                <PlayerAvatar player={player} size={28} />
                                                                                <span>{player.name}</span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-center">{player.groupWins || 0}</td>
                                                                        <td className="text-center">{player.groupLosses || 0}</td>
                                                                        <td className="text-center fw-bold">{player.groupPoints || 0}</td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* Matchs du groupe */}
                                                <div className="card-footer bg-light">
                                                    <small className="text-muted d-block mb-2">Matchs</small>
                                                    {getGroupMatches(group.id).map(match => (
                                                        <div key={match.id} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <PlayerAvatar player={match.player1} size={24} />
                                                                <small className={match.winner?.id === match.player1?.id ? 'fw-bold text-success' : ''}>
                                                                    {match.player1?.name}
                                                                </small>
                                                            </div>
                                                            <span className="badge bg-dark">
                                                                {match.score1 ?? '-'} : {match.score2 ?? '-'}
                                                            </span>
                                                            <div className="d-flex align-items-center gap-2">
                                                                <small className={match.winner?.id === match.player2?.id ? 'fw-bold text-success' : ''}>
                                                                    {match.player2?.name}
                                                                </small>
                                                                <PlayerAvatar player={match.player2} size={24} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Participants */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-dark text-white">
                            <h5 className="mb-0"><i className="bi bi-people me-2"></i>Participants ({tournament.players.length})</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-2">
                                {tournament.players.map(player => {
                                    const isWinner = tournament.winner?.id === player.id;
                                    const isSecond = tournament.secondPlace?.id === player.id;
                                    const isThird = tournament.thirdPlace?.id === player.id;

                                    return (
                                        <div key={player.id} className="col-6 col-md-3">
                                            <div className={`d-flex align-items-center gap-2 p-2 rounded border ${isWinner ? 'border-warning bg-warning bg-opacity-25' :
                                                isSecond ? 'border-secondary bg-secondary bg-opacity-10' :
                                                    isThird ? 'border-warning bg-warning bg-opacity-10' : ''
                                                }`}>
                                                <PlayerAvatar player={player} size={32} />
                                                <span className="text-truncate small fw-medium flex-grow-1">{player.name}</span>
                                                {isWinner && '👑'}
                                                {isSecond && '🥈'}
                                                {isThird && '🥉'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center py-4">
                        <p className="text-muted small mb-3">
                            <span className="badge bg-success me-2">●</span>
                            Mise à jour automatique en temps réel
                        </p>
                        <a href="/" className="btn btn-dark btn-lg">
                            <i className="bi bi-house me-2"></i>Accueil ToilesCoins
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
