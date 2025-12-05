/**
 * Types TypeScript pour le système de gestion de tournois
 * ToilesCoins - Tournament Management System
 */

/**
 * Représente un joueur participant au tournoi
 */
export interface Player {
    /** Identifiant unique du joueur */
    id: string;

    /** Nom du joueur (pseudo ou nom personnalisé) */
    name: string;

    /** Indique si le joueur est inscrit sur l'application */
    isRegistered: boolean;

    /** ID Firebase du joueur (uniquement si isRegistered = true) */
    userId?: string;

    /** Position de départ dans le bracket (1, 2, 3...) */
    seed?: number;
}

/**
 * Représente un match dans le tournoi
 */
export interface Match {
    /** Identifiant unique du match */
    id: string;

    /** Numéro du round (1 = premier tour, 2 = quarts, etc.) */
    round: number;

    /** Numéro du match dans le round */
    matchNumber: number;

    /** Premier joueur du match */
    player1?: Player;

    /** Deuxième joueur du match */
    player2?: Player;

    /** Joueur vainqueur du match */
    winner?: Player;

    /** Score du joueur 1 */
    score1?: number;

    /** Score du joueur 2 */
    score2?: number;

    /** ID du match suivant (pour la progression) */
    nextMatchId?: string;
}

/**
 * Statut du tournoi
 */
export type TournamentStatus = 'setup' | 'ongoing' | 'completed';

/**
 * Représente un tournoi complet
 */
export interface Tournament {
    /** Identifiant Firestore (généré après sauvegarde) */
    id?: string;

    /** Nom du tournoi */
    name: string;

    /** ID du type d'événement */
    eventTypeId: string;

    /** Nom du type d'événement */
    eventTypeName: string;

    /** Date et heure du tournoi */
    date: Date;

    /** Statut actuel du tournoi */
    status: TournamentStatus;

    /** Liste de tous les participants */
    players: Player[];

    /** Liste de tous les matchs */
    matches: Match[];

    /** Vainqueur du tournoi (1ère place) */
    winner?: Player;

    /** Deuxième place */
    secondPlace?: Player;

    /** Troisième place */
    thirdPlace?: Player;

    /** Timestamp de création */
    createdAt?: any;

    /** Timestamp de finalisation */
    completedAt?: any;
}

/**
 * Récompenses par position
 */
export interface TournamentReward {
    /** Joueur récompensé */
    player: Player;

    /** Nombre de ToilesCoins attribués */
    points: number;

    /** Position finale (1, 2, ou 3) */
    position: number;
}

/**
 * Configuration des récompenses par défaut
 */
export const DEFAULT_REWARDS: Record<number, number> = {
    1: 500,  // Champion
    2: 300,  // Deuxième place
    3: 150   // Troisième place
};

/**
 * Document Firestore pour un tournoi
 */
export interface TournamentDocument extends Omit<Tournament, 'date'> {
    /** Date au format Firestore Timestamp */
    date: FirebaseFirestore.Timestamp;

    /** Timestamp de création Firestore */
    createdAt: FirebaseFirestore.Timestamp;

    /** Timestamp de finalisation Firestore */
    completedAt?: FirebaseFirestore.Timestamp;
}

/**
 * Document Firestore pour un événement créé depuis un tournoi
 */
export interface TournamentEventDocument {
    /** Nom de l'événement */
    name: string;

    /** ID du type d'événement */
    typeId: string;

    /** Nom du type d'événement */
    typeName: string;

    /** Date de l'événement */
    date: Date | FirebaseFirestore.Timestamp;

    /** Nom du vainqueur */
    winner: string;

    /** Nom du deuxième */
    secondPlace?: string;

    /** Points du vainqueur */
    winnerPoints: number;

    /** Points du deuxième */
    secondPlacePoints: number;

    /** Statut de l'événement */
    status: 'completed';

    /** Référence au tournoi */
    tournamentId: string;

