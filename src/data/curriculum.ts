import { Operation } from '../domain/types';

export interface CurriculumUnit {
  id: string;
  name: string;
  description: string;
  recommendedOperations: Operation[];
  minGrade: number;
  maxGrade: number;
}

export const GRADE_OPTIONS = [
  { value: 0, label: '전학년 종합', subtitle: '사칙연산 자유 구성' },
  { value: 1, label: '초등 1학년', subtitle: '한 자리 덧셈·뺄셈' },
  { value: 2, label: '초등 2학년', subtitle: '두 자리 연산 및 구구단' },
  { value: 3, label: '초등 3학년', subtitle: '세 자리 연산과 나눗셈 기초' },
  { value: 4, label: '초등 4학년', subtitle: '큰 수 연산과 혼합 계산 기초' },
  { value: 5, label: '초등 5학년', subtitle: '복합 자연수 연산' },
  { value: 6, label: '초등 6학년', subtitle: '고난도 종합 연산' },
];

export const CURRICULUM_UNITS: CurriculumUnit[] = [
  {
    id: 'basic-addition-subtraction',
    name: '기본 덧셈과 뺄셈 (10 이하 / 한 자리)',
    description: '1~9 범위의 기초 덧셈과 뺄셈',
    recommendedOperations: ['addition', 'subtraction'],
    minGrade: 1,
    maxGrade: 1,
  },
  {
    id: 'carry-borrow-2digit',
    name: '두 자리 수 덧셈·뺄셈 (받아올림/내림)',
    description: '10~99 범위의 자연수 덧셈과 뺄셈',
    recommendedOperations: ['addition', 'subtraction'],
    minGrade: 1,
    maxGrade: 3,
  },
  {
    id: 'multiplication-table',
    name: '구구단 (2단~9단 기초)',
    description: '구구단 2단부터 9단까지 곱셈',
    recommendedOperations: ['multiplication'],
    minGrade: 2,
    maxGrade: 3,
  },
  {
    id: 'basic-division',
    name: '기초 나눗셈 (구구단 범위)',
    description: '나누어떨어지는 1자리~2자리 나눗셈',
    recommendedOperations: ['division'],
    minGrade: 3,
    maxGrade: 4,
  },
  {
    id: 'grade4-multiplication',
    name: '4학년 곱셈 (두 자리×두 자리 / 세 자리×한 자리)',
    description: '4학년 곱셈 계산 및 응용 연산',
    recommendedOperations: ['multiplication'],
    minGrade: 4,
    maxGrade: 4,
  },
  {
    id: 'multi-digit-mixed',
    name: '두 자리 곱셈 및 큰 수 나눗셈',
    description: '두 자리 수 곱셈 및 두 자리÷한 자리 나눗셈',
    recommendedOperations: ['multiplication', 'division'],
    minGrade: 3,
    maxGrade: 6,
  },
  {
    id: 'all-operations',
    name: '사칙연산 스피드 종합 배틀',
    description: '덧셈, 뺄셈, 곱셈, 나눗셈 랜덤 출제',
    recommendedOperations: ['addition', 'subtraction', 'multiplication', 'division'],
    minGrade: 0,
    maxGrade: 6,
  },
];

export const OPERATION_META: Record<
  Operation,
  { label: string; symbol: string; badgeColor: string; bgSoft: string; textDark: string }
> = {
  addition: {
    label: '덧셈',
    symbol: '+',
    badgeColor: 'bg-emerald-600 text-white',
    bgSoft: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    textDark: 'text-emerald-700',
  },
  subtraction: {
    label: '뺄셈',
    symbol: '-',
    badgeColor: 'bg-blue-600 text-white',
    bgSoft: 'bg-blue-50 border-blue-200 text-blue-800',
    textDark: 'text-blue-700',
  },
  multiplication: {
    label: '곱셈',
    symbol: '×',
    badgeColor: 'bg-amber-600 text-white',
    bgSoft: 'bg-amber-50 border-amber-200 text-amber-800',
    textDark: 'text-amber-700',
  },
  division: {
    label: '나눗셈',
    symbol: '÷',
    badgeColor: 'bg-rose-600 text-white',
    bgSoft: 'bg-rose-50 border-rose-200 text-rose-800',
    textDark: 'text-rose-700',
  },
};

export const PLAYER_COLORS = [
  { key: 'red', name: '레드', bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-500', light: 'bg-rose-50 border-rose-200 text-rose-900', border: 'border-rose-400' },
  { key: 'blue', name: '블루', bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500', light: 'bg-blue-50 border-blue-200 text-blue-900', border: 'border-blue-400' },
  { key: 'green', name: '그린', bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-900', border: 'border-emerald-400' },
  { key: 'amber', name: '옐로', bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-500', light: 'bg-amber-50 border-amber-200 text-amber-900', border: 'border-amber-400' },
  { key: 'purple', name: '퍼플', bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-500', light: 'bg-purple-50 border-purple-200 text-purple-900', border: 'border-purple-400' },
  { key: 'teal', name: '민트', bg: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-500', light: 'bg-teal-50 border-teal-200 text-teal-900', border: 'border-teal-400' },
];
