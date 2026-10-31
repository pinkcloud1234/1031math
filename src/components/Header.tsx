import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, Trophy, HelpCircle, Swords, User, LogIn, LogOut, Award } from 'lucide-react';
import { sound } from '../utils/sound';
import { UserProfile } from '../services/userService';

interface HeaderProps {
  onOpenRecords: () => void;
  onOpenRules: () => void;
  onOpenTutor?: () => void;
  onOpenHallOfFame?: () => void;
  onOpenAuth?: () => void;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRecords,
  onOpenRules,
  onOpenTutor,
  onOpenHallOfFame,
  onOpenAuth,
  currentUser,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = useState(!sound.isEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleSound = () => {
    const active = sound.toggle();
    setIsMuted(!active);
  };

  const handleToggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">
                매쓰 아레나
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                교실용 수학 배틀
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
              전자칠판과 공용 화면에서 함께 푸는 초등 수학 게임
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* User Auth Info / Button */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-bold text-indigo-900 max-w-[80px] sm:max-w-[110px] truncate">
                {currentUser.nickname}
              </span>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-slate-400 hover:text-rose-600 ml-1"
                  title="로그아웃"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : onOpenAuth ? (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>회원가입</span>
            </button>
          ) : null}

          {/* Hall of Fame Button */}
          {onOpenHallOfFame && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHallOfFame();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-300 transition-colors shadow-2xs"
              title="Firebase 실시간 명예의 전당"
            >
              <Trophy className="w-4 h-4 text-amber-600 fill-current" />
              <span className="hidden md:inline">명예의 전당</span>
            </button>
          )}

          {/* AI Mentor Chatbot button */}
          {onOpenTutor && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenTutor();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs"
              title="AI 매쓰 멘토 (힌트 및 챗봇)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AI 멘토</span>
            </button>
          )}

          {/* Rules button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenRules();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="게임 방법 및 도움말"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">도움말</span>
          </button>

          {/* Records button */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenRecords();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="학급 배틀 기록"
          >
            <Award className="w-4 h-4 text-slate-500" />
            <span className="hidden lg:inline">최근 기록</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              isMuted
                ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isMuted ? '소리 켜기' : '소리 끄기'}
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors hidden md:flex items-center justify-center"
            title={isFullscreen ? '창 모드로 전환' : '전자칠판 전체 화면'}
            aria-label={isFullscreen ? '창 모드로 전환' : '전자칠판 전체 화면'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
