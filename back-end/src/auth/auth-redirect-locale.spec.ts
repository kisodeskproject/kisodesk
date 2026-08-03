import { toAuthRedirectLocale } from './auth-redirect-locale';

describe('auth redirect locale', () => {
  it.each([
    ['es', 'es-latam'],
    ['es-419', 'es-latam'],
    ['en', 'en-US'],
    ['en-GB', 'en-GB'],
    ['pt-BR', 'pt-BR'],
    ['fr-FR', 'fr'],
    ['pt-br', 'pt-BR'],
    ['unknown', 'es-latam'],
    [undefined, 'es-latam'],
  ])('normalizes %p to %s', (value, expected) => {
    expect(toAuthRedirectLocale(value)).toBe(expected);
  });
});
