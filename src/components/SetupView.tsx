import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Tv,
  Smartphone,
  Sparkles,
  Users,
  RotateCcw,
  Shuffle,
  Clock,
  HelpCircle,
  Play,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';
import { GameMode, GameSettings, Operation, Difficulty, MathQuestion, Player } from '../domain/types';
import { GRADE_OPTIONS, CURRICULUM_UNITS, OPERATION_META, PLAYER_COLORS } from '../data/curriculum';
import { generateQuestionList } from '../domain/questions/generateQuestion';
import { sound } from '../utils/sound';

import { UserProfile } from '../services/userService';
import { User, LogIn, Trophy } from 'lucide-react';

interface SetupViewProps {
  onStartGame: (settings: GameSettings, players: Player[]) => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: () => void;
  onOpenHallOfFame?: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  onStartGame,
  currentUser,
  onOpenAuth,
  onOpenHallOfFame,
}) => {
  // 1. Play Channel
  const [playChannel] = useState<'shared-screen'>('shared-screen');

  // 2. Learning Curriculum (Default: 4th grade multiplication as requested)
  const [grade, setGrade] = useState<number>(4);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('grade4-multiplication');
  const [operations, setOperations] = useState<Operation[]>(['multiplication']);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');

  // 3. Game Mode
  const [gameMode, setGameMode] = useState<GameMode>('keypad');

  // 4. Participants
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [playerNames, setPlayerNames] = useState<string[]>([
    currentUser?.nickname || '1번 학생',
    '2번 학생',
    '3번 학생',
    '4번 학생',
    '5번 학생',
    '6번 학생',
  ]);

  // Keep player 1 synced with currentUser if logged in
  useEffect(() => {
    if (currentUser?.nickname) {
      setPlayerNames((prev) => [currentUser.nickname, ...prev.slice(1)]);
    }
  }, [currentUser]);

  // 5. Game Options
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(15); // 15s per question
  const [soloTotalSeconds, setSoloTotalSeconds] = useState<number>(60); // 60s total for solo
  const [streakBonus, setStreakBonus] = useState<boolean>(true);

  // 6. Preview Questions
  const [previewSeed, setPreviewSeed] = useState<number>(0);

  // Sync player count restrictions when gameMode changes
  useEffect(() => {
    if (gameMode === 'tug-of-war') {
      setPlayerCount(2);
    } else if (gameMode === 'solo') {
      setPlayerCount(1);
    } else if (gameMode === 'keypad' && playerCount < 2) {
      setPlayerCount(4);
    }
  }, [gameMode]);

  // Handle Unit Selection
  const handleSelectUnit = (unitId: string) => {
    sound.playClick();
    setSelectedUnitId(unitId);
    const unit = CURRICULUM_UNITS.find((u) => u.id === unitId);
    if (unit && unit.recommendedOperations.length > 0) {
      setOperations(unit.recommendedOperations);
    }
  };

  // Toggle Operation
  const handleToggleOperation = (op: Operation) => {
    sound.playClick();
    if (operations.includes(op)) {
      if (operations.length === 1) {
        // Must keep at least one operation
        return;
      }
      setOperations(operations.filter((o) => o !== op));
    } else {
      setOperations([...operations, op]);
    }
  };

  // Quick name templates
  const applyNameTemplate = (type: 'number' | 'team' | 'animal') => {
    sound.playClick();
    if (type === 'number') {
      setPlayerNames(['1번', '2번', '3번', '4번', '5번', '6번']);
    } else if (type === 'team') {
      setPlayerNames(['청팀', '백팀', '홍팀', '청록팀', '노랑팀', '보라팀']);
    } else if (type === 'animal') {
      setPlayerNames(['호랑이', '독수리', '돌고래', '판다', '사자', '치타']);
    }
  };

  const handleShufflePlayers = () => {
    sound.playClick();
    const active = playerNames.slice(0, playerCount);
    for (let i = active.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [active[i], active[j]] = [active[j], active[i]];
    }
    const updated = [...playerNames];
    for (let i = 0; i < playerCount; i++) {
      updated[i] = active[i];
    }
    setPlayerNames(updated);
  };

  const handlePlayerNameChange = (index: number, newName: string) => {
    const updated = [...playerNames];
    updated[index] = newName;
    setPlayerNames(updated);
  };

  // Generate live preview questions
  const previewQuestions = useMemo<MathQuestion[]>(() => {
    return generateQuestionList(5, {
      operations,
      difficulty,
      grade,
      unitId: selectedUnitId,
      includeChoices: gameMode === 'tug-of-war',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operations, difficulty, grade, selectedUnitId, gameMode, previewSeed]);

  // Validation
  const canStart = operations.length > 0 && playerCount > 0;

  // Handle Start
  const handleStart = () => {
    if (!canStart) return;
    sound.playStart();

    const actualTimeLimit = gameMode === 'solo' ? soloTotalSeconds : timeLimitSeconds;

    const settings: GameSettings = {
      playChannel: 'shared-screen',
      gameMode,
      grade,
      operations,
      difficulty,
      questionCount,
      timeLimitSeconds: actualTimeLimit,
      playerCount,
      pointsPerCorrectAnswer: 10,
      streakBonus,
      unitId: selectedUnitId,
    };

    const players: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
      const name = playerNames[i]?.trim() || `${i + 1}번 학생`;
      players.push({
        id: `p_${i + 1}_${Date.now()}`,
        displayName: name,
        seatIndex: i,
        colorKey: color.key,
        score: 0,
        correctCount: 0,
        incorrectCount: 0,
        currentStreak: 0,
        maxStreak: 0,
      });
    }

    onStartGame(settings, players);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32 space-y-8">
      {/* 0. Learner Auth & Hall of Fame Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white">
                {currentUser
                  ? `반가워요, ${currentUser.nickname}님! 🌟`
                  : '학습자 간편 회원가입 & 명예의 전당'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-amber-300 border border-white/20">
                Firebase 연동
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              {currentUser
                ? '배틀을 완료하면 획득한 점수가 Firebase 명예의 전당 랭킹에 실시간 공개됩니다!'
                : '닉네임과 비밀번호만으로 5초 만에 가입하고 명예의 전당 포디움에 도전하세요!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!currentUser && onOpenAuth && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenAuth();
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-indigo-600" />
              <span>간편 회원가입 / 로그인</span>
            </button>
          )}

          {onOpenHallOfFame && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onOpenHallOfFame();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Trophy className="w-4 h-4 fill-current" />
              <span>명예의 전당</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Play Channel Selection Banner */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              플레이 방식 (접속 채널)
            </h2>
          </div>
          <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            기획서 C 방식: 1차 공용화면 MVP
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Option 1: Shared Screen (Active MVP) */}
          <div className="relative rounded-xl border-2 border-indigo-600 bg-indigo-50/40 p-4 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5 shadow-xs">
                <Tv className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">
                    교실 공용 화면 (전자칠판 · 대형 모니터)
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-md">
                    사용 중
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  인터넷 연결이나 학생 스마트폰 없이, 한 대의 전자칠판/노트북 화면에서 2~6명이 각자 분할된 터치
                  키패드로 즉시 대결합니다.
                </p>
              </div>
            </div>
          </div>

          {/* Option 2: Personal Device (2nd Phase Planned) */}
          <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-75 cursor-not-allowed">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-slate-300 text-slate-600 shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-base">
                    학생 개인 기기 접속 (실시간 대결)
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md">
                    2차 업데이트 예정
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  학생들이 각자의 스마트폰/태블릿으로 QR 코드를 찍고 방에 접속해 대결하는 모드는 1차 공용 화면
                  검증 후 다음 단계에서 제공됩니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Game Mode Selection */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-600" />
            1. 게임 모드 선택
          </h2>
          <span className="text-xs text-slate-500">수업 형태에 맞게 선택하세요</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1: Keypad Battle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setGameMode('keypad');
            }}
            className={`text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
              gameMode === 'keypad'
                ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-100 text-indigo-700">
                  2~6인 대결 · 핵심 모드
                </span>
                {gameMode === 'keypad' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">키패드 배틀</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                전자칠판 화면을 플레이어 수만큼 분할하여 각자 대형 터치 키패드로 동시에 답을 입력하고 스피드
                점수를 겨룹니다.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>동시 터치 입력</span>
              <span className="font-semibold text-indigo-600">2~6명</span>
            </div>
          </button>

          {/* Mode 2: Tug of War */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setGameMode('tug-of-war');
            }}
            className={`text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
              gameMode === 'tug-of-war'
                ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-700">
                  1:1 맞대결 · 객관식
                </span>
                {gameMode === 'tug-of-war' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">줄다리기 배틀</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                두 학생이 마주보고 3개의 보기 중 정답을 고릅니다. 정답을 맞출 때마다 중앙의 줄이 자기 진영으로
                끌려옵니다!
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>선택지 터치</span>
              <span className="font-semibold text-amber-600">2명 고정</span>
            </div>
          </button>

          {/* Mode 3: Solo Time Attack */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setGameMode('solo');
            }}
            className={`text-left p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between ${
              gameMode === 'solo'
                ? 'border-indigo-600 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-700">
                  1인 도전 · 기록 갱신
                </span>
                {gameMode === 'solo' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">개인 타임어택</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                제한 시간 동안 연속으로 문제를 풀며 자신의 최고 콤보와 점수를 기록합니다. 수업 전 집중력 훈련에
                최적입니다.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>타임어택</span>
              <span className="font-semibold text-emerald-600">1명</span>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Learning Scope: Grade, Units & Operations */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            2. 학습 범위 및 연산 설정
          </h2>
          <span className="text-xs text-slate-500">학년과 출제할 연산 종류를 지정하세요</span>
        </div>

        {/* Grade Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">대상 학년</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {GRADE_OPTIONS.map((g) => {
              const active = grade === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setGrade(g.value);
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  <div className="text-xs sm:text-sm">{g.label}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{g.subtitle}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Unit Quick Templates */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">추천 단원 템플릿</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {CURRICULUM_UNITS.map((u) => {
              const active = selectedUnitId === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectUnit(u.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 font-semibold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{u.name}</span>
                    {active && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{u.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operations Toggle */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700">출제 연산 기호 (다중 선택 가능)</label>
            {operations.length === 0 && (
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> 최소 1개 이상 선택해야 합니다
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['addition', 'subtraction', 'multiplication', 'division'] as Operation[]).map((op) => {
              const meta = OPERATION_META[op];
              const isSelected = operations.includes(op);
              return (
                <button
                  key={op}
                  type="button"
                  onClick={() => handleToggleOperation(op)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected
                      ? `${meta.bgSoft} border-current font-bold ring-2 ring-current/20`
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-white shadow-xs border border-slate-200 flex items-center justify-center text-lg font-bold">
                      {meta.symbol}
                    </span>
                    <span className="text-sm">{meta.label}</span>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 className="w-5 h-5 text-current" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">난이도</label>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              const labels = {
                easy: { name: '쉬움 (기초)', desc: '1자리 위주, 낮은 수' },
                normal: { name: '보통 (표준)', desc: '표준 학년 범위' },
                hard: { name: '어려움 (도전)', desc: '받아올림/내림, 2자리' },
              };
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setDifficulty(d);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    active
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-sm font-bold">{labels[d].name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{labels[d].desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Participants Setup */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            3. 참여 학생 설정
          </h2>

          {/* Quick Tools */}
          {gameMode !== 'solo' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">빠른 이름:</span>
              <button
                type="button"
                onClick={() => applyNameTemplate('number')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                1번~N번
              </button>
              <button
                type="button"
                onClick={() => applyNameTemplate('team')}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                청팀/백팀
              </button>
              <button
                type="button"
                onClick={handleShufflePlayers}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="참가자 순서 섞기"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>셔플</span>
              </button>
            </div>
          )}
        </div>

        {/* Player Count Selection (Only for Keypad battle) */}
        {gameMode === 'keypad' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              플레이어 수 (전자칠판 화면 분할)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPlayerCount(num);
                  }}
                  className={`flex-1 min-w-[70px] py-2.5 px-3 rounded-xl border text-sm font-bold transition-all ${
                    playerCount === num
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {num}인 대결
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Player Name List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: playerCount }).map((_, idx) => {
            const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${color.light}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${color.bg}`}
                >
                  P{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={playerNames[idx] || ''}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    placeholder={`${idx + 1}번 학생`}
                    maxLength={10}
                    className="w-full text-xs sm:text-sm font-semibold bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Game Options (Questions & Time) */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          4. 게임 진행 옵션
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Question count or Time */}
          {gameMode !== 'solo' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">문제 수</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setQuestionCount(count);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      questionCount === count
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {count}문제
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">타임어택 총 제한 시간</label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 60, 90, 120].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSoloTotalSeconds(sec);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      soloTotalSeconds === sec
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {sec}초
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Time per question for multiplayer */}
          {gameMode !== 'solo' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">문제당 제한 시간</label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setTimeLimitSeconds(sec);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      timeLimitSeconds === sec
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {sec}초
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Streak Bonus */}
          <div className="md:col-span-2 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-500" />
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900">연속 정답(콤보) 보너스 점수</div>
                <div className="text-[11px] text-slate-500">연속으로 맞출 때마다 추가 점수를 부여합니다.</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setStreakBonus(!streakBonus);
              }}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                streakBonus ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={streakBonus}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  streakBonus ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Realtime Question Preview */}
      <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">실시간 출제 미리보기 (샘플 5문항)</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setPreviewSeed((prev) => prev + 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>새로고침</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {previewQuestions.map((q, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Q{idx + 1}</span>
                <span className="font-mono text-indigo-400">
                  {OPERATION_META[q.operation].label}
                </span>
              </div>
              <div className="text-center py-2 text-lg font-extrabold tracking-wider font-mono text-white">
                {q.prompt.replace(' = ?', '')}
              </div>
              <div className="text-right text-xs font-bold text-emerald-400 border-t border-slate-700/60 pt-1.5">
                정답: {q.answer}
              </div>
              {q.choices && (
                <div className="text-[10px] text-slate-400 mt-1 flex justify-center gap-1">
                  보기: {q.choices.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          현재 설정된 연산과 난이도에 따라 매 게임마다 새로운 문제가 자동으로 무작위 출제됩니다.
        </p>
      </section>

      {/* 7. Bottom Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 truncate max-w-full">
            <span className="font-bold text-slate-900">
              {GRADE_OPTIONS.find((g) => g.value === grade)?.label || '전학년'}
            </span>
            <span>·</span>
            <span className="text-indigo-600 font-semibold">
              {operations.map((o) => OPERATION_META[o].symbol).join(' ')}
            </span>
            <span>·</span>
            <span className="font-medium">
              {gameMode === 'keypad'
                ? `키패드 배틀 (${playerCount}인)`
                : gameMode === 'tug-of-war'
                ? '줄다리기 (2인)'
                : '개인 타임어택'}
            </span>
            <span>·</span>
            <span>
              {gameMode === 'solo' ? `${soloTotalSeconds}초` : `${questionCount}문제 (문제당 ${timeLimitSeconds}초)`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all ${
              canStart
                ? 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white hover:from-indigo-700 hover:to-violet-800 active:scale-98 shadow-indigo-200'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>수학 배틀 시작하기</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
