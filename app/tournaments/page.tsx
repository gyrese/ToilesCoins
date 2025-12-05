"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    getDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { Trophy, Users, Plus, Save, ArrowLeft, Award, Medal, Globe, Calendar, MapPin } from "lucide-react";

interface Player {
    id: string;
    name: string;
    isRegistered: boolean;
    userId?: string;
    seed?: number;
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

interface EventData {
    id: string;
    name: string;
    date: any;
    place?: string;
    imageUrl?: string;
    typeName?: string;
    typeEmoji?: string;
}

interface Tournament {
    id?: string;
    name: string;
    eventId?: string;
    eventTypeId: string;
    eventTypeName: string;
    date: Date;
    place?: string;
    imageUrl?: string;
    status: 'setup' | 'ongoing' | 'completed';
    format: 'elimination' | 'groups';
    players: Player[];
    matches: Match[];
    groups: Group[];
    publicId?: string;
    winner?: Player;
    secondPlace?: Player;
    thirdPlace?: Player;
    createdAt?: any;
}

function TournamentContent() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventTypeId = searchParams.get('typeId');
    const eventTypeName = searchParams.get('typeName');
    const eventId = searchParams.get('eventId');

    const [eventData, setEventData] = useState<EventData | null>(null);
    const [tournament, setTournament] = useState<Tournament>({
        name: "",
        eventId: eventId || undefined,
        eventTypeId: eventTypeId || "",
        eventTypeName: eventTypeName || "",
        date: new Date(),
        status: 'setup',
        format: 'elimination',
        players: [],
        matches: [],
        groups: []
    });

    const [currentView, setCurrentView] = useState<'accueil' | 'players' | 'bracket' | 'results'>('accueil');
    const [newPlayerName, setNewPlayerName] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [message, setMessage] = useState("");

    // Load event data if eventId is provided
    useEffect(() => {
        const loadEventData = async () => {
            if (eventId) {
                try {
                    const eventDoc = await getDoc(doc(db, "events", eventId));
                    if (eventDoc.exists()) {
                        const data = eventDoc.data();
                        const eventInfo: EventData = {
                            id: eventDoc.id,
                            name: data.name,
                            date: data.date,
                            place: data.place,
                            imageUrl: data.imageUrl,
                            typeName: data.typeName,
                            typeEmoji: data.typeEmoji
                        };
                        setEventData(eventInfo);

                        // Pre-fill tournament data
                        const eventDate = data.date?.toDate?.() || new Date(data.date);
                        setTournament(prev => ({
                            ...prev,
                            name: data.name || "",
                            date: eventDate,
                            place: data.place || "",
                            imageUrl: data.imageUrl || "",
                            eventTypeName: data.typeName || eventTypeName || "",
                            eventTypeId: data.typeId || eventTypeId || ""
                        }));
                    }
                } catch (error) {
                    console.error("Erreur chargement événement:", error);
                }
            }
        };
        loadEventData();
    }, [eventId, eventTypeName, eventTypeId]);

    // Auth check
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

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

