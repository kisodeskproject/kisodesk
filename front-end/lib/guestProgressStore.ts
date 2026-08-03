import type { ContentLanguage, Locale } from './locales';
import type { ErrorSummary } from './errorSummary';
import { savePracticeResult } from './practiceClient';
import type { TypingTelemetry } from './typingTelemetry';
import type { UserProgress } from '@/types/course';

export const GUEST_PROGRESS_STORAGE_KEY = 'kiso-guest-progress:v1';

export type GuestLessonProgress = {
  courseId: string;
  lessonId: string;
  language?: ContentLanguage;
  locale?: Locale;
  completedAt: string;
  attempts: number;
  bestNetWpm?: number;
  bestGrossWpm?: number;
  bestScore?: number;
  bestAccuracy?: number;
  totalTimeElapsed: number;
};

export type GuestPracticeResult = {
  completedAt: string;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  timeElapsed: number;
  language: ContentLanguage;
  locale?: Locale;
  layoutId?: string;
  errorSummary?: ErrorSummary;
  telemetry?: TypingTelemetry;
  clientSessionId: string;
  syncedAt?: string;
};

export type GuestProgress = {
  lessons: Record<string, GuestLessonProgress>;
  practice: GuestPracticeResult[];
};

const EMPTY_PROGRESS: GuestProgress = { lessons: {}, practice: [] };
const MAX_PRACTICE_RESULTS = 50;
let guestPracticeSyncInFlight: Promise<void> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

