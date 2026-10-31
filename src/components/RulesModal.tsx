import React from 'react';
import { X, Touchpad, Play, Award, Smartphone } from 'lucide-react';
import { sound } from '../utils/sound';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">게임 규칙 및 교실 활용 팁</h2>
          </div>
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm text-slate-600">
          {/* Section 1: Play Channels */}
          <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-base mb-1">
              <Touchpad className="w-5 h-5 text-indigo-600" />
              1차 MVP: 교실 공용 화면 플레이
            </div>
            <p className="text-indigo-800 leading-relaxed text-xs sm:text-sm">
              전자칠판이나 교실 모니터 한 대에서 2~6명이 함께 플레이합니다. 학생 개인 기기나 별도 인터넷 연결,
              회원가입 없이 즉시 시작할 수 있습니다.
            </p>
          </div>

          {/* Section 2: Modes */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">배틀 모드별 규칙</h3>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                키패드 배틀 (2~6인 공용 화면 분할)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 pl-8">
                화면이 플레이어 수만큼 분할되어 각자 전용 대형 숫자 키패드가 주어집니다. 모두 같은 문제를 보며
                독립적으로 정답을 입력하고 제출합니다. 먼저 정확하게 제출한 학생이 점수를 획득합니다!
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-xs">
                  2
                </span>
                줄다리기 배틀 (1:1 선택지 배틀)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 pl-8">
                두 플레이어가 양쪽에서 3개의 보기 중 정답을 선택합니다. 정답을 맞출 때마다 중앙의 줄이 자기
                쪽으로 1칸 당겨집니다. 먼저 목표 지점까지 끌어오거나 제한시간 후 더 많이 당긴 사람이 승리합니다.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  3
                </span>
                개인 타임어택 (1인 스피드 챌린지)
              </div>
              <p className="text-xs sm:text-sm text-slate-600 pl-8">
                30초~120초의 제한 시간 동안 최대한 많은 문제를 연속으로 풉니다. 연속 정답(콤보)을 이어갈수록
                점수가 대폭 상승하며, 학급 내 최고 기록에 도전할 수 있습니다.
              </p>
            </div>
          </div>

          {/* Section 3: 2nd Phase Notice */}
          <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">학생 개인 기기 접속 안내:</span> 방 코드 및 QR코드로
              학생 개별 스마트폰이나 태블릿에서 실시간 접속해 대결하는 기능은 기획서에 따라 1차 공용화면 MVP 완성
              후 <span className="font-semibold text-indigo-600">2차 개발</span>에서 제공됩니다.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