    // Search for registered users
    const searchUsers = async (searchTerm: string) => {
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            const results = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((u: any) =>
                    u.pseudo?.toLowerCase().includes(searchTerm.toLowerCase())
                );
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        }
    };

    // Add player to tournament
    const addPlayer = (player: Player) => {
        if (tournament.players.some(p => p.id === player.id)) {
            setMessage("❌ Ce joueur est déjà dans le tournoi");
            return;
        }

        setTournament({
            ...tournament,
            players: [...tournament.players, player]
        });
        setNewPlayerName("");
        setSearchResults([]);
        setMessage(`✅ ${player.name} ajouté au tournoi`);
    };

    // Add unregistered player
    const addUnregisteredPlayer = () => {
        if (!newPlayerName.trim()) return;

        const player: Player = {
            id: `unregistered_${Date.now()}`,
            name: newPlayerName.trim(),
            isRegistered: false
        };

        addPlayer(player);
    };

    // Remove player
    const removePlayer = (playerId: string) => {
        setTournament({
            ...tournament,
            players: tournament.players.filter(p => p.id !== playerId)
        });
        setMessage("✅ Joueur retiré");
    };

    // Generate groups for group stage
    const generateGroups = (players: Player[], groupCount: number): Group[] => {
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const groups: Group[] = [];

        for (let i = 0; i < groupCount; i++) {
            groups.push({
                id: `group_${i}`,
                name: `Poule ${String.fromCharCode(65 + i)}`,
                players: []
            });
        }

        shuffled.forEach((player, index) => {
            const groupIndex = index % groupCount;
            player.groupId = groups[groupIndex].id;
            player.groupPoints = 0;
            player.groupWins = 0;
            player.groupLosses = 0;
            groups[groupIndex].players.push(player);
        });

        return groups;
    };

    // Generate group stage matches
    const generateGroupMatches = (groups: Group[]): Match[] => {
        const matches: Match[] = [];
        let matchId = 0;

        groups.forEach(group => {
            // Round robin within each group
            for (let i = 0; i < group.players.length; i++) {
                for (let j = i + 1; j < group.players.length; j++) {
                    matches.push({
                        id: `match_${matchId}`,
                        round: 1,
                        matchNumber: matchId + 1,
                        player1: group.players[i],
                        player2: group.players[j],
                        phase: 'group',
                        groupId: group.id
                    });
                    matchId++;
                }
            }
        });

        return matches;
    };

    // Generate elimination bracket
    const generateEliminationBracket = (players: Player[]): Match[] => {
        const playerCount = players.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));

        const shuffledPlayers = [...players]
            .sort(() => Math.random() - 0.5)
            .map((p, i) => ({ ...p, seed: i + 1 }));

        const matches: Match[] = [];
        let matchId = 0;

        for (let i = 0; i < bracketSize / 2; i++) {
            const player1 = shuffledPlayers[i * 2];
            const player2 = shuffledPlayers[i * 2 + 1];

            matches.push({
                id: `match_${matchId}`,
                round: 1,
                matchNumber: i + 1,
                player1,
                player2,
                phase: 'knockout',
                nextMatchId: `match_${Math.floor(bracketSize / 2) + Math.floor(i / 2)}`
            });
            matchId++;
        }

        let currentRound = 2;
        let matchesInRound = bracketSize / 4;

        while (matchesInRound >= 1) {
            for (let i = 0; i < matchesInRound; i++) {
                matches.push({
                    id: `match_${matchId}`,
                    round: currentRound,
                    matchNumber: i + 1,
                    phase: 'knockout',
                    nextMatchId: matchesInRound > 1 ? `match_${matchId + matchesInRound + Math.floor(i / 2)}` : undefined
                });
                matchId++;
            }
            currentRound++;
            matchesInRound = matchesInRound / 2;
        }

        return matches;
    };

    // Generate tournament bracket
    const generateBracket = () => {
        const playerCount = tournament.players.length;

        if (playerCount < 2) {
            setMessage("❌ Il faut au moins 2 joueurs pour créer un tournoi");
            return;
        }

        if (tournament.format === 'groups' && playerCount < 4) {
            setMessage("❌ Il faut au moins 4 joueurs pour un tournoi avec poules");
            return;
        }

        let matches: Match[] = [];
        let groups: Group[] = [];

        if (tournament.format === 'groups') {
            // Calculate optimal number of groups (2-4 players per group)
            const groupCount = Math.max(2, Math.floor(playerCount / 3));
            groups = generateGroups(tournament.players, groupCount);
            matches = generateGroupMatches(groups);

            setTournament({
                ...tournament,
                groups,
                matches,
                status: 'ongoing'
            });
        } else {
            matches = generateEliminationBracket(tournament.players);
            setTournament({
                ...tournament,
                matches,
                status: 'ongoing'
            });
        }

        setCurrentView('bracket');
        setMessage("✅ Tournoi généré !");
    };

    // Update match score
    const updateMatchScore = (matchId: string, score1: number, score2: number) => {
        const match = tournament.matches.find(m => m.id === matchId);
        if (!match || !match.player1 || !match.player2) return;

        const winner = score1 > score2 ? match.player1 : match.player2;
        const loser = score1 > score2 ? match.player2 : match.player1;

        const updatedMatches = tournament.matches.map(m => {
            if (m.id === matchId) {
                return { ...m, score1, score2, winner };
            }
            if (m.phase === 'knockout' && m.id === match.nextMatchId) {
                if (!m.player1) {
                    return { ...m, player1: winner };
                } else if (!m.player2) {
                    return { ...m, player2: winner };
                }
            }
            return m;
        });

        // Update group standings if group phase
        let updatedPlayers = [...tournament.players];
        if (match.phase === 'group') {
            updatedPlayers = tournament.players.map(p => {
                if (p.id === winner.id) {
                    return {
                        ...p,
                        groupPoints: (p.groupPoints || 0) + 3,
                        groupWins: (p.groupWins || 0) + 1
                    };
                }
                if (p.id === loser.id) {
                    return {
                        ...p,
                        groupLosses: (p.groupLosses || 0) + 1
                    };
                }
                return p;
            });
        }

        setTournament({
            ...tournament,
            matches: updatedMatches,
            players: updatedPlayers
        });
    };

    // Generate knockout phase from group results
    const generateKnockoutFromGroups = () => {
        const groupMatches = tournament.matches.filter(m => m.phase === 'group');
        const allGroupMatchesComplete = groupMatches.every(m => m.winner);

        if (!allGroupMatchesComplete) {
            setMessage("❌ Tous les matchs de poule doivent être terminés");
            return;
        }

        // Get top 2 from each group
        const qualifiedPlayers: Player[] = [];
        tournament.groups.forEach(group => {
            const groupPlayers = tournament.players
                .filter(p => p.groupId === group.id)
                .sort((a, b) => (b.groupPoints || 0) - (a.groupPoints || 0));
            qualifiedPlayers.push(...groupPlayers.slice(0, 2));
        });

        const knockoutMatches = generateEliminationBracket(qualifiedPlayers);
        const newMatchIdOffset = tournament.matches.length;

        const adjustedKnockoutMatches = knockoutMatches.map((m, idx) => ({
            ...m,
            id: `match_${newMatchIdOffset + idx}`,
            nextMatchId: m.nextMatchId ? `match_${newMatchIdOffset + parseInt(m.nextMatchId.split('_')[1])}` : undefined
        }));

        setTournament({
            ...tournament,
            matches: [...tournament.matches, ...adjustedKnockoutMatches]
        });
        setMessage("✅ Phase éliminatoire générée !");
    };

    // Launch public tournament page
    const launchPublicTournament = async () => {
        try {
            const publicId = `public_${Date.now()}`;

            const tournamentData = {
                ...tournament,
                publicId,
                launchedAt: serverTimestamp()
            };

            const tournamentRef = await addDoc(collection(db, "tournaments"), tournamentData);

            setTournament({
                ...tournament,
                id: tournamentRef.id,
                publicId
            });

            setMessage(`✅ Tournoi lancé ! Page publique: /tournament/${publicId}`);

            // Open public page in new tab
            window.open(`/tournament/${publicId}`, '_blank');
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur lors du lancement du tournoi");
        }
    };

    // Complete tournament and save results
    const completeTournament = async () => {
        const knockoutMatches = tournament.matches.filter(m => m.phase === 'knockout');
        const finalMatch = knockoutMatches.find(m => !m.nextMatchId);

        if (!finalMatch || !finalMatch.winner) {
            setMessage("❌ Le tournoi n'est pas terminé");
            return;
        }

        const winner = finalMatch.winner;
        const secondPlace = finalMatch.player1?.id === winner.id ? finalMatch.player2 : finalMatch.player1;

        const semiFinals = knockoutMatches.filter(m => m.nextMatchId === finalMatch.id);
        const thirdPlaceCandidates = semiFinals
            .map(m => [m.player1, m.player2].find(p => p?.id !== winner.id && p?.id !== secondPlace?.id))
            .filter(p => p);
        const thirdPlace = thirdPlaceCandidates[0];

        try {
            const tournamentData = {
                ...tournament,
                winner,
                secondPlace,
                thirdPlace,
                status: 'completed' as const,
                completedAt: serverTimestamp()
            };

            let tournamentId = tournament.id;
            if (tournamentId) {
                await updateDoc(doc(db, "tournaments", tournamentId), tournamentData);
            } else {
                const tournamentRef = await addDoc(collection(db, "tournaments"), tournamentData);
                tournamentId = tournamentRef.id;
            }

            // Award points to registered winners
            const rewards = [
                { player: winner, points: 500, position: 1 },
                { player: secondPlace, points: 300, position: 2 },
                { player: thirdPlace, points: 150, position: 3 }
            ];

            for (const reward of rewards) {
                if (reward.player && reward.player.isRegistered && reward.player.userId) {
                    await updateDoc(doc(db, "users", reward.player.userId), {
                        balance: increment(reward.points),
                        wins: reward.position === 1 ? increment(1) : increment(0),
                        eventsCount: increment(1)
                    });

                    await addDoc(collection(db, "transactions"), {
                        userId: reward.player.userId,
                        amount: reward.points,
                        type: "EARN",
                        description: `${tournament.eventTypeName} - Position ${reward.position}`,
                        date: new Date().toISOString()
                    });
                }
            }

            // Update event if linked
            if (tournament.eventId) {
                await updateDoc(doc(db, "events", tournament.eventId), {
                    winner: winner.name,
                    secondPlace: secondPlace?.name,
                    winnerPoints: 500,
                    secondPlacePoints: 300,
                    status: "completed",
                    tournamentId,
                    completedAt: serverTimestamp()
                });
            }

            setMessage("✅ Tournoi terminé et résultats enregistrés !");
            setCurrentView('results');
            setTournament({
                ...tournamentData,
                id: tournamentId
            });

        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur lors de l'enregistrement des résultats");
        }
    };

    const getMatchesByRound = (round: number) => {
        return tournament.matches.filter(m => m.round === round && m.phase === 'knockout');
    };

    const getGroupMatches = (groupId: string) => {
        return tournament.matches.filter(m => m.phase === 'group' && m.groupId === groupId);
    };

    const knockoutMatches = tournament.matches.filter(m => m.phase === 'knockout');
    const totalKnockoutRounds = knockoutMatches.length > 0
        ? Math.max(...knockoutMatches.map(m => m.round))
        : 0;

    const allGroupMatchesComplete = tournament.matches
        .filter(m => m.phase === 'group')
        .every(m => m.winner);

    return (
        <div className="min-h-screen bg-[#FFC845] p-4">
            {/* Header compact */}
            <div className="max-w-4xl mx-auto mb-6">
                <button
                    onClick={() => router.push('/admin')}
                    className="neo-btn bg-white mb-4 flex items-center gap-2 text-sm"
                >
                    <ArrowLeft size={16} />
                    RETOUR
                </button>

                {/* Event Card */}
                <div className="neo-card bg-black text-white overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Event Image */}
                        {(eventData?.imageUrl || tournament.imageUrl) && (
                            <div className="w-full md:w-48 h-32 md:h-auto border-2 border-yellow-400 overflow-hidden flex-shrink-0">
                                <img
                                    src={eventData?.imageUrl || tournament.imageUrl}
                                    alt={tournament.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Event Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Trophy size={24} className="text-yellow-400" />
                                <span className="text-yellow-400 font-bold text-sm uppercase">
                                    {eventData?.typeEmoji} {tournament.eventTypeName}
                                </span>
                            </div>
                            <h1 className="text-xl md:text-2xl font-black uppercase mb-2">
                                {tournament.name || "Nouveau Tournoi"}
                            </h1>
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                    <Calendar size={14} />
                                    <span>{tournament.date.toLocaleDateString('fr-FR')}</span>
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

                    {message && (
                        <div className={`mt-4 p-2 font-bold text-sm border-2 ${message.includes('✅') ? 'bg-green-400 border-green-600 text-black' : 'bg-red-400 border-red-600 text-white'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setCurrentView('accueil')}
                        className={`neo-btn text-sm ${currentView === 'accueil' ? 'bg-black text-white' : 'bg-white'}`}
                    >
                        🏠 ACCUEIL
                    </button>
                    <button
                        onClick={() => setCurrentView('players')}
                        className={`neo-btn text-sm ${currentView === 'players' ? 'bg-black text-white' : 'bg-white'}`}
                    >
                        👥 JOUEURS ({tournament.players.length})
                    </button>
                    <button
                        onClick={() => setCurrentView('bracket')}
                        disabled={tournament.matches.length === 0}
                        className={`neo-btn text-sm ${currentView === 'bracket' ? 'bg-black text-white' : 'bg-white'} ${tournament.matches.length === 0 ? 'opacity-50' : ''}`}
                    >
                        🏆 MATCHS
                    </button>
                    {tournament.status === 'completed' && (
                        <button
                            onClick={() => setCurrentView('results')}
                            className={`neo-btn text-sm ${currentView === 'results' ? 'bg-black text-white' : 'bg-white'}`}
                        >
                            🏅 RÉSULTATS
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto">
                {/* ACCUEIL VIEW */}
                {currentView === 'accueil' && (
                    <div className="space-y-4">
                        <div className="neo-card">
                            <h2 className="text-xl font-black uppercase mb-4">⚙️ Configuration</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 text-sm uppercase">Nom du Tournoi</label>
                                    <input
                                        type="text"
                                        className="neo-input w-full"
                                        value={tournament.name}
                                        onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                                        placeholder="Ex: Championship 2025"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold mb-1 text-sm uppercase">Date</label>
                                        <input
                                            type="datetime-local"
                                            className="neo-input w-full"
                                            value={tournament.date.toISOString().slice(0, 16)}
                                            onChange={(e) => setTournament({ ...tournament, date: new Date(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold mb-1 text-sm uppercase">Lieu</label>
                                        <input
                                            type="text"
                                            className="neo-input w-full"
                                            value={tournament.place || ""}
                                            onChange={(e) => setTournament({ ...tournament, place: e.target.value })}
                                            placeholder="Ex: Bar Le Pixel"
                                        />
                                    </div>
                                </div>

                                {/* Format Selection */}
                                <div>
                                    <label className="block font-bold mb-2 text-sm uppercase">Format du Tournoi</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => setTournament({ ...tournament, format: 'elimination' })}
                                            className={`p-4 border-4 ${tournament.format === 'elimination' ? 'border-green-500 bg-green-50' : 'border-black bg-white'} text-left`}
                                        >
                                            <div className="text-2xl mb-2">⚔️</div>
                                            <div className="font-black uppercase">Élimination Directe</div>
                                            <div className="text-xs text-gray-600">Match perdu = éliminé</div>
                                        </button>
                                        <button
                                            onClick={() => setTournament({ ...tournament, format: 'groups' })}
                                            className={`p-4 border-4 ${tournament.format === 'groups' ? 'border-green-500 bg-green-50' : 'border-black bg-white'} text-left`}
                                        >
                                            <div className="text-2xl mb-2">🏟️</div>
                                            <div className="font-black uppercase">Poules + Play-offs</div>
                                            <div className="text-xs text-gray-600">Phase de groupes puis élimination</div>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-yellow-100 border-2 border-black">
                                    <p className="font-bold text-sm">
                                        👉 Ajoutez des joueurs dans l'onglet JOUEURS puis générez le tournoi !
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PLAYERS VIEW */}
                {currentView === 'players' && (
                    <div className="space-y-4">
                        <div className="neo-card">
                            <h2 className="text-xl font-black uppercase mb-4">👥 Ajouter des Joueurs</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block font-bold mb-1 text-sm uppercase">
                                        Rechercher un joueur inscrit
                                    </label>
                                    <input
                                        type="text"
                                        className="neo-input w-full"
                                        placeholder="Tapez le pseudo..."
                                        onChange={(e) => searchUsers(e.target.value)}
                                    />

                                    {searchResults.length > 0 && (
                                        <div className="mt-2 border-2 border-black bg-white max-h-40 overflow-y-auto">
                                            {searchResults.map((user: any) => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => addPlayer({
                                                        id: user.id,
                                                        name: user.pseudo,
                                                        isRegistered: true,
                                                        userId: user.id
                                                    })}
                                                    className="w-full p-2 hover:bg-yellow-100 text-left font-bold border-b border-black last:border-b-0 text-sm"
                                                >
                                                    {user.pseudo} <span className="text-xs text-gray-600">(Inscrit)</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t-2 border-black pt-4">
                                    <label className="block font-bold mb-1 text-sm uppercase">
                                        Ou ajouter un joueur non inscrit
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="neo-input flex-1"
                                            placeholder="Nom du joueur..."
                                            value={newPlayerName}
                                            onChange={(e) => setNewPlayerName(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addUnregisteredPlayer()}
                                        />
                                        <button
                                            onClick={addUnregisteredPlayer}
                                            className="neo-btn bg-green-400 hover:bg-green-300"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Players List */}
                        <div className="neo-card">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h2 className="text-xl font-black uppercase">
                                    Participants ({tournament.players.length})
                                </h2>
                                {tournament.players.length >= 2 && tournament.matches.length === 0 && (
                                    <button
                                        onClick={generateBracket}
                                        className="neo-btn bg-green-400 hover:bg-green-300 text-sm"
                                    >
                                        🎯 GÉNÉRER LE TOURNOI
                                    </button>
                                )}
                            </div>

                            {tournament.players.length === 0 ? (
                                <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-black">
                                    <p className="font-bold text-gray-600">Aucun joueur ajouté</p>
                                </div>
                            ) : (
                                <div className="grid gap-2 grid-cols-2 md:grid-cols-3">
                                    {tournament.players.map((player) => (
                                        <div
                                            key={player.id}
                                            className="flex items-center justify-between p-2 bg-white border-2 border-black"
                                        >
                                            <div>
                                                <div className="font-black text-sm">{player.name}</div>
                                                <div className="text-xs text-gray-600">
                                                    {player.isRegistered ? '✅ Inscrit' : '👤 Invité'}
                                                </div>
                                            </div>
                                            {tournament.matches.length === 0 && (
                                                <button
                                                    onClick={() => removePlayer(player.id)}
                                                    className="text-red-500 font-bold text-xs"
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* BRACKET VIEW */}
                {currentView === 'bracket' && (
                    <div className="space-y-4">
                        {/* Actions */}
                        <div className="neo-card bg-purple-100">
                            <div className="flex flex-wrap gap-2 items-center justify-between">
                                <div className="flex gap-2 flex-wrap">
                                    {!tournament.publicId && tournament.status === 'ongoing' && (
                                        <button
                                            onClick={launchPublicTournament}
                                            className="neo-btn bg-blue-400 hover:bg-blue-300 text-sm"
                                        >
                                            <Globe size={16} className="inline mr-1" />
                                            LANCER PAGE PUBLIQUE
                                        </button>
                                    )}
                                    {tournament.publicId && (
                                        <button
                                            onClick={() => window.open(`/tournament/${tournament.publicId}`, '_blank')}
                                            className="neo-btn bg-blue-200 text-sm"
                                        >
                                            🔗 VOIR PAGE PUBLIQUE
                                        </button>
                                    )}
                                </div>
                                {tournament.status === 'ongoing' && knockoutMatches.length > 0 && (
                                    <button
                                        onClick={completeTournament}
                                        className="neo-btn bg-green-400 hover:bg-green-300 text-sm"
                                    >
                                        <Save size={16} className="inline mr-1" />
                                        TERMINER LE TOURNOI
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Group Stage */}
                        {tournament.format === 'groups' && tournament.groups.length > 0 && (
                            <div className="neo-card">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black uppercase">🏟️ Phase de Poules</h2>
                                    {allGroupMatchesComplete && knockoutMatches.length === 0 && (
                                        <button
                                            onClick={generateKnockoutFromGroups}
                                            className="neo-btn bg-green-400 hover:bg-green-300 text-sm"
                                        >
                                            ➡️ GÉNÉRER PLAY-OFFS
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {tournament.groups.map(group => (
                                        <div key={group.id} className="border-2 border-black p-3 bg-white">
                                            <h3 className="font-black text-lg mb-2 bg-black text-white p-2 -m-3 mb-3">
                                                {group.name}
                                            </h3>

                                            {/* Standings */}
                                            <div className="mb-3">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b-2 border-black">
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
                                                                <tr key={player.id} className={idx < 2 ? 'bg-green-50' : ''}>
                                                                    <td className="p-1 font-bold">{player.name}</td>
                                                                    <td className="text-center p-1">{player.groupWins || 0}</td>
                                                                    <td className="text-center p-1">{player.groupLosses || 0}</td>
                                                                    <td className="text-center p-1 font-black">{player.groupPoints || 0}</td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Group Matches */}
                                            <div className="space-y-2">
                                                {getGroupMatches(group.id).map(match => (
                                                    <div key={match.id} className="p-2 bg-gray-50 border border-black text-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className={match.winner?.id === match.player1?.id ? 'font-black text-green-600' : ''}>
                                                                {match.player1?.name}
                                                            </span>
                                                            <div className="flex gap-1 items-center">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-10 p-1 border border-black text-center text-xs"
                                                                    value={match.score1 ?? ''}
                                                                    onChange={(e) => {
                                                                        const s1 = parseInt(e.target.value) || 0;
                                                                        const s2 = match.score2 || 0;
                                                                        if (s1 !== s2) updateMatchScore(match.id, s1, s2);
                                                                    }}
                                                                    disabled={!!match.winner}
                                                                />
                                                                <span>-</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-10 p-1 border border-black text-center text-xs"
                                                                    value={match.score2 ?? ''}
                                                                    onChange={(e) => {
                                                                        const s1 = match.score1 || 0;
                                                                        const s2 = parseInt(e.target.value) || 0;
                                                                        if (s1 !== s2) updateMatchScore(match.id, s1, s2);
                                                                    }}
                                                                    disabled={!!match.winner}
                                                                />
                                                            </div>
                                                            <span className={match.winner?.id === match.player2?.id ? 'font-black text-green-600' : ''}>
                                                                {match.player2?.name}
                                                            </span>
                                                        </div>
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
                                    {Array.from({ length: totalKnockoutRounds }, (_, i) => i + 1).map(round => (
                                        <div key={round}>
                                            <h3 className="text-lg font-black uppercase mb-3 bg-black text-white p-2">
                                                {round === totalKnockoutRounds ? '🏆 FINALE' :
                                                    round === totalKnockoutRounds - 1 ? '🥇 DEMI-FINALES' :
                                                        round === totalKnockoutRounds - 2 ? '🎯 QUARTS' :
                                                            `ROUND ${round}`}
                                            </h3>

                                            <div className="grid gap-3 md:grid-cols-2">
                                                {getMatchesByRound(round).map(match => (
                                                    <div key={match.id} className="p-3 bg-white border-2 border-black">
                                                        <div className="text-xs text-gray-600 mb-2">Match #{match.matchNumber}</div>

                                                        {/* Player 1 */}
                                                        <div className={`flex justify-between items-center p-2 mb-1 border-2 ${match.winner?.id === match.player1?.id ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                                            <span className="font-bold text-sm">{match.player1?.name || 'TBD'}</span>
                                                            {match.player1 && (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-12 p-1 border-2 border-black text-center text-sm font-black"
                                                                    value={match.score1 ?? ''}
                                                                    onChange={(e) => {
                                                                        const s1 = parseInt(e.target.value) || 0;
                                                                        if (match.score2 !== undefined && s1 !== match.score2) {
                                                                            updateMatchScore(match.id, s1, match.score2);
                                                                        }
                                                                    }}
                                                                    disabled={!!match.winner}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="text-center text-xs font-black">VS</div>

                                                        {/* Player 2 */}
                                                        <div className={`flex justify-between items-center p-2 mt-1 border-2 ${match.winner?.id === match.player2?.id ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                                            <span className="font-bold text-sm">{match.player2?.name || 'TBD'}</span>
                                                            {match.player2 && (
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    className="w-12 p-1 border-2 border-black text-center text-sm font-black"
                                                                    value={match.score2 ?? ''}
                                                                    onChange={(e) => {
                                                                        const s2 = parseInt(e.target.value) || 0;
                                                                        if (match.score1 !== undefined && match.score1 !== s2) {
                                                                            updateMatchScore(match.id, match.score1, s2);
                                                                        }
                                                                    }}
                                                                    disabled={!!match.winner}
                                                                />
                                                            )}
                                                        </div>

                                                        {match.winner && (
                                                            <div className="text-center text-xs font-black text-green-600 mt-2">
                                                                ✅ {match.winner.name}
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
                    </div>
                )}

                {/* RESULTS VIEW */}
                {currentView === 'results' && tournament.winner && (
                    <div className="space-y-4">
                        <div className="neo-card bg-gradient-to-br from-yellow-400 to-yellow-600 text-black text-center">
                            <Trophy size={60} className="mx-auto mb-2" />
                            <h2 className="text-3xl font-black uppercase mb-1">CHAMPION</h2>
                            <p className="text-4xl font-black mb-2">{tournament.winner.name}</p>
                            {tournament.winner.isRegistered && (
                                <p className="text-lg font-bold">+500 TC 🎉</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {tournament.secondPlace && (
                                <div className="neo-card bg-gray-200 text-center">
                                    <Medal size={40} className="mx-auto mb-1 text-gray-600" />
                                    <h3 className="text-lg font-black uppercase">2ème</h3>
                                    <p className="text-xl font-black">{tournament.secondPlace.name}</p>
                                    {tournament.secondPlace.isRegistered && (
                                        <p className="text-sm font-bold">+300 TC</p>
                                    )}
                                </div>
                            )}

                            {tournament.thirdPlace && (
                                <div className="neo-card bg-orange-200 text-center">
                                    <Award size={40} className="mx-auto mb-1 text-orange-600" />
                                    <h3 className="text-lg font-black uppercase">3ème</h3>
                                    <p className="text-xl font-black">{tournament.thirdPlace.name}</p>
                                    {tournament.thirdPlace.isRegistered && (
                                        <p className="text-sm font-bold">+150 TC</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="neo-card">
                            <h3 className="text-lg font-black uppercase mb-3">📊 Stats</h3>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-3 bg-gray-50 border-2 border-black">
                                    <div className="text-2xl font-black">{tournament.players.length}</div>
                                    <div className="text-xs font-bold uppercase">Joueurs</div>
                                </div>
                                <div className="p-3 bg-gray-50 border-2 border-black">
                                    <div className="text-2xl font-black">{tournament.matches.length}</div>
                                    <div className="text-xs font-bold uppercase">Matchs</div>
                                </div>
                                <div className="p-3 bg-gray-50 border-2 border-black">
                                    <div className="text-2xl font-black">{tournament.groups.length || '-'}</div>
                                    <div className="text-xs font-bold uppercase">Poules</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function TournamentManager() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">CHARGEMENT...</div>}>
            <TournamentContent />
        </Suspense>
    );
}
