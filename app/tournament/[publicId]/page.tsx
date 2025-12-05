"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Trophy, Users, Calendar, MapPin, Medal, Award } from "lucide-react";

interface Player {
    id: string;
    name: string;
    isRegistered: boolean;
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

    useEffect(() => {
        if (!publicId) return;

        // Real-time listener for tournament updates
        const q = query(collection(db, "tournaments"), where("publicId", "==", publicId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setError("Tournoi introuvable");
                setLoading(false);
                return;
            }

            const doc = snapshot.docs[0];
            const data = doc.data();
            setTournament({
                id: doc.id,
                ...data,
                date: data.date?.toDate?.() || new Date(data.date)
            } as Tournament);
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError("Erreur de chargement");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [publicId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFC845] flex items-center justify-center">
                <div className="text-center">
                    <Trophy size={60} className="mx-auto mb-4 animate-bounce" />
                    <p className="font-black text-xl">CHARGEMENT DU TOURNOI...</p>
                </div>
            </div>
        );
    }

    if (error || !tournament) {
        return (
            <div className="min-h-screen bg-[#FFC845] flex items-center justify-center p-4">
                <div className="neo-card text-center max-w-md">
                    <h1 className="text-2xl font-black mb-4">❌ {error || "Tournoi introuvable"}</h1>
                    <p className="mb-4">Ce tournoi n'existe pas ou a été supprimé.</p>
                    <a href="/" className="neo-btn bg-white inline-block">RETOUR À L'ACCUEIL</a>
                </div>
            </div>
        );
    }

    const knockoutMatches = tournament.matches.filter(m => m.phase === 'knockout');
    const totalKnockoutRounds = knockoutMatches.length > 0
        ? Math.max(...knockoutMatches.map(m => m.round))
        : 0;

    const getMatchesByRound = (round: number) => {
        return knockoutMatches.filter(m => m.round === round);
    };

    const getGroupMatches = (groupId: string) => {
        return tournament.matches.filter(m => m.phase === 'group' && m.groupId === groupId);
    };

    return (
        <div className="min-h-screen bg-[#FFC845] p-4">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="neo-card bg-black text-white overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4">
                        {tournament.imageUrl && (
                            <div className="w-full md:w-48 h-32 md:h-auto border-2 border-yellow-400 overflow-hidden flex-shrink-0">
                                <img
                                    src={tournament.imageUrl}
                                    alt={tournament.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy size={24} className="text-yellow-400" />
                                <span className="text-yellow-400 font-bold text-sm uppercase">
                                    {tournament.eventTypeName}
                                </span>
                                {tournament.status === 'ongoing' && (
                                    <span className="bg-green-500 text-white text-xs px-2 py-1 font-bold animate-pulse">
                                        EN COURS
                                    </span>
                                )}
                                {tournament.status === 'completed' && (
                                    <span className="bg-blue-500 text-white text-xs px-2 py-1 font-bold">
                                        TERMINÉ
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-black uppercase mb-2">
                                {tournament.name}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>{new Date(tournament.date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                {tournament.place && (
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} />
                                        <span>{tournament.place}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Users size={14} />
                                    <span>{tournament.players.length} joueurs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Winner Display (if completed) */}
                {tournament.status === 'completed' && tournament.winner && (
                    <div className="neo-card bg-gradient-to-br from-yellow-400 to-yellow-600 text-black text-center">
                        <Trophy size={60} className="mx-auto mb-2" />
                        <h2 className="text-3xl font-black uppercase mb-1">🏆 CHAMPION 🏆</h2>
                        <p className="text-4xl font-black mb-4">{tournament.winner.name}</p>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {tournament.secondPlace && (
                                <div className="bg-white/50 p-3 border-2 border-black">
                                    <Medal size={30} className="mx-auto mb-1" />
                                    <div className="font-black">🥈 2ème</div>
                                    <div className="text-lg font-bold">{tournament.secondPlace.name}</div>
                                </div>
                            )}
                            {tournament.thirdPlace && (
                                <div className="bg-white/50 p-3 border-2 border-black">
                                    <Award size={30} className="mx-auto mb-1" />
                                    <div className="font-black">🥉 3ème</div>
                                    <div className="text-lg font-bold">{tournament.thirdPlace.name}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Players List */}
                <div className="neo-card">
                    <h2 className="text-xl font-black uppercase mb-4">👥 Participants ({tournament.players.length})</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {tournament.players.map(player => (
                            <div
                                key={player.id}
                                className={`p-2 border-2 text-center text-sm font-bold ${tournament.winner?.id === player.id
                                        ? 'border-yellow-500 bg-yellow-100'
                                        : tournament.secondPlace?.id === player.id
                                            ? 'border-gray-400 bg-gray-100'
                                            : tournament.thirdPlace?.id === player.id
                                                ? 'border-orange-400 bg-orange-100'
                                                : 'border-black bg-white'
                                    }`}
                            >
                                {tournament.winner?.id === player.id && '🏆 '}
                                {tournament.secondPlace?.id === player.id && '🥈 '}
                                {tournament.thirdPlace?.id === player.id && '🥉 '}
                                {player.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Group Stage */}
                {tournament.format === 'groups' && tournament.groups.length > 0 && (
                    <div className="neo-card">
                        <h2 className="text-xl font-black uppercase mb-4">🏟️ Phase de Poules</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            {tournament.groups.map(group => (
                                <div key={group.id} className="border-2 border-black p-3 bg-white">
                                    <h3 className="font-black text-lg mb-2 bg-black text-white p-2 -m-3 mb-3">
                                        {group.name}
                                    </h3>

                                    {/* Standings */}
                                    <div className="mb-3">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-black">
                                                    <th className="text-left p-1">#</th>
                                                    <th className="text-left p-1">Joueur</th>
                                                    <th className="text-center p-1">V</th>
                                                    <th className="text-center p-1">D</th>
                                                    <th className="text-center p-1">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tournament.players
                                                    .filter(p => p.groupId === group.id)
                                                    .sort((a, b) => (b.groupPoints || 0) - (a.groupPoints || 0))
                                                    .map((player, idx) => (
                                                        <tr key={player.id} className={idx < 2 ? 'bg-green-50 font-bold' : ''}>
                                                            <td className="p-1">{idx + 1}</td>
                                                            <td className="p-1">{player.name}</td>
                                                            <td className="text-center p-1">{player.groupWins || 0}</td>
                                                            <td className="text-center p-1">{player.groupLosses || 0}</td>
                                                            <td className="text-center p-1 font-black">{player.groupPoints || 0}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Group Matches */}
                                    <div className="space-y-1">
                                        {getGroupMatches(group.id).map(match => (
                                            <div key={match.id} className="p-2 bg-gray-50 border border-gray-300 text-sm flex justify-between items-center">
                                                <span className={match.winner?.id === match.player1?.id ? 'font-black text-green-600' : ''}>
                                                    {match.player1?.name}
                                                </span>
                                                <span className="font-black text-lg">
                                                    {match.score1 ?? '-'} : {match.score2 ?? '-'}
                                                </span>
                                                <span className={match.winner?.id === match.player2?.id ? 'font-black text-green-600' : ''}>
                                                    {match.player2?.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Knockout Stage */}
                {knockoutMatches.length > 0 && (
                    <div className="neo-card">
                        <h2 className="text-xl font-black uppercase mb-4">⚔️ Phase Éliminatoire</h2>

                        <div className="space-y-6">
                            {Array.from({ length: totalKnockoutRounds }, (_, i) => totalKnockoutRounds - i).map(round => (
                                <div key={round}>
                                    <h3 className="text-lg font-black uppercase mb-3 bg-black text-white p-2 text-center">
                                        {round === totalKnockoutRounds ? '🏆 FINALE' :
                                            round === totalKnockoutRounds - 1 ? '🥇 DEMI-FINALES' :
                                                round === totalKnockoutRounds - 2 ? '🎯 QUARTS DE FINALE' :
                                                    `ROUND ${round}`}
                                    </h3>

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {getMatchesByRound(round).map(match => (
                                            <div
                                                key={match.id}
                                                className={`p-3 border-4 ${round === totalKnockoutRounds
                                                        ? 'border-yellow-500 bg-yellow-50'
                                                        : 'border-black bg-white'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className={`font-bold ${match.winner?.id === match.player1?.id ? 'text-green-600' : ''}`}>
                                                        {match.player1?.name || 'En attente...'}
                                                    </span>
                                                    <span className="text-xl font-black bg-gray-100 px-3 py-1 border-2 border-black">
                                                        {match.score1 ?? '-'}
                                                    </span>
                                                </div>

                                                <div className="text-center text-xs font-bold text-gray-500 my-1">VS</div>

                                                <div className="flex justify-between items-center">
                                                    <span className={`font-bold ${match.winner?.id === match.player2?.id ? 'text-green-600' : ''}`}>
                                                        {match.player2?.name || 'En attente...'}
                                                    </span>
                                                    <span className="text-xl font-black bg-gray-100 px-3 py-1 border-2 border-black">
                                                        {match.score2 ?? '-'}
                                                    </span>
                                                </div>

                                                {match.winner && (
                                                    <div className="text-center mt-2 pt-2 border-t-2 border-gray-200">
                                                        <span className="text-sm font-black text-green-600">
                                                            ✅ Vainqueur: {match.winner.name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center py-4">
                    <p className="text-sm font-bold opacity-70">
                        🔄 Cette page se met à jour automatiquement
                    </p>
                    <a href="/" className="neo-btn bg-white inline-block mt-4 text-sm">
                        🏠 ACCUEIL TOILESCOINS
                    </a>
                </div>
            </div>
        </div>
    );
}
