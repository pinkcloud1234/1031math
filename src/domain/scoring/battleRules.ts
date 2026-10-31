import { Player } from '../types';

export interface ScoreCalculationResult {
  isCorrect: boolean;
  pointsEarned: number;
  newStreak: number;
  maxStreak: number;
}

/**
 * Calculates score earned for an answer, including optional streak/combo bonus.
 */
export function evaluateAnswer(
  playerAnswer: number,
  correctAnswer: number,
  currentStreak: number,
  basePoints: number = 10,
  streakBonusEnabled: boolean = true
): ScoreCalculationResult {
  const isCorrect = playerAnswer === correctAnswer;

  if (isCorrect) {
    const newStreak = currentStreak + 1;
    // Streak bonus: +2 points per streak above 1, capped at +10 extra
    const bonus = streakBonusEnabled ? Math.min((newStreak - 1) * 2, 10) : 0;
    const pointsEarned = basePoints + bonus;

    return {
      isCorrect: true,
      pointsEarned,
      newStreak,
      maxStreak: newStreak,
    };
  } else {
    return {
      isCorrect: false,
      pointsEarned: 0,
      newStreak: 0,
      maxStreak: currentStreak,
    };
  }
}

export interface PlayerRanking {
  player: Player;
  rank: number;
  isWinner: boolean;
  accuracy: number;
}

/**
 * Determines ranks handling ties fairly (standard dense/competition ranking).
 */
export function calculateRankings(players: Player[]): PlayerRanking[] {
  if (players.length === 0) return [];

  // Sort descending by score, then by correctCount, then by maxStreak
  const sorted = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return b.maxStreak - a.maxStreak;
  });

  const topScore = sorted[0].score;

  let currentRank = 1;
  const rankings: PlayerRanking[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      if (curr.score < prev.score) {
        currentRank = i + 1;
      }
    }

    const totalAnswered = sorted[i].correctCount + sorted[i].incorrectCount;
    const accuracy = totalAnswered > 0 ? Math.round((sorted[i].correctCount / totalAnswered) * 100) : 0;

    rankings.push({
      player: sorted[i],
      rank: currentRank,
      isWinner: sorted[i].score === topScore && topScore > 0,
      accuracy,
    });
  }

  return rankings;
}
