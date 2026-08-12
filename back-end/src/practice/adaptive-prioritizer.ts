import { LanguageCode } from '@prisma/client';

const ALPHANUMERIC_CHARACTER = /^[\p{L}\p{N}]$/u;
const NEW_CHARACTER_CANDIDATE = /^\S$/u;
const WORDS_PER_TARGET = 3;
const TARGET_SLOTS = 6;
const NEW_CHARACTER_SLOTS = 2;
const LOW_CONFIDENCE_NEW_CHARACTER_SLOTS = 1;
const LOW_CONFIDENCE_THRESHOLD = 0.5;
const PRIORITY_BUDGET = 4;
const MINIMUM_ATTEMPTS = 5;
const PERSISTENT_ERROR_MINIMUM = 2;

type NewCharacterKind = 'letter' | 'number' | 'symbol';
const NEW_CHARACTER_KIND_ORDER: Record<NewCharacterKind, number> = {
  letter: 0,
  number: 1,
  symbol: 2,
};
const classifyNewCharacter = (value: string): NewCharacterKind => {
  if (/\p{L}/u.test(value)) return 'letter';
  if (/\p{N}/u.test(value)) return 'number';
  return 'symbol';
};

export type AdaptiveStat = {
  keyChar?: string;
  firstChar?: string;
  secondChar?: string;
  totalPresses: number;
  totalErrors: number;
  errorRate?: number;
  averageLatencyMs?: number;
};

export type AdaptiveCorpusText = { id: string; content: string };
export type AdaptiveExercise = {
  mode: 'words' | 'text';
  id: string;
  text: string;
  language: LanguageCode;
  layoutId: string;
  targets: { keys: string[]; bigrams: string[] };
  composition: {
    persistentErrors: number;
    weakBigrams: number;
    weakKeys: number;
    newCharacters: number;
    review: number;
  };
  reason: string;
  profile: { sampleSessions: number; averageAccuracy: number | null; confidence: number };
};

type Target = {
  kind: 'persistent-error' | 'weak-bigram' | 'weak-key' | 'new-character';
  value: string;
  score: number;
};

const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase();
const isCharacter = (value: string) => ALPHANUMERIC_CHARACTER.test(normalize(value));
const isNewCharacterCandidate = (value: string) => NEW_CHARACTER_CANDIDATE.test(normalize(value));
const score = (errorRate: number, errors: number, latency = 0) => {
  const normalizedLatency = Math.max(0, Math.min(100, ((latency - 150) / 450) * 100));
  return errorRate * 0.65 + normalizedLatency * 0.25 + Math.min(100, (errors / 5) * 100) * 0.1;
};

