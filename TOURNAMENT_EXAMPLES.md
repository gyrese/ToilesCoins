# 💻 Exemples de Code - Système de Tournois

## Exemples d'utilisation et snippets utiles

### 1. Créer un tournoi programmatiquement

```typescript
import { addDoc, collection } from 'firebase/firestore';
import { db } from './lib/firebase';

async function createTournament() {
  const tournament = {
    name: "Mario Kart Championship 2025",
    eventTypeId: "mario-kart-id",
    eventTypeName: "Mario Kart",
    date: new Date("2025-12-25T18:00:00"),
    status: 'setup',
    players: [],
    matches: [],
    createdAt: new Date()
  };
  
  const docRef = await addDoc(collection(db, "tournaments"), tournament);
  console.log("Tournament created with ID:", docRef.id);
}
```

### 2. Ajouter un joueur inscrit

```typescript
async function addRegisteredPlayer(tournamentId: string, userId: string, pseudo: string) {
  const player: Player = {
    id: userId,
    name: pseudo,
    isRegistered: true,
    userId: userId
  };
  
  // Ajouter à la liste des joueurs du tournoi
  // (Dans l'interface, ceci est géré par le state React)
}
```

### 3. Générer un bracket pour N joueurs

```typescript
function generateBracket(players: Player[]): Match[] {
  const playerCount = players.length;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
  
  // Mélanger les joueurs
  const shuffledPlayers = [...players]
    .sort(() => Math.random() - 0.5)
    .map((p, i) => ({ ...p, seed: i + 1 }));
  
  const matches: Match[] = [];
  let matchId = 0;
  
  // Premier round
  for (let i = 0; i < bracketSize / 2; i++) {
    const player1 = shuffledPlayers[i * 2];
    const player2 = shuffledPlayers[i * 2 + 1];
    
    matches.push({
      id: `match_${matchId}`,
      round: 1,
      matchNumber: i + 1,
      player1,
      player2,
      nextMatchId: `match_${Math.floor(bracketSize / 2) + Math.floor(i / 2)}`
    });
    matchId++;
  }
  
  // Rounds suivants
  let currentRound = 2;
  let matchesInRound = bracketSize / 4;
  
  while (matchesInRound >= 1) {
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `match_${matchId}`,
        round: currentRound,
        matchNumber: i + 1,
        nextMatchId: matchesInRound > 1 
          ? `match_${matchId + matchesInRound + Math.floor(i / 2)}` 
          : undefined
      });
      matchId++;
    }
    currentRound++;
    matchesInRound = matchesInRound / 2;
  }
  
  return matches;
}
```

### 4. Valider un match et déterminer le vainqueur

```typescript
function validateMatch(match: Match, score1: number, score2: number): Match {
  if (!match.player1 || !match.player2) {
    throw new Error("Match incomplet");
  }
  
  if (score1 === score2) {
    throw new Error("Les scores ne peuvent pas être égaux");
  }
  
  const winner = score1 > score2 ? match.player1 : match.player2;
  
  return {
    ...match,
    score1,
    score2,
    winner
  };
}
```

### 5. Faire progresser le vainqueur au tour suivant

```typescript
function advanceWinner(matches: Match[], completedMatch: Match): Match[] {
  if (!completedMatch.winner || !completedMatch.nextMatchId) {
    return matches;
  }
  
  return matches.map(m => {
    if (m.id === completedMatch.nextMatchId) {
      // Ajouter le vainqueur au prochain match
      if (!m.player1) {
        return { ...m, player1: completedMatch.winner };
      } else if (!m.player2) {
        return { ...m, player2: completedMatch.winner };
      }
    }
    return m;
  });
}
```

### 6. Trouver le podium final

