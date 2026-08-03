import { describe, expect, it } from '@jest/globals';

import { getPracticeMode, getPracticeModeUrl } from './practiceMode';

describe('practice adaptive mode', () => {
  it('mantiene práctica libre como modo compatible por defecto', () => {
    expect(getPracticeMode(null)).toBe('free');
    expect(getPracticeMode('free')).toBe('free');
  });

  it('activa y conserva la práctica adaptativa en la URL', () => {
    const url = getPracticeModeUrl('/es-latam/practice', 'layout=qwerty-latam', 'adaptive');
    expect(url).toBe('/es-latam/practice?layout=qwerty-latam&mode=adaptive');
    expect(getPracticeMode(new URL(`https://kiso.test${url}`).searchParams.get('mode'))).toBe('adaptive');
  });

  it('cambia a práctica libre sin perder parámetros de idioma o layout', () => {
    expect(getPracticeModeUrl('/en-US/dashboard/practice', 'layout=qwerty-en&mode=adaptive', 'free')).toBe(
      '/en-US/dashboard/practice?layout=qwerty-en&mode=free',
    );
  });
});
