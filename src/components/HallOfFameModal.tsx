import React, { useState, useEffect } from 'react';
import { Trophy, X, Medal, Sparkles, Flame, Clock, Award, Filter, RotateCcw, User } from 'lucide-react';
import { HallOfFameEntry, getHallOfFameEntries } from '../services/hallOfFameService';
import { sound } from '../utils/sound';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightEntryId?: string | null;
}

export const HallOfFameModal: React.FC<HallOfFameModalProps> = ({
  isOpen,
  onClose,
  highlightEntryId,
}) => {
  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async (mode?: string) => {
    setLoading(true);
    try {
      const data = await getHallOfFameEntries(mode || filterMode);
      setEntries(data);
    } catch (err) {
      console.error('Failed to load hall of fame:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData(filterMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filterMode]);

  if (!isOpen) return null;

  const top3 = entries.slice(0, 3);
  const remaining = entries.slice(3);

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'keypad':
        return '키패드 배틀';
      case 'tug-of-war':
        return '줄다리기';
      case 'solo':
        return '타임어택';
      default:
        return mode;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white p-5 flex items-center justify-between shrink-0 shadow-sm relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md border border-white/30">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">매쓰 아레나 명예의 전당</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  Firebase 실시간 랭킹
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                수학 배틀을 정복한 최고 득점자들의 영광스러운 기록입니다!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                loadData(filterMode);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="새로고침"
              aria-label="새로고침"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5" /> 배틀 모드:
          </span>
          {[
            { id: 'all', label: '전체 모드' },
            { id: 'keypad', label: '키패드 배틀' },
            { id: 'tug-of-war', label: '줄다리기 배틀' },
            { id: 'solo', label: '개인 타임어택' },
          ].map((tab) => {
            const active = filterMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFilterMode(tab.id);
                }}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {loading && entries.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Trophy className="w-12 h-12 mx-auto text-amber-400/50 animate-bounce" />
              <p className="text-sm font-semibold text-slate-600">명예의 전당 점수를 불러오는 중...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <Trophy className="w-14 h-14 mx-auto text-slate-300 stroke-1" />
              <p className="text-base font-bold text-slate-700">아직 등록된 명예의 전당 점수가 없습니다.</p>
              <p className="text-xs text-slate-400">
                수학 배틀을 완료하면 학습자의 점수가 이곳에 화려하게 등재됩니다!
              </p>
            </div>
          ) : (
            <>
              {/* Podium for Top 3 */}
              <div className="pt-2 pb-4">
                <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto items-end text-center">
                  {/* 2nd Place */}
                  {top3[1] ? (
                    <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-3 flex flex-col items-center shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-extrabold text-sm flex items-center justify-center mb-1 shadow-2xs">
                        2
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-full">
                        {top3[1].nickname}
                      </div>
                      <div className="font-mono text-base font-extrabold text-indigo-600 mt-1">
                        {top3[1].score}점
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {getModeLabel(top3[1].mode)}
                      </span>
                    </div>
                  ) : (
                    <div className="h-28 rounded-2xl border border-dashed border-slate-200" />
                  )}

                  {/* 1st Place (Center, Tallest) */}
                  {top3[0] && (
                    <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 border-2 border-amber-400 rounded-2xl p-4 flex flex-col items-center shadow-md relative -translate-y-2">
                      <div className="absolute -top-3 w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center shadow-md">
                        👑
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-extrabold text-base flex items-center justify-center mb-1 shadow-xs">
                        1
                      </div>
                      <div className="font-extrabold text-sm sm:text-base text-slate-900 truncate max-w-full">
                        {top3[0].nickname}
                      </div>
                      <div className="font-mono text-xl font-extrabold text-indigo-700 mt-1">
                        {top3[0].score}점
                      </div>
                      <span className="text-[11px] font-semibold text-amber-800 mt-0.5">
                        정답률 {top3[0].accuracy}%
                      </span>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {top3[2] ? (
                    <div className="bg-slate-50 border-2 border-amber-700/30 rounded-2xl p-3 flex flex-col items-center shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-amber-700 text-white font-extrabold text-sm flex items-center justify-center mb-1 shadow-2xs">
                        3
                      </div>
                      <div className="font-bold text-xs sm:text-sm text-slate-800 truncate max-w-full">
                        {top3[2].nickname}
                      </div>
                      <div className="font-mono text-base font-extrabold text-indigo-600 mt-1">
                        {top3[2].score}점
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        {getModeLabel(top3[2].mode)}
                      </span>
                    </div>
                  ) : (
                    <div className="h-24 rounded-2xl border border-dashed border-slate-200" />
                  )}
                </div>
              </div>

              {/* Full Leaderboard Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>전체 랭킹 순위 ({entries.length}명)</span>
                  <span className="text-slate-400 font-normal">점수순 정렬</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {entries.map((item, idx) => {
                    const isHighlighted = item.id === highlightEntryId;
                    const dateStr = new Date(item.createdAt).toLocaleDateString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                    });

                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          isHighlighted
                            ? 'bg-amber-100/60 ring-2 ring-amber-400 font-bold'
                            : idx < 3
                            ? 'bg-amber-50/20 hover:bg-slate-50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Rank & Nickname */}
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950 font-extrabold'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-800'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-bold text-slate-900">{item.nickname}</span>
                              {isHighlighted && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                  방금 달성!
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{getModeLabel(item.mode)}</span>
                              <span>·</span>
                              <span>{item.grade ? `초등 ${item.grade}학년` : '전학년'}</span>
                              <span>·</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        </div>

                        {/* Scores & Stats */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right hidden sm:block">
                            <div className="text-[10px] text-slate-400">정답률</div>
                            <div className="font-semibold text-slate-700">{item.accuracy}%</div>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-[10px] text-slate-400">최종 점수</div>
                            <div className="text-base sm:text-lg font-mono font-extrabold text-indigo-600">
                              {item.score}점
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
