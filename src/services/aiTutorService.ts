export interface HintRequest {
  question: string;
  answer: number;
  userAnswer?: number;
  consecutiveIncorrect: number;
  grade?: number;
  operation?: string;
}

export interface PraiseRequest {
  question: string;
  streak: number;
  playerName: string;
}

export async function getAiHint(req: HintRequest): Promise<string> {
  try {
    const res = await fetch('/api/tutor/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.hint;
  } catch (err) {
    console.error('Failed to fetch AI hint:', err);
    if (req.consecutiveIncorrect <= 1) {
      return '괜찮아! 차근차근 다시 계산해보자. 앞자리부터 쪼개어 곱하면 훨씬 쉬워! 💪';
    } else if (req.consecutiveIncorrect === 2) {
      return '2번 연속 오답도 배움의 기회야! 십의 자리 곱셈과 일의 자리 곱셈을 따로 구해서 합쳐볼까? ✨';
    } else {
      return '3번이나 포기하지 않고 도전하다니 정말 멋져! 천천히 종이에 식을 적어가며 풀어보자. 넌 할 수 있어! 🌟';
    }
  }
}

export async function getAiPraise(req: PraiseRequest): Promise<string> {
  try {
    const res = await fetch('/api/tutor/praise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.praise;
  } catch (err) {
    console.error('Failed to fetch AI praise:', err);
    if (req.streak <= 1) {
      return `나이스! 멋지게 정답이야, ${req.playerName}! 👏`;
    } else if (req.streak === 2) {
      return `대단해! 2연속 정답! 계산 실력이 불붙고 있어! 🔥`;
    } else if (req.streak === 3) {
      return `와아! 3연속 콤보 폭발!! 수학 천재 탄생이야! 🌟`;
    } else {
      return `전설의 계산왕! ${req.streak}연속 콤보 대기록 달성! 👑🚀`;
    }
  }
}

export async function sendTutorChatMessage(message: string, currentQuestionPrompt?: string, grade: number = 4): Promise<string> {
  try {
    const res = await fetch('/api/tutor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        currentQuestion: currentQuestionPrompt ? { prompt: currentQuestionPrompt } : null,
        grade,
      }),
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.error('Failed to chat with AI tutor:', err);
    return '수학은 원리를 알면 정말 재미있는 마법 같아! 질문이 있다면 언제든 편하게 물어봐줘! 😊';
  }
}
