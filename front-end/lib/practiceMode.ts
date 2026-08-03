export type PracticeMode = 'free' | 'adaptive';

export function getPracticeMode(value: string | null): PracticeMode {
  return value === 'adaptive' ? 'adaptive' : 'free';
}

export function getPracticeModeUrl(
  pathname: string,
  currentQuery: string,
  mode: PracticeMode,
): string {
  const query = new URLSearchParams(currentQuery);
  query.set('mode', mode);
  return `${pathname}?${query.toString()}`;
}
