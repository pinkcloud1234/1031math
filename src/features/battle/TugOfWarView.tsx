import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, XCircle, Clock, Check, AlertCircle, ArrowLeft, ArrowRight, Swords } from 'lucide-react';
import { GameSettings, MathQuestion, Player } from '../../domain/types';
import { PLAYER_COLORS } from '../../data/curriculum';
import { sound } from '../../utils/sound';

interface TugOfWarViewProps {
  settings: GameSettings;
  initialPlayers: Player[];
  questions: MathQuestion[];
  onFinishGame: (finalPlayers: Player[], durationSeconds: number) => void;
  onExitGame: () => void;
}

export const TugOfWarView: React.FC<TugOfWarViewProps> = ({
  settings,
  initialPlayers,
  questions,
  onFinishGame,
  onExitGame,
}) => {
  const [players, setPlayers] = useState<Player[]>(initialPlayers.slice(0, 2));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimitSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showingAnswer, setShowingAnswer] = useState<boolean>(false);

  // Rope position: -4 (P1 win) to +4 (P2 win), 0 is middle
  const [ropePosition, setRopePosition] = useState<number>(0);

  // Answer status for current round
  const [p1Answered, setP1Answered] = useState<boolean>(false);
  const [p2Answered, setP2Answered] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const p1 = players[0];
  const p2 = players[1];
  const currentQuestion = questions[currentIndex];

  const finishBattle = () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    onFinishGame(players, elapsed);
  };

  const nextQuestion = () => {
    // Check if sudden death reached (-4 or +4)
    if (Math.abs(ropePosition) >= 4 || currentIndex + 1 >= questions.length) {
      setShowingAnswer(true);
      setTimeout(() => {
        finishBattle();
      }, 1500);
      return;
    }

    setShowingAnswer(true);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setTimeLeft(settings.timeLimitSeconds);
      setP1Answered(false);
      setP2Answered(false);
      setShowingAnswer(false);
    }, 1800);
  };

  // Timer loop
  useEffect(() => {
    if (isPaused || showingAnswer) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sound.playCountdown();
          nextQuestion();
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
  }, [currentIndex, isPaused, showingAnswer, ropePosition]);

  // Handle Choice Selection
  const handleSelectChoice = (playerIndex: 0 | 1, choice: number) => {
    if (isPaused || showingAnswer) return;
    if (playerIndex === 0 && p1Answered) return;
    if (playerIndex === 1 && p2Answered) return;

    sound.playClick();
    const isCorrect = choice === currentQuestion.answer;

    if (playerIndex === 0) {
      setP1Answered(true);
      if (isCorrect) {
        sound.playCorrect();
        setRopePosition((prev) => Math.max(prev - 1, -4));
        setPlayers((prev) => [
          {
            ...prev[0],
            score: prev[0].score + 10,
            correctCount: prev[0].correctCount + 1,
            currentStreak: prev[0].currentStreak + 1,
            maxStreak: Math.max(prev[0].maxStreak, prev[0].currentStreak + 1),
          },
          prev[1],
        ]);
      } else {
        sound.playIncorrect();
        setPlayers((prev) => [
          {
            ...prev[0],
            incorrectCount: prev[0].incorrectCount + 1,
            currentStreak: 0,
          },
          prev[1],
        ]);
      }
    } else {
      setP2Answered(true);
      if (isCorrect) {
        sound.playCorrect();
        setRopePosition((prev) => Math.min(prev + 1, 4));
        setPlayers((prev) => [
          prev[0],
          {
            ...prev[1],
            score: prev[1].score + 10,
            correctCount: prev[1].correctCount + 1,
            currentStreak: prev[1].currentStreak + 1,
            maxStreak: Math.max(prev[1].maxStreak, prev[1].currentStreak + 1),
          },
        ]);
      } else {
        sound.playIncorrect();
        setPlayers((prev) => [
          prev[0],
          {
            ...prev[1],
            incorrectCount: prev[1].incorrectCount + 1,
            currentStreak: 0,
          },
        ]);
      }
    }

    // If both players have answered, proceed
    const otherAnswered = playerIndex === 0 ? p2Answered : p1Answered;
    if (otherAnswered) {
      nextQuestion();
    }
  };

  const choices = currentQuestion.choices || [
    currentQuestion.answer,
    currentQuestion.answer + 2,
    Math.max(0, currentQuestion.answer - 2),
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-950 text-amber-400 border border-amber-800">
            줄다리기 {currentIndex + 1} / {questions.length}
          </span>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-mono font-bold text-slate-400">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {timeLeft}초
            </span>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsPaused(!isPaused);
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('게임을 종료하시겠습니까?')) onExitGame();
              }}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Math Question in Center */}
        <div className="text-center py-2">
          <div className="text-3xl sm:text-5xl font-mono font-extrabold text-white">
            {showingAnswer ? (
              <span className="text-emerald-400 animate-pulse">정답: {currentQuestion.answer}</span>
            ) : (
              currentQuestion.prompt
            )}
          </div>
        </div>

        {/* Rope Visualization */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold px-2 mb-2">
            <span className="text-rose-400 flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> {p1.displayName} 진영
            </span>
            <span className="text-slate-500 font-mono">중앙</span>
            <span className="text-blue-400 flex items-center gap-1">
              {p2.displayName} 진영 <ArrowRight className="w-4 h-4" />
            </span>
          </div>

          {/* Tug of war bar */}
          <div className="relative h-6 bg-slate-800 rounded-full overflow-hidden border border-slate-700 flex items-center px-1">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-500 -translate-x-1/2 z-10" />

            {/* Rope Line */}
            <div className="w-full h-1.5 bg-amber-700/80 rounded-full" />

            {/* Moving Knot / Ribbon */}
            <div
              className="absolute top-1 bottom-1 w-8 rounded-full bg-amber-400 shadow-md shadow-amber-500/50 flex items-center justify-center transition-all duration-500 -translate-x-1/2 z-20"
              style={{
                left: `${50 + ropePosition * 12.5}%`,
              }}
            >
              <Swords className="w-4 h-4 text-slate-950" />
            </div>
          </div>
        </div>
      </div>

      {/* Two Players Choice Areas (Left vs Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 flex-1">
        {/* P1 Left Zone */}
        <div className="bg-slate-900/90 rounded-2xl border-2 border-rose-500/50 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-rose-500 text-white font-bold flex items-center justify-center">
                P1
              </span>
              <span className="font-bold text-base text-white">{p1.displayName}</span>
            </div>
            <div className="text-xl font-mono font-extrabold text-amber-400">{p1.score}점</div>
          </div>

          {/* Status */}
          <div className="text-center py-2 text-xs text-slate-400 font-medium">
            {p1Answered ? (
              <span className="text-slate-300 font-bold">선택 완료! 결과 대기 중...</span>
            ) : (
              '정답을 터치해 줄을 당기세요!'
            )}
          </div>

          {/* 3 Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                disabled={p1Answered || isPaused || showingAnswer}
                onClick={() => handleSelectChoice(0, c)}
                className="h-16 rounded-xl bg-slate-800 hover:bg-rose-900/40 active:bg-rose-600 disabled:opacity-40 border border-slate-700 hover:border-rose-500 text-xl font-bold font-mono text-white transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* P2 Right Zone */}
        <div className="bg-slate-900/90 rounded-2xl border-2 border-blue-500/50 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-500 text-white font-bold flex items-center justify-center">
                P2
              </span>
              <span className="font-bold text-base text-white">{p2.displayName}</span>
            </div>
            <div className="text-xl font-mono font-extrabold text-amber-400">{p2.score}점</div>
          </div>

          {/* Status */}
          <div className="text-center py-2 text-xs text-slate-400 font-medium">
            {p2Answered ? (
              <span className="text-slate-300 font-bold">선택 완료! 결과 대기 중...</span>
            ) : (
              '정답을 터치해 줄을 당기세요!'
            )}
          </div>

          {/* 3 Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {choices.map((c, i) => (
              <button
                key={i}
                type="button"
                disabled={p2Answered || isPaused || showingAnswer}
                onClick={() => handleSelectChoice(1, c)}
                className="h-16 rounded-xl bg-slate-800 hover:bg-blue-900/40 active:bg-blue-600 disabled:opacity-40 border border-slate-700 hover:border-blue-500 text-xl font-bold font-mono text-white transition-all shadow-md active:scale-95 flex items-center justify-center"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
