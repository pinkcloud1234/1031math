import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, Trophy, Users, Clock, Award, Filter, Share2, Check } from 'lucide-react';
import { BattleRecord, GameMode } from '../domain/types';
import { loadBattleRecords, clearAllBattleRecords, deleteBattleRecord } from '../services/recordStorage';
import { sound } from '../utils/sound';

interface RecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordsModal: React.FC<RecordsModalProps> = ({ isOpen, onClose }) => {
  const [records, setRecords] = useState<BattleRecord[]>([]);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRecords(loadBattleRecords());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearAll = () => {
    if (confirm('현재 기기에 저장된 모든 학급 배틀 기록을 삭제하시겠습니까?')) {
      clearAllBattleRecords();
      setRecords([]);
      sound.playClick();
    }
  };

  const handleDeleteOne = (id: string) => {
    deleteBattleRecord(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    sound.playClick();
  };

  const handleCopyShareLink = () => {
    sound.playClick();
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'keypad':
        return '키패드 배틀';
      case 'tug-of-war':
        return '줄다리기 배틀';
      case 'solo':
        return '개인 타임어택';
      default:
        return mode;
    }
  };

  const filteredRecords = filterMode === 'all'
    ? records
    : records.filter((r) => r.gameMode === filterMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">학급 최근 배틀 기록</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {records.length}건
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">이 기기 브라우저에 최대 100회까지 보관됩니다</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="flex items-center gap-1 text-xs text-indigo-700 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-colors"
              title="현재 웹앱 주소 복사"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? '복사됨!' : '링크 복사'}</span>
            </button>

            {records.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>전체 삭제</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2 shrink-0 overflow-x-auto">
          <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3 h-3" /> 필터:
          </span>
          {[
            { id: 'all', label: '전체' },
            { id: 'keypad', label: '키패드 배틀' },
            { id: 'tug-of-war', label: '줄다리기' },
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
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Trophy className="w-12 h-12 mx-auto stroke-1 mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">해당 조건의 배틀 기록이 없습니다.</p>
              <p className="text-xs text-slate-400 mt-1">새로운 수학 배틀을 완료하면 결과가 이곳에 기록됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((r) => {
                const dateStr = new Date(r.createdAt).toLocaleDateString('ko-KR', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-shadow shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                          {getModeLabel(r.gameMode)}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateStr}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {r.durationSeconds}초 소요
                        </span>
                        {r.settings.grade && (
                          <span className="text-xs text-slate-400">
                            초등 {r.settings.grade}학년
                          </span>
                        )}
                      </div>

                      {/* Players & Scores */}
                      <div className="flex items-center gap-2 flex-wrap text-sm pt-1">
                        {r.players.map((p) => {
                          const isWinner = r.winnerPlayerIds.includes(p.id);
                          return (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                isWinner
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isWinner && <Award className="w-3.5 h-3.5 text-amber-500 inline shrink-0" />}
                              <span className="truncate max-w-[80px]">{p.displayName}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-indigo-600 font-bold">{p.score}점</span>
                              <span className="text-slate-400 text-[10px]">
                                ({p.correctCount}/{p.correctCount + p.incorrectCount})
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteOne(r.id)}
                      className="self-end sm:self-center p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 transition-colors"
                      title="이 기록 삭제"
                      aria-label="이 기록 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
