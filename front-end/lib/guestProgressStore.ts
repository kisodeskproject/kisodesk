import type { ErrorSummary } from './errorSummary';
import type { ContentLanguage, Locale } from './locales';
import { apiPost } from './apiClient';
import { savePracticeResult } from './practiceClient';
import type { TypingTelemetry, TypingTelemetryEvent } from './typingTelemetry';
import type { UserProgress } from '@/types/course';

export const GUEST_PROGRESS_STORAGE_KEY = 'kiso-guest-progress:v2';
export const LEGACY_GUEST_PROGRESS_STORAGE_KEY = 'kiso-guest-progress:v1';

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
  layoutId?: string;
  errorSummary?: ErrorSummary;
  telemetry?: TypingTelemetry;
};

export type GuestLessonAdaptiveAttempt = {
  id: string;
  lessonId: string;
  language: ContentLanguage;
  locale: Locale;
  layoutId: string;
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  timeElapsed: number;
  errorSummary?: ErrorSummary;
  telemetry?: TypingTelemetry;
  syncedAt?: string;
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

export type GuestAdaptiveStat = {
  attempts: number;
  errors: number;
  latencyTotalMs: number;
  latencySamples: number;
  recurrence: number;
};

export type GuestAdaptiveProfile = {
  language: ContentLanguage;
  locale: Locale;
  layoutId: string;
  sampleSessions: number;
  totalInputs: number;
  totalFinalInputs: number;
  correctFinalInputs: number;
  totalIncorrectAttempts: number;
  correctedErrors: number;
  uncorrectedErrors: number;
  totalActiveDurationMs: number;
  finalAccuracy: number;
  keyStats: Record<string, GuestAdaptiveStat>;
  bigramStats: Record<string, GuestAdaptiveStat>;
};

export type GuestProgress = {
  version: 2;
  lessons: Record<string, GuestLessonProgress>;
  practice: GuestPracticeResult[];
  lessonAdaptiveAttempts: GuestLessonAdaptiveAttempt[];
  adaptiveProfiles: Record<string, GuestAdaptiveProfile>;
};

type SessionAdaptiveStats = Omit<
  GuestAdaptiveProfile,
  'language' | 'locale' | 'layoutId' | 'sampleSessions' | 'finalAccuracy'
>;

const EMPTY_PROGRESS: GuestProgress = {
  version: 2,
  lessons: {},
  practice: [],
  lessonAdaptiveAttempts: [],
  adaptiveProfiles: {},
};
const MAX_PRACTICE_RESULTS = 50;
const MAX_LESSON_ADAPTIVE_ATTEMPTS = 200;
let guestPracticeSyncInFlight: Promise<void> | null = null;
let guestLessonSyncInFlight: Promise<void> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function profileKey(language: ContentLanguage, locale: Locale, layoutId: string) {
  return `${language}:${locale}:${layoutId}`;
}

function createEmptyProfile(
  language: ContentLanguage,
  locale: Locale,
  layoutId: string,
): GuestAdaptiveProfile {
  return {
    language,
    locale,
    layoutId,
    sampleSessions: 0,
    totalInputs: 0,
    totalFinalInputs: 0,
    correctFinalInputs: 0,
    totalIncorrectAttempts: 0,
    correctedErrors: 0,
    uncorrectedErrors: 0,
    totalActiveDurationMs: 0,
    finalAccuracy: 100,
    keyStats: {},
    bigramStats: {},
  };
}

function createEmptySessionStats(): SessionAdaptiveStats {
  return {
    totalInputs: 0,
    totalFinalInputs: 0,
    correctFinalInputs: 0,
    totalIncorrectAttempts: 0,
    correctedErrors: 0,
    uncorrectedErrors: 0,
    totalActiveDurationMs: 0,
    keyStats: {},
    bigramStats: {},
  };
}

function addStat(
  stats: Record<string, GuestAdaptiveStat>,
  key: string,
  input: { attempts?: number; errors?: number; latencyMs?: number; recurring?: boolean },
) {
  if (!key) return;
  const current = stats[key] ?? {
    attempts: 0,
    errors: 0,
    latencyTotalMs: 0,
    latencySamples: 0,
    recurrence: 0,
  };
  current.attempts += input.attempts ?? 0;
  current.errors += input.errors ?? 0;
  if (input.latencyMs !== undefined) {
    current.latencyTotalMs += input.latencyMs;
    current.latencySamples += 1;
  }
  if (input.recurring) current.recurrence += 1;
  stats[key] = current;
}

function normalizeExpected(value: unknown) {
  return typeof value === 'string' ? value.normalize('NFC') : '';
}

function deriveSessionFromTelemetry(telemetry: TypingTelemetry): SessionAdaptiveStats | null {
  if (!Array.isArray(telemetry.events)) return null;
  const events = telemetry.events
    .filter(
      (event): event is TypingTelemetryEvent =>
        isObject(event) &&
        typeof event.kind === 'string' &&
        typeof event.sequence === 'number' &&
        typeof event.timestamp === 'number' &&
        typeof event.position === 'number',
    )
    .slice()
    .sort((left, right) => left.sequence - right.sequence || left.timestamp - right.timestamp);
  const inputs = events.filter((event) => event.kind === 'input');
  if (inputs.length === 0) return null;

  const activeInputs: TypingTelemetryEvent[] = [];
  for (const event of events) {
    if (event.kind === 'input') {
      activeInputs.push(event);
    } else if (event.kind === 'backspace' && event.position === activeInputs.length) {
      activeInputs.pop();
    }
  }

  const result = createEmptySessionStats();
  result.totalInputs = inputs.length;
  result.totalFinalInputs = activeInputs.length;
  result.totalIncorrectAttempts = inputs.filter((event) => event.correct === false).length;
  result.uncorrectedErrors = activeInputs.filter((event) => event.correct !== true).length;
  result.correctedErrors = result.totalIncorrectAttempts - result.uncorrectedErrors;
  result.correctFinalInputs = result.totalFinalInputs - result.uncorrectedErrors;

  const startedAt = typeof telemetry.startedAt === 'number' ? telemetry.startedAt : inputs[0].timestamp;
  const endedAt = events[events.length - 1]?.timestamp ?? startedAt;
  result.totalActiveDurationMs = Math.max(
    0,
    endedAt - startedAt - (typeof telemetry.pausedMs === 'number' ? telemetry.pausedMs : 0),
  );

  const recurringKeys = new Set<string>();
  const recurringBigrams = new Set<string>();
  for (let index = 0; index < activeInputs.length; index++) {
    const event = activeInputs[index];
    const expected = normalizeExpected(event.expected);
    if (!expected) continue;
    const error = event.correct !== true;
    if (error) recurringKeys.add(expected);
    const previous = activeInputs[index - 1];
    const latency = previous ? event.timestamp - previous.timestamp : undefined;
    addStat(result.keyStats, expected, {
      attempts: 1,
      errors: error ? 1 : 0,
      latencyMs: latency !== undefined && latency >= 20 && latency <= 2000 ? latency : undefined,
    });

    if (!previous) continue;
    const first = normalizeExpected(previous.expected);
    if (!first) continue;
    const bigram = `${first}${expected}`;
    if (error) recurringBigrams.add(bigram);
    addStat(result.bigramStats, bigram, {
      attempts: 1,
      errors: error ? 1 : 0,
      latencyMs: latency !== undefined && latency >= 20 && latency <= 2000 ? latency : undefined,
    });
  }
  for (const key of recurringKeys) result.keyStats[key].recurrence += 1;
  for (const bigram of recurringBigrams) result.bigramStats[bigram].recurrence += 1;

  return result;
}

function deriveSessionFromSummary(summary: ErrorSummary | undefined): SessionAdaptiveStats | null {
  if (!summary?.keys?.length) return null;
  const result = createEmptySessionStats();
  result.totalInputs = summary.totalKeystrokes;
  result.totalFinalInputs = summary.totalKeystrokes;
  result.uncorrectedErrors = summary.totalErrors;
  result.correctFinalInputs = Math.max(0, summary.totalKeystrokes - summary.totalErrors);
  for (const key of summary.keys) {
    const expected = normalizeExpected(key.expected);
    if (!expected) continue;
    addStat(result.keyStats, expected, {
      attempts: key.totalPresses,
      errors: key.totalErrors,
      recurring: key.totalErrors > 0,
    });
  }
  return result;
}

function mergeStats(
  target: Record<string, GuestAdaptiveStat>,
  source: Record<string, GuestAdaptiveStat>,
) {
  for (const [key, value] of Object.entries(source)) {
    addStat(target, key, {
      attempts: value.attempts,
      errors: value.errors,
      latencyMs: undefined,
    });
    const current = target[key];
    current.latencyTotalMs += value.latencyTotalMs;
    current.latencySamples += value.latencySamples;
    current.recurrence += value.recurrence;
  }
}

function buildAdaptiveProfiles(
  practice: GuestPracticeResult[],
  lessonAttempts: GuestLessonAdaptiveAttempt[],
) {
  const profiles: Record<string, GuestAdaptiveProfile> = {};
  const sessions = [
    ...practice.filter((session) => !session.syncedAt),
    ...lessonAttempts.filter((attempt) => !attempt.syncedAt),
  ];
  for (const session of sessions) {
    if (
      typeof session.language !== 'string' ||
      typeof session.layoutId !== 'string' ||
      !session.language ||
      !session.layoutId
    ) {
      continue;
    }
    const language = session.language as ContentLanguage;
    const locale = (typeof session.locale === 'string' ? session.locale : 'es-latam') as Locale;
    const key = profileKey(language, locale, session.layoutId);
    const profile = profiles[key] ?? createEmptyProfile(language, locale, session.layoutId);
    const derived = session.telemetry
      ? deriveSessionFromTelemetry(session.telemetry)
      : deriveSessionFromSummary(session.errorSummary);
    if (!derived) {
      profiles[key] = profile;
      continue;
    }
    profile.sampleSessions += 1;
    profile.totalInputs += derived.totalInputs;
    profile.totalFinalInputs += derived.totalFinalInputs;
    profile.correctFinalInputs += derived.correctFinalInputs;
    profile.totalIncorrectAttempts += derived.totalIncorrectAttempts;
    profile.correctedErrors += derived.correctedErrors;
    profile.uncorrectedErrors += derived.uncorrectedErrors;
    profile.totalActiveDurationMs += derived.totalActiveDurationMs;
    mergeStats(profile.keyStats, derived.keyStats);
    mergeStats(profile.bigramStats, derived.bigramStats);
    profile.finalAccuracy = profile.totalFinalInputs
      ? (profile.correctFinalInputs / profile.totalFinalInputs) * 100
      : 100;
    profiles[key] = profile;
  }
  return profiles;
}

function normalizeProgress(value: unknown): GuestProgress {
  const parsed = isObject(value) ? value : {};
  const lessons = isObject(parsed.lessons)
    ? (parsed.lessons as Record<string, GuestLessonProgress>)
    : {};
  const practice = Array.isArray(parsed.practice)
    ? parsed.practice
        .filter(isObject)
        .map((item) => ({
          ...item,
          clientSessionId:
            typeof item.clientSessionId === 'string' && item.clientSessionId
              ? item.clientSessionId
              : crypto.randomUUID(),
        })) as GuestPracticeResult[]
    : [];
  const lessonAdaptiveAttempts = Array.isArray(parsed.lessonAdaptiveAttempts)
    ? parsed.lessonAdaptiveAttempts.filter(
        (item): item is GuestLessonAdaptiveAttempt =>
          isObject(item) &&
          typeof item.id === 'string' &&
          typeof item.lessonId === 'string' &&
          typeof item.language === 'string' &&
          typeof item.locale === 'string' &&
          typeof item.layoutId === 'string' &&
          typeof item.netWpm === 'number' &&
          typeof item.grossWpm === 'number' &&
          typeof item.accuracy === 'number' &&
          typeof item.timeElapsed === 'number',
      )
    : [];
  return {
    version: 2,
    lessons,
    practice,
    lessonAdaptiveAttempts,
    adaptiveProfiles: buildAdaptiveProfiles(practice, lessonAdaptiveAttempts),
  };
}

function writeGuestProgress(progress: GuestProgress) {
  if (!isBrowser()) return;
  const normalized = normalizeProgress(progress);
  try {
    window.localStorage.setItem(GUEST_PROGRESS_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // localStorage puede no estar disponible.
  }
}

export function readGuestProgress(): GuestProgress {
  if (!isBrowser()) return EMPTY_PROGRESS;
  try {
    const current = window.localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY);
    if (current) {
      const normalized = normalizeProgress(JSON.parse(current));
      if (current !== JSON.stringify(normalized)) writeGuestProgress(normalized);
      return normalized;
    }
    const legacy = window.localStorage.getItem(LEGACY_GUEST_PROGRESS_STORAGE_KEY);
    if (!legacy) return EMPTY_PROGRESS;
    const migrated = normalizeProgress(JSON.parse(legacy));
    writeGuestProgress(migrated);
    return migrated;
  } catch {
    return EMPTY_PROGRESS;
  }
}

const GUEST_DAILY_GOAL_STORAGE_KEY = 'kiso-guest-daily-goal-minutes';
const DEFAULT_GUEST_DAILY_GOAL_MINUTES = 15;
const MIN_GUEST_DAILY_GOAL_MINUTES = 5;
const MAX_GUEST_DAILY_GOAL_MINUTES = 180;

export function readGuestDailyGoalMinutes(): number {
  if (!isBrowser()) return DEFAULT_GUEST_DAILY_GOAL_MINUTES;
  try {
    const stored = window.localStorage.getItem(GUEST_DAILY_GOAL_STORAGE_KEY);
    const value = stored ? Number(stored) : NaN;
    if (!Number.isFinite(value)) return DEFAULT_GUEST_DAILY_GOAL_MINUTES;
    return Math.min(MAX_GUEST_DAILY_GOAL_MINUTES, Math.max(MIN_GUEST_DAILY_GOAL_MINUTES, value));
  } catch {
    return DEFAULT_GUEST_DAILY_GOAL_MINUTES;
  }
}

export function writeGuestDailyGoalMinutes(minutes: number): number {
  const clamped = Math.min(
    MAX_GUEST_DAILY_GOAL_MINUTES,
    Math.max(MIN_GUEST_DAILY_GOAL_MINUTES, Math.round(minutes)),
  );
  if (isBrowser()) {
    try {
      window.localStorage.setItem(GUEST_DAILY_GOAL_STORAGE_KEY, String(clamped));
    } catch {
      // localStorage puede no estar disponible.
    }
  }
  return clamped;
}

export function recordGuestLessonProgress(
  input: Omit<GuestLessonProgress, 'completedAt' | 'attempts' | 'totalTimeElapsed'> & {
    timeElapsed?: number;
    clientSessionId?: string;
  },
): GuestProgress {
  const progress = readGuestProgress();
  const key = `${input.courseId}:${input.lessonId}`;
  const previous = progress.lessons[key];
  const adaptiveAttempt =
    input.language && input.locale && input.layoutId && (input.telemetry || input.errorSummary)
      ? {
          id:
            input.clientSessionId ?? crypto.randomUUID(),
          lessonId: input.lessonId,
          language: input.language,
          locale: input.locale,
          layoutId: input.layoutId,
          netWpm: input.bestNetWpm ?? 0,
          grossWpm: input.bestGrossWpm ?? 0,
          accuracy: input.bestAccuracy ?? 0,
          timeElapsed: input.timeElapsed ?? 1,
          errorSummary: input.errorSummary,
          telemetry: input.telemetry,
        }
      : null;
  const isDuplicateAdaptiveAttempt = Boolean(
    adaptiveAttempt && progress.lessonAdaptiveAttempts.some((attempt) => attempt.id === adaptiveAttempt.id),
  );
  const nextLesson: GuestLessonProgress = {
    courseId: input.courseId,
    lessonId: input.lessonId,
    language: input.language,
    locale: input.locale ?? previous?.locale,
    completedAt: new Date().toISOString(),
    attempts: (previous?.attempts ?? 0) + (isDuplicateAdaptiveAttempt ? 0 : 1),
    bestNetWpm: Math.max(previous?.bestNetWpm ?? 0, input.bestNetWpm ?? 0) || undefined,
    bestGrossWpm: Math.max(previous?.bestGrossWpm ?? 0, input.bestGrossWpm ?? 0) || undefined,
    bestScore: Math.max(previous?.bestScore ?? 0, input.bestScore ?? 0) || undefined,
    bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, input.bestAccuracy ?? 0) || undefined,
    totalTimeElapsed:
      (previous?.totalTimeElapsed ?? 0) + (isDuplicateAdaptiveAttempt ? 0 : input.timeElapsed ?? 0),
    layoutId: input.layoutId ?? previous?.layoutId,
    errorSummary: input.errorSummary ?? previous?.errorSummary,
    telemetry: input.telemetry ?? previous?.telemetry,
  };
  const next = {
    ...progress,
    lessons: { ...progress.lessons, [key]: nextLesson },
    lessonAdaptiveAttempts:
      adaptiveAttempt && !isDuplicateAdaptiveAttempt
        ? [...progress.lessonAdaptiveAttempts, adaptiveAttempt].slice(-MAX_LESSON_ADAPTIVE_ATTEMPTS)
        : progress.lessonAdaptiveAttempts,
  };
  writeGuestProgress(next);
  return normalizeProgress(next);
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
  return normalizeProgress(next);
}

