import { describe, expect, it } from '@jest/globals';
import type { Lesson } from '@/types';
import {
  getWeakKeyLessonRecommendations,
  normalizeRecommendationKey,
} from './weakKeyLessonRecommendations';

function lesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'lesson-1',
    slug: 'lesson-1',
    courseSlug: 'caracteres-alfabeticos-es',
    title: 'Lección',
    text: 'texto',
    focusKeys: [],
    reviewKeys: [],
    order: 1,
    ...overrides,
  };
}

describe('weak-key lesson recommendations', () => {
  it('prioriza focusKeys sobre reviewKeys', () => {
    const result = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'a' }],
      lessons: [
        lesson({ id: 'review', reviewKeys: ['a'] }),
        lesson({ id: 'focus', focusKeys: ['a'] }),
      ],
    });

    expect(result.map((item) => item.lesson.id)).toEqual(['focus', 'review']);
    expect(result[0]).toMatchObject({ score: 3, focusKeyMatches: ['a'], reviewKeyMatches: [] });
  });

  it('cuenta una tecla presente en ambas listas solo como focusKey', () => {
    const [result] = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'a' }],
      lessons: [lesson({ focusKeys: ['a'], reviewKeys: ['a'] })],
    });

    expect(result).toMatchObject({ score: 3, focusKeyMatches: ['a'], reviewKeyMatches: [], reason: 'focus' });
  });

  it('usa el orden de debilidad del backend al puntuar coincidencias', () => {
    const result = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'x' }, { key: 'a' }],
      lessons: [lesson({ id: 'a', focusKeys: ['a'] }), lesson({ id: 'x', focusKeys: ['x'] })],
    });

    expect(result.map((item) => item.lesson.id)).toEqual(['x', 'a']);
    expect(result[0].score).toBe(6);
    expect(result[1].score).toBe(3);
  });

  it('desempata por progreso, orden curricular e identificador estable', () => {
    const result = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'a' }],
      lessons: [
        lesson({ id: 'z', order: 2, focusKeys: ['a'], completed: true }),
        lesson({ id: 'b', order: 2, focusKeys: ['a'] }),
        lesson({ id: 'a', order: 1, focusKeys: ['a'] }),
        lesson({ id: 'c', order: 2, focusKeys: ['a'] }),
      ],
    });

    expect(result.map((item) => item.lesson.id)).toEqual(['a', 'b', 'c']);
  });

  it('deduplica por id, respeta el límite y excluye otros cursos', () => {
    const result = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'a' }],
      courseSlug: 'caracteres-alfabeticos-es',
      limit: 3,
      lessons: [
        lesson({ id: 'one', order: 1, focusKeys: ['a'] }),
        lesson({ id: 'one', order: 1, focusKeys: ['a'] }),
        lesson({ id: 'two', order: 2, focusKeys: ['a'] }),
        lesson({ id: 'three', order: 3, focusKeys: ['a'] }),
        lesson({ id: 'four', order: 4, focusKeys: ['a'] }),
        lesson({ id: 'other', courseSlug: 'spanish-typing-course', focusKeys: ['a'] }),
      ],
    });

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.lesson.id)).toEqual(['one', 'two', 'three']);
  });

  it('no recomienda lecciones sin coincidencias', () => {
    expect(
      getWeakKeyLessonRecommendations({ weakKeys: [{ key: 'a' }], lessons: [lesson({ focusKeys: ['b'] })] }),
    ).toEqual([]);
  });

  it('normaliza mayúsculas y Unicode sin colapsar acentos, ñ ni caracteres especiales', () => {
    expect(normalizeRecommendationKey('Ñ')).toBe('ñ');
    expect(normalizeRecommendationKey('Á')).toBe('á');
    expect(normalizeRecommendationKey('á')).not.toBe(normalizeRecommendationKey('a'));
    expect(normalizeRecommendationKey('ñ')).not.toBe(normalizeRecommendationKey('n'));
    expect(normalizeRecommendationKey('¿')).toBe('¿');

    const result = getWeakKeyLessonRecommendations({
      weakKeys: [{ key: 'Ñ' }, { key: 'Á' }, { key: '¿' }],
      lessons: [lesson({ focusKeys: ['ñ', 'á'], reviewKeys: ['¿'] })],
    });
    expect(result[0].matchedWeakKeys).toEqual(['Ñ', 'Á', '¿']);
    expect(result[0].reason).toBe('focus-and-review');
  });
});
