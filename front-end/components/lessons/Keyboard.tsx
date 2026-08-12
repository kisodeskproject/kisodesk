// components/lessons/Keyboard.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getHandReferencesForPhysicalKeyId,
  getHandSvgPositionsForPhysicalFamily,
} from '@/lib/keyboardPhysicalHands';
import {
  getPhysicalKeyIdForCode,
  normalizeKeyboardPhysicalFamily,
  PHYSICAL_KEY_ID_ROWS,
  type PhysicalKeyId,
} from '@/lib/keyboardPhysical';
import { toSupportedLocale, useTranslations } from '@/lib/i18n';
import { useKeyboardLayout } from '@/contexts/KeyboardLayoutContext';
import {
  getKeyboardPhysicalFamily,
  getSvgKeyIdForPhysicalKeyId,
  getVisualKeyForPhysicalKeyId,
  resolveCharacterToPhysicalKey,
} from '@/lib/keyMappings';
import { getDeadKey, getKeyOutput, getLayoutById } from '@/lib/keyboardLayouts';
import type { KeyboardPhysicalFamily } from '@/lib/keyboardLayouts';
import { useParams } from 'next/navigation';

interface KeyboardProps {
  layoutId: string;
  onKeyPress?: (key: string) => void;
  activeKeys?: PhysicalKeyId[];
  correctFlashKeys?: PhysicalKeyId[];
  incorrectFlashKeys?: PhysicalKeyId[];
  guideKeys?: PhysicalKeyId[];
  expectedChar?: string | null;
  leftHandSrc?: string;
  rightHandSrc?: string;
}

/* ============================================================
   
============================================================ */
const toPhysicalKeyId = (value: string) => value as PhysicalKeyId;

const CONTROL_OUTPUT_BY_PHYSICAL_ID: Partial<Record<PhysicalKeyId, string>> = Object.fromEntries(
  [
    ['P42', 'Shift_L'],
    ['P55', 'Shift_R'],
    ['P56', 'Ctrl_L'],
    ['P63', 'Ctrl_R'],
    ['P59', 'Alt_L'],
    ['P64', 'Alt_R'],
    ['P61', 'AltGr'],
    ['P58', 'Win_L'],
    ['P62', 'Win_R'],
    ['P60', 'Space'],
    ['P14', 'Backspace'],
    ['P15', 'Tab'],
    ['P29', 'Caps'],
    ['P41', 'Enter'],
    ['P66', 'NonConvert'],
    ['P67', 'Convert'],
    ['P68', 'KanaMode'],
    ['P69', 'Lang2'],
    ['P70', 'Lang1'],
  ].map(([key, value]) => [toPhysicalKeyId(key), value]),
) as Partial<Record<PhysicalKeyId, string>>;

const CONTROL_DISPLAY_LABEL_BY_PHYSICAL_ID: Partial<Record<PhysicalKeyId, string>> =
  Object.fromEntries(
    [
      ['P14', 'Backspace'],
      ['P15', 'Tab'],
      ['P29', 'Caps Lock'],
      ['P41', 'Enter'],
      ['P42', 'Shift'],
      ['P55', 'Shift'],
      ['P56', 'Ctrl'],
      ['P57', 'Fn'],
      ['P58', 'Win'],
      ['P59', 'Alt'],
      ['P60', 'Space'],
      ['P64', 'Alt'],
      ['P62', 'Win'],
      ['P63', 'Ctrl'],
      ['P61', 'AltGr'],
      ['P66', '無変換'],
      ['P67', '変換'],
      ['P68', 'かな'],
      ['P69', '한/영'],
      ['P70', '한자'],
    ].map(([key, value]) => [toPhysicalKeyId(key), value]),
  ) as Partial<Record<PhysicalKeyId, string>>;
/* ============================================================
   GEOMETRÍA
============================================================ */
export type KeyboardGeometryConfig = {
  PITCH: number;
  KEY_SIZE: number;
  ROW_OFFSET: number;
  KEY_RADIUS: number;
  TEXT_SIZE: number;
  MARGIN: number;
  KEY_UNITS: Record<string, number>;
  PHYSICAL_KEY_UNITS: Partial<Record<PhysicalKeyId, number>>;
  PHYSICAL_KEY_OFFSETS: Partial<Record<PhysicalKeyId, { x: number; y?: number }>>;
  ENTER: { form: 'rectangular' | 'iso' | 'big-ass'; units: number };
  SHIFT_LEFT: { units: number };
  SHIFT_RIGHT: { units: number };
  SPECIAL_POSITIONS: Partial<Record<PhysicalKeyId, { units: number }>>;
};

type HandVisualConfig = {
  strokeWidth: string;
  stroke: string;
  opacity: number;
  fill: string;
  strokeLinecap: 'round' | 'butt' | 'square';
  strokeLinejoin: 'round' | 'miter' | 'bevel';
};

const HAND_SVG_GRAY = 'var(--keyboard-hand-guide)';

