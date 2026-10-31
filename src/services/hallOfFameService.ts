import { collection, doc, getDocs, setDoc, query, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GameMode } from '../domain/types';

export interface HallOfFameEntry {
  id: string;
  nickname: string;
  score: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  mode: GameMode;
  grade: number;
  durationSeconds: number;
  createdAt: string;
}

export async function submitToHallOfFame(entry: HallOfFameEntry): Promise<void> {
  const docRef = doc(db, 'hallOfFame', entry.id);
  try {
    await setDoc(docRef, entry);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `hallOfFame/${entry.id}`);
  }
}

export async function getHallOfFameEntries(modeFilter?: string): Promise<HallOfFameEntry[]> {
  const colRef = collection(db, 'hallOfFame');
  try {
    const q = query(colRef, limit(100));
    const snap = await getDocs(q);
    const results: HallOfFameEntry[] = [];
    snap.forEach((d) => {
      const data = d.data() as HallOfFameEntry;
      if (!modeFilter || modeFilter === 'all' || data.mode === modeFilter) {
        results.push(data);
      }
    });

    // Sort descending by score, then accuracy, then duration
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return a.durationSeconds - b.durationSeconds;
    });

    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'hallOfFame');
    return [];
  }
}
