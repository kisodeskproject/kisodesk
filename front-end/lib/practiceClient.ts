// lib/practiceClient.ts

// ─── Dependencias ───
import { apiGet, apiPost } from '@/lib/apiClient';
import type { ErrorSummary } from '@/lib/errorSummary';
import type { ContentLanguage, Locale } from '@/lib/locales';
import type { TypingTelemetry } from '@/lib/typingTelemetry';

// ─── Tipos ───
export interface PracticeText {
  id: string;
  text: string;
}

export interface AdaptivePracticeText extends PracticeText {
  mode: 'words' | 'text';
  targets: { keys: string[]; bigrams: string[] };
  reason: string;
  profile: { sampleSessions: number; averageAccuracy: number | null; confidence: number };
}

export interface SavePracticePayload {
  netWpm: number;
  grossWpm: number;
  accuracy: number;
  timeElapsed: number;
  language: ContentLanguage;
  locale: Locale;
  layoutId?: string;
  textId?: string;
  errorSummary: ErrorSummary;
  telemetry?: TypingTelemetry;
  clientSessionId?: string;
}

export interface SavePracticeResponse {
  id: string;
  savedAt: string;
}

const PRACTICE_TEXT_HISTORY_LIMIT = 100;
const PRACTICE_TEXT_HISTORY_KEY = 'practice-text-history';

function getPracticeTextHistory(language: ContentLanguage, historyScope: string): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(
      `${PRACTICE_TEXT_HISTORY_KEY}:${historyScope}:${language}`,
    );
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((id): id is string => typeof id === 'string')
          .slice(-PRACTICE_TEXT_HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function savePracticeTextHistory(
  language: ContentLanguage,
  historyScope: string,
  history: string[],
) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      `${PRACTICE_TEXT_HISTORY_KEY}:${historyScope}:${language}`,
      JSON.stringify(history),
    );
  } catch {
    // localStorage puede no estar disponible.
  }
}

function rememberPracticeText(
  language: ContentLanguage,
  historyScope: string,
  id: string,
  history: string[],
) {
  const nextHistory =
    history.length >= PRACTICE_TEXT_HISTORY_LIMIT
      ? [history[history.length - 1], id]
      : [...history, id];
  savePracticeTextHistory(language, historyScope, nextHistory);
}

// ─── Obtener texto aleatorio de práctica ───
/**
 * Obtiene un texto aleatorio para práctica libre en el idioma indicado.
 * Retorna tanto el texto como su identificador único para asociarlo
 * al resultado final.
 */
export async function fetchPracticeText(
  language: ContentLanguage,
  historyScope = 'guest',
): Promise<PracticeText> {
  const history = getPracticeTextHistory(language, historyScope);
  const excludedIds = history.length >= PRACTICE_TEXT_HISTORY_LIMIT ? history.slice(-1) : history;
  const query = new URLSearchParams({ lang: language });

  if (excludedIds.length > 0) {
    query.set('excludeIds', excludedIds.join(','));
  }

  const practiceText = await apiGet<PracticeText>(`/practice/texts?${query.toString()}`);
  rememberPracticeText(language, historyScope, practiceText.id, history);
  return practiceText;
}

export async function fetchAdaptivePracticeText(
  language: ContentLanguage,
  layoutId: string,
  mode: 'words' | 'text',
): Promise<AdaptivePracticeText> {
  const query = new URLSearchParams({ lang: language, layoutId, mode });
  return apiGet<AdaptivePracticeText>(`/practice/adaptive/next?${query.toString()}`);
}

// ─── Guardar resultado de práctica libre ───
/**
 * Envía los resultados de una sesión de práctica libre al backend.
 * Incluye opcionalmente el identificador del texto utilizado y el
 * resumen agregado de errores para análisis futuros.
 */
export async function savePracticeResult(
  payload: SavePracticePayload,
): Promise<SavePracticeResponse> {
  return apiPost<SavePracticeResponse>('/practice/results', payload);
}
