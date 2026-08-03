// src/errors/weak-keys.service.ts
import { Injectable } from '@nestjs/common';
import { LanguageCode } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

const FINGER_MAP: Record<string, { finger: string; hand: string; row: string }> = {
  '`': { finger: 'pinky', hand: 'left', row: 'number' },
  '1': { finger: 'pinky', hand: 'left', row: 'number' },
  '2': { finger: 'ring', hand: 'left', row: 'number' },
  '3': { finger: 'middle', hand: 'left', row: 'number' },
  '4': { finger: 'index', hand: 'left', row: 'number' },
  '5': { finger: 'index', hand: 'left', row: 'number' },
  '6': { finger: 'index', hand: 'right', row: 'number' },
  '7': { finger: 'index', hand: 'right', row: 'number' },
  '8': { finger: 'middle', hand: 'right', row: 'number' },
  '9': { finger: 'ring', hand: 'right', row: 'number' },
  '0': { finger: 'pinky', hand: 'right', row: 'number' },
  '-': { finger: 'pinky', hand: 'right', row: 'number' },
  '=': { finger: 'pinky', hand: 'right', row: 'number' },
  q: { finger: 'pinky', hand: 'left', row: 'top' },
  w: { finger: 'ring', hand: 'left', row: 'top' },
  e: { finger: 'middle', hand: 'left', row: 'top' },
  r: { finger: 'index', hand: 'left', row: 'top' },
  t: { finger: 'index', hand: 'left', row: 'top' },
  y: { finger: 'index', hand: 'right', row: 'top' },
  u: { finger: 'index', hand: 'right', row: 'top' },
  i: { finger: 'middle', hand: 'right', row: 'top' },
  o: { finger: 'ring', hand: 'right', row: 'top' },
  p: { finger: 'pinky', hand: 'right', row: 'top' },
  '[': { finger: 'pinky', hand: 'right', row: 'top' },
  ']': { finger: 'pinky', hand: 'right', row: 'top' },
  '\\': { finger: 'pinky', hand: 'right', row: 'top' },
  a: { finger: 'pinky', hand: 'left', row: 'home' },
  s: { finger: 'ring', hand: 'left', row: 'home' },
  d: { finger: 'middle', hand: 'left', row: 'home' },
  f: { finger: 'index', hand: 'left', row: 'home' },
  g: { finger: 'index', hand: 'left', row: 'home' },
  h: { finger: 'index', hand: 'right', row: 'home' },
  j: { finger: 'index', hand: 'right', row: 'home' },
  k: { finger: 'middle', hand: 'right', row: 'home' },
  l: { finger: 'ring', hand: 'right', row: 'home' },
  ñ: { finger: 'pinky', hand: 'right', row: 'home' },
  ';': { finger: 'pinky', hand: 'right', row: 'home' },
  "'": { finger: 'pinky', hand: 'right', row: 'home' },
  z: { finger: 'pinky', hand: 'left', row: 'bottom' },
  x: { finger: 'ring', hand: 'left', row: 'bottom' },
  c: { finger: 'middle', hand: 'left', row: 'bottom' },
  v: { finger: 'index', hand: 'left', row: 'bottom' },
  b: { finger: 'index', hand: 'left', row: 'bottom' },
  n: { finger: 'index', hand: 'right', row: 'bottom' },
  m: { finger: 'index', hand: 'right', row: 'bottom' },
  ',': { finger: 'middle', hand: 'right', row: 'bottom' },
  '.': { finger: 'ring', hand: 'right', row: 'bottom' },
  '/': { finger: 'pinky', hand: 'right', row: 'bottom' },
  ' ': { finger: 'thumb', hand: 'both', row: 'bottom' },
};

const LEFT_HAND_KEYS = new Set(
  Object.entries(FINGER_MAP)
    .filter(([, v]) => v.hand === 'left')
    .map(([k]) => k),
);
const RIGHT_HAND_KEYS = new Set(
  Object.entries(FINGER_MAP)
    .filter(([, v]) => v.hand === 'right')
    .map(([k]) => k),
);

