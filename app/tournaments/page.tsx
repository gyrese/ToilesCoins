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
    setDoc,
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

// Helper function to remove undefined values recursively (Firestore doesn't accept undefined)
const cleanForFirestore = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
        return obj.map(item => cleanForFirestore(item));
    }
    if (typeof obj === 'object' && !(obj instanceof Date)) {
        const cleaned: any = {};
        for (const key in obj) {
            if (obj[key] !== undefined) {
                cleaned[key] = cleanForFirestore(obj[key]);
            }
        }
        return cleaned;
    }
    return obj;
};

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
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Load existing tournament or event data
    useEffect(() => {
        const loadData = async () => {
            if (!eventId) {
                setIsLoading(false);
                return;
            }

            try {
                // First, check if a tournament already exists for this event
                const tournamentsQuery = query(
                    collection(db, "tournaments"),
                    where("eventId", "==", eventId)
                );
                const tournamentsSnapshot = await getDocs(tournamentsQuery);

                if (!tournamentsSnapshot.empty) {
                    // Load existing tournament
                    const tournamentDoc = tournamentsSnapshot.docs[0];
                    const data = tournamentDoc.data();

                    setTournament({
                        id: tournamentDoc.id,
                        name: data.name || "",
                        eventId: data.eventId,
                        eventTypeId: data.eventTypeId || "",
                        eventTypeName: data.eventTypeName || "",
                        date: data.date?.toDate?.() || new Date(data.date) || new Date(),
                        place: data.place,
                        imageUrl: data.imageUrl,
                        status: data.status || 'setup',
                        format: data.format || 'elimination',
                        players: data.players || [],
                        matches: data.matches || [],
                        groups: data.groups || [],
                        publicId: data.publicId,
                        winner: data.winner,
                        secondPlace: data.secondPlace,
                        thirdPlace: data.thirdPlace
                    });

                    // Also load event data for display
                    const eventDoc = await getDoc(doc(db, "events", eventId));
                    if (eventDoc.exists()) {
                        const eventDocData = eventDoc.data();
                        setEventData({
                            id: eventDoc.id,
                            name: eventDocData.name,
                            date: eventDocData.date,
                            place: eventDocData.place,
                            imageUrl: eventDocData.imageUrl,
                            typeName: eventDocData.typeName,
                            typeEmoji: eventDocData.typeEmoji
                        });
                    }

                    setMessage("✅ Tournoi chargé");
                } else {
                    // No existing tournament, load event data to create new one
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
                }
            } catch (error) {
                console.error("Erreur chargement données:", error);
                setMessage("❌ Erreur de chargement");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [eventId, eventTypeName, eventTypeId]);

    // Auth check
    useEffect(() => {
        if (!loading && !user) router.push("/login");
    }, [user, loading, router]);

    // Auto-save tournament to Firestore when data changes
    useEffect(() => {
        // Don't save during initial loading or if no eventId
        if (isLoading || !eventId || !tournament.name) return;

        const saveTimeout = setTimeout(async () => {
            try {
                setIsSaving(true);

                // Clean all data to remove undefined values (Firestore doesn't accept undefined)
                const tournamentData = cleanForFirestore({
                    name: tournament.name,
                    eventId: eventId,
                    eventTypeId: tournament.eventTypeId || "",
                    eventTypeName: tournament.eventTypeName || "",
                    date: tournament.date,
                    place: tournament.place || "",
                    imageUrl: tournament.imageUrl || "",
                    status: tournament.status,
                    format: tournament.format,
                    players: tournament.players || [],
                    matches: tournament.matches || [],
                    groups: tournament.groups || [],
                    publicId: tournament.publicId || null,
                    winner: tournament.winner || null,
                    secondPlace: tournament.secondPlace || null,
                    thirdPlace: tournament.thirdPlace || null,
                    updatedAt: serverTimestamp()
                });

                if (tournament.id) {
                    // Update existing tournament
                    await updateDoc(doc(db, "tournaments", tournament.id), tournamentData);
                    console.log("Tournament updated:", tournament.id);
                } else {
                    // Create new tournament
                    const docRef = await addDoc(collection(db, "tournaments"), {
                        ...tournamentData,
                        createdAt: serverTimestamp()
                    });
                    console.log("Tournament created:", docRef.id);
                    // Update local state with the new ID (without triggering another save)
                    setTournament(prev => ({ ...prev, id: docRef.id }));
                }

                setMessage("✅ Sauvegardé");
                // Clear message after 2 seconds
                setTimeout(() => setMessage(""), 2000);
            } catch (error) {
                console.error("Erreur sauvegarde automatique:", error);
                setMessage("❌ Erreur de sauvegarde - " + (error as Error).message);
            } finally {
                setIsSaving(false);
            }
        }, 1000); // Debounce 1 second

        return () => clearTimeout(saveTimeout);
    }, [tournament.name, tournament.players, tournament.matches, tournament.groups, tournament.format, tournament.status, eventId, isLoading]);

    if (loading || isLoading || (user && !userData)) {
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

    // Manual save function
    const saveTournament = async () => {
        if (!eventId || !tournament.name) {
            setMessage("❌ Impossible de sauvegarder - données manquantes");
            return;
        }

        try {
            setIsSaving(true);

            // Clean all data to remove undefined values
            const tournamentData = cleanForFirestore({
                name: tournament.name,
                eventId: eventId,
                eventTypeId: tournament.eventTypeId || "",
                eventTypeName: tournament.eventTypeName || "",
                date: tournament.date,
                place: tournament.place || "",
                imageUrl: tournament.imageUrl || "",
                status: tournament.status,
                format: tournament.format,
                players: tournament.players || [],
                matches: tournament.matches || [],
                groups: tournament.groups || [],
                publicId: tournament.publicId || null,
                winner: tournament.winner || null,
                secondPlace: tournament.secondPlace || null,
                thirdPlace: tournament.thirdPlace || null,
                updatedAt: serverTimestamp()
            });

            if (tournament.id) {
                await updateDoc(doc(db, "tournaments", tournament.id), tournamentData);
                setMessage("✅ Tournoi sauvegardé !");
            } else {
                const docRef = await addDoc(collection(db, "tournaments"), {
                    ...tournamentData,
                    createdAt: serverTimestamp()
                });
                setTournament(prev => ({ ...prev, id: docRef.id }));
                setMessage("✅ Tournoi créé et sauvegardé !");
            }
        } catch (error) {
            console.error("Erreur sauvegarde:", error);
            setMessage("❌ Erreur: " + (error as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

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

    // Generate elimination bracket with proper seeding
    const generateEliminationBracket = (players: Player[]): Match[] => {
        const playerCount = players.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
        const numByes = bracketSize - playerCount;

        // Shuffle and assign seeds
        const shuffledPlayers = [...players]
            .sort(() => Math.random() - 0.5)
            .map((p, i) => ({ ...p, seed: i + 1 }));

        // Create bracket positions using standard seeding
        // For an 8-player bracket: 1v8, 4v5, 3v6, 2v7
        // This ensures top seeds get byes
        const getSeedingOrder = (size: number): number[][] => {
            if (size === 2) return [[1, 2]];
            const smaller = getSeedingOrder(size / 2);
            const result: number[][] = [];
            smaller.forEach(pair => {
                result.push([pair[0], size + 1 - pair[0]]);
                result.push([pair[1], size + 1 - pair[1]]);
            });
            return result;
        };

        const seedingOrder = getSeedingOrder(bracketSize);

        // Get player by seed (or undefined for bye)
        const getPlayerBySeed = (seed: number): Player | undefined => {
            return shuffledPlayers.find(p => p.seed === seed);
        };

        const matches: Match[] = [];
        let matchId = 0;

        // Generate first round matches with proper seeding
        for (let i = 0; i < bracketSize / 2; i++) {
            const [seed1, seed2] = seedingOrder[i];
            const player1 = getPlayerBySeed(seed1);
            const player2 = getPlayerBySeed(seed2);

            const match: Match = {
                id: `match_${matchId}`,
                round: 1,
                matchNumber: i + 1,
                player1,
                player2,
                phase: 'knockout',
                nextMatchId: `match_${Math.floor(bracketSize / 2) + Math.floor(i / 2)}`
            };

            // Handle byes - player with opponent as bye wins automatically
            if (player1 && !player2) {
                match.winner = player1;
                match.score1 = 1;
                match.score2 = 0;
            } else if (!player1 && player2) {
                match.winner = player2;
                match.score1 = 0;
                match.score2 = 1;
            }
            // Note: with proper seeding, we should never have bye vs bye

            matches.push(match);
            matchId++;
        }

        // Generate subsequent rounds
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

        // Propagate bye winners and handle cascading byes
        const propagateByeWinners = () => {
            let changed = true;
            while (changed) {
                changed = false;

                // Find all matches with a winner that hasn't been propagated yet
                const completedMatches = matches.filter(m => m.winner && m.nextMatchId);

                completedMatches.forEach(completedMatch => {
                    if (!completedMatch.nextMatchId || !completedMatch.winner) return;

                    const nextMatch = matches.find(m => m.id === completedMatch.nextMatchId);
                    if (!nextMatch) return;

                    // Check if winner needs to be added to next match
                    const winnerInNextMatch =
                        nextMatch.player1?.id === completedMatch.winner.id ||
                        nextMatch.player2?.id === completedMatch.winner.id;

                    if (!winnerInNextMatch) {
                        if (!nextMatch.player1) {
                            nextMatch.player1 = completedMatch.winner;
                            changed = true;
                        } else if (!nextMatch.player2) {
                            nextMatch.player2 = completedMatch.winner;
                            changed = true;
                        }
                    }
                });

                // Check for new auto-wins (one player vs no player)
                matches.forEach(match => {
                    if (!match.winner && match.player1 && !match.player2) {
                        // Player 1 wins by default (bye)
                        match.winner = match.player1;
                        match.score1 = 1;
                        match.score2 = 0;
                        changed = true;
                    } else if (!match.winner && !match.player1 && match.player2) {
                        // Player 2 wins by default (bye)
                        match.winner = match.player2;
                        match.score1 = 0;
                        match.score2 = 1;
                        changed = true;
                    }
                });
            }
        };

        propagateByeWinners();

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

    // Update match score - handles score modifications with recalculation
    const updateMatchScore = (matchId: string, score1: number, score2: number) => {
        const match = tournament.matches.find(m => m.id === matchId);
        if (!match || !match.player1 || !match.player2) return;

        // Handle tie - no winner yet
        if (score1 === score2) {
            // Just update scores without declaring winner
            const updatedMatches = tournament.matches.map(m => {
                if (m.id === matchId) {
                    return { ...m, score1, score2, winner: undefined };
                }
                return m;
            });

            // If there was a previous winner, revert their stats
            let updatedPlayers = [...tournament.players];
            if (match.phase === 'group' && match.winner) {
                const oldWinner = match.winner;
                const oldLoser = match.player1.id === oldWinner.id ? match.player2 : match.player1;

                updatedPlayers = updatedPlayers.map(p => {
                    if (p.id === oldWinner.id) {
                        return {
                            ...p,
                            groupPoints: Math.max(0, (p.groupPoints || 0) - 3),
                            groupWins: Math.max(0, (p.groupWins || 0) - 1)
                        };
                    }
                    if (p.id === oldLoser.id) {
                        return {
                            ...p,
                            groupLosses: Math.max(0, (p.groupLosses || 0) - 1)
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
            return;
        }

        const newWinner = score1 > score2 ? match.player1 : match.player2;
        const newLoser = score1 > score2 ? match.player2 : match.player1;
        const oldWinner = match.winner;

        // For knockout phase, we need to cascade the change to subsequent matches
        let updatedMatches = [...tournament.matches];

        // First update the current match
        updatedMatches = updatedMatches.map(m => {
            if (m.id === matchId) {
                return { ...m, score1, score2, winner: newWinner };
            }
            return m;
        });

        // Handle knockout bracket cascade
        if (match.phase === 'knockout' && match.nextMatchId) {
            // Helper function to reset a match and cascade to its children
            const resetMatchCascade = (matchIdToReset: string, oldPlayerId: string) => {
                const matchToReset = updatedMatches.find(m => m.id === matchIdToReset);
                if (!matchToReset) return;

                // Check if the old player is in this match
                const wasPlayer1 = matchToReset.player1?.id === oldPlayerId;
                const wasPlayer2 = matchToReset.player2?.id === oldPlayerId;

                if (wasPlayer1 || wasPlayer2) {
                    // Reset this match
                    updatedMatches = updatedMatches.map(m => {
                        if (m.id === matchIdToReset) {
                            return {
                                ...m,
                                player1: wasPlayer1 ? newWinner : m.player1,
                                player2: wasPlayer2 ? newWinner : m.player2,
                                score1: undefined,
                                score2: undefined,
                                winner: undefined
                            };
                        }
                        return m;
                    });

                    // Cascade to next match if this match had a winner that moved forward
                    if (matchToReset.winner && matchToReset.nextMatchId) {
                        resetMatchCascade(matchToReset.nextMatchId, matchToReset.winner.id);
                    }
                }
            };

            if (oldWinner) {
                // The winner changed, we need to update downstream matches
                resetMatchCascade(match.nextMatchId, oldWinner.id);
            } else {
                // First time setting winner, just add to next match
                updatedMatches = updatedMatches.map(m => {
                    if (m.id === match.nextMatchId) {
                        // Check if player1 slot is empty or TBD
                        if (!m.player1 || m.player1.name === 'TBD') {
                            return { ...m, player1: newWinner };
                        } else if (!m.player2 || m.player2.name === 'TBD') {
                            return { ...m, player2: newWinner };
                        }
                    }
                    return m;
                });
            }
        }

        // Update group standings if group phase
        let updatedPlayers = [...tournament.players];
        if (match.phase === 'group') {
            // First, revert old winner/loser stats if there was a previous result
            if (oldWinner) {
                const oldLoser = match.player1.id === oldWinner.id ? match.player2 : match.player1;
                updatedPlayers = updatedPlayers.map(p => {
                    if (p.id === oldWinner.id) {
                        return {
                            ...p,
                            groupPoints: Math.max(0, (p.groupPoints || 0) - 3),
                            groupWins: Math.max(0, (p.groupWins || 0) - 1)
                        };
                    }
                    if (p.id === oldLoser.id) {
                        return {
                            ...p,
                            groupLosses: Math.max(0, (p.groupLosses || 0) - 1)
                        };
                    }
                    return p;
                });
            }

            // Then apply new winner/loser stats
            updatedPlayers = updatedPlayers.map(p => {
                if (p.id === newWinner.id) {
                    return {
                        ...p,
                        groupPoints: (p.groupPoints || 0) + 3,
                        groupWins: (p.groupWins || 0) + 1
                    };
                }
                if (p.id === newLoser.id) {
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

            const tournamentData = cleanForFirestore({
                ...tournament,
                publicId,
                launchedAt: serverTimestamp()
            });

            let tournamentId = tournament.id;

            if (tournamentId) {
                // Update existing tournament
                await updateDoc(doc(db, "tournaments", tournamentId), tournamentData);
            } else {
                // Create new tournament if doesn't exist
                const tournamentRef = await addDoc(collection(db, "tournaments"), {
                    ...tournamentData,
                    createdAt: serverTimestamp()
                });
                tournamentId = tournamentRef.id;
            }

            setTournament({
                ...tournament,
                id: tournamentId,
                publicId
            });

            setMessage(`✅ Tournoi lancé ! Page publique: /tournament/${publicId}`);

            // Open public page in new tab
            window.open(`/tournament/${publicId}`, '_blank');
        } catch (error) {
            console.error(error);
            setMessage("❌ Erreur lors du lancement du tournoi - " + (error as Error).message);
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

    // Recalculate all scores and stats from matches
    const recalculateAllScores = () => {
        const groupMatches = tournament.matches.filter(m => m.phase === 'group');

        // Reset all player group stats
        let updatedPlayers = tournament.players.map(p => ({
            ...p,
            groupPoints: 0,
            groupWins: 0,
            groupLosses: 0
        }));

        // Recalculate from all group matches
        groupMatches.forEach(match => {
            if (match.winner && match.score1 !== undefined && match.score2 !== undefined) {
                const winnerId = match.winner.id;
                const loserId = match.player1?.id === winnerId ? match.player2?.id : match.player1?.id;

                // Check for tie (both get 1 point)
                if (match.score1 === match.score2) {
                    updatedPlayers = updatedPlayers.map(p => {
                        if (p.id === match.player1?.id || p.id === match.player2?.id) {
                            return {
                                ...p,
                                groupPoints: (p.groupPoints || 0) + 1
                            };
                        }
                        return p;
                    });
                } else {
                    // Winner gets 3 points
                    updatedPlayers = updatedPlayers.map(p => {
                        if (p.id === winnerId) {
                            return {
                                ...p,
                                groupPoints: (p.groupPoints || 0) + 3,
                                groupWins: (p.groupWins || 0) + 1
                            };
                        }
                        if (p.id === loserId) {
                            return {
                                ...p,
                                groupLosses: (p.groupLosses || 0) + 1
                            };
                        }
                        return p;
                    });
                }
            }
        });

        // For knockout matches, ensure winners are propagated correctly
        let updatedMatches = [...tournament.matches];

        // Sort knockout matches by round to process in order (lowest round first)
        const knockoutMatches = updatedMatches
            .filter(m => m.phase === 'knockout')
            .sort((a, b) => a.round - b.round);

        // Process each knockout match and propagate winner to next match
        knockoutMatches.forEach(match => {
            if (match.winner && match.nextMatchId) {
                const winnerId = match.winner.id;
                const winner = match.winner;

                updatedMatches = updatedMatches.map(m => {
                    if (m.id === match.nextMatchId) {
                        // Determine which slot this winner should go to based on match number
                        // Even match numbers go to player1, odd go to player2
                        const isEvenMatch = match.matchNumber % 2 === 0;

                        // Check if winner is already correctly placed
                        if (m.player1?.id === winnerId || m.player2?.id === winnerId) {
                            return m;
                        }

                        // Place winner in the appropriate slot
                        if (!m.player1 || m.player1.name === 'TBD') {
                            return { ...m, player1: winner };
                        } else if (!m.player2 || m.player2.name === 'TBD') {
                            return { ...m, player2: winner };
                        } else {
                            // Both slots filled - replace based on match number
                            if (isEvenMatch) {
                                return { ...m, player1: winner };
                            } else {
                                return { ...m, player2: winner };
                            }
                        }
                    }
                    return m;
                });
            }
        });

        setTournament({
            ...tournament,
            players: updatedPlayers,
            matches: updatedMatches
        });

        setMessage("✅ Scores et qualifiés recalculés !");
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
            <div className="max-w-2xl mx-auto mb-6">
                <button
                    onClick={() => router.push('/admin')}
                    className="neo-btn bg-white text-black mb-4 flex items-center gap-2 text-sm font-bold"
                >
                    <ArrowLeft size={16} />
                    RETOUR
                </button>

                {/* Event Card - Compact */}
                <div className="neo-card bg-black text-white overflow-hidden p-3">
                    <div className="flex items-center gap-4">
                        {/* Event Image - Compact */}
                        {(eventData?.imageUrl || tournament.imageUrl) && (
                            <div className="w-20 h-20 border-2 border-yellow-400 overflow-hidden flex-shrink-0 rounded">
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
                                {isSaving && (
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Save size={14} className="animate-pulse" />
                                        <span>Sauvegarde...</span>
                                    </div>
                                )}
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

            {/* Navigation - Tabs with better contrast */}
            <div className="max-w-2xl mx-auto mb-6">
                <div className="flex gap-2 flex-wrap items-center justify-between">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setCurrentView('accueil')}
                            className={`neo-btn text-sm font-black ${currentView === 'accueil' ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            🏠 ACCUEIL
                        </button>
                        <button
                            onClick={() => setCurrentView('players')}
                            className={`neo-btn text-sm font-black ${currentView === 'players' ? 'bg-black text-white' : 'bg-white text-black'}`}
                        >
                            👥 JOUEURS ({tournament.players.length})
                        </button>
                        <button
                            onClick={() => setCurrentView('bracket')}
                            disabled={tournament.matches.length === 0}
                            className={`neo-btn text-sm font-black ${currentView === 'bracket' ? 'bg-black text-white' : 'bg-white text-black'} ${tournament.matches.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            🏆 MATCHS
                        </button>
                        {tournament.status === 'completed' && (
                            <button
                                onClick={() => setCurrentView('results')}
                                className={`neo-btn text-sm font-black ${currentView === 'results' ? 'bg-black text-white' : 'bg-white text-black'}`}
                            >
                                🏅 RÉSULTATS
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {tournament.matches.length > 0 && (
                            <button
                                onClick={recalculateAllScores}
                                className="neo-btn text-sm font-black bg-orange-400 text-black hover:bg-orange-300"
                                title="Recalculer tous les points et propager les qualifiés"
                            >
                                🔄 RECALCULER
                            </button>
                        )}
                        <button
                            onClick={saveTournament}
                            disabled={isSaving}
                            className={`neo-btn text-sm font-black bg-green-400 text-black hover:bg-green-300 ${isSaving ? 'opacity-50' : ''}`}
                        >
                            <Save size={14} className="inline mr-1" />
                            {isSaving ? 'SAUVEGARDE...' : 'SAUVEGARDER'}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-2xl mx-auto">
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
                                                type="button"
                                                onClick={() => setTournament({ ...tournament, format: 'elimination' })}
                                                className={`p-4 border-4 transition-all ${tournament.format === 'elimination' ? 'border-green-500 bg-green-100 ring-4 ring-green-300' : 'border-black bg-white hover:bg-gray-50'} text-left relative`}
                                            >
                                                {tournament.format === 'elimination' && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                                                )}
                                                <div className="text-2xl mb-2">⚔️</div>
                                                <div className="font-black uppercase">Élimination Directe</div>
                                                <div className="text-xs text-gray-600">Match perdu = éliminé</div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTournament({ ...tournament, format: 'groups' })}
                                                className={`p-4 border-4 transition-all ${tournament.format === 'groups' ? 'border-green-500 bg-green-100 ring-4 ring-green-300' : 'border-black bg-white hover:bg-gray-50'} text-left relative`}
                                            >
                                                {tournament.format === 'groups' && (
                                                    <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">✓</div>
                                                )}
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
                                                                            const s2 = match.score2 ?? 0;
                                                                            updateMatchScore(match.id, s1, s2);
                                                                        }}
                                                                    />
                                                                    <span>-</span>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        className="w-10 p-1 border border-black text-center text-xs"
                                                                        value={match.score2 ?? ''}
                                                                        onChange={(e) => {
                                                                            const s1 = match.score1 ?? 0;
                                                                            const s2 = parseInt(e.target.value) || 0;
                                                                            updateMatchScore(match.id, s1, s2);
                                                                        }}
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
                                                                            const s2 = match.score2 ?? 0;
                                                                            updateMatchScore(match.id, s1, s2);
                                                                        }}
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
                                                                            const s1 = match.score1 ?? 0;
                                                                            updateMatchScore(match.id, s1, s2);
                                                                        }}
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