    /** Timestamp de création */
    createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Transaction créée pour une récompense
 */
export interface TournamentTransaction {
    /** ID de l'utilisateur récompensé */
    userId: string;

    /** Montant de la récompense */
    amount: number;

    /** Type de transaction */
    type: 'EARN';

    /** Description de la transaction */
    description: string;

    /** Date de la transaction */
    date: string;
}

/**
 * Mise à jour de l'utilisateur après récompense
 */
export interface UserTournamentUpdate {
    /** Incrément du solde */
    balance: number;

    /** Incrément des victoires (1 pour le champion, 0 pour les autres) */
    wins: number;

    /** Incrément du compteur d'événements */
    eventsCount: number;
}

/**
 * Vue actuelle de l'interface
 */
export type TournamentView = 'setup' | 'players' | 'bracket' | 'results';

/**
 * Props pour les composants de tournoi
 */
export interface TournamentManagerProps {
    /** ID du type d'événement (depuis URL) */
    eventTypeId?: string;

    /** Nom du type d'événement (depuis URL) */
    eventTypeName?: string;
}

/**
 * Résultat de la recherche d'utilisateurs
 */
export interface UserSearchResult {
    /** ID Firestore de l'utilisateur */
    id: string;

    /** Pseudo de l'utilisateur */
    pseudo: string;

    /** URL de la photo de profil */
    photoURL?: string;

    /** Solde actuel */
    balance?: number;

    /** Nombre de victoires */
    wins?: number;
}

/**
 * Statistiques d'un tournoi
 */
export interface TournamentStats {
    /** Nombre total de participants */
    totalPlayers: number;

    /** Nombre de joueurs inscrits */
    registeredPlayers: number;

    /** Nombre de joueurs invités */
    guestPlayers: number;

    /** Nombre total de matchs */
    totalMatches: number;

    /** Nombre de rounds */
    totalRounds: number;

    /** Taille du bracket (puissance de 2) */
    bracketSize: number;

    /** Nombre de byes nécessaires */
    byesNeeded: number;
}

/**
 * Calcule les statistiques d'un tournoi
 */
export function calculateTournamentStats(tournament: Tournament): TournamentStats {
    const totalPlayers = tournament.players.length;
    const registeredPlayers = tournament.players.filter(p => p.isRegistered).length;
    const guestPlayers = totalPlayers - registeredPlayers;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
    const byesNeeded = bracketSize - totalPlayers;
    const totalMatches = tournament.matches.length;
    const totalRounds = totalMatches > 0 ? Math.max(...tournament.matches.map(m => m.round)) : 0;

    return {
        totalPlayers,
        registeredPlayers,
        guestPlayers,
        totalMatches,
        totalRounds,
        bracketSize,
        byesNeeded
    };
}

/**
 * Utilitaire pour obtenir le nom du round
 */
export function getRoundName(round: number, totalRounds: number): string {
    if (round === totalRounds) return '🏆 FINALE';
    if (round === totalRounds - 1) return '🥇 DEMI-FINALES';
    if (round === totalRounds - 2) return '🎯 QUARTS DE FINALE';
    return `ROUND ${round}`;
}

/**
 * Utilitaire pour valider un tournoi avant finalisation
 */
export function validateTournamentCompletion(tournament: Tournament): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    if (!tournament.name) {
        errors.push("Le tournoi doit avoir un nom");
    }

    if (tournament.players.length < 2) {
        errors.push("Le tournoi doit avoir au moins 2 joueurs");
    }

    if (tournament.matches.length === 0) {
        errors.push("Le bracket n'a pas été généré");
    }

    const finalMatch = tournament.matches.find(m => !m.nextMatchId);
    if (!finalMatch || !finalMatch.winner) {
        errors.push("La finale n'est pas terminée");
    }

    const incompleteMatches = tournament.matches.filter(m =>
        m.player1 && m.player2 && !m.winner
    );
    if (incompleteMatches.length > 0) {
        errors.push(`${incompleteMatches.length} match(s) non terminé(s)`);
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