const HAND_VISUAL_CONFIG = {
  leftHand: {
    strokeWidth: '8',
    stroke: HAND_SVG_GRAY,
    opacity: 1,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  rightHand: {
    strokeWidth: '8',
    stroke: HAND_SVG_GRAY,
    opacity: 1,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
} satisfies Record<'leftHand' | 'rightHand', HandVisualConfig>;

const LEFT_REST_HAND_VISUAL_CONFIG: HandVisualConfig = {
  strokeWidth: '8',
  stroke: 'var(--keyboard-hand-rest)',
  opacity: 1,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const REST_HAND_SVG_SOURCES = new Set(['/svg/P30-P33.svg', '/svg/P36-P39-Space.svg']);
const SHIFT_HAND_SVG_SOURCES = new Set(['/svg/P42.svg', '/svg/P55.svg']);

type InlineHandSvg = {
  viewBox: string;
  markup: string;
};

const inlineHandSvgCache = new Map<string, Promise<InlineHandSvg | null>>();

function normalizeHandSvgSource(markup: string): string {
  return markup
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/>\s*>/g, '>')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
}

function buildInlineHandSvg(markup: string): InlineHandSvg {
  const parser = new DOMParser();
  const normalizedSource = normalizeHandSvgSource(markup);
  const doc = parser.parseFromString(normalizedSource, 'image/svg+xml');
  const root = doc.documentElement;

  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    throw new Error('No se pudo interpretar el SVG de mano.');
  }

  const descendants = root.querySelectorAll('*');
  descendants.forEach((node) => {
    node.removeAttribute('fill');
    node.removeAttribute('stroke');
    node.removeAttribute('stroke-width');
    node.removeAttribute('stroke-linecap');
    node.removeAttribute('stroke-linejoin');
    node.removeAttribute('opacity');
    node.setAttribute('fill', 'none');
    node.setAttribute('stroke', 'currentColor');
  });

  const viewBox = root.getAttribute('viewBox') || '0 0 1495 1052';
  const serializer = new XMLSerializer();
  const markupContent = Array.from(root.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join('');

  return { viewBox, markup: markupContent };
}

function loadInlineHandSvg(src: string | undefined): Promise<InlineHandSvg | null> {
  if (!src) {
    return Promise.resolve(null);
  }

  const cachedSvg = inlineHandSvgCache.get(src);
  if (cachedSvg) {
    return cachedSvg;
  }

  const request = fetch(src)
    .then(async (response) => {
      if (!response.ok) {
        return null;
      }

      return buildInlineHandSvg(await response.text());
    })
    .catch(() => null);

  inlineHandSvgCache.set(src, request);
  return request;
}

const BASE_KEY_UNITS: Record<string, number> = {
  º: 1,
  '°': 1,
  '²': 1,
  '`': 1,
  '-': 1,
  '=': 1,
  '[': 1,
  ']': 1,
  '+': 1,
  '{': 1,
  '}': 1.5,
  '\\': 1,
  ';': 1,
  "'": 1,
  '/': 1,
  ',': 1,
  '.': 1,
  '#': 1,
  '?': 1,
  '¿': 1,
  '·': 1,
  ç: 1,
  ù: 1,
  ü: 1,
  ö: 1,
  ä: 1,
  ß: 1,
  '´': 1,
  '^': 1,
  '&': 1,
  é: 1,
  _: 1,
  à: 1,
  '(': 1,
  ')': 1,
  '!': 1,
  ':': 1,
  '*': 1,
  $: 1,
  '<': 1,
  '¡': 1,
  q: 1,
  w: 1,
  e: 1,
  r: 1,
  t: 1,
  y: 1,
  u: 1,
  i: 1,
  o: 1,
  p: 1,
  a: 1,
  s: 1,
  d: 1,
  f: 1,
  g: 1,
  h: 1,
  j: 1,
  k: 1,
  l: 1,
  ñ: 1,
  z: 1,
  x: 1,
  c: 1,
  v: 1,
  b: 1,
  n: 1,
  m: 1,
  '1': 1,
  '2': 1,
  '3': 1,
  '4': 1,
  '5': 1,
  '6': 1,
  '7': 1,
  '8': 1,
  '9': 1,
  '0': 1,
  Backspace: 2,
  Tab: 1.5,
  Caps: 1.75,
  Enter: 2.25,
  Shift_L: 2.25,
  Shift_R: 1.75,
  Ctrl_L: 1.25,
  Ctrl_R: 1.25,
  Win_L: 1,
  Win_R: 1,
  Alt_L: 1.5,
  Alt_R: 1.5,
  AltGr: 1.5,
  Space: 5.5,
  Fn: 1,
};

const BASE_PHYSICAL_KEY_UNITS = Object.fromEntries(
  (
    [
      ['P41', 2.25],
      ['P42', 2.25],
      ['P43', 1],
      ['P54', 1],
      ['P55', 1.75],
    ] as Array<[string, number]>
  ).map(([key, value]) => [toPhysicalKeyId(key), value]),
) as Partial<Record<PhysicalKeyId, number>>;

function createKeyboardGeometryConfig(): KeyboardGeometryConfig {
  return {
    PITCH: 19,
    KEY_SIZE: 15.5,
    ROW_OFFSET: 18,
    KEY_RADIUS: 2,
    TEXT_SIZE: 4.5,
    MARGIN: 5,
    KEY_UNITS: { ...BASE_KEY_UNITS },
    PHYSICAL_KEY_UNITS: { ...BASE_PHYSICAL_KEY_UNITS },
    PHYSICAL_KEY_OFFSETS: {},
    ENTER: { form: 'rectangular', units: 2.25 },
    SHIFT_LEFT: { units: 2.25 },
    SHIFT_RIGHT: { units: 1.75 },
    SPECIAL_POSITIONS: Object.fromEntries(
      (
        [
          ['P43', { units: 1 }],
          ['P54', { units: 1 }],
        ] as Array<[string, { units: number }]>
      ).map(([key, value]) => [toPhysicalKeyId(key), value]),
    ) as Partial<Record<PhysicalKeyId, { units: number }>>,
  };
}

function createAnsiKeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createKeyboardGeometryConfig();

  return {
    ...geometry,
    KEY_UNITS: {
      ...geometry.KEY_UNITS,
      Backspace: 2,
      Tab: 1.5,
      Caps: 1.75,
    },
    PHYSICAL_KEY_UNITS: {
      ...geometry.PHYSICAL_KEY_UNITS,
      [toPhysicalKeyId('P14')]: 2,
      [toPhysicalKeyId('P15')]: 1.5,
      [toPhysicalKeyId('P29')]: 1.75,
      [toPhysicalKeyId('P41')]: 2.25,
      [toPhysicalKeyId('P42')]: 2.25,
      [toPhysicalKeyId('P55')]: 1.75,
    },
  };
}

function createIsoKeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createAnsiKeyboardGeometryConfig();

  return {
    ...geometry,
    PHYSICAL_KEY_UNITS: {
      ...geometry.PHYSICAL_KEY_UNITS,
      [toPhysicalKeyId('P28')]: 1,
      [toPhysicalKeyId('P41')]: 1.25,
      [toPhysicalKeyId('P42')]: 1,
      [toPhysicalKeyId('P43')]: 1,
      [toPhysicalKeyId('P56')]: 1.25,
      [toPhysicalKeyId('P57')]: 1,
      [toPhysicalKeyId('P58')]: 1,
      [toPhysicalKeyId('P59')]: 1.5,
      [toPhysicalKeyId('P64')]: 1.5,
      [toPhysicalKeyId('P62')]: 1,
      [toPhysicalKeyId('P63')]: 1.25,
    },
    ENTER: { form: 'iso', units: 1.25 },
    SHIFT_LEFT: { units: 1.25 },
  };
}

