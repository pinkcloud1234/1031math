import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Sparkles, CheckCircle2, Trophy, Clock, Flame, RotateCcw } from 'lucide-react';
import { GameSession, GameSettings, MathQuestion, Player } from '../domain/types';
import { generateQuestionList } from '../domain/questions/generateQuestion';
import { PLAYER_COLORS } from '../data/curriculum';
import { sound } from '../utils/sound';

interface BattleArenaPreviewProps {
  settings: GameSettings;
  players: Player[];
  onBackToSetup: () => void;
}

export const BattleArenaPreview: React.FC<BattleArenaPreviewProps> = ({
  settings,
  players,
  onBackToSetup,
}) => {
  const [questions] = useState<MathQuestion[]>(() =>
    generateQuestionList(settings.questionCount, {
      operations: settings.operations,
      difficulty: settings.difficulty,
      grade: settings.grade,
      unitId: settings.unitId,
      includeChoices: settings.gameMode === 'tug-of-war',
    })
  );

  const [activeTab, setActiveTab] = useState<'layout' | 'questions'>('layout');

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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-white p-4 sm:p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onBackToSetup();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>설정으로 돌아가기</span>
          </button>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>
                {settings.gameMode === 'keypad'
                  ? '키패드 배틀'
                  : settings.gameMode === 'tug-of-war'
                  ? '줄다리기 배틀'
                  : '개인 타임어택'}
              </span>
              <span className="text-xs font-normal text-slate-400">
                ({players.length}인 · 총 {questions.length}문제)
              </span>
            </h2>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'layout' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            화면 분할 구조
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'questions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            출제 문항 ({questions.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center">
        {activeTab === 'layout' ? (
          <div className="space-y-4">
            {/* Notice */}
            <div className="bg-indigo-950/60 border border-indigo-500/30 rounded-xl p-3 text-center text-xs text-indigo-300">
              <span className="font-bold text-indigo-200">1단계 점검 화면:</span> 아래는 공용 화면에서 각
              플레이어에게 할당되는 전자칠판 영역입니다. 2단계에서 실시간 인터랙티브 키패드/줄다리기 게임 플레이가
              연결됩니다.
            </div>

            {/* Split Screen Layout Preview */}
            <div className={`grid ${getGridCols(players.length)} gap-3 h-full`}>
              {players.map((p, idx) => {
                const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                return (
                  <div
                    key={p.id}
                    className="bg-slate-800/90 rounded-2xl border-2 border-slate-700 p-4 flex flex-col justify-between shadow-lg min-h-[220px]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center ${color.bg}`}
                        >
                          P{idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm">{p.displayName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-amber-400">{p.score}점</div>
                      </div>
                    </div>

                    {/* Virtual Keypad Mockup for Visual Structure */}
                    <div className="my-3 py-3 border-y border-slate-700/60 text-center">
                      <div className="text-xs text-slate-400 mb-1">입력 대기중</div>
                      <div className="font-mono text-2xl font-bold tracking-widest text-slate-500">
                        _ _ _
                      </div>
                    </div>

                    {/* Keypad Mock Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 opacity-60 pointer-events-none">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '지움', 0, '제출'].map((btn, bIdx) => (
                        <div
                          key={bIdx}
                          className="bg-slate-700/80 rounded-md py-1.5 text-center text-xs font-mono font-semibold text-slate-300"
                        >
                          {btn}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Question List Review */
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 max-h-[60vh] overflow-y-auto space-y-2">
            <h3 className="text-sm font-bold text-slate-300 mb-2">출제 문제 리스트 ({questions.length}개)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between"
                >
                  <div className="text-xs text-slate-400">
                    <span className="font-bold text-slate-200 mr-2">Q{idx + 1}.</span>
                    <span className="font-mono text-white text-sm">{q.prompt}</span>
                  </div>
                  <div className="font-mono font-bold text-emerald-400 text-sm">답: {q.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-500">
        매쓰 아레나 MVP 1단계 · 문제 엔진 검증 및 설정 완료 · 2단계 키패드/줄다리기 배틀 실행 엔진 대기
      </div>
    </div>
  );
};
