import React, { useState } from 'react';
import { X, UserPlus, LogIn, Lock, User, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { registerUser, loginUser, UserProfile } from '../services/userService';
import { sound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: UserProfile;
      if (mode === 'register') {
        user = await registerUser(nickname, password);
        sound.playStart();
      } else {
        user = await loginUser(nickname, password);
        sound.playClick();
      }
      onSuccess(user);
      onClose();
    } catch (err: unknown) {
      sound.playIncorrect();
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('로그인/회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-6 relative">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-xs border border-white/30">
              {mode === 'register' ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {mode === 'register' ? '간편 회원가입' : '학습자 로그인'}
              </h3>
              <p className="text-xs text-indigo-100 mt-1">
                {mode === 'register'
                  ? '닉네임과 비밀번호만으로 5초 만에 가입하세요!'
                  : '가입한 닉네임으로 로그인하고 점수를 기록하세요.'}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="mt-5 flex p-1 bg-black/20 rounded-xl">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              회원가입
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-indigo-900 shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              로그인
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>학습자 닉네임</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 4학년수학왕, 빛나는별"
              required
              minLength={2}
              maxLength={20}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">2자~20자 이내의 한글, 영문, 숫자를 권장합니다.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>비밀번호</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="4자리 이상 입력"
              required
              minLength={4}
              maxLength={64}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-400 mt-1">교실에서 기억하기 쉬운 비밀번호를 입력해주세요.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !nickname.trim() || !password.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>처리 중...</span>
              ) : mode === 'register' ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>회원가입 완료하고 시작하기</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>로그인하기</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              {mode === 'register' ? '이미 계정이 있으신가요? ' : '아직 계정이 없으신가요? '}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError(null);
                }}
                className="text-indigo-600 font-bold hover:underline"
              >
                {mode === 'register' ? '로그인하기' : '회원가입하기'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