```typescript
function findPodium(matches: Match[]): {
  winner?: Player;
  secondPlace?: Player;
  thirdPlace?: Player;
} {
  // Finale
  const finalMatch = matches.find(m => !m.nextMatchId);
  if (!finalMatch || !finalMatch.winner) {
    return {};
  }
  
  const winner = finalMatch.winner;
  const secondPlace = finalMatch.player1?.id === winner.id 
    ? finalMatch.player2 
    : finalMatch.player1;
  
  // Demi-finales pour trouver la 3ème place
  const semiFinals = matches.filter(m => m.nextMatchId === finalMatch.id);
  const thirdPlaceCandidates = semiFinals
    .map(m => [m.player1, m.player2].find(p => 
      p?.id !== winner.id && p?.id !== secondPlace?.id
    ))
    .filter(p => p);
  
  const thirdPlace = thirdPlaceCandidates[0];
  
  return { winner, secondPlace, thirdPlace };
}
```

### 7. Distribuer les récompenses

```typescript
async function distributeRewards(
  tournament: Tournament,
  winner: Player,
  secondPlace?: Player,
  thirdPlace?: Player
) {
  const rewards = [
    { player: winner, points: 500, position: 1 },
    { player: secondPlace, points: 300, position: 2 },
    { player: thirdPlace, points: 150, position: 3 }
  ];
  
  for (const reward of rewards) {
    if (reward.player && reward.player.isRegistered && reward.player.userId) {
      // Mettre à jour le solde
      await updateDoc(doc(db, "users", reward.player.userId), {
        balance: increment(reward.points),
        wins: reward.position === 1 ? increment(1) : increment(0),
        eventsCount: increment(1)
      });
      
      // Créer la transaction
      await addDoc(collection(db, "transactions"), {
        userId: reward.player.userId,
        amount: reward.points,
        type: "EARN",
        description: `${tournament.eventTypeName} - Position ${reward.position}`,
        date: new Date().toISOString()
      });
    }
  }
}
```

### 8. Enregistrer le tournoi complet

```typescript
async function saveTournament(tournament: Tournament) {
  const tournamentData = {
    ...tournament,
    status: 'completed',
    completedAt: serverTimestamp()
  };
  
  // Sauvegarder le tournoi
  const tournamentRef = await addDoc(
    collection(db, "tournaments"), 
    tournamentData
  );
  
  // Créer l'événement
  await addDoc(collection(db, "events"), {
    name: tournament.name,
    typeId: tournament.eventTypeId,
    typeName: tournament.eventTypeName,
    date: tournament.date,
    winner: tournament.winner?.name,
    secondPlace: tournament.secondPlace?.name,
    winnerPoints: 500,
    secondPlacePoints: 300,
    status: "completed",
    tournamentId: tournamentRef.id,
    createdAt: serverTimestamp()
  });
  
  return tournamentRef.id;
}
```

### 9. Récupérer l'historique des tournois

```typescript
async function getTournamentHistory(limit: number = 10) {
  const q = query(
    collection(db, "tournaments"),
    where("status", "==", "completed"),
    orderBy("completedAt", "desc"),
    limit(limit)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Tournament[];
}
```

### 10. Rechercher des joueurs

```typescript
async function searchPlayers(searchTerm: string): Promise<UserSearchResult[]> {
  if (searchTerm.length < 2) return [];
  
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);
  
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((u: any) => 
      u.pseudo?.toLowerCase().includes(searchTerm.toLowerCase())
    ) as UserSearchResult[];
}
```

### 11. Calculer les statistiques d'un tournoi

```typescript
function calculateStats(tournament: Tournament): TournamentStats {
  const totalPlayers = tournament.players.length;
  const registeredPlayers = tournament.players.filter(p => p.isRegistered).length;
  const guestPlayers = totalPlayers - registeredPlayers;
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
  const byesNeeded = bracketSize - totalPlayers;
  const totalMatches = tournament.matches.length;
  const totalRounds = totalMatches > 0 
    ? Math.max(...tournament.matches.map(m => m.round)) 
    : 0;
  
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
```

### 12. Valider un tournoi avant finalisation

```typescript
function validateTournament(tournament: Tournament): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!tournament.name) {
    errors.push("Le tournoi doit avoir un nom");
  }
  
  if (tournament.players.length < 2) {
    errors.push("Minimum 2 joueurs requis");
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
    errors.push(`${incompleteMatches.length} match(s) incomplet(s)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