function getFingerInfo(char: string) {
  return (
    FINGER_MAP[char.toLowerCase()] ?? {
      finger: 'unknown',
      hand: 'unknown',
      row: 'unknown',
    }
  );
}

function countHandChars(text: string): { left: number; right: number } {
  let left = 0;
  let right = 0;
  for (const char of text.toLowerCase()) {
    if (LEFT_HAND_KEYS.has(char)) left++;
    else if (RIGHT_HAND_KEYS.has(char)) right++;
  }
  return { left, right };
}

@Injectable()
export class WeakKeysService {
  constructor(private prisma: PrismaService) {}

  async getWeakKeys(userId: string, languageCode?: LanguageCode, limit: number = 10) {
    const where: any = { userId };
    if (languageCode) {
      where.languageCode = languageCode;
    }

    const stats = await this.prisma.keyStat.findMany({
      where: {
        ...where,
        totalPresses: { gt: 0 },
      },
      orderBy: { errorRate: 'desc' },
      take: limit,
    });

    return stats.map((s) => ({
      key: s.keyChar,
      totalPresses: s.totalPresses,
      totalErrors: s.totalErrors,
      errorRate: s.errorRate,
      lastErrorAt: s.lastErrorAt,
      ...getFingerInfo(s.keyChar),
    }));
  }

  async getErrorHeatmap(userId: string, languageCode?: LanguageCode) {
    const where: any = { userId };
    if (languageCode) {
      where.languageCode = languageCode;
    }

    const stats = await this.prisma.keyStat.findMany({
      where: {
        ...where,
        totalErrors: { gt: 0 },
      },
    });

    const byHand: Record<string, number> = {
      left: 0,
      right: 0,
      both: 0,
      unknown: 0,
    };
    const byFinger: Record<string, number> = {
      pinky: 0,
      ring: 0,
      middle: 0,
      index: 0,
      thumb: 0,
      unknown: 0,
    };
    const byRow: Record<string, number> = {
      number: 0,
      top: 0,
      home: 0,
      bottom: 0,
      unknown: 0,
    };

    for (const stat of stats) {
      const info = getFingerInfo(stat.keyChar);
      byHand[info.hand] += stat.totalErrors;
      byFinger[info.finger] += stat.totalErrors;
      byRow[info.row] += stat.totalErrors;
    }

    const totalErrors = Object.values(byHand).reduce((a, b) => a + b, 0);

    return {
      totalErrors,
      byHand: Object.entries(byHand).map(([hand, errors]) => ({
        hand,
        errors,
        percentage: totalErrors > 0 ? Math.round((errors / totalErrors) * 100) : 0,
      })),
      byFinger: Object.entries(byFinger).map(([finger, errors]) => ({
        finger,
        errors,
        percentage: totalErrors > 0 ? Math.round((errors / totalErrors) * 100) : 0,
      })),
      byRow: Object.entries(byRow).map(([row, errors]) => ({
        row,
        errors,
        percentage: totalErrors > 0 ? Math.round((errors / totalErrors) * 100) : 0,
      })),
    };
  }

