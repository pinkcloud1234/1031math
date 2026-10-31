import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Lightbulb, Heart, RotateCcw, MessageCircle } from 'lucide-react';
import { sendTutorChatMessage, getAiHint } from '../services/aiTutorService';
import { sound } from '../utils/sound';

interface AiTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuestionPrompt?: string;
  currentAnswer?: number;
  grade?: number;
  initialHint?: string | null;
}

interface ChatMessage {
  id: string;
  sender: 'tutor' | 'user';
  text: string;
  time: string;
}

export const AiTutorModal: React.FC<AiTutorModalProps> = ({
  isOpen,
  onClose,
  currentQuestionPrompt,
  currentAnswer,
  grade = 4,
  initialHint,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        const welcomeText = initialHint
          ? initialHint
          : `안녕! 나는 너의 수학 친구 '매쓰 멘토'야! 🌟\n문제가 어렵거나 헷갈릴 때는 언제든 나에게 물어봐. 정답 대신 쉽게 풀 수 있는 힌트를 친절하게 알려줄게!`;

        setMessages([
          {
            id: 'm_init',
            sender: 'tutor',
            text: welcomeText,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (initialHint) {
        setMessages((prev) => [
          ...prev,
          {
            id: `m_hint_${Date.now()}`,
            sender: 'tutor',
            text: initialHint,
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialHint]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    sound.playClick();
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendTutorChatMessage(text, currentQuestionPrompt, grade);
      const tutorMsg: ChatMessage = {
        id: `t_${Date.now()}`,
        sender: 'tutor',
        text: reply,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, tutorMsg]);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (quickText: string) => {
    handleSend(quickText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full flex flex-col h-[600px] max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-amber-300">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">AI 매쓰 멘토 챗봇</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  실시간 힌트 & 격려
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {currentQuestionPrompt ? `현재 문제: ${currentQuestionPrompt}` : '수학이 쉬워지는 생각 비법'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Question Kicker Banner if in game */}
        {currentQuestionPrompt && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-2 flex items-center justify-between text-xs text-indigo-900 shrink-0">
            <span className="flex items-center gap-1.5 font-bold">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>함께 풀고 있는 식:</span>
              <span className="font-mono text-indigo-700 text-sm">{currentQuestionPrompt}</span>
            </span>
            <span className="text-[11px] text-indigo-600 font-medium">초등 {grade}학년</span>
          </div>
        )}

        {/* Chat message list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/70">
          {messages.map((m) => {
            const isTutor = m.sender === 'tutor';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2.5 ${isTutor ? 'justify-start' : 'justify-end'}`}
              >
                {isTutor && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    멘토
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                    isTutor
                      ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs'
                      : 'bg-indigo-600 text-white rounded-tr-xs'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      isTutor ? 'text-slate-400' : 'text-indigo-200'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-11 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              <span>멘토 선생님이 힌트를 생각하고 있어요...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => handleQuickQuestion('이 문제 쉽게 암산하는 힌트 알려주세요!')}
            className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1"
          >
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>힌트 주세요</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickQuestion('계산이 자꾸 틀려서 속상해요. 격려 한마디 해주세요!')}
            className="text-[11px] font-medium bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1"
          >
            <Heart className="w-3 h-3 text-rose-500" />
            <span>응원 메시지</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickQuestion('두 자리 수 곱셈 쉽게 쪼개는 법 알려주세요!')}
            className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 shrink-0 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>곱셈 쪼개기 비법</span>
          </button>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="궁금한 수학 질문이나 힌트를 물어보세요..."
            maxLength={100}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-40 text-white transition-colors shadow-xs"
            aria-label="메시지 전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