function createAbnt2KeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createIsoKeyboardGeometryConfig();

  return {
    ...geometry,
    PHYSICAL_KEY_UNITS: {
      ...geometry.PHYSICAL_KEY_UNITS,
      [toPhysicalKeyId('P54')]: 1,
      [toPhysicalKeyId('P55')]: 1.25,
    },
    SHIFT_RIGHT: { units: 1.25 },
  };
}

function createBigAssKeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createIsoKeyboardGeometryConfig();

  return {
    ...geometry,
    ENTER: { form: 'big-ass', units: 1.25 },
  };
}

// JIS y KS parten de la retícula ANSI, pero conservan objetos propios: sus
// teclas exclusivas podrán ajustarse sin alterar ninguna otra familia.
function createJisKeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createAnsiKeyboardGeometryConfig();

  return {
    ...geometry,
    PHYSICAL_KEY_UNITS: {
      ...geometry.PHYSICAL_KEY_UNITS,
      [toPhysicalKeyId('P65')]: 1,
      [toPhysicalKeyId('P66')]: 1,
      [toPhysicalKeyId('P67')]: 1,
      [toPhysicalKeyId('P68')]: 1,
    },
  };
}

function createKsKeyboardGeometryConfig(): KeyboardGeometryConfig {
  const geometry = createAnsiKeyboardGeometryConfig();

  return {
    ...geometry,
    PHYSICAL_KEY_UNITS: {
      ...geometry.PHYSICAL_KEY_UNITS,
      [toPhysicalKeyId('P65')]: 1,
      [toPhysicalKeyId('P69')]: 1,
      [toPhysicalKeyId('P70')]: 1,
    },
  };
}

export const KEYBOARD_GEOMETRY_BY_FAMILY: Readonly<
  Record<KeyboardPhysicalFamily, KeyboardGeometryConfig>
> = {
  ANSI: createAnsiKeyboardGeometryConfig(),
  ISO: createIsoKeyboardGeometryConfig(),
  ABNT2: createAbnt2KeyboardGeometryConfig(),
  BIG_ASS: createBigAssKeyboardGeometryConfig(),
  JIS: createJisKeyboardGeometryConfig(),
  KS: createKsKeyboardGeometryConfig(),
};

const VISUAL_CONTROL_KEY_IDS = new Set(
  Object.keys(CONTROL_DISPLAY_LABEL_BY_PHYSICAL_ID) as PhysicalKeyId[],
);

// La geometría pertenece sólo a la familia física. Las etiquetas siempre se
// obtienen del layout lógico seleccionado en keyboardLayouts.ts.
export function getKeyboardSvgData(layoutId: string, physicalFamily?: KeyboardPhysicalFamily) {
  const keyboardLayout = getLayoutById(layoutId) ?? getLayoutById('qwerty-es')!;
  const family = normalizeKeyboardPhysicalFamily(
    physicalFamily ?? getKeyboardPhysicalFamily(keyboardLayout),
  );
  const keyIdRows = PHYSICAL_KEY_ID_ROWS[family];

  return {
    physicalFamily: family,
    keyboardLayout,
    keyIdRows,
    rows: keyIdRows.map((row) =>
      row.map((physicalKeyId) =>
        VISUAL_CONTROL_KEY_IDS.has(physicalKeyId)
          ? CONTROL_DISPLAY_LABEL_BY_PHYSICAL_ID[physicalKeyId]!
          : (getKeyOutput(keyboardLayout, physicalKeyId) ?? ''),
      ),
    ),
  };
}