export async function syncGuestPracticeResults(): Promise<void> {
  if (guestPracticeSyncInFlight) return guestPracticeSyncInFlight;
  guestPracticeSyncInFlight = (async () => {
    const pending = readGuestProgress().practice.filter(
      (session) => !session.syncedAt && session.errorSummary && session.layoutId,
    );
    const syncedIds = new Set<string>();
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
          source: 'guest_sync',
        });
        syncedIds.add(session.clientSessionId);
      } catch {
        // El resultado queda pendiente y se reintentará en la siguiente sesión.
      }
    }
    if (!syncedIds.size) return;
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

export async function syncGuestLessonAttempts(): Promise<void> {
  if (guestLessonSyncInFlight) return guestLessonSyncInFlight;
  guestLessonSyncInFlight = (async () => {
    const pending = readGuestProgress().lessonAdaptiveAttempts.filter(
      (attempt) => !attempt.syncedAt && attempt.errorSummary,
    );
    const syncedIds = new Set<string>();
    for (const attempt of pending) {
      try {
        await apiPost(`/lessons/${attempt.lessonId}/complete`, {
          netWpm: attempt.netWpm,
          grossWpm: attempt.grossWpm,
          accuracy: attempt.accuracy,
          timeElapsed: attempt.timeElapsed,
          locale: attempt.locale,
          layoutId: attempt.layoutId,
          errorSummary: attempt.errorSummary,
          telemetry: attempt.telemetry,
          clientSessionId: attempt.id,
        });
        syncedIds.add(attempt.id);
      } catch {
        // El intento queda pendiente y se reintentará tras la siguiente autenticación.
      }
    }
    if (!syncedIds.size) return;
    const latest = readGuestProgress();
    writeGuestProgress({
      ...latest,
      lessonAdaptiveAttempts: latest.lessonAdaptiveAttempts.map((attempt) =>
        syncedIds.has(attempt.id)
          ? { ...attempt, syncedAt: attempt.syncedAt ?? new Date().toISOString() }
          : attempt,
      ),
    });
  })().finally(() => {
    guestLessonSyncInFlight = null;
  });
  return guestLessonSyncInFlight;
}

export function clearGuestProgress() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(GUEST_PROGRESS_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GUEST_PROGRESS_STORAGE_KEY);
}

export function getGuestAdaptiveProfile(
  language: ContentLanguage,
  locale: Locale,
  layoutId: string,
): GuestAdaptiveProfile | null {
  return readGuestProgress().adaptiveProfiles[profileKey(language, locale, layoutId)] ?? null;
}
