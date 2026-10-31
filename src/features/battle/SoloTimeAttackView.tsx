import React, { useState, useEffect, useRef } from 'react';
import { Clock, Flame, Check, Delete, CornerDownLeft, XCircle, Trophy, Zap } from 'lucide-react';
import { GameSettings, MathQuestion, Player } from '../../domain/types';
import { generateQuestion } from '../../domain/questions/generateQuestion';
import { evaluateAnswer } from '../../domain/scoring/battleRules';
import { sound } from '../../utils/sound';

interface SoloTimeAttackViewProps {
  settings: GameSettings;
  player: Player;
  onFinishGame: (finalPlayers: Player[], durationSeconds: number) => void;
  onExitGame: () => void;
}

export const SoloTimeAttackView: React.FC<SoloTimeAttackViewProps> = ({
  settings,
  player,
  onFinishGame,
  onExitGame,
}) => {
  const [currentUser, setCurrentUser] = useState<Player>(player);
  const [timeLeft, setTimeLeft] = useState<number>(settings.timeLimitSeconds);
  const [currentInput, setCurrentInput] = useState<string>('');
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [lastFeedback, setLastFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);

  // Dynamic next question generator
  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestion({
      operations: settings.operations,
      difficulty: settings.difficulty,
      grade: settings.grade,
      unitId: settings.unitId,
    })
  );

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Finish game
  const finishTimeAttack = () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    onFinishGame([currentUser], elapsed);
  };

  // Timer loop
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          sound.playCountdown();
          finishTimeAttack();
          return 0;
        }
        if (prev <= 5) {
          sound.playCountdown();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Keyboard support for desktop / laptops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleKeyPress('clear');
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentInput, question, currentUser]);

  const handleKeyPress = (key: string) => {
    sound.playClick();
    if (key === 'clear') {
      setCurrentInput('');
    } else if (key === 'submit') {
      handleSubmit();
    } else {
      if (currentInput.length < 5) {
        setCurrentInput((prev) => prev + key);
      }
    }
  };

  const handleSubmit = () => {
    if (!currentInput.trim()) return;
    const parsed = parseInt(currentInput, 10);
    if (isNaN(parsed)) return;

    const evalResult = evaluateAnswer(
      parsed,
      question.answer,
      currentUser.currentStreak,
      settings.pointsPerCorrectAnswer,
      settings.streakBonus
    );

    if (evalResult.isCorrect) {
      sound.playCorrect();
      setLastFeedback({ isCorrect: true, text: `정답! +${evalResult.pointsEarned}점` });
    } else {
      sound.playIncorrect();
      setLastFeedback({ isCorrect: false, text: `오답 (정답: ${question.answer})` });
    }

    // Update player
    setCurrentUser((prev) => ({
      ...prev,
      score: prev.score + evalResult.pointsEarned,
      correctCount: prev.correctCount + (evalResult.isCorrect ? 1 : 0),
      incorrectCount: prev.incorrectCount + (evalResult.isCorrect ? 0 : 1),
      currentStreak: evalResult.newStreak,
      maxStreak: Math.max(prev.maxStreak, evalResult.maxStreak),
    }));

    setSolvedCount((prev) => prev + 1);
    setCurrentInput('');

    // Generate immediate next question
    setQuestion(
      generateQuestion({
        operations: settings.operations,
        difficulty: settings.difficulty,
        grade: settings.grade,
        unitId: settings.unitId,
      })
    );
  };

  const totalAttempts = currentUser.correctCount + currentUser.incorrectCount;
  const accuracy = totalAttempts > 0 ? Math.round((currentUser.correctCount / totalAttempts) * 100) : 0;
  const timerRatio = Math.max(0, timeLeft / settings.timeLimitSeconds);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 select-none max-w-2xl mx-auto">
      {/* Top HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800">
              개인 타임어택
            </span>
            <span className="text-xs text-slate-400">{currentUser.displayName}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 font-mono font-bold text-amber-400 text-sm">
              <Zap className="w-4 h-4" />
              <span>{currentUser.score}점</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('타임어택을 중단하고 나가시겠습니까?')) onExitGame();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-300">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>{timeLeft}초 남음</span>
          </div>
          <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                timeLeft <= 10
                  ? 'bg-rose-500 animate-pulse'
                  : timeLeft <= 20
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${timerRatio * 100}%` }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-center text-xs">
          <div>
            <div className="text-slate-400">정답 수</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">{currentUser.correctCount}개</div>
          </div>
          <div>
            <div className="text-slate-400">정답률</div>
            <div className="font-mono font-bold text-white text-sm">{accuracy}%</div>
          </div>
          <div>
            <div className="text-slate-400">최대 콤보</div>
            <div className="font-mono font-bold text-amber-400 text-sm flex items-center justify-center gap-0.5">
              <Flame className="w-3.5 h-3.5 fill-current" />
              {currentUser.maxStreak}
            </div>
          </div>
        </div>
      </div>

      {/* Center Question Box */}
      <div className="my-4 p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500/40 text-center shadow-lg relative">
        {currentUser.currentStreak >= 2 && (
          <div className="absolute top-3 right-3 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{currentUser.currentStreak} 콤보!</span>
          </div>
        )}

        <div className="text-4xl sm:text-6xl font-extrabold font-mono tracking-tight text-white mb-3">
          {question.prompt}
        </div>

        {/* Feedback flash */}
        <div className="h-6">
          {lastFeedback && (
            <span
              className={`text-xs font-bold ${
                lastFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {lastFeedback.text}
            </span>
          )}
        </div>

        {/* Current Input Preview */}
        <div className="mt-2 py-3 px-6 rounded-xl bg-slate-950 border border-slate-800 inline-block min-w-[200px]">
          <span className="text-3xl font-mono font-extrabold tracking-widest text-white">
            {currentInput || <span className="text-slate-600">_ _ _</span>}
          </span>
        </div>
      </div>

      {/* Large Touch Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(String(num))}
            className="h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-2xl font-bold font-mono text-white border border-slate-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          onClick={() => handleKeyPress('clear')}
          className="h-14 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-sm font-bold text-slate-300 border border-slate-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
        >
          <Delete className="w-5 h-5" />
          <span>지움</span>
        </button>

        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="h-14 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-indigo-600 text-2xl font-bold font-mono text-white border border-slate-700 active:scale-95 transition-all shadow-md flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          disabled={!currentInput}
          onClick={handleSubmit}
          className="h-14 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 text-sm font-bold text-white border border-emerald-500 disabled:border-slate-700 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
        >
          <CornerDownLeft className="w-5 h-5" />
          <span>입력</span>
        </button>
      </div>
    </div>
  );
};
