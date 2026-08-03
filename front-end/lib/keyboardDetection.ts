import type { KeyboardLayout } from './keyboardLayouts';
import { getDeadKey, getKeyOutput } from './keyboardLayouts';
import { getPhysicalKeyIdForCode } from './keyboardPhysical';

export type KeyboardDetectionQuestionId =
  | 'rightOfL'
  | 'leftOfBackspace'
  | 'shiftDigit2'
  | 'sixthTopRow'
  | 'firstTopRow'
  | 'quoteKey';

export interface KeyboardDetectionQuestion {
  id: KeyboardDetectionQuestionId;
  code: string;
  shiftKey: boolean;
  titleKey: string;
  helpKey: string;
}

export interface KeyboardDetectionSample {
  questionId: KeyboardDetectionQuestionId;
  code: string;
  key: string;
  shiftKey: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altGraphKey?: boolean;
  isComposing?: boolean;
}

export type KeyboardDetectionEventIssue =
  | 'composition'
  | 'unidentified'
  | 'alt-graph'
  | 'modified'
  | 'wrong-key';

export interface RankedKeyboardLayout {
  layout: KeyboardLayout;
  matches: number;
  matchRate: number;
  certainty: number;
}

export interface KeyboardDetectionAnalysis {
  ranked: RankedKeyboardLayout[];
  detectedLayout: KeyboardLayout | null;
  matchRate: number;
  certainty: number;
  margin: number;
  nextQuestion: KeyboardDetectionQuestion | null;
  exhausted: boolean;
  unidentified: boolean;
}

export const MAX_DETECTION_QUESTIONS = 5;
const MINIMUM_MATCHES = 2;
const DETECTION_CERTAINTY = 0.6;

export const KEYBOARD_DETECTION_QUESTIONS: readonly KeyboardDetectionQuestion[] = [
  {
    id: 'rightOfL',
    code: 'Semicolon',
    shiftKey: false,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.rightOfL.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.rightOfL.help',
  },
  {
    id: 'leftOfBackspace',
    code: 'Equal',
    shiftKey: false,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.leftOfBackspace.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.leftOfBackspace.help',
  },
  {
    id: 'shiftDigit2',
    code: 'Digit2',
    shiftKey: true,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.shiftDigit2.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.shiftDigit2.help',
  },
  {
    id: 'sixthTopRow',
    code: 'KeyY',
    shiftKey: false,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.sixthTopRow.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.sixthTopRow.help',
  },
  {
    id: 'firstTopRow',
    code: 'KeyQ',
    shiftKey: false,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.firstTopRow.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.firstTopRow.help',
  },
  {
    id: 'quoteKey',
    code: 'Quote',
    shiftKey: false,
    titleKey: 'components.lessons.keyboardDetectionWizard.general.questions.quoteKey.title',
    helpKey: 'components.lessons.keyboardDetectionWizard.general.questions.quoteKey.help',
  },
];

function normalizeKey(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('en');
}

export function getKeyboardDetectionEventIssue(
  sample: KeyboardDetectionSample,
  question?: KeyboardDetectionQuestion,
): KeyboardDetectionEventIssue | null {
  if (sample.isComposing || sample.key === 'Process' || sample.key === 'Compose')
    return 'composition';
  if (sample.code === 'Unidentified' || sample.key === 'Unidentified') return 'unidentified';
  if (sample.altGraphKey || (sample.altKey && sample.ctrlKey)) return 'alt-graph';
  if (sample.altKey || sample.ctrlKey || sample.metaKey) return 'modified';
  if (question && (sample.code !== question.code || sample.shiftKey !== question.shiftKey))
    return 'wrong-key';
  return null;
}

export function getExpectedKey(
  layout: KeyboardLayout,
  question: KeyboardDetectionQuestion,
): string | null {
  const physicalKeyId = getPhysicalKeyIdForCode(question.code);
  return physicalKeyId ? getKeyOutput(layout, physicalKeyId, question.shiftKey) ?? null : null;
}

export function matchesExpectedKey(
  observedKey: string,
  expectedKey: string | null,
  expectsDeadKey = false,
): boolean {
  if (!expectedKey) return false;
  if (observedKey === 'Dead') return expectsDeadKey;
  return !expectsDeadKey && normalizeKey(observedKey) === normalizeKey(expectedKey);
}