export function buildAdaptiveExercise(input: {
  language: LanguageCode;
  layoutId: string;
  mode: 'words' | 'text';
  keyStats: AdaptiveStat[];
  bigramStats: AdaptiveStat[];
  texts: AdaptiveCorpusText[];
  sampleSessions: number;
  averageAccuracy: number | null;
}): AdaptiveExercise {
  const texts = input.texts.length ? input.texts : [{ id: 'fallback', content: '' }];
  const corpus = texts.map((text) => normalize(text.content));
  const inCorpus = (value: string) => corpus.some((content) => content.includes(value));
  const available = new Map<string, number>();
  for (const text of texts)
    for (const character of text.content.normalize('NFC')) {
      const value = normalize(character);
      if (isNewCharacterCandidate(value)) available.set(value, (available.get(value) ?? 0) + 1);
    }
  const practiced = new Set(
    input.keyStats
      .filter(
        (item) => item.totalPresses > 0 && item.keyChar && isNewCharacterCandidate(item.keyChar),
      )
      .map((item) => normalize(item.keyChar!)),
  );
  // Prioridad de caracteres nuevos: letras > números > símbolos, alfabético dentro de cada grupo.
  const newCharacters = [...available.entries()]
    .filter(([value]) => !practiced.has(value))
    .map(([value]) => value)
    .sort((a, b) => {
      const kindDelta = NEW_CHARACTER_KIND_ORDER[classifyNewCharacter(a)] - NEW_CHARACTER_KIND_ORDER[classifyNewCharacter(b)];
      return kindDelta !== 0 ? kindDelta : a.localeCompare(b);
    });
  const keys = input.keyStats
    .filter(
      (item) =>
        item.keyChar &&
        item.totalPresses >= MINIMUM_ATTEMPTS &&
        item.totalErrors > 0 &&
        isCharacter(item.keyChar),
    )
    .map((item) => ({
      value: normalize(item.keyChar!),
      totalErrors: item.totalErrors,
      score: score(
        item.errorRate ?? (item.totalErrors / item.totalPresses) * 100,
        item.totalErrors,
        item.averageLatencyMs,
      ),
    }))
    .filter((item) => inCorpus(item.value))
    .sort((a, b) => b.score - a.score || b.totalErrors - a.totalErrors);
  const persistent = keys
    .filter((item) => item.totalErrors >= PERSISTENT_ERROR_MINIMUM)
    .map<Target>((item) => ({ kind: 'persistent-error', ...item }));
  const weakKeys = keys
    .filter((item) => item.totalErrors < PERSISTENT_ERROR_MINIMUM)
    .map<Target>((item) => ({ kind: 'weak-key', ...item }));
  const bigrams = input.bigramStats
    .filter(
      (item) =>
        item.firstChar &&
        item.secondChar &&
        item.totalPresses >= MINIMUM_ATTEMPTS &&
        item.totalErrors > 0 &&
        isCharacter(item.firstChar) &&
        isCharacter(item.secondChar),
    )
    .map((item) => ({
      value: `${normalize(item.firstChar!)}${normalize(item.secondChar!)}`,
      totalErrors: item.totalErrors,
      score: score(
        (item.totalErrors / item.totalPresses) * 100,
        item.totalErrors,
        item.averageLatencyMs,
      ),
    }))
    .filter((item) => inCorpus(item.value))
    .sort((a, b) => b.score - a.score)
    .map<Target>((item) => ({ kind: 'weak-bigram', ...item }));
  const totalPresses = [...input.keyStats, ...input.bigramStats].reduce(
    (total, item) => total + item.totalPresses,
    0,
  );
  const confidence = Math.min(1, totalPresses / 300);

  // Repartimos un cupo fijo de 4 slots entre errores persistentes, teclas
  // débiles y bigramas: si hay pocos persistentes/teclas débiles, el bigrama
  // aprovecha el espacio libre en vez de caer directo a repaso genérico.
  const persistentSlice = persistent.slice(0, 2);
  const weakKeySlice = weakKeys.slice(0, 1);
  const bigramCap =
    PRIORITY_BUDGET - persistentSlice.length - weakKeySlice.length >= 2 ? 2 : 1;
  const bigramSlice = bigrams.slice(0, bigramCap);
  const targets: Target[] = [...persistentSlice, ...bigramSlice, ...weakKeySlice];

  // Con confianza baja (perfil nuevo, pocos datos) somos más conservadores
  // e introducimos un solo carácter nuevo por vez en vez de dos.
  const newCharacterSlots =
    confidence < LOW_CONFIDENCE_THRESHOLD ? LOW_CONFIDENCE_NEW_CHARACTER_SLOTS : NEW_CHARACTER_SLOTS;
  for (const value of newCharacters.slice(0, newCharacterSlots)) {
    if (targets.length >= TARGET_SLOTS) break;
    targets.push({ kind: 'new-character', value, score: 1 });
  }
  const newCharacterCount = targets.filter((item) => item.kind === 'new-character').length;
  const selected = texts
    .map((text) => ({
      ...text,
      score: targets.reduce(
        (total, target) =>
          total +
          (normalize(text.content).split(target.value).length - 1) *
            target.score *
            (target.kind === 'weak-bigram' ? 2 : 1),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.content.length - b.content.length)[0];
  const sourceWords = [selected, ...texts.filter((text) => text.id !== selected.id)].flatMap(
    (text) => text.content.normalize('NFC').match(/[\p{L}\p{M}]+/gu) ?? [],
  );
  const targetWords = targets.flatMap((target) => {
    const words = sourceWords.filter((word) => normalize(word).includes(normalize(target.value)));
    return words.length
      ? Array.from({ length: WORDS_PER_TARGET }, (_, index) => words[index % words.length])
      : [];
  });
  const review = Math.max(0, TARGET_SLOTS - targets.length);
  // Rotamos el punto de partida del repaso según la cantidad de sesiones ya
  // practicadas, para no repetir siempre las mismas palabras de relleno.
  const reviewOffset = sourceWords.length ? input.sampleSessions % sourceWords.length : 0;
  const reviewWords = Array.from(
    { length: review * WORDS_PER_TARGET },
    (_, index) => sourceWords[(reviewOffset + index) % sourceWords.length],
  ).filter(Boolean);
  return {
    mode: input.mode,
    id: selected.id,
    text:
      targetWords.length || reviewWords.length
        ? [...targetWords, ...reviewWords].join(' ')
        : selected.content,
    language: input.language,
    layoutId: input.layoutId,
    targets: {
      keys: targets.filter((item) => item.kind !== 'weak-bigram').map((item) => item.value),
      bigrams: targets.filter((item) => item.kind === 'weak-bigram').map((item) => item.value),
    },
    composition: {
      persistentErrors: targets.filter((item) => item.kind === 'persistent-error').length,
      weakBigrams: targets.filter((item) => item.kind === 'weak-bigram').length,
      weakKeys: targets.filter((item) => item.kind === 'weak-key').length,
      newCharacters: newCharacterCount,
      review,
    },
    reason: targets.some((item) => item.kind === 'persistent-error')
      ? 'Prioriza errores recurrentes no corregidos.'
      : targets.some((item) => item.kind === 'weak-bigram')
        ? 'Prioriza bigramas débiles con errores recurrentes.'
        : targets.some((item) => item.kind === 'weak-key')
          ? 'Prioriza teclas débiles con errores no corregidos.'
          : newCharacterCount > 0
            ? newCharacterCount > 1
              ? 'Introduce caracteres nuevos de forma gradual y conserva repaso general.'
              : 'Introduce un carácter nuevo de forma gradual y conserva repaso general.'
            : 'Aún no hay estadísticas suficientes; se seleccionó repaso general.',
    profile: {
      sampleSessions: input.sampleSessions,
      averageAccuracy: input.averageAccuracy,
      confidence,
    },
  };
}
