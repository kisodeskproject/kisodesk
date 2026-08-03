import { describe, expect, it } from '@jest/globals';

import {
  analyzeKeyboardDetection,
  getExpectedKey,
  getKeyboardDetectionEventIssue,
  matchesExpectedKey,
  MAX_DETECTION_QUESTIONS,
  type KeyboardDetectionSample,
} from './keyboardDetection';
import { getEnabledLayoutById, getEnabledLayouts } from './keyboardLayouts';
import { getPhysicalKeyIdForCode } from './keyboardPhysical';

describe('keyboard detection', () => {
  const layouts = getEnabledLayouts();

  const indistinguishableLayoutIds = new Set(['qwerty-en', 'qwerty-pl']);

  it.each(
    layouts
      .filter((layout) => !indistinguishableLayoutIds.has(layout.id))
      .map((layout) => [layout.id, layout] as const),
  )(
    'identifies %s with adaptive questions',
    (_layoutId, layout) => {
      const samples: KeyboardDetectionSample[] = [];
      let analysis = analyzeKeyboardDetection(samples, layouts);

      while (!analysis.detectedLayout && analysis.nextQuestion) {
        const question = analysis.nextQuestion;
        const deadKey = layout.deadKeys?.some(
          (key) => key.physicalKeyId === getPhysicalKeyIdForCode(question.code) && key.shiftKey === question.shiftKey,
        );
        samples.push({
          questionId: question.id,
          code: question.code,
          key: deadKey ? 'Dead' : getExpectedKey(layout, question)!,
          shiftKey: question.shiftKey,
        });
        analysis = analyzeKeyboardDetection(samples, layouts);
      }

      expect(analysis.detectedLayout?.id).toBe(layout.id);
      expect(samples.length).toBeLessThanOrEqual(MAX_DETECTION_QUESTIONS);
    },
  );

  it('no elige entre distribuciones idénticas sin AltGr', () => {
    const usLayout = getEnabledLayoutById('qwerty-en');
    const samples: KeyboardDetectionSample[] = [];
    let analysis = analyzeKeyboardDetection(samples, layouts);

    while (analysis.nextQuestion) {
      const question = analysis.nextQuestion;
      samples.push({
        questionId: question.id,
        code: question.code,
        key: getExpectedKey(usLayout, question)!,
        shiftKey: question.shiftKey,
      });
      analysis = analyzeKeyboardDetection(samples, layouts);
    }

    expect(analysis.detectedLayout).toBeNull();
    expect(analysis.exhausted).toBe(true);
    expect(analysis.ranked.slice(0, 2).map((candidate) => candidate.layout.id)).toEqual(
      expect.arrayContaining(['qwerty-en', 'qwerty-pl']),
    );
  });

  it('keeps match rate and certainty separate for a single sample', () => {
    const analysis = analyzeKeyboardDetection(
      [{ questionId: 'rightOfL', code: 'Semicolon', key: 'ñ', shiftKey: false }],
      layouts,
    );

    expect(analysis.matchRate).toBe(1);
    expect(analysis.certainty).toBeLessThan(1);
    expect(analysis.detectedLayout).toBeNull();
  });

  it('classifies zero matches as unidentified and does not suggest a layout', () => {
    const analysis = analyzeKeyboardDetection(
      [{ questionId: 'rightOfL', code: 'Semicolon', key: 'Unmatched key', shiftKey: false }],
      layouts,
    );

    expect(analysis.unidentified).toBe(true);
    expect(analysis.detectedLayout).toBeNull();
    expect(analysis.nextQuestion).toBeNull();
  });

  it('requires enough evidence before selecting a layout', () => {
    const analysis = analyzeKeyboardDetection(
      [{ questionId: 'rightOfL', code: 'Semicolon', key: 'ò', shiftKey: false }],
      layouts,
    );

    expect(analysis.ranked[0].layout.id).toBe('qwerty-it');
    expect(analysis.detectedLayout).toBeNull();
  });

  it('only accepts a dead-key event for its exact configured physical key and modifier', () => {
    const portuguese = getEnabledLayoutById('qwerty-pt');
    const italian = getEnabledLayoutById('qwerty-it');
    const question = {
      id: 'leftOfBackspace' as const,
      code: 'Equal',
      shiftKey: false,
      titleKey: '',
      helpKey: '',
    };

    expect(matchesExpectedKey('Dead', getExpectedKey(portuguese, question), true)).toBe(true);
    expect(matchesExpectedKey('Dead', getExpectedKey(italian, question), false)).toBe(false);
    expect(
      analyzeKeyboardDetection(
        [{ questionId: 'quoteKey', code: 'Quote', key: 'Dead', shiftKey: false }],
        layouts,
      ).ranked.find((candidate) => candidate.layout.id === 'qwerty-pt')?.matches,
    ).toBe(0);
  });

  it.each([
    [
      {
        questionId: 'rightOfL',
        code: 'Semicolon',
        key: 'Process',
        shiftKey: false,
        isComposing: true,
      },
      'composition',
    ],
    [{ questionId: 'rightOfL', code: 'Unidentified', key: 'ñ', shiftKey: false }, 'unidentified'],
    [
      {
        questionId: 'rightOfL',
        code: 'Semicolon',
        key: 'ñ',
        shiftKey: false,
        altKey: true,
        ctrlKey: true,
      },
      'alt-graph',
    ],
    [
      { questionId: 'rightOfL', code: 'Semicolon', key: 'ñ', shiftKey: false, metaKey: true },
      'modified',
    ],
  ] as const)('rejects %s events', (sample, issue) => {
    expect(
      getKeyboardDetectionEventIssue(sample, {
        id: 'rightOfL',
        code: 'Semicolon',
        shiftKey: false,
        titleKey: '',
        helpKey: '',
      }),
    ).toBe(issue);
    expect(analyzeKeyboardDetection([sample], layouts).ranked[0].matchRate).toBe(0);
  });
});
