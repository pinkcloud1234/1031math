import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API Key initialization
const apiKey = process.env.GEMINI_API_KEY || 'AQ.Ab8RN6LiawCPknDKbMf2JTq-joUEytWS27GoGAYrALzRUpTfPg';
const ai = new GoogleGenAI({ apiKey });

// Gemini model choice: gemini-3.8-flash for rapid tutoring responses
const TUTOR_MODEL = 'gemini-3.8-flash';

// Fallback message generator for zero-latency / offline resilience
function getFallbackHint(question: string, consecutiveIncorrect: number, grade: number = 4): string {
  if (consecutiveIncorrect <= 1) {
    return `괜찮아, 조금만 더 생각하면 풀 수 있어! ${question}에서 앞자리와 뒷자리를 나누어서 계산해볼까?`;
  } else if (consecutiveIncorrect === 2) {
    return `두 번 틀려도 전혀 문제없어! 차근차근 쪼개보자. 예: 34 × 6은 (30 × 6) + (4 × 6)으로 나눠서 더하면 훨씬 쉬워!`;
  } else {
    return `침착하게 호흡 한번 쉬어가자! 3번 도전한 너의 용기가 대단해. 급하게 풀지 말고 십의 자리 곱셈부터 천천히 종이에 적어보자!`;
  }
}

function getFallbackPraise(streak: number, playerName: string = '학생'): string {
  if (streak <= 1) {
    return `나이스! 멋지게 정답을 맞혔어, ${playerName}! 👏`;
  } else if (streak === 2) {
    return `대단해! 벌써 2연속 정답이야! 계산 집중력이 최고조에 달했어! 🔥`;
  } else if (streak === 3) {
    return `와아! 3연속 스트라이크 콤보 폭발!! 🌟 수학 천재 등장! 이 기세를 유지하자!`;
  } else {
    return `믿을 수 없어! ${streak}연속 정답 돌파! 교실 최고의 매쓰 마스터 탄생! 👑🚀`;
  }
}

async function safeGenerateText(prompt: string, fallback: string): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('AI timeout')), 4500)
    );
    const apiPromise = (async () => {
      const response = await ai.models.generateContent({
        model: TUTOR_MODEL,
        contents: prompt,
      });
      return response.text?.trim() || fallback;
    })();

    return await Promise.race([apiPromise, timeoutPromise]);
  } catch (err) {
    console.warn('AI call resolved with pedagogical fallback:', err);
    return fallback;
  }
}

// 1. Hint endpoint
app.post('/api/tutor/hint', async (req, res) => {
  const { question, answer, userAnswer, consecutiveIncorrect = 1, grade = 4 } = req.body;
  const fallback = getFallbackHint(question, consecutiveIncorrect, grade);

  const prompt = `당신은 초등학교 수학 교실의 다정하고 유쾌한 AI 수학 튜터 '매쓰 멘토'입니다.
현재 문제: "${question}"
정답: ${answer}
학생이 입력한 답: ${userAnswer ?? '모름'}
연속 오답 횟수: ${consecutiveIncorrect}회
대상 학년: 초등 ${grade}학년

요구사항:
1. 연속 오답 횟수에 맞춰 격려와 힌트의 깊이를 조절하세요:
   - 1회 오답: 따뜻한 격려 + 가벼운 한 줄 생각거리.
   - 2회 연속 오답: "실수는 배움의 기회"라는 공감 + 수를 십의 자리/일의 자리로 쪼개어 곱하는 단계별 팁.
   - 3회 이상 연속 오답: 진심 어린 응원과 위로 + 가장 기초 원리부터 친절하게 안내.
2. 절대로 최종 정답 숫자를 직접 말하지 마세요.
3. 2~3문장의 짧고 친근한 해요체(~해볼까?, ~할 수 있어!)와 귀여운 이모지를 사용하세요.`;

  const hint = await safeGenerateText(prompt, fallback);
  res.json({ hint });
});

// 2. Praise endpoint
app.post('/api/tutor/praise', async (req, res) => {
  const { question, streak = 1, playerName = '학생' } = req.body;
  const fallback = getFallbackPraise(streak, playerName);

  const prompt = `당신은 초등학교 수학 교실의 다정하고 신나는 AI 수학 튜터 '매쓰 멘토'입니다.
학생: ${playerName}
푼 문제: "${question}"
연속 정답(콤보): ${streak}연속 정답!

요구사항:
- ${streak}회 연속 정답에 어울리는 인정과 칭찬 메시지 작성:
  - 1회: 상쾌한 축하 ("정답이야! 멋져!").
  - 2회: 2연속에 대한 칭찬 ("집중력이 최고야!").
  - 3회: 3연속 콤보 폭발 환호 ("3연속 폭발! 천재적인 계산 감각!").
  - 4회 이상: 전설적인 실력이라는 극찬.
- 1~2문장의 경쾌한 한국어와 이모지(🔥, ✨, 🎉, 👏) 포함.`;

  const praise = await safeGenerateText(prompt, fallback);
  res.json({ praise });
});

// 3. Freeform Math Tutor Chat endpoint
app.post('/api/tutor/chat', async (req, res) => {
  const { message, currentQuestion = null, grade = 4 } = req.body;
  const contextInfo = currentQuestion ? `(현재 문제: ${currentQuestion.prompt})` : '';
  const fallback = '수학은 원리를 알면 정말 재미있는 마법 같아! 십의 자리부터 차근차근 쪼개어 계산하면 훨씬 쉽게 풀 수 있어! 😊';

  const prompt = `당신은 초등학생들을 위한 친절한 AI 수학 튜터 '매쓰 멘토'입니다.
학생 대상: 초등 ${grade}학년.
${contextInfo}

학생의 질문: "${message}"

요구사항:
- 초등학생 눈높이에 맞게 쉽고 재미있게 수학 원리를 설명하세요.
- 계산법 질문일 경우 최종 답만 주지 말고, 어떻게 나누어 생각하면 쉬운지 단계별 비법을 알려주세요.
- 2~3문장 내외로 친근하게 답변하세요.`;

  const reply = await safeGenerateText(prompt, fallback);
  res.json({ reply });
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`매쓰 아레나 서버가 포트 ${port}에서 실행 중입니다.`);
});
