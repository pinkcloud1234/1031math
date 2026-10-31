import React, { useState } from 'react';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { KeypadBattleView } from './features/battle/KeypadBattleView';
import { TugOfWarView } from './features/battle/TugOfWarView';
import { SoloTimeAttackView } from './features/battle/SoloTimeAttackView';
import { BattleResultView } from './features/battle/BattleResultView';
import { RulesModal } from './components/RulesModal';
import { RecordsModal } from './components/RecordsModal';
import { AiTutorModal } from './components/AiTutorModal';
import { AuthModal } from './components/AuthModal';
import { HallOfFameModal } from './components/HallOfFameModal';
import { GameSettings, MathQuestion, Player } from './domain/types';
import { generateQuestionList } from './domain/questions/generateQuestion';
import { getActiveUser, setActiveUser, UserProfile } from './services/userService';
import { Bot } from 'lucide-react';
import { sound } from './utils/sound';

type AppView = 'setup' | 'battle' | 'result';

export default function App() {
  const [view, setView] = useState<AppView>('setup');
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isRecordsOpen, setIsRecordsOpen] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const [tutorInitialHint, setTutorInitialHint] = useState<string | null>(null);

  // User Profile from Firebase/Local
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getActiveUser());

  // Active Session State
  const [currentSettings, setCurrentSettings] = useState<GameSettings | null>(null);
  const [currentPlayers, setCurrentPlayers] = useState<Player[]>([]);
  const [questions, setQuestions] = useState<MathQuestion[]>([]);

  // Result State
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);

  const handleStartGame = (settings: GameSettings, players: Player[]) => {
    setCurrentSettings(settings);
    setCurrentPlayers(players);

    // Generate fresh questions for session
    const list = generateQuestionList(settings.questionCount, {
      operations: settings.operations,
      difficulty: settings.difficulty,
      grade: settings.grade,
      unitId: settings.unitId,
      includeChoices: settings.gameMode === 'tug-of-war',
    });

    setQuestions(list);
    setView('battle');
  };

  const handleFinishGame = (finishedPlayers: Player[], elapsedSeconds: number) => {
    setFinalPlayers(finishedPlayers);
    setDurationSeconds(elapsedSeconds);
    setView('result');
  };

  const handleRestart = () => {
    if (!currentSettings) return;

    // Reset scores & streaks for players
    const resetPlayers = currentPlayers.map((p) => ({
      ...p,
      score: 0,
      correctCount: 0,
      incorrectCount: 0,
      currentStreak: 0,
      maxStreak: 0,
    }));

    handleStartGame(currentSettings, resetPlayers);
  };

  const handleBackToHome = () => {
    setView('setup');
  };

  const handleOpenTutor = (hint?: string) => {
    sound.playClick();
    setTutorInitialHint(hint || null);
    setIsTutorOpen(true);
  };

  const handleLogout = () => {
    sound.playClick();
    setActiveUser(null);
    setCurrentUser(null);
  };

  const handleAuthSuccess = (user: UserProfile) => {
    setCurrentUser(user);
  };

  // Current active question prompt if in battle
  const currentPrompt = questions[0]?.prompt;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900 relative">
      <Header
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenRecords={() => setIsRecordsOpen(true)}
        onOpenTutor={() => handleOpenTutor()}
        onOpenHallOfFame={() => {
          sound.playClick();
          setIsHallOfFameOpen(true);
        }}
        onOpenAuth={() => {
          sound.playClick();
          setIsAuthOpen(true);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col">
        {view === 'setup' && (
          <SetupView
            onStartGame={handleStartGame}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenHallOfFame={() => setIsHallOfFameOpen(true)}
          />
        )}

        {view === 'battle' && currentSettings && (
          <>
            {currentSettings.gameMode === 'keypad' && (
              <KeypadBattleView
                settings={currentSettings}
                initialPlayers={currentPlayers}
                questions={questions}
                onFinishGame={handleFinishGame}
                onExitGame={handleBackToHome}
                onOpenTutor={handleOpenTutor}
              />
            )}

            {currentSettings.gameMode === 'tug-of-war' && (
              <TugOfWarView
                settings={currentSettings}
                initialPlayers={currentPlayers}
                questions={questions}
                onFinishGame={handleFinishGame}
                onExitGame={handleBackToHome}
              />
            )}

            {currentSettings.gameMode === 'solo' && (
              <SoloTimeAttackView
                settings={currentSettings}
                player={currentPlayers[0]}
                onFinishGame={handleFinishGame}
                onExitGame={handleBackToHome}
              />
            )}
          </>
        )}

        {view === 'result' && currentSettings && (
          <BattleResultView
            settings={currentSettings}
            finalPlayers={finalPlayers}
            durationSeconds={durationSeconds}
            onRestart={handleRestart}
            onBackToHome={handleBackToHome}
            onViewRecords={() => setIsRecordsOpen(true)}
            onOpenHallOfFame={() => {
              sound.playClick();
              setIsHallOfFameOpen(true);
            }}
          />
        )}
      </main>

      {/* Floating AI Tutor Quick Trigger Button */}
      {view === 'setup' && (
        <button
          type="button"
          onClick={() => handleOpenTutor()}
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-300 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-indigo-400"
          title="AI 매쓰 멘토에게 수학 질문하기"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-amber-300" />
          </div>
          <span>AI 매쓰 멘토 챗봇</span>
        </button>
      )}

      {/* Modals */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      <RecordsModal isOpen={isRecordsOpen} onClose={() => setIsRecordsOpen(false)} />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <HallOfFameModal
        isOpen={isHallOfFameOpen}
        onClose={() => setIsHallOfFameOpen(false)}
      />
      <AiTutorModal
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        currentQuestionPrompt={currentPrompt}
        currentAnswer={questions[0]?.answer}
        grade={currentSettings?.grade || 4}
        initialHint={tutorInitialHint}
      />
    </div>
  );
}
