import type { KeystrokeEvent } from '@/components/lessons/TypingArea';

export interface KeyMistakeSummary {
  typed: string;
  count: number;
}

export interface KeyErrorSummary {
  expected: string;
  totalPresses: number;
  totalErrors: number;
  techniqueErrors?: number;
  mistakes?: KeyMistakeSummary[];
}

export interface ErrorSummary {
  totalKeystrokes: number;
  totalErrors: number;
  keys: KeyErrorSummary[];
}

export function buildErrorSummary(keystrokes: KeystrokeEvent[] = []): ErrorSummary {
  const byExpected = new Map<
    string,
    {
      totalPresses: number;
      totalErrors: number;
      techniqueErrors: number;
      mistakes: Map<string, number>;
    }
  >();

  for (const keystroke of keystrokes) {
    const expected = keystroke.expected;
    const typed = keystroke.key;
    const current = byExpected.get(expected) ?? {
      totalPresses: 0,
      totalErrors: 0,
      techniqueErrors: 0,
      mistakes: new Map<string, number>(),
    };

    const hasTechniqueError = keystroke.techniqueCorrect === false;
    const hasValueError = !keystroke.correct;
    const hasError = hasValueError || hasTechniqueError;

    current.totalPresses += 1;
    if (hasError) current.totalErrors += 1;
    if (hasTechniqueError) current.techniqueErrors += 1;
    if (hasValueError) {
      current.mistakes.set(typed, (current.mistakes.get(typed) ?? 0) + 1);
    }

    byExpected.set(expected, current);
  }

  const keys = Array.from(byExpected.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([expected, stats]) => {
      const mistakes = Array.from(stats.mistakes.entries())
        .sort(
          ([typedA, countA], [typedB, countB]) => countB - countA || typedA.localeCompare(typedB),
        )
        .map(([typed, count]) => ({ typed, count }));

      return {
        expected,
        totalPresses: stats.totalPresses,
        totalErrors: stats.totalErrors,
        ...(stats.techniqueErrors > 0 ? { techniqueErrors: stats.techniqueErrors } : {}),
        ...(mistakes.length > 0 ? { mistakes } : {}),
      };
    });

  return {
    totalKeystrokes: keystrokes.length,
    totalErrors: keys.reduce((sum, key) => sum + key.totalErrors, 0),
    keys,
  };
}
