export const TYPING_TELEMETRY_VERSION = 1 as const;

export type TypingEventKind = 'input' | 'backspace' | 'dead-key' | 'modifier' | 'control';

export interface TypingTelemetryEvent {
  sequence: number;
  kind: TypingEventKind;
  timestamp: number;
  code: string;
  key: string;
  expected?: string;
  typed?: string;
  position: number;
  correct?: boolean;
  composing?: boolean;
  shiftKey?: boolean;
}

export interface TypingTelemetry {
  version: typeof TYPING_TELEMETRY_VERSION;
  text: string;
  startedAt: number | null;
  pausedMs: number;
  events: TypingTelemetryEvent[];
}

export function normalizeTypingText(value: string): string {
  return value.normalize('NFC');
}

/** Segments visible characters without splitting surrogate pairs or combining marks. */
export function splitGraphemes(value: string): string[] {
  const normalized = normalizeTypingText(value);
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(normalized), ({ segment }) => segment);
  }
  return Array.from(normalized);
}