### 13. Hook React personnalisé pour gérer un tournoi

```typescript
function useTournament(eventTypeId: string, eventTypeName: string) {
  const [tournament, setTournament] = useState<Tournament>({
    name: "",
    eventTypeId,
    eventTypeName,
    date: new Date(),
    status: 'setup',
    players: [],
    matches: []
  });
  
  const addPlayer = useCallback((player: Player) => {
    setTournament(prev => ({
      ...prev,
      players: [...prev.players, player]
    }));
  }, []);
  
  const removePlayer = useCallback((playerId: string) => {
    setTournament(prev => ({
      ...prev,
      players: prev.players.filter(p => p.id !== playerId)
    }));
  }, []);
  
  const generateBracket = useCallback(() => {
    const matches = generateBracket(tournament.players);
    setTournament(prev => ({
      ...prev,
      matches,
      status: 'ongoing'
    }));
  }, [tournament.players]);
  
  const updateMatch = useCallback((matchId: string, score1: number, score2: number) => {
    setTournament(prev => {
      const match = prev.matches.find(m => m.id === matchId);
      if (!match) return prev;
      
      const validatedMatch = validateMatch(match, score1, score2);
      const updatedMatches = prev.matches.map(m => 
        m.id === matchId ? validatedMatch : m
      );
      
      return {
        ...prev,
        matches: advanceWinner(updatedMatches, validatedMatch)
      };
    });
  }, []);
  
  return {
    tournament,
    addPlayer,
    removePlayer,
    generateBracket,
    updateMatch
  };
}
```

### 14. Composant de carte de match

```typescript
function MatchCard({ match, onScoreUpdate }: {
  match: Match;
  onScoreUpdate: (matchId: string, score1: number, score2: number) => void;
}) {
  const [score1, setScore1] = useState(match.score1 || 0);
  const [score2, setScore2] = useState(match.score2 || 0);
  
  const handleValidate = () => {
    if (score1 !== score2) {
      onScoreUpdate(match.id, score1, score2);
    }
  };
  
  return (
    <div className="neo-card">
      <div className="text-xs font-bold mb-2">Match #{match.matchNumber}</div>
      
      <div className={`p-2 border-2 ${match.winner?.id === match.player1?.id ? 'border-green-500' : 'border-black'}`}>
        <span>{match.player1?.name || 'TBD'}</span>
        <input
          type="number"
          value={score1}
          onChange={(e) => setScore1(parseInt(e.target.value) || 0)}
          disabled={!!match.winner}
        />
      </div>
      
      <div className="text-center font-bold">VS</div>
      
      <div className={`p-2 border-2 ${match.winner?.id === match.player2?.id ? 'border-green-500' : 'border-black'}`}>
        <span>{match.player2?.name || 'TBD'}</span>
        <input
          type="number"
          value={score2}
          onChange={(e) => setScore2(parseInt(e.target.value) || 0)}
          disabled={!!match.winner}
        />
      </div>
      
      {!match.winner && match.player1 && match.player2 && (
        <button onClick={handleValidate} className="neo-btn">
          VALIDER
        </button>
      )}
    </div>
  );
}
```

### 15. Utilitaire pour formater les dates

```typescript
function formatTournamentDate(date: Date | FirebaseFirestore.Timestamp): string {
  const d = date instanceof Date ? date : date.toDate();
  
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}
```

## 🎯 Conseils d'utilisation

1. **Toujours valider** les données avant de les enregistrer
2. **Utiliser les types TypeScript** pour éviter les erreurs
3. **Gérer les erreurs** avec try/catch
4. **Afficher des messages** clairs à l'utilisateur
5. **Tester avec différents nombres** de joueurs (2, 4, 8, 16, etc.)

## 📚 Ressources

- Types complets : `app/tournaments/types.ts`
- Interface principale : `app/tournaments/page.tsx`
- Documentation : `TOURNAMENT_SYSTEM.md`

---

**Créé le** : 2025-12-05  
**Version** : 1.0
