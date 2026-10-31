import { BattleRecord } from '../domain/types';

const STORAGE_KEY = 'math_arena_battle_records';
const MAX_RECORDS = 100;

export function loadBattleRecords(): BattleRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load battle records from localStorage', e);
    return [];
  }
}

export function saveBattleRecord(record: BattleRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadBattleRecords();
    const updated = [record, ...current].slice(0, MAX_RECORDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save battle record to localStorage', e);
  }
}

export function clearAllBattleRecords(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear battle records', e);
  }
}

export function deleteBattleRecord(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadBattleRecords();
    const updated = current.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete battle record', e);
  }
}
