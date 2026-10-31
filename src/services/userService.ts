import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface UserProfile {
  id: string;
  nickname: string;
  createdAt: string;
}

const LOCAL_USER_KEY = 'math_arena_active_user';

export function makeUserId(nickname: string): string {
  // Safe alphanumeric document id
  const sanitized = nickname.trim().replace(/[^a-zA-Z0-9가-힣_-]/g, '');
  // Base64 or hash fallback to ensure strictly valid characters [a-zA-Z0-9_-]
  const encoded = Array.from(sanitized)
    .map((c) => c.charCodeAt(0).toString(16))
    .join('');
  return `u_${encoded.slice(0, 50) || 'student'}_${sanitized.length}`;
}

export function getActiveUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setActiveUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

export async function registerUser(nickname: string, password: string): Promise<UserProfile> {
  const trimmedName = nickname.trim();
  const trimmedPass = password.trim();

  if (trimmedName.length < 2 || trimmedName.length > 20) {
    throw new Error('닉네임은 2자 이상 20자 이하로 입력해주세요.');
  }
  if (trimmedPass.length < 4 || trimmedPass.length > 64) {
    throw new Error('비밀번호는 4자 이상으로 입력해주세요.');
  }

  const userId = makeUserId(trimmedName);
  const docRef = doc(db, 'users', userId);

  try {
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error('이미 사용 중인 닉네임입니다. 다른 닉네임을 선택해주세요.');
    }

    const newUser = {
      nickname: trimmedName,
      password: trimmedPass,
      createdAt: new Date().toISOString(),
    };

    await setDoc(docRef, newUser);

    const profile: UserProfile = {
      id: userId,
      nickname: trimmedName,
      createdAt: newUser.createdAt,
    };

    setActiveUser(profile);
    return profile;
  } catch (error) {
    if (error instanceof Error && error.message.includes('이미 사용 중인')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}`);
    throw error;
  }
}

export async function loginUser(nickname: string, password: string): Promise<UserProfile> {
  const trimmedName = nickname.trim();
  const trimmedPass = password.trim();

  const userId = makeUserId(trimmedName);
  const docRef = doc(db, 'users', userId);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('등록되지 않은 닉네임입니다. 먼저 회원가입을 해주세요.');
    }

    const data = snap.data();
    if (data.password !== trimmedPass) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }

    const profile: UserProfile = {
      id: userId,
      nickname: data.nickname,
      createdAt: data.createdAt,
    };

    setActiveUser(profile);
    return profile;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('등록되지 않은') || error.message.includes('비밀번호가 일치'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
    throw error;
  }
}
