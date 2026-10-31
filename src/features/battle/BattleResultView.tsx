import React, { useEffect } from 'react';
import { Trophy, RotateCcw, Home, Award, Flame, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
import { BattleRecord, GameSettings, Player } from '../../domain/types';
import { calculateRankings } from '../../domain/scoring/battleRules';
import { PLAYER_COLORS } from '../../data/curriculum';
import { saveBattleRecord } from '../../services/recordStorage';
import { submitToHallOfFame } from '../../services/hallOfFameService';
import { sound } from '../../utils/sound';

interface BattleResultViewProps {
  settings: GameSettings;
  finalPlayers: Player[];
  durationSeconds: number;
  onRestart: () => void;
  onBackToHome: () => void;
  onViewRecords: () => void;
  onOpenHallOfFame: () => void;
}

export const BattleResultView: React.FC<BattleResultViewProps> = ({
  settings,
  finalPlayers,
  durationSeconds,
  onRestart,
  onBackToHome,
  onViewRecords,
  onOpenHallOfFame,
}) => {
  const rankings = calculateRankings(finalPlayers);
  const winners = rankings.filter((r) => r.isWinner);

  useEffect(() => {
    sound.playFanfare();

    // Auto save battle record to localStorage
    const record: BattleRecord = {
      id: `record_${Date.now()}`,
      createdAt: new Date().toISOString(),
      playChannel: settings.playChannel,
      gameMode: settings.gameMode,
      settings,
      players: finalPlayers,
      winnerPlayerIds: winners.map((w) => w.player.id),
      durationSeconds,
    };
    saveBattleRecord(record);

    // Save players to Firebase Firestore Hall of Fame
    finalPlayers.forEach((p) => {
      const pRanking = rankings.find((r) => r.player.id === p.id);
      const entryId = `hof_${Date.now()}_${p.seatIndex}_${Math.floor(Math.random() * 1000)}`;
      submitToHallOfFame({
        id: entryId,
        nickname: p.displayName,
        score: p.score,
        accuracy: pRanking?.accuracy || 0,
        correctCount: p.correctCount,
        incorrectCount: p.incorrectCount,
        mode: settings.gameMode,
        grade: settings.grade,
        durationSeconds,
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('Failed to submit to Firestore Hall of Fame:', err);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getModeTitle = () => {
    switch (settings.gameMode) {
      case 'keypad':
        return '키패드 배틀 종료';
      case 'tug-of-war':
        return '줄다리기 배틀 종료';
      case 'solo':
        return '개인 타임어택 종료';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 select-none">
      {/* Top Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{getModeTitle()}</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          모든 문제가 종료되었습니다. 배틀 결과가 학급 기록에 안전하게 저장되었습니다.
        </p>
      </div>

      {/* Winner Spotlight (1st Place or Solo Achievement) */}
      {settings.gameMode !== 'solo' ? (
        <div className="bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-slate-50 border-2 border-amber-300 rounded-3xl p-6 text-center space-y-3 shadow-md">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
            {winners.length > 1 ? '공동 1위 승리!' : '배틀 챔피언!'}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {winners.map((w) => {
              const color = PLAYER_COLORS[w.player.seatIndex % PLAYER_COLORS.length];
              return (
                <div
                  key={w.player.id}
                  className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-amber-200"
                >
                  <span
                    className={`w-8 h-8 rounded-xl text-white font-bold text-sm flex items-center justify-center ${color.bg}`}
                  >
                    P{w.player.seatIndex + 1}
                  </span>
                  <span className="text-lg font-bold text-slate-900">{w.player.displayName}</span>
                  <span className="text-lg font-mono font-extrabold text-indigo-600">
                    {w.player.score}점
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-6 text-center space-y-2 shadow-sm">
          <div className="text-xs font-bold text-emerald-800">타임어택 완료!</div>
          <div className="text-3xl sm:text-4xl font-mono font-extrabold text-emerald-700">
            {finalPlayers[0]?.score || 0}점
          </div>
          <div className="text-xs text-emerald-600">
            정답 {finalPlayers[0]?.correctCount}개 / 정답률 {rankings[0]?.accuracy}%
          </div>
        </div>
      )}

      {/* Ranking List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
          <span>플레이어별 상세 성적</span>
          <span className="text-slate-500 font-normal">총 소요 시간: {durationSeconds}초</span>
        </div>

        <div className="divide-y divide-slate-100">
          {rankings.map((r) => {
            const color = PLAYER_COLORS[r.player.seatIndex % PLAYER_COLORS.length];
            return (
              <div
                key={r.player.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  r.isWinner ? 'bg-amber-50/40' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center ${
                      r.rank === 1
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : r.rank === 2
                        ? 'bg-slate-300 text-slate-800'
                        : r.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {r.rank}위
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-md text-white font-bold text-[11px] flex items-center justify-center ${color.bg}`}
                    >
                      P{r.player.seatIndex + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">{r.player.displayName}</span>
                    {r.isWinner && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        승리
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Scores & Details */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                  <div className="text-right hidden sm:block">
                    <div className="text-slate-400 text-[11px]">정답 / 오답</div>
                    <div className="font-medium text-slate-700">
                      <span className="text-emerald-600 font-bold">{r.player.correctCount}</span> /{' '}
                      <span className="text-rose-500">{r.player.incorrectCount}</span>
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-slate-400 text-[11px]">정답률</div>
                    <div className="font-semibold text-slate-800">{r.accuracy}%</div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-slate-400 text-[11px]">최대 콤보</div>
                    <div className="font-bold text-amber-600 flex items-center justify-end gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      {r.player.maxStreak}
                    </div>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="text-slate-400 text-[11px]">최종 점수</div>
                    <div className="text-lg font-mono font-extrabold text-indigo-600">
                      {r.player.score}점
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <RotateCcw className="w-4 h-4" />
          <span>같은 설정으로 다시 시작</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onBackToHome();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>게임 설정 홈으로</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onOpenHallOfFame();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-200 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <Trophy className="w-4 h-4 fill-current text-slate-950" />
          <span>명예의 전당 보기</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onViewRecords();
          }}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>학급 기록</span>
        </button>
      </div>
    </div>
  );
};