  async getErrorTrends(userId: string, languageCode?: LanguageCode, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const sessions = await this.prisma.errorSession.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        type: true,
        totalErrors: true,
        totalKeystrokes: true,
        accuracy: true,
        netWpm: true,
        createdAt: true,
      },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      type: s.type,
      date: s.createdAt.toISOString(),
      totalErrors: s.totalErrors,
      totalKeystrokes: s.totalKeystrokes,
      accuracy: s.accuracy,
      netWpm: s.netWpm,
      errorRate: s.totalKeystrokes > 0 ? Math.round((s.totalErrors / s.totalKeystrokes) * 100) : 0,
    }));
  }

  async getPersonalizedLesson(userId: string, languageCode?: LanguageCode, limit: number = 5) {
    const weakKeys = await this.getWeakKeys(userId, languageCode, limit);

    if (weakKeys.length === 0) {
      // Sin datos: devolver texto aleatorio del idioma
      const fallbackText = await this.getRandomText(languageCode ?? LanguageCode.es);
      return {
        targetKeys: [],
        mostProblematicHand: null,
        topWeakKeys: [],
        reason:
          'No hay suficientes datos para generar una lección personalizada. Sigue practicando.',
        suggestedText: fallbackText,
      };
    }

    const targetKeys = weakKeys.map((k) => k.key);
    const targetKeySet = new Set(targetKeys.map((k) => k.toLowerCase()));

    const mostProblematicHand =
      weakKeys[0]?.hand === 'left' || weakKeys[0]?.hand === 'right' ? weakKeys[0].hand : null;

    // Buscar textos que contengan al menos una targetKey
    const texts = await this.prisma.practiceText.findMany({
      where: {
        languageCode: languageCode ?? LanguageCode.es,
        characterSet: { hasSome: targetKeys },
      },
      select: {
        id: true,
        content: true,
        characterSet: true,
      },
    });

    if (texts.length === 0) {
      const fallbackText = await this.getRandomText(languageCode ?? LanguageCode.es);
      return {
        targetKeys,
        mostProblematicHand,
        topWeakKeys: weakKeys,
        reason: `Teclas problemáticas: ${targetKeys.join(', ')}. No se encontró texto personalizado.`,
        suggestedText: fallbackText,
      };
    }

    // Puntuar textos: coincidencias de targetKeys + prioridad de mano
    const scored = texts.map((t) => {
      const charSet = new Set(t.characterSet.map((c) => c.toLowerCase()));
      let matchCount = 0;
      for (const key of targetKeySet) {
        if (charSet.has(key)) matchCount++;
      }

      const { left, right } = countHandChars(t.content);
      const handScore =
        mostProblematicHand === 'left'
          ? left - right
          : mostProblematicHand === 'right'
            ? right - left
            : 0;

      return { ...t, matchCount, handScore };
    });

    // Ordenar: más coincidencias primero, luego prioridad de mano
    scored.sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return b.handScore - a.handScore;
    });

    const best = scored[0];

    const reason = mostProblematicHand
      ? `Enfocada en la mano ${mostProblematicHand === 'left' ? 'izquierda' : 'derecha'}. Teclas objetivo: ${targetKeys.join(', ')}`
      : `Enfocada en las teclas con mayor tasa de error: ${targetKeys.join(', ')}`;

    return {
      targetKeys,
      mostProblematicHand,
      topWeakKeys: weakKeys,
      reason,
      suggestedText: {
        id: best.id,
        content: best.content,
      },
    };
  }

  private async getRandomText(languageCode: LanguageCode) {
    const texts = await this.prisma.practiceText.findMany({
      where: { languageCode },
      select: { id: true, content: true },
      take: 10,
    });

    if (texts.length > 0) {
      const randomIndex = Math.floor(Math.random() * texts.length);
      return { id: texts[randomIndex].id, content: texts[randomIndex].content };
    }

    const defaults: Partial<Record<LanguageCode, { id: string; content: string }>> = {
      [LanguageCode.es]: {
        id: 'default-es-1',
        content:
          'Este es un texto de práctica. Escribe rápido y con precisión para mejorar tu mecanografía.',
      },
      [LanguageCode.en]: {
        id: 'default-en-1',
        content:
          'This is a practice text. Type quickly and accurately to improve your typing skills.',
      },
      [LanguageCode.pt]: {
        id: 'default-pt-1',
        content:
          'Este é um texto de prática. Digite com rapidez e precisão para melhorar sua digitação.',
      },
      [LanguageCode.fr]: {
        id: 'default-fr-1',
        content:
          'Ceci est un texte de pratique. Tapez rapidement et avec précision pour améliorer votre dactylographie.',
      },
    };

    return defaults[languageCode] ?? defaults[LanguageCode.en];
  }
}