export function readGuestProgress(): GuestProgress {
  if (!isBrowser()) return EMPTY_PROGRESS;

  try {
    const raw = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (!raw) return EMPTY_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GuestProgress>;
    let assignedClientSessionId = false;
    const progress = {
      lessons: parsed.lessons && typeof parsed.lessons === 'object' ? parsed.lessons : {},
      practice: Array.isArray(parsed.practice)
        ? parsed.practice.map((item) => {
            if (item.clientSessionId) return item as GuestPracticeResult;
            assignedClientSessionId = true;
            return { ...item, clientSessionId: crypto.randomUUID() } as GuestPracticeResult;
          })
        : [],
    };
    // Migra los resultados guardados antes de clientSessionId para que un reintento
    // conserve la misma identidad y el backend pueda aplicar su idempotencia.
    if (assignedClientSessionId) writeGuestProgress(progress);
    return progress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

function writeGuestProgress(progress: GuestProgress) {
  if (!isBrowser()) return;
  window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

export function recordGuestLessonProgress(
  input: Omit<GuestLessonProgress, 'completedAt' | 'attempts' | 'totalTimeElapsed'> & {
    timeElapsed?: number;
  },
): GuestProgress {
  const progress = readGuestProgress();
  const key = `${input.courseId}:${input.lessonId}`;
  const previous = progress.lessons[key];
  const nextLesson: GuestLessonProgress = {
    courseId: input.courseId,
    lessonId: input.lessonId,
    language: input.language,
    locale: input.locale ?? previous?.locale,
    completedAt: new Date().toISOString(),
    attempts: (previous?.attempts ?? 0) + 1,
    bestNetWpm: Math.max(previous?.bestNetWpm ?? 0, input.bestNetWpm ?? 0) || undefined,
    bestGrossWpm: Math.max(previous?.bestGrossWpm ?? 0, input.bestGrossWpm ?? 0) || undefined,
    bestScore: Math.max(previous?.bestScore ?? 0, input.bestScore ?? 0) || undefined,
    bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, input.bestAccuracy ?? 0) || undefined,
    totalTimeElapsed: (previous?.totalTimeElapsed ?? 0) + (input.timeElapsed ?? 0),
  };
  const next = { ...progress, lessons: { ...progress.lessons, [key]: nextLesson } };
  writeGuestProgress(next);
  return next;
}

export function getGuestLessonProgress(courseId: string, lessonId: string): GuestLessonProgress | null {
  return readGuestProgress().lessons[`${courseId}:${lessonId}`] ?? null;
}

export function getGuestCourseProgress(courseId: string): UserProgress | null {
  const lessons = Object.values(readGuestProgress().lessons).filter(
    (lesson) => lesson.courseId === courseId,
  );
  if (!lessons.length) return null;

  const accuracies = lessons
    .map((lesson) => lesson.bestAccuracy)
    .filter((accuracy): accuracy is number => typeof accuracy === 'number');

  return {
    completedLessons: lessons.length,
    bestWpm: Math.max(...lessons.map((lesson) => lesson.bestNetWpm ?? 0)),
    avgAccuracy: accuracies.length
      ? Math.round(accuracies.reduce((total, accuracy) => total + accuracy, 0) / accuracies.length)
      : 0,
    totalTimeSpent: lessons.reduce((total, lesson) => total + lesson.totalTimeElapsed, 0),
  };
}

export function recordGuestPracticeResult(
  result: Omit<GuestPracticeResult, 'completedAt' | 'clientSessionId'>,
): GuestProgress {
  const progress = readGuestProgress();
  const next = {
    ...progress,
    practice: [
      ...progress.practice,
      { ...result, clientSessionId: crypto.randomUUID(), completedAt: new Date().toISOString() },
    ].slice(-MAX_PRACTICE_RESULTS),
  };
  writeGuestProgress(next);
  return next;
}

export async function syncGuestPracticeResults(): Promise<void> {
  if (guestPracticeSyncInFlight) return guestPracticeSyncInFlight;

  guestPracticeSyncInFlight = (async () => {
    const pending = readGuestProgress().practice.filter(
      (session) => !session.syncedAt && session.errorSummary && session.layoutId,
    );
    const syncedIds = new Set<string>();

    // Se procesa una sesión por vez: una falla no impide enviar las siguientes y
    // sólo se marca como sincronizada después de que el backend la acepta.
    for (const session of pending) {
      try {
        await savePracticeResult({
          netWpm: session.netWpm,
          grossWpm: session.grossWpm,
          accuracy: session.accuracy,
          timeElapsed: session.timeElapsed,
          language: session.language,
          locale: session.locale ?? 'es-latam',
          layoutId: session.layoutId,
          errorSummary: session.errorSummary!,
          telemetry: session.telemetry,
          clientSessionId: session.clientSessionId,
        });
        syncedIds.add(session.clientSessionId);
      } catch {
        // El resultado queda pendiente y se reintentará en la siguiente sesión.
      }
    }

    if (!syncedIds.size) return;

    // Relee antes de escribir para conservar prácticas creadas mientras se enviaban.
    const latest = readGuestProgress();
    writeGuestProgress({
      ...latest,
      practice: latest.practice.map((session) =>
        syncedIds.has(session.clientSessionId)
          ? { ...session, syncedAt: session.syncedAt ?? new Date().toISOString() }
          : session,
      ),
    });
  })().finally(() => {
    guestPracticeSyncInFlight = null;
  });

  return guestPracticeSyncInFlight;
}

export function clearGuestProgress() {
  if (isBrowser()) window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
}

export function getGuestAdaptiveTargets(language: ContentLanguage, layoutId: string): string[] {
  return getGuestAdaptiveProfile(language, layoutId).keys;
}

export function getGuestAdaptiveProfile(
  language: ContentLanguage,
  layoutId: string,
): { keys: string[]; bigrams: string[] } {
  const totals = new Map<string, { presses: number; errors: number }>();
  const bigrams = new Map<string, { presses: number; errors: number }>();
  for (const session of readGuestProgress().practice) {
    if (session.language !== language || session.layoutId !== layoutId) continue;
    for (const key of session.errorSummary?.keys ?? []) {
      const current = totals.get(key.expected) ?? { presses: 0, errors: 0 };
      current.presses += key.totalPresses;
      current.errors += key.totalErrors;
      totals.set(key.expected, current);
    }
    const inputs = session.telemetry?.events.filter((event) => event.kind === 'input') ?? [];
    for (let index = 1; index < inputs.length; index += 1) {
      const first = inputs[index - 1].expected;
      const second = inputs[index].expected;
      if (!first || !second) continue;
      const key = `${first}${second}`.normalize('NFC');
      const current = bigrams.get(key) ?? { presses: 0, errors: 0 };
      current.presses += 1;
      current.errors += inputs[index].correct === false ? 1 : 0;
      bigrams.set(key, current);
    }
  }
  const keys = [...totals.entries()]
    .filter(([, value]) => value.presses >= 5 && value.errors > 0)
    .sort(([, a], [, b]) => b.errors / b.presses - a.errors / a.presses)
    .slice(0, 5)
    .map(([key]) => key);
  const weakBigrams = [...bigrams.entries()]
    .filter(([, value]) => value.presses >= 3 && value.errors > 0)
    .sort(([, a], [, b]) => b.errors / b.presses - a.errors / a.presses)
    .slice(0, 5)
    .map(([key]) => key);
  return { keys, bigrams: weakBigrams };
}