function sampleMatchesLayout(sample: KeyboardDetectionSample, layout: KeyboardLayout): boolean {
  const question = KEYBOARD_DETECTION_QUESTIONS.find(
    (candidate) => candidate.id === sample.questionId,
  );
  if (!question || getKeyboardDetectionEventIssue(sample, question)) return false;
  const physicalKeyId = getPhysicalKeyIdForCode(question.code);
  const expectedDeadKey = Boolean(physicalKeyId && getDeadKey(layout, physicalKeyId, question.shiftKey));
  return matchesExpectedKey(sample.key, getExpectedKey(layout, question), expectedDeadKey);
}

function getCertainty(
  matchRate: number,
  matches: number,
  sampleCount: number,
  margin: number,
): number {
  const evidence = Math.min(matches / MINIMUM_MATCHES, 1) * Math.min(sampleCount / 3, 1);
  const separation = Math.min(Math.max(margin, 0) / 0.5, 1);
  return matchRate * evidence * (0.5 + separation * 0.5);
}

export function rankKeyboardLayouts(
  samples: readonly KeyboardDetectionSample[],
  layouts: readonly KeyboardLayout[],
): RankedKeyboardLayout[] {
  const preliminary = layouts.map((layout) => {
    const matches = samples.reduce(
      (total, sample) => total + Number(sampleMatchesLayout(sample, layout)),
      0,
    );
    return { layout, matches, matchRate: samples.length ? matches / samples.length : 0 };
  });
  const sorted = [...preliminary].sort(
    (left, right) =>
      right.matchRate - left.matchRate ||
      right.matches - left.matches ||
      left.layout.id.localeCompare(right.layout.id),
  );

  return sorted.map((candidate, index) => ({
    ...candidate,
    certainty: getCertainty(
      candidate.matchRate,
      candidate.matches,
      samples.length,
      candidate.matchRate - (sorted[index + 1]?.matchRate ?? 0),
    ),
  }));
}

function getNextQuestion(
  samples: readonly KeyboardDetectionSample[],
  ranked: readonly RankedKeyboardLayout[],
  layouts: readonly KeyboardLayout[],
): KeyboardDetectionQuestion | null {
  if (samples.length === 0) return KEYBOARD_DETECTION_QUESTIONS[0];
  const usedQuestions = new Set(samples.map((sample) => sample.questionId));
  const bestMatchRate = ranked[0]?.matchRate ?? 0;
  const tiedCandidates = ranked
    .filter((candidate) => Math.abs(candidate.matchRate - bestMatchRate) < 0.001)
    .map((candidate) => candidate.layout);
  const candidatePool = tiedCandidates.length > 1 ? tiedCandidates : layouts;

  return (
    KEYBOARD_DETECTION_QUESTIONS.filter((question) => !usedQuestions.has(question.id))
      .map((question) => ({
        question,
        score: new Set(
          candidatePool
            .map((layout) => {
              const physicalKeyId = getPhysicalKeyIdForCode(question.code);
              return physicalKeyId && getDeadKey(layout, physicalKeyId, question.shiftKey)
                ? 'Dead'
                : getExpectedKey(layout, question);
            })
            .filter(Boolean),
        ).size,
      }))
      .sort((left, right) => right.score - left.score)[0]?.question ?? null
  );
}

export function analyzeKeyboardDetection(
  samples: readonly KeyboardDetectionSample[],
  layouts: readonly KeyboardLayout[],
): KeyboardDetectionAnalysis {
  const ranked = rankKeyboardLayouts(samples, layouts);
  const best = ranked[0];
  const second = ranked[1];
  const matchRate = best?.matchRate ?? 0;
  const margin = matchRate - (second?.matchRate ?? 0);
  const certainty = best?.certainty ?? 0;
  const detectedLayout =
    samples.length >= MINIMUM_MATCHES &&
    best &&
    best.matches >= MINIMUM_MATCHES &&
    matchRate >= 0.9 &&
    margin >= 0.25 &&
    certainty >= DETECTION_CERTAINTY
      ? best.layout
      : null;
  const unidentified = samples.length > 0 && matchRate === 0;
  const nextQuestion =
    detectedLayout || unidentified || samples.length >= MAX_DETECTION_QUESTIONS
      ? null
      : getNextQuestion(samples, ranked, layouts);

  return {
    ranked,
    detectedLayout,
    matchRate,
    certainty,
    margin,
    nextQuestion,
    exhausted: !detectedLayout && (!nextQuestion || samples.length >= MAX_DETECTION_QUESTIONS),
    unidentified,
  };
}