/* ============================================================
   SHIFT – mapeo de tecla base a su representación con Shift
============================================================ */
const SHIFT_MAP: Record<string, Record<string, string>> = {
  'qwerty-es': {
    '1': '!',
    '2': '"',
    '3': '·',
    '4': '$',
    '5': '%',
    '6': '&',
    '7': '/',
    '8': '(',
    '9': ')',
    '0': '=',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~',
    '<': '>',
  },
  'qwerty-latam': {
    '1': '!',
    '2': '"',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '&',
    '7': '/',
    '8': '(',
    '9': ')',
    '0': '=',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~',
    '°': ' ',
    '<': '>',
  },
  'qwerty-en': {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~',
  },
  'qwerty-uk': {
    '1': '!',
    '2': '"',
    '3': '£',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '@',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '¬',
    '#': '~',
    '\\': '|',
  },
  azerty: {
    '&': '1',
    é: '2',
    '"': '3',
    "'": '4',
    '(': '5',
    '-': '6',
    è: '7',
    _: '8',
    ç: '9',
    à: '0',
    ')': '°',
    '=': '+',
    '^': '¨',
    $: '£',
    '*': 'µ',
    ',': '?',
    ';': '.',
    ':': '/',
    '!': '§',
    '<': '>',
  },
  qwertz: {
    '1': '!',
    '2': '"',
    '3': '§',
    '4': '$',
    '5': '%',
    '6': '&',
    '7': '/',
    '8': '(',
    '9': ')',
    '0': '=',
    ß: '?',
    '´': '`',
    '+': '*',
    '#': "'",
    ',': ';',
    '.': ':',
    '-': '_',
    '<': '>',
  },
  dvorak: {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~',
  },
  colemak: {
    '1': '!',
    '2': '@',
    '3': '#',
    '4': '$',
    '5': '%',
    '6': '^',
    '7': '&',
    '8': '*',
    '9': '(',
    '0': ')',
    '-': '_',
    '=': '+',
    '[': '{',
    ']': '}',
    ';': ':',
    "'": '"',
    ',': '<',
    '.': '>',
    '/': '?',
    '`': '~',
  },
};
void SHIFT_MAP;

/* ============================================================
   CONJUNTO DE TECLAS MODIFICADORAS 
============================================================ */
const MODIFIER_KEYS = new Set([
  'Shift',
  'Ctrl',
  'Alt',
  'Win',
  'Shift_L',
  'Shift_R',
  'Ctrl_L',
  'Ctrl_R',
  'Alt_L',
  'Alt_R',
  'AltGr',
  'Win_L',
  'Win_R',
  'Caps',
  'Caps Lock',
  'Tab',
  'Enter',
  'Backspace',
  'Fn',
]);

export function resolveKeyboardVisualKey(layoutId: string, physicalKeyId: PhysicalKeyId): string {
  return (
    getVisualKeyForPhysicalKeyId(physicalKeyId, layoutId) ??
    CONTROL_OUTPUT_BY_PHYSICAL_ID[physicalKeyId] ??
    physicalKeyId
  );
}

export function resolveKeyboardPressOutput(
  layoutId: string,
  physicalKeyId: PhysicalKeyId,
  shiftKey: boolean,
  fallbackKey: string,
): string {
  return (
    CONTROL_OUTPUT_BY_PHYSICAL_ID[physicalKeyId] ??
    getVisualKeyForPhysicalKeyId(physicalKeyId, layoutId, shiftKey) ??
    fallbackKey
  );
}

type RoundedIsoEnterPathOptions = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  upperLeft: number;
  upperTop: number;
  radius: number;
};

const ISO_ENTER_HORIZONTAL_BOTTOM_TRIM = 2;

function buildRoundedIsoEnterPath({
  left,
  right,
  top,
  bottom,
  upperLeft,
  upperTop,
  radius,
}: RoundedIsoEnterPathOptions): string {
  const horizontalBottom = top - ISO_ENTER_HORIZONTAL_BOTTOM_TRIM;

  const roundedRadius = Math.max(
    0,
    Math.min(
      radius,
      (right - left) / 2,
      (horizontalBottom - upperTop) / 2,
      (bottom - horizontalBottom) / 2,
      (left - upperLeft) / 2,
    ),
  );

  return [
    `M ${upperLeft + roundedRadius} ${upperTop}`,
    `H ${right - roundedRadius}`,
    `Q ${right} ${upperTop} ${right} ${upperTop + roundedRadius}`,
    `V ${bottom - roundedRadius}`,
    `Q ${right} ${bottom} ${right - roundedRadius} ${bottom}`,
    `H ${left + roundedRadius}`,
    `Q ${left} ${bottom} ${left} ${bottom - roundedRadius}`,
    `V ${horizontalBottom + roundedRadius}`,
    `Q ${left} ${horizontalBottom} ${left - roundedRadius} ${horizontalBottom}`,
    `H ${upperLeft + roundedRadius}`,
    `Q ${upperLeft} ${horizontalBottom} ${upperLeft} ${horizontalBottom - roundedRadius}`,
    `V ${upperTop + roundedRadius}`,
    `Q ${upperLeft} ${upperTop} ${upperLeft + roundedRadius} ${upperTop}`,
    'Z',
  ].join(' ');
}

function buildRoundedBigAssEnterPath({
  left,
  right,
  top,
  bottom,
  upperLeft,
  upperTop,
  radius,
}: RoundedIsoEnterPathOptions): string {
  const horizontalBottom = top - ISO_ENTER_HORIZONTAL_BOTTOM_TRIM;
  const roundedRadius = Math.max(
    0,
    Math.min(
      radius,
      (right - upperLeft) / 2,
      (horizontalBottom - upperTop) / 2,
      (bottom - horizontalBottom) / 2,
      (upperLeft - left) / 2,
    ),
  );

  return [
    `M ${upperLeft + roundedRadius} ${upperTop}`,
    `H ${right - roundedRadius}`,
    `Q ${right} ${upperTop} ${right} ${upperTop + roundedRadius}`,
    `V ${bottom - roundedRadius}`,
    `Q ${right} ${bottom} ${right - roundedRadius} ${bottom}`,
    `H ${left + roundedRadius}`,
    `Q ${left} ${bottom} ${left} ${bottom - roundedRadius}`,
    `V ${horizontalBottom + roundedRadius}`,
    `Q ${left} ${horizontalBottom} ${left + roundedRadius} ${horizontalBottom}`,
    `H ${upperLeft - roundedRadius}`,
    `Q ${upperLeft} ${horizontalBottom} ${upperLeft} ${horizontalBottom - roundedRadius}`,
    `V ${upperTop + roundedRadius}`,
    `Q ${upperLeft} ${upperTop} ${upperLeft + roundedRadius} ${upperTop}`,
    'Z',
  ].join(' ');
}

