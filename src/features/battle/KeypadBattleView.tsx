import React, { useState, useEffect, useRef } from 'react';
import {
  Pause,
  Play,
  SkipForward,
  XCircle,
  Clock,
  Flame,
  Check,
  Delete,
  CornerDownLeft,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { GameSettings, MathQuestion, Player } from '../../domain/types';
import { PLAYER_COLORS } from '../../data/curriculum';
import { evaluateAnswer } from '../../domain/scoring/battleRules';
import { sound } from '../../utils/sound';
import { getAiHint, getAiPraise } from '../../services/aiTutorService';
import { Bot, Lightbulb, Heart } from 'lucide-react';

interface KeypadBattleViewProps {
  settings: GameSettings;
  initialPlayers: Player[];
  questions: MathQuestion[];
  onFinishGame: (finalPlayers: Player[], durationSeconds: number) => void;
  onExitGame: () => void;
  onOpenTutor?: (hint?: string) => void;
}

interface PlayerInputState {
  currentInput: string;
  isSubmitted: boolean;
  isCorrect?: boolean;
  earnedPoints?: number;
  mentorFeedback?: string;
}

export const KeypadBattleView: React.FC<KeypadBattleViewProps> = ({
  settings,
  initialPlayers,
  questions,
  onFinishGame,
  onExitGame,
  onOpenTutor,
}) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimitSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showingAnswer, setShowingAnswer] = useState<boolean>(false);

  // Consecutive incorrect track per player
  const [consecutiveFails, setConsecutiveFails] = useState<Record<string, number>>({});
  const [mentorToast, setMentorToast] = useState<{ text: string; type: 'hint' | 'praise' } | null>(null);

  // Per-player input state for current question
  const [playerInputs, setPlayerInputs] = useState<Record<string, PlayerInputState>>(() => {
    const init: Record<string, PlayerInputState> = {};
    initialPlayers.forEach((p) => {
      init[p.id] = { currentInput: '', isSubmitted: false };
    });
    return init;
  });

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentIndex];

  // Grid columns based on player count
  const getGridCols = (count: number) => {
    switch (count) {
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-3';
      case 4:
        return 'grid-cols-2 md:grid-cols-4';
      case 5:
      case 6:
        return 'grid-cols-2 md:grid-cols-3';
      default:
        return 'grid-cols-1';
    }
  };

  // Check if all players have submitted
  const allSubmitted = players.every((p) => playerInputs[p.id]?.isSubmitted);

  // Transition to next question or finish
  const moveToNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setShowingAnswer(true);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setTimeLeft(settings.timeLimitSeconds);
        setShowingAnswer(false);

        // Reset inputs
        const nextInputs: Record<string, PlayerInputState> = {};
        players.forEach((p) => {
          nextInputs[p.id] = { currentInput: '', isSubmitted: false };
        });
        setPlayerInputs(nextInputs);
      }, 2000);
    } else {
      setShowingAnswer(true);
      setTimeout(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        onFinishGame(players, elapsed);
      }, 1500);
    }
  };

  // Timer loop
  useEffect(() => {
    if (isPaused || showingAnswer) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sound.playCountdown();
          moveToNextQuestion();
          return 0;
        }
        if (prev <= 4) {
          sound.playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isPaused, showingAnswer]);

  // When all players submitted before time runs out
  useEffect(() => {
    if (allSubmitted && !showingAnswer) {
      moveToNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubmitted, showingAnswer]);

  // Keypad button click
  const handleKeypadPress = (playerId: string, key: string) => {
    if (isPaused || showingAnswer) return;
    const current = playerInputs[playerId];
    if (!current || current.isSubmitted) return;

    sound.playClick();

    if (key === 'clear') {
      setPlayerInputs((prev) => ({
        ...prev,
        [playerId]: { ...prev[playerId], currentInput: '' },
      }));
    } else if (key === 'submit') {
      handleSubmitAnswer(playerId);
    } else {
      // Numbers
      if (current.currentInput.length < 5) {
        setPlayerInputs((prev) => ({
          ...prev,
          [playerId]: { ...prev[playerId], currentInput: prev[playerId].currentInput + key },
        }));
      }
    }
  };

  // Submit Answer
  const handleSubmitAnswer = (playerId: string) => {
    const current = playerInputs[playerId];
    if (!current || current.isSubmitted || current.currentInput.trim() === '') return;

    const parsedAnswer = parseInt(current.currentInput, 10);
    if (isNaN(parsedAnswer)) return;

    const player = players.find((p) => p.id === playerId);
    if (!player) return;

    const evalResult = evaluateAnswer(
      parsedAnswer,
      currentQuestion.answer,
      player.currentStreak,
      settings.pointsPerCorrectAnswer,
      settings.streakBonus
    );

    if (evalResult.isCorrect) {
      sound.playCorrect();
      setConsecutiveFails((prev) => ({ ...prev, [playerId]: 0 }));
      getAiPraise({
        question: currentQuestion.prompt,
        streak: evalResult.newStreak,
        playerName: player.displayName,
      }).then((praise) => {
        setMentorToast({ text: praise, type: 'praise' });
      });
    } else {
      sound.playIncorrect();
      const failCount = (consecutiveFails[playerId] || 0) + 1;
      setConsecutiveFails((prev) => ({ ...prev, [playerId]: failCount }));
      getAiHint({
        question: currentQuestion.prompt,
        answer: currentQuestion.answer,
        userAnswer: parsedAnswer,
        consecutiveIncorrect: failCount,
        grade: settings.grade,
      }).then((hint) => {
        setMentorToast({ text: hint, type: 'hint' });
      });
    }

    // Update player input state
    setPlayerInputs((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        isSubmitted: true,
        isCorrect: evalResult.isCorrect,
        earnedPoints: evalResult.pointsEarned,
      },
    }));

    // Update player statistics
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          score: p.score + evalResult.pointsEarned,
          correctCount: p.correctCount + (evalResult.isCorrect ? 1 : 0),
          incorrectCount: p.incorrectCount + (evalResult.isCorrect ? 0 : 1),
          currentStreak: evalResult.newStreak,
          maxStreak: Math.max(p.maxStreak, evalResult.maxStreak),
        };
      })
    );
  };

  const timerRatio = Math.max(0, timeLeft / settings.timeLimitSeconds);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-5 select-none">
      {/* Top HUD: Question, Round, Timer & Teacher Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          {/* Round Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800">
              문제 {currentIndex + 1} / {questions.length}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              난이도: {settings.difficulty === 'easy' ? '쉬움' : settings.difficulty === 'normal' ? '보통' : '어려움'}
            </span>
          </div>

          {/* Teacher Quick Controls */}
          <div className="flex items-center gap-1.5">
            {onOpenTutor && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenTutor(mentorToast?.text);
                }}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1 transition-colors shadow-xs"
                title="AI 매쓰 멘토 챗봇 열기"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI 멘토</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsPaused(!isPaused);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
              title={isPaused ? '재개' : '일시정지'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isPaused ? '계속하기' : '일시정지'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                moveToNextQuestion();
              }}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
              title="다음 문제로 건너뛰기"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">건너뛰기</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('게임을 종료하고 설정으로 돌아가시겠습니까?')) {
                  sound.playClick();
                  onExitGame();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="게임 나가기"
              aria-label="게임 나가기"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Large Math Question */}
        <div className="py-2 text-center relative">
          <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-mono tracking-tight text-white drop-shadow-sm">
            {showingAnswer ? (
              <span className="text-emerald-400 animate-pulse">
                정답: {currentQuestion.answer}
              </span>
            ) : (
              currentQuestion.prompt
            )}
          </div>
        </div>

        {/* Timer Bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{timeLeft}초</span>
          </div>
          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                timeLeft <= 4
                  ? 'bg-rose-500 animate-pulse'
                  : timeLeft <= 7
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
              }`}
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Mentor Live Feedback Banner */}
      {mentorToast && (
        <div
          className={`my-2 p-3 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
            mentorToast.type === 'praise'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-indigo-950/70 border-indigo-500/50 text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white ${
                mentorToast.type === 'praise' ? 'bg-emerald-600' : 'bg-indigo-600'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium leading-relaxed">{mentorToast.text}</span>
          </div>

          {onOpenTutor && (
            <button
              type="button"
              onClick={() => onOpenTutor(mentorToast.text)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              질문하기
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Per-Player Screen Divisions */}
      <div className={`grid ${getGridCols(players.length)} gap-3 my-3 flex-1`}>
        {players.map((p, idx) => {
          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
          const inputState = playerInputs[p.id] || { currentInput: '', isSubmitted: false };

          return (
            <div
              key={p.id}
              className={`bg-slate-900/90 rounded-2xl border-2 p-3 sm:p-4 flex flex-col justify-between shadow-lg transition-all ${
                inputState.isSubmitted
                  ? inputState.isCorrect
                    ? 'border-emerald-500 bg-emerald-950/20 ring-2 ring-emerald-500/30'
                    : 'border-rose-500/80 bg-rose-950/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Player Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${color.bg}`}
                  >
                    P{idx + 1}
                  </span>
                  <span className="font-bold text-white text-sm truncate max-w-[100px] sm:max-w-[130px]">
                    {p.displayName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {p.currentStreak >= 2 && (
                    <span className="flex items-center text-xs font-bold text-amber-400 gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {p.currentStreak}연속
                    </span>
                  )}
                  <span className="text-lg font-mono font-extrabold text-amber-400">
                    {p.score}점
                  </span>
                </div>
              </div>

              {/* Input Display */}
              <div className="my-2.5 py-2.5 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[64px]">
                {inputState.isSubmitted ? (
                  inputState.isCorrect ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-base sm:text-lg animate-bounce">
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>정답! +{inputState.earnedPoints}점</span>
                    </div>
                  ) : (
                    <div className="text-rose-400 font-bold text-sm sm:text-base">
                      아쉬워요! (입력: {inputState.currentInput})
                    </div>
                  )
                ) : (
                  <div className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white">
                    {inputState.currentInput ? (
                      inputState.currentInput
                    ) : (
                      <span className="text-slate-600">_ _ _</span>
                    )}
                  </div>
                )}
              </div>

              {/* Large Touch Keypad (0-9, Clear, Submit) */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={inputState.isSubmitted || isPaused || showingAnswer}
                    onClick={() => handleKeypadPress(p.id, String(num))}
                    className="h-11 sm:h-13 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 disabled:opacity-35 disabled:hover:bg-slate-800 text-lg sm:text-xl font-bold font-mono text-white border border-slate-700/80 active:scale-95 transition-all shadow-xs flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}

                {/* Clear */}
                <button
                  type="button"
                  disabled={inputState.isSubmitted || isPaused || showingAnswer}
                  onClick={() => handleKeypadPress(p.id, 'clear')}
                  className="h-11 sm:h-13 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 active:bg-rose-900 disabled:opacity-35 disabled:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-300 border border-slate-700/80 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
                  title="지우기"
                >
                  <Delete className="w-4 h-4" />
                  <span>지움</span>
                </button>

                {/* 0 */}
                <button
                  type="button"
                  disabled={inputState.isSubmitted || isPaused || showingAnswer}
                  onClick={() => handleKeypadPress(p.id, '0')}
                  className="h-11 sm:h-13 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 disabled:opacity-35 disabled:hover:bg-slate-800 text-lg sm:text-xl font-bold font-mono text-white border border-slate-700/80 active:scale-95 transition-all shadow-xs flex items-center justify-center"
                >
                  0
                </button>

                {/* Submit */}
                <button
                  type="button"
                  disabled={
                    inputState.isSubmitted ||
                    isPaused ||
                    showingAnswer ||
                    inputState.currentInput.length === 0
                  }
                  onClick={() => handleKeypadPress(p.id, 'submit')}
                  className="h-11 sm:h-13 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-35 text-xs sm:text-sm font-bold text-white border border-indigo-500 disabled:border-slate-700 active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1"
                >
                  <CornerDownLeft className="w-4 h-4" />
                  <span>제출</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pause Overlay Modal if Paused */}
      {isPaused && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white">게임이 일시정지되었습니다</h3>
            <p className="text-xs text-slate-400">교실 전자칠판 설명이 끝나면 계속하기를 누르세요.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-colors"
              >
                계속하기
              </button>
              <button
                type="button"
                onClick={onExitGame}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-colors"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
