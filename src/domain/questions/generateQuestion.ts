import { Difficulty, MathQuestion, Operation } from '../types';

export interface GenerateQuestionOptions {
  operations?: Operation[];
  difficulty?: Difficulty;
  grade?: number;
  unitId?: string;
  rng?: () => number; // Optional custom RNG for deterministic testing
  includeChoices?: boolean;
  choicesCount?: number;
}

/**
 * Returns a random integer in [min, max] inclusive using provided or default RNG.
 */
function randomInt(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Generates plausibly confusing wrong choices close to the correct answer.
 */
export function generateChoices(
  answer: number,
  count: number = 3,
  minVal: number = 0,
  rng: () => number = Math.random
): number[] {
  const choicesSet = new Set<number>([answer]);
  const offsets = [-10, 10, -1, 1, -2, 2, -5, 5, -20, 20];
  
  // Try plausible offsets first
  let attempts = 0;
  while (choicesSet.size < count && attempts < 40) {
    attempts++;
    const offset = offsets[Math.floor(rng() * offsets.length)];
    const candidate = answer + offset;
    if (candidate >= minVal && candidate !== answer) {
      choicesSet.add(candidate);
    }
  }

  // Fallback if still not enough unique choices
  let delta = 1;
  while (choicesSet.size < count) {
    const candidateHigh = answer + delta;
    const candidateLow = answer - delta;
    if (!choicesSet.has(candidateHigh)) {
      choicesSet.add(candidateHigh);
    }
    if (choicesSet.size < count && candidateLow >= minVal && !choicesSet.has(candidateLow)) {
      choicesSet.add(candidateLow);
    }
    delta++;
  }

  // Shuffle choices
  const choices = Array.from(choicesSet);
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  return choices;
}

/**
 * Core mathematical question generator supporting elementary grades 1-6 and general modes.
 */
export function generateQuestion(options: GenerateQuestionOptions = {}): MathQuestion {
  const rng = options.rng ?? Math.random;
  const operations = options.operations && options.operations.length > 0
    ? options.operations
    : (['addition', 'subtraction', 'multiplication', 'division'] as Operation[]);
  
  const difficulty = options.difficulty ?? 'normal';
  const grade = options.grade ?? 0;
  
  // Pick an operation uniformly at random from allowed set
  const op = operations[Math.floor(rng() * operations.length)];

  let num1 = 0;
  let num2 = 0;
  let answer = 0;
  let prompt = '';

  switch (op) {
    case 'addition': {
      if (grade === 1 || difficulty === 'easy') {
        // 1자리 + 1자리 (결과 <= 18)
        num1 = randomInt(1, 9, rng);
        num2 = randomInt(1, 9, rng);
      } else if (difficulty === 'normal') {
        // 2자리 + 1~2자리
        num1 = randomInt(10, 89, rng);
        num2 = randomInt(5, 50, rng);
      } else {
        // 2자리 + 2자리 또는 3자리
        num1 = randomInt(35, 99, rng);
        num2 = randomInt(25, 99, rng);
      }
      answer = num1 + num2;
      prompt = `${num1} + ${num2} = ?`;
      break;
    }

    case 'subtraction': {
      if (grade === 1 || difficulty === 'easy') {
        // 1자리 - 1자리 (결과 >= 0)
        num1 = randomInt(2, 10, rng);
        num2 = randomInt(1, num1, rng);
      } else if (difficulty === 'normal') {
        // 2자리 - 1~2자리
        num1 = randomInt(15, 99, rng);
        num2 = randomInt(5, num1, rng);
      } else {
        // 2자리 - 2자리 (받아내림 유도)
        num1 = randomInt(40, 100, rng);
        num2 = randomInt(15, num1 - 1, rng);
      }
      answer = num1 - num2;
      prompt = `${num1} - ${num2} = ?`;
      break;
    }

    case 'multiplication': {
      if (grade === 4) {
        if (difficulty === 'easy') {
          // 4학년 기초: (두 자리 수) × (한 자리 수), 예: 15 × 4
          num1 = randomInt(11, 49, rng);
          num2 = randomInt(2, 9, rng);
        } else if (difficulty === 'normal') {
          // 4학년 표준: (두 자리 수) × (한 자리 수) 또는 (두 자리 수) × (두 자리 수, 10대~20대)
          if (rng() < 0.5) {
            num1 = randomInt(25, 89, rng);
            num2 = randomInt(3, 9, rng);
          } else {
            num1 = randomInt(12, 35, rng);
            num2 = randomInt(11, 25, rng);
          }
        } else {
          // 4학년 도전: (세 자리 수) × (한 자리 수) 또는 (두 자리 수) × (두 자리 수)
          if (rng() < 0.5) {
            num1 = randomInt(110, 350, rng);
            num2 = randomInt(2, 9, rng);
          } else {
            num1 = randomInt(25, 75, rng);
            num2 = randomInt(15, 45, rng);
          }
        }
      } else if (difficulty === 'easy') {
        // 2단~5단 기초
        num1 = randomInt(2, 5, rng);
        num2 = randomInt(1, 9, rng);
      } else if (difficulty === 'normal') {
        // 2단~9단 구구단
        num1 = randomInt(2, 9, rng);
        num2 = randomInt(2, 9, rng);
      } else {
        // 두 자리 x 한 자리 (예: 12 x 4) 또는 9단 이상
        num1 = randomInt(11, 25, rng);
        num2 = randomInt(2, 9, rng);
      }
      answer = num1 * num2;
      prompt = `${num1} × ${num2} = ?`;
      break;
    }

    case 'division': {
      // Must divide evenly, never divide by 0
      if (difficulty === 'easy') {
        const divisor = randomInt(2, 5, rng);
        const quotient = randomInt(1, 9, rng);
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
      } else if (difficulty === 'normal') {
        const divisor = randomInt(2, 9, rng);
        const quotient = randomInt(2, 9, rng);
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
      } else {
        const divisor = randomInt(3, 12, rng);
        const quotient = randomInt(5, 20, rng);
        num1 = divisor * quotient;
        num2 = divisor;
        answer = quotient;
      }
      prompt = `${num1} ÷ ${num2} = ?`;
      break;
    }
  }

  const id = `q_${Date.now()}_${Math.floor(rng() * 1000000)}`;

  const question: MathQuestion = {
    id,
    prompt,
    num1,
    num2,
    answer,
    operation: op,
    difficulty,
    grade,
    unitId: options.unitId,
  };

  if (options.includeChoices) {
    const choiceCount = options.choicesCount ?? 3;
    question.choices = generateChoices(answer, choiceCount, 0, rng);
  }

  return question;
}

/**
 * Generates an array of non-duplicate (different prompts) questions.
 */
export function generateQuestionList(count: number, options: GenerateQuestionOptions = {}): MathQuestion[] {
  const list: MathQuestion[] = [];
  const seenPrompts = new Set<string>();
  const rng = options.rng ?? Math.random;

  let retries = 0;
  while (list.length < count && retries < count * 10) {
    const q = generateQuestion({ ...options, rng });
    if (!seenPrompts.has(q.prompt) || retries > count * 3) {
      seenPrompts.add(q.prompt);
      list.push(q);
    }
    retries++;
  }

  return list;
}
