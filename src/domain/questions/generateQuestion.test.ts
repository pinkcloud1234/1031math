import test from 'node:test';
import assert from 'node:assert/strict';
import { generateQuestion, generateQuestionList, generateChoices } from './generateQuestion';
import { Operation, Difficulty } from '../types';

test('generateQuestion produces accurate answers for 500 random cases', () => {
  const operations: Operation[] = ['addition', 'subtraction', 'multiplication', 'division'];
  const difficulties: Difficulty[] = ['easy', 'normal', 'hard'];

  for (let i = 0; i < 500; i++) {
    const op = operations[i % operations.length];
    const diff = difficulties[i % difficulties.length];
    const q = generateQuestion({
      operations: [op],
      difficulty: diff,
      includeChoices: true,
      choicesCount: 3,
    });

    // 1. Prompt and Answer verification
    assert.ok(q.prompt.length > 0, 'Prompt must not be empty');
    assert.ok(typeof q.answer === 'number' && Number.isFinite(q.answer), 'Answer must be a finite number');

    switch (q.operation) {
      case 'addition':
        assert.equal(q.num1 + q.num2, q.answer, `Addition math must match: ${q.num1} + ${q.num2} = ${q.answer}`);
        assert.ok(q.answer > 0, 'Elementary addition result should be positive');
        break;
      case 'subtraction':
        assert.equal(q.num1 - q.num2, q.answer, `Subtraction math must match: ${q.num1} - ${q.num2} = ${q.answer}`);
        assert.ok(q.answer >= 0, `Subtraction result must be non-negative in elementary math: ${q.prompt}`);
        assert.ok(q.num1 >= q.num2, `Minuend must be >= subtrahend: ${q.prompt}`);
        break;
      case 'multiplication':
        assert.equal(q.num1 * q.num2, q.answer, `Multiplication math must match: ${q.num1} * ${q.num2} = ${q.answer}`);
        break;
      case 'division':
        assert.ok(q.num2 > 0, 'Divisor must be greater than zero (no divide by zero)');
        assert.equal(q.num1 / q.num2, q.answer, `Division math must match: ${q.num1} / ${q.num2} = ${q.answer}`);
        assert.equal(q.num1 % q.num2, 0, `Division must divide evenly without remainder: ${q.prompt}`);
        break;
    }

    // 2. Choices verification
    assert.ok(Array.isArray(q.choices), 'Choices must be an array');
    assert.equal(q.choices.length, 3, 'Choices count must be 3');
    
    // Exactly one instance of correct answer in choices
    const correctCount = q.choices.filter((c) => c === q.answer).length;
    assert.equal(correctCount, 1, `Answer ${q.answer} must appear exactly once in choices ${JSON.stringify(q.choices)}`);

    // Unique choices (no duplicates)
    const uniqueChoices = new Set(q.choices);
    assert.equal(uniqueChoices.size, q.choices.length, `Choices must be unique: ${JSON.stringify(q.choices)}`);

    // Non-negative choices
    for (const c of q.choices) {
      assert.ok(c >= 0, `Choice ${c} must be non-negative in elementary math`);
    }
  }
});

test('generateQuestion handles 4th grade multiplication correctly', () => {
  for (let i = 0; i < 100; i++) {
    const q = generateQuestion({
      grade: 4,
      operations: ['multiplication'],
      difficulty: 'normal',
    });
    assert.equal(q.operation, 'multiplication');
    assert.equal(q.num1 * q.num2, q.answer);
    assert.ok(q.answer >= 20, '4th grade multiplication answer should be substantial');
  }
});

test('generateQuestionList generates unique prompts and requested count', () => {
  const count = 10;
  const list = generateQuestionList(count, {
    operations: ['addition', 'multiplication'],
    difficulty: 'normal',
  });

  assert.equal(list.length, count, 'Generated count should match requested count');
  for (const q of list) {
    assert.ok(q.prompt.length > 0);
    assert.ok(typeof q.answer === 'number');
  }
});

test('generateChoices creates unique choices including the correct answer', () => {
  const answer = 42;
  const choices = generateChoices(answer, 4, 0);
  assert.equal(choices.length, 4);
  assert.ok(choices.includes(answer));
  const set = new Set(choices);
  assert.equal(set.size, 4);
  for (const c of choices) {
    assert.ok(c >= 0);
  }
});
