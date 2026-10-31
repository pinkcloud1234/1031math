import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAnswer, calculateRankings } from './battleRules';
import { Player } from '../types';

test('evaluateAnswer computes base points and streak bonus correctly', () => {
  // 1st correct answer
  const res1 = evaluateAnswer(42, 42, 0, 10, true);
  assert.equal(res1.isCorrect, true);
  assert.equal(res1.pointsEarned, 10);
  assert.equal(res1.newStreak, 1);

  // 2nd consecutive correct answer (+2 bonus)
  const res2 = evaluateAnswer(42, 42, 1, 10, true);
  assert.equal(res2.isCorrect, true);
  assert.equal(res2.pointsEarned, 12);
  assert.equal(res2.newStreak, 2);

  // Incorrect answer resets streak
  const resFail = evaluateAnswer(30, 42, 5, 10, true);
  assert.equal(resFail.isCorrect, false);
  assert.equal(resFail.pointsEarned, 0);
  assert.equal(resFail.newStreak, 0);
});

test('calculateRankings handles ties and rankings fairly', () => {
  const players: Player[] = [
    {
      id: 'p1',
      displayName: 'Alice',
      seatIndex: 0,
      colorKey: 'red',
      score: 50,
      correctCount: 5,
      incorrectCount: 0,
      currentStreak: 5,
      maxStreak: 5,
    },
    {
      id: 'p2',
      displayName: 'Bob',
      seatIndex: 1,
      colorKey: 'blue',
      score: 50,
      correctCount: 5,
      incorrectCount: 0,
      currentStreak: 5,
      maxStreak: 5,
    },
    {
      id: 'p3',
      displayName: 'Charlie',
      seatIndex: 2,
      colorKey: 'green',
      score: 30,
      correctCount: 3,
      incorrectCount: 2,
      currentStreak: 1,
      maxStreak: 2,
    },
  ];

  const rankings = calculateRankings(players);

  // Tied for 1st place
  assert.equal(rankings[0].rank, 1);
  assert.equal(rankings[1].rank, 1);
  assert.equal(rankings[0].isWinner, true);
  assert.equal(rankings[1].isWinner, true);

  // 3rd player has rank 3
  assert.equal(rankings[2].rank, 3);
  assert.equal(rankings[2].isWinner, false);
  assert.equal(rankings[2].accuracy, 60); // 3 / 5 = 60%
});