/* ============================================================
   COMPONENTE
============================================================ */
export default function Keyboard({
  layoutId,
  onKeyPress,
  activeKeys,
  correctFlashKeys = [],
  incorrectFlashKeys = [],
  guideKeys = [],
  expectedChar,
  leftHandSrc,
  rightHandSrc,
}: KeyboardProps) {
  const params = useParams<{ lang?: string }>();
  const t = useTranslations(toSupportedLocale(params?.lang ?? 'es-latam'));
  const { physicalFamily: savedPhysicalFamily } = useKeyboardLayout();
  const { keyboardLayout, keyIdRows, rows, physicalFamily } = useMemo(
    () => getKeyboardSvgData(layoutId, savedPhysicalFamily),
    [layoutId, savedPhysicalFamily],
  );
  const geometry = KEYBOARD_GEOMETRY_BY_FAMILY[physicalFamily];
  const shiftMap = useMemo(() => {
    const map: Record<string, string> = {};

    keyIdRows.forEach((row) => {
      row.forEach((physicalKeyId) => {
        const baseKey = getKeyOutput(keyboardLayout, physicalKeyId);
        const shiftedKey = getKeyOutput(keyboardLayout, physicalKeyId, true);
        if (baseKey && shiftedKey && baseKey !== shiftedKey) map[baseKey] = shiftedKey;
      });
    });

    return map;
  }, [keyIdRows, keyboardLayout]);
  const handSvgPositions = useMemo(
    () => getHandSvgPositionsForPhysicalFamily(physicalFamily),
    [physicalFamily],
  );
  const [pressedKeys, setPressedKeys] = useState<Set<PhysicalKeyId>>(new Set());
  const [accentGuideCompleted, setAccentGuideCompleted] = useState(false);
  const [localCorrectFlashKeys, setLocalCorrectFlashKeys] = useState<PhysicalKeyId[]>([]);
  const [localIncorrectFlashKeys, setLocalIncorrectFlashKeys] = useState<PhysicalKeyId[]>([]);
  const [inlineHandSvgs, setInlineHandSvgs] = useState<{
    leftSrc?: string;
    left: InlineHandSvg | null;
    rightSrc?: string;
    right: InlineHandSvg | null;
  }>({
    leftSrc: undefined,
    left: null,
    rightSrc: undefined,
    right: null,
  });

  const shiftActive =
    pressedKeys.has('P42' as PhysicalKeyId) || pressedKeys.has('P55' as PhysicalKeyId);

  const normalizedConfiguredGuideKeys = useMemo(
    () =>
      new Set(
        (activeKeys ?? guideKeys).filter(
          (key) => getSvgKeyIdForPhysicalKeyId(key, physicalFamily) !== null,
        ),
      ),
    [activeKeys, guideKeys, physicalFamily],
  );
  const shiftSequenceGuideKeys = useMemo<Set<PhysicalKeyId>>(
    () =>
      new Set([...normalizedConfiguredGuideKeys].filter((key) => key === 'P42' || key === 'P55')),
    [normalizedConfiguredGuideKeys],
  );
  const hasShiftSequence =
    shiftSequenceGuideKeys.size > 0 &&
    normalizedConfiguredGuideKeys.size > shiftSequenceGuideKeys.size;
  const resolvedExpectedKey = useMemo(
    () => (expectedChar ? resolveCharacterToPhysicalKey(expectedChar, keyboardLayout) : null),
    [expectedChar, keyboardLayout],
  );
  const accentSequenceKey = useMemo(() => {
    if (resolvedExpectedKey?.deadKey) return resolvedExpectedKey.deadKey.physicalKeyId;
    return (
      [...normalizedConfiguredGuideKeys].find((key) =>
        Boolean(getKeyOutput(keyboardLayout, key) && getDeadKey(keyboardLayout, key, false)),
      ) ?? null
    );
  }, [keyboardLayout, normalizedConfiguredGuideKeys, resolvedExpectedKey]);
  const accentSequenceRequiresShift = resolvedExpectedKey?.deadKey?.requiresShift ?? false;
  const accentSequenceShiftKeyId = resolvedExpectedKey?.deadKey?.shiftPhysicalKeyId ?? null;
  const hasAccentSequence = accentSequenceKey !== null && normalizedConfiguredGuideKeys.size > 1;
  const guideSignature = useMemo(
    () => [...normalizedConfiguredGuideKeys].sort().join('|'),
    [normalizedConfiguredGuideKeys],
  );
  useEffect(() => {
    setAccentGuideCompleted(false);
  }, [guideSignature]);
  const isRequiredShiftHeld = useMemo(
    () => [...pressedKeys].some((key) => shiftSequenceGuideKeys.has(key)),
    [pressedKeys, shiftSequenceGuideKeys],
  );
  const normalizedGuideKeys = useMemo(() => {
    if (hasAccentSequence && !accentGuideCompleted) {
      const keys = [accentSequenceKey as PhysicalKeyId];
      if (accentSequenceRequiresShift && accentSequenceShiftKeyId) {
        keys.push(accentSequenceShiftKeyId);
      }
      return new Set(keys);
    }
    if (hasAccentSequence && accentGuideCompleted) {
      return new Set(
        [...normalizedConfiguredGuideKeys].filter(
          (key) =>
            key !== accentSequenceKey &&
            !(accentSequenceRequiresShift && key === accentSequenceShiftKeyId),
        ),
      );
    }
    if (!hasShiftSequence || isRequiredShiftHeld) return normalizedConfiguredGuideKeys;
    return shiftSequenceGuideKeys;
  }, [
    accentGuideCompleted,
    accentSequenceKey,
    accentSequenceRequiresShift,
    accentSequenceShiftKeyId,
    hasAccentSequence,
    hasShiftSequence,
    isRequiredShiftHeld,
    normalizedConfiguredGuideKeys,
    shiftSequenceGuideKeys,
  ]);
  const guideHandReferences = useMemo(() => {
    const targetKeyId = (activeKeys ?? guideKeys).find((key) => key !== 'P42' && key !== 'P55');
    return getHandReferencesForPhysicalKeyId(targetKeyId, physicalFamily);
  }, [activeKeys, guideKeys, physicalFamily]);
  const resolvedLeftHandSrc = guideHandReferences.left ?? leftHandSrc;
  const resolvedRightHandSrc = guideHandReferences.right ?? rightHandSrc;
  const displayedLeftHandSrc =
    hasShiftSequence &&
    !isRequiredShiftHeld &&
    !SHIFT_HAND_SVG_SOURCES.has(resolvedLeftHandSrc ?? '')
      ? '/svg/P30-P33.svg'
      : resolvedLeftHandSrc;
  const displayedRightHandSrc =
    hasShiftSequence &&
    !isRequiredShiftHeld &&
    !SHIFT_HAND_SVG_SOURCES.has(resolvedRightHandSrc ?? '')
      ? '/svg/P36-P39-Space.svg'
      : resolvedRightHandSrc;
  const normalizedCorrectFlashKeys = useMemo(
    () => new Set([...correctFlashKeys, ...localCorrectFlashKeys]),
    [correctFlashKeys, localCorrectFlashKeys],
  );
  const normalizedIncorrectFlashKeys = useMemo(
    () => new Set([...incorrectFlashKeys, ...localIncorrectFlashKeys]),
    [incorrectFlashKeys, localIncorrectFlashKeys],
  );

  const flashPressedKey = useCallback(
    (physicalKeyId: PhysicalKeyId) => {
      if (!getSvgKeyIdForPhysicalKeyId(physicalKeyId, physicalFamily)) return;
      const isCorrect = normalizedGuideKeys.has(physicalKeyId);
      const setFlashKeys = isCorrect ? setLocalCorrectFlashKeys : setLocalIncorrectFlashKeys;

      if (isCorrect && hasAccentSequence && physicalKeyId === accentSequenceKey) {
        setAccentGuideCompleted(true);
      }

      setFlashKeys((current) =>
        current.includes(physicalKeyId) ? current : [...current, physicalKeyId],
      );
      if (!isCorrect) return;

      window.setTimeout(() => {
        setFlashKeys((current) => current.filter((currentKey) => currentKey !== physicalKeyId));
      }, 150);
    },
    [accentSequenceKey, hasAccentSequence, normalizedGuideKeys, physicalFamily],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      const physicalKeyId = getPhysicalKeyIdForCode(e.code, physicalFamily);
      if (!physicalKeyId) return;
      setPressedKeys((prev) => {
        if (prev.has(physicalKeyId)) return prev;
        const next = new Set(prev);
        next.add(physicalKeyId);
        return next;
      });
      flashPressedKey(physicalKeyId);
      onKeyPress?.(resolveKeyboardPressOutput(layoutId, physicalKeyId, e.shiftKey, e.key));
    },
    [flashPressedKey, layoutId, onKeyPress, physicalFamily],
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const physicalKeyId = getPhysicalKeyIdForCode(e.code, physicalFamily);
    if (!physicalKeyId) return;
    setPressedKeys((prev) => {
      if (!prev.has(physicalKeyId)) return prev;
      const next = new Set(prev);
      next.delete(physicalKeyId);
      return next;
    });
    window.setTimeout(() => {
      setLocalIncorrectFlashKeys((current) =>
        current.filter((currentKey) => currentKey !== physicalKeyId),
      );
    }, 150);
  }, [physicalFamily]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const label = useCallback(
    (key: string) => {
      if (shiftActive) {
        if (shiftMap[key]) return shiftMap[key];
        if (key.length === 1 && /^[a-z]$/.test(key)) return key.toUpperCase();
      }
      return key.replace(/_(L|R)$/, '');
    },
    [shiftActive, shiftMap],
  );

  const getColor = useCallback(
    (physicalKeyId: PhysicalKeyId, key: string) => {
      if (normalizedIncorrectFlashKeys.has(physicalKeyId)) return 'fill-(--accent-red)';
      if (normalizedCorrectFlashKeys.has(physicalKeyId)) return 'fill-(--accent-green)';
      if (isRequiredShiftHeld && shiftSequenceGuideKeys.has(physicalKeyId)) {
        return 'fill-(--accent-green)';
      }
      return MODIFIER_KEYS.has(key)
        ? 'fill-(--keyboard-modifier-key-background)'
        : 'fill-(--bg-secondary)';
    },
    [
      isRequiredShiftHeld,
      normalizedCorrectFlashKeys,
      normalizedIncorrectFlashKeys,
      shiftSequenceGuideKeys,
    ],
  );

  const svgGeometry = useMemo(() => {
    const maxW = Math.max(
      ...rows.map((row, rowIndex) =>
        row.reduce((sum, key, columnIndex) => {
          const physicalKeyId = keyIdRows[rowIndex][columnIndex];
          const units = geometry.PHYSICAL_KEY_UNITS[physicalKeyId] ?? geometry.KEY_UNITS[key] ?? 1;
          return sum + units * geometry.PITCH;
        }, 0),
      ),
    );
    return {
      width: maxW + geometry.MARGIN * 2,
      height: geometry.KEY_SIZE + (rows.length - 1) * geometry.ROW_OFFSET + geometry.MARGIN * 2,
    };
  }, [geometry, keyIdRows, rows]);

  const positions = useMemo(() => {
    const data: {
      id: string;
      physicalKeyId: PhysicalKeyId;
      key: string;
      x: number;
      y: number;
      w: number;
    }[] = [];
    let y = geometry.MARGIN + geometry.KEY_SIZE / 2;
    rows.forEach((row, ri) => {
      let x = geometry.MARGIN;
      row.forEach((key, columnIndex) => {
        const physicalKeyId = keyIdRows[ri][columnIndex];
        const unit = geometry.PHYSICAL_KEY_UNITS[physicalKeyId] ?? geometry.KEY_UNITS[key] ?? 1;
        const cellW = unit * geometry.PITCH;
        const keyW = cellW - (geometry.PITCH - geometry.KEY_SIZE - 1);
        const offset = geometry.PHYSICAL_KEY_OFFSETS[physicalKeyId];
        data.push({
          id: `${ri}-${physicalKeyId}`,
          physicalKeyId,
          key,
          x: x + cellW / 2 + (offset?.x ?? 0),
          y: y + (offset?.y ?? 0),
          w: keyW,
        });
        x += cellW;
      });
      y += geometry.ROW_OFFSET;
    });
    return data;
  }, [geometry, keyIdRows, rows]);

  const handOverlayGeometry = useMemo(() => {
    const leftPosition = displayedLeftHandSrc ? handSvgPositions[displayedLeftHandSrc] : null;
    const rightPosition = displayedRightHandSrc ? handSvgPositions[displayedRightHandSrc] : null;

    return {
      left: leftPosition
        ? {
            x: svgGeometry.width * leftPosition.xRatio,
            y: svgGeometry.height * leftPosition.yRatio,
            width: svgGeometry.width * leftPosition.widthRatio,
            height: svgGeometry.height * leftPosition.heightRatio,
          }
        : null,
      right: rightPosition
        ? {
            x: svgGeometry.width * rightPosition.xRatio,
            y: svgGeometry.height * rightPosition.yRatio,
            width: svgGeometry.width * rightPosition.widthRatio,
            height: svgGeometry.height * rightPosition.heightRatio,
          }
        : null,
    };
  }, [
    displayedLeftHandSrc,
    displayedRightHandSrc,
    handSvgPositions,
    svgGeometry.height,
    svgGeometry.width,
  ]);

  const leftHandVisualConfig = REST_HAND_SVG_SOURCES.has(displayedLeftHandSrc ?? '')
    ? LEFT_REST_HAND_VISUAL_CONFIG
    : HAND_VISUAL_CONFIG.leftHand;
  const rightHandVisualConfig = REST_HAND_SVG_SOURCES.has(displayedRightHandSrc ?? '')
    ? LEFT_REST_HAND_VISUAL_CONFIG
    : HAND_VISUAL_CONFIG.rightHand;

  useEffect(() => {
    let cancelled = false;

    async function resolveInlineHandSvgs() {
      const [left, right] = await Promise.all([
        loadInlineHandSvg(displayedLeftHandSrc),
        loadInlineHandSvg(displayedRightHandSrc),
      ]);

      if (!cancelled) {
        setInlineHandSvgs({
          leftSrc: displayedLeftHandSrc,
          left,
          rightSrc: displayedRightHandSrc,
          right,
        });
      }
    }

    void resolveInlineHandSvgs();

    return () => {
      cancelled = true;
    };
  }, [displayedLeftHandSrc, displayedRightHandSrc]);

  return (
    <div className="overflow-visible bg-(--surface-strong) p-4 rounded-lg select-none">
      <svg
        viewBox={`0 0 ${svgGeometry.width} ${svgGeometry.height}`}
        className="h-auto w-full overflow-visible"
        style={{ overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={t('components.lessons.keyboard.general.virtualKeyboard')}
      >
        <rect
          x={0}
          y={0}
          width={svgGeometry.width}
          height={svgGeometry.height}
          rx={5}
          ry={5}
          fill="var(--surface-overlay-soft)"
          stroke="var(--border-card)"
          strokeWidth={1}
        />
        {positions.map((p) => {
          const isIsoEnter =
            geometry.ENTER.form !== 'rectangular' && p.physicalKeyId === 'P41';
          const left = p.x - p.w / 2;
          const top = p.y - geometry.KEY_SIZE / 2;
          const right = p.x + p.w / 2;
          const bottom = p.y + geometry.KEY_SIZE / 2;
          const isoEnterPath = isIsoEnter
            ? (geometry.ENTER.form === 'big-ass'
              ? buildRoundedBigAssEnterPath({
                  left,
                  right,
                  top,
                  bottom,
                  upperLeft: left + geometry.PITCH - 14,
                  upperTop: top - geometry.ROW_OFFSET,
                  radius: geometry.KEY_RADIUS,
                })
              : buildRoundedIsoEnterPath({
                  left,
                  right,
                  top,
                  bottom,
                  upperLeft: left - geometry.PITCH + 14,
                  upperTop: top - geometry.ROW_OFFSET,
                  radius: geometry.KEY_RADIUS,
                }))
            : undefined;

          return (
            <g key={p.id}>
              {isIsoEnter ? (
                <path
                  id={`key-${p.physicalKeyId}`}
                  data-svg-key-id={`key-${p.physicalKeyId}`}
                  d={isoEnterPath}
                  className={`transition-all duration-150 ${getColor(p.physicalKeyId, p.key)} ${normalizedGuideKeys.has(p.physicalKeyId) ? 'key-guide' : ''}`}
                  stroke="var(--border-card)"
                  strokeWidth={0.5}
                />
              ) : (
                <rect
                  id={`key-${p.physicalKeyId}`}
                  data-svg-key-id={`key-${p.physicalKeyId}`}
                  x={left}
                  y={top}
                  width={p.w}
                  height={geometry.KEY_SIZE}
                  rx={geometry.KEY_RADIUS}
                  ry={geometry.KEY_RADIUS}
                  className={`transition-all duration-150 ${getColor(p.physicalKeyId, p.key)} ${normalizedGuideKeys.has(p.physicalKeyId) ? 'key-guide' : ''}`}
                  stroke="var(--border-card)"
                  strokeWidth={0.5}
                />
              )}
              <text
                x={p.x}
                y={p.y + 1.2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={geometry.TEXT_SIZE}
                fontFamily="system-ui,sans-serif"
                fill="var(--text-secondary)"
                className="pointer-events-none"
              >
                {label(p.key)}
              </text>
            </g>
          );
        })}
        {inlineHandSvgs.left &&
          inlineHandSvgs.leftSrc === displayedLeftHandSrc &&
          handOverlayGeometry.left && (
            <svg
              x={handOverlayGeometry.left.x}
              y={handOverlayGeometry.left.y}
              width={handOverlayGeometry.left.width}
              height={handOverlayGeometry.left.height}
              viewBox={inlineHandSvgs.left.viewBox}
              preserveAspectRatio="xMidYMid meet"
              opacity={leftHandVisualConfig.opacity}
              fill={leftHandVisualConfig.fill}
              stroke={leftHandVisualConfig.stroke}
              strokeWidth={leftHandVisualConfig.strokeWidth}
              strokeLinecap={leftHandVisualConfig.strokeLinecap}
              strokeLinejoin={leftHandVisualConfig.strokeLinejoin}
              pointerEvents="none"
              style={{ color: leftHandVisualConfig.stroke }}
            >
              <g
                style={{ stroke: leftHandVisualConfig.stroke, fill: leftHandVisualConfig.fill }}
                dangerouslySetInnerHTML={{ __html: inlineHandSvgs.left.markup }}
              />
            </svg>
          )}
        {inlineHandSvgs.right &&
          inlineHandSvgs.rightSrc === displayedRightHandSrc &&
          handOverlayGeometry.right && (
            <svg
              x={handOverlayGeometry.right.x}
              y={handOverlayGeometry.right.y}
              width={handOverlayGeometry.right.width}
              height={handOverlayGeometry.right.height}
              viewBox={inlineHandSvgs.right.viewBox}
              preserveAspectRatio="xMidYMid meet"
              opacity={rightHandVisualConfig.opacity}
              fill={rightHandVisualConfig.fill}
              stroke={rightHandVisualConfig.stroke}
              strokeWidth={rightHandVisualConfig.strokeWidth}
              strokeLinecap={rightHandVisualConfig.strokeLinecap}
              strokeLinejoin={rightHandVisualConfig.strokeLinejoin}
              pointerEvents="none"
              style={{ color: rightHandVisualConfig.stroke }}
            >
              <g
                style={{ stroke: rightHandVisualConfig.stroke, fill: rightHandVisualConfig.fill }}
                dangerouslySetInnerHTML={{ __html: inlineHandSvgs.right.markup }}
              />
            </svg>
          )}
        {positions
          .filter((p) => normalizedGuideKeys.has(p.physicalKeyId))
          .map((p) => {
            const left = p.x - p.w / 2;
            const top = p.y - geometry.KEY_SIZE / 2;
            const right = p.x + p.w / 2;
            const bottom = p.y + geometry.KEY_SIZE / 2;
            const isIsoEnter =
              geometry.ENTER.form !== 'rectangular' && p.physicalKeyId === 'P41';

            if (isIsoEnter) {
              return (
                <path
                  key={`foreground-guide-${p.id}`}
                  d={
                    geometry.ENTER.form === 'big-ass'
                      ? buildRoundedBigAssEnterPath({
                          left,
                          right,
                          top,
                          bottom,
                          upperLeft: left + geometry.PITCH - 5,
                          upperTop: top - geometry.ROW_OFFSET,
                          radius: geometry.KEY_RADIUS,
                        })
                      : buildRoundedIsoEnterPath({
                          left,
                          right,
                          top,
                          bottom,
                          upperLeft: left - geometry.PITCH + 5,
                          upperTop: top - geometry.ROW_OFFSET,
                          radius: geometry.KEY_RADIUS,
                        })
                  }
                  fill="none"
                  className="pointer-events-none key-guide"
                />
              );
            }

            return (
              <rect
                key={`foreground-guide-${p.id}`}
                x={left}
                y={top}
                width={p.w}
                height={geometry.KEY_SIZE}
                rx={geometry.KEY_RADIUS}
                ry={geometry.KEY_RADIUS}
                fill="none"
                className="pointer-events-none key-guide"
              />
            );
          })}
      </svg>
    </div>
  );
}
