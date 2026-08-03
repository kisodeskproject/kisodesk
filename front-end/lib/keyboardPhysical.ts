// front-typing/lib/keyboardPhysical
import type { KeyboardPhysicalFamily } from './keyboardLayouts';

declare const physicalKeyIdBrand: unique symbol;
export type PhysicalKeyId = string & {
  readonly [physicalKeyIdBrand]: 'PhysicalKeyId';
};

export const PHYSICAL_KEY_ID_BY_CODE = {
  Backquote: 'P01',
  Digit1: 'P02',
  Digit2: 'P03',
  Digit3: 'P04',
  Digit4: 'P05',
  Digit5: 'P06',
  Digit6: 'P07',
  Digit7: 'P08',
  Digit8: 'P09',
  Digit9: 'P10',
  Digit0: 'P11',
  Minus: 'P12',
  Equal: 'P13',
  Backspace: 'P14',
  Tab: 'P15',
  KeyQ: 'P16',
  KeyW: 'P17',
  KeyE: 'P18',
  KeyR: 'P19',
  KeyT: 'P20',
  KeyY: 'P21',
  KeyU: 'P22',
  KeyI: 'P23',
  KeyO: 'P24',
  KeyP: 'P25',
  BracketLeft: 'P26',
  BracketRight: 'P27',
  Backslash: 'P28',
  Caps: 'P29',
  KeyA: 'P30',
  KeyS: 'P31',
  KeyD: 'P32',
  KeyF: 'P33',
  KeyG: 'P34',
  KeyH: 'P35',
  KeyJ: 'P36',
  KeyK: 'P37',
  KeyL: 'P38',
  Semicolon: 'P39',
  Quote: 'P40',
  Enter: 'P41',
  Shift_L: 'P42',
  IntlBackslash: 'P43',
  KeyZ: 'P44',
  KeyX: 'P45',
  KeyC: 'P46',
  KeyV: 'P47',
  KeyB: 'P48',
  KeyN: 'P49',
  KeyM: 'P50',
  Comma: 'P51',
  Period: 'P52',
  Slash: 'P53',
  IntlRo: 'P54',
  Shift_R: 'P55',
  Ctrl_L: 'P56',
  Fn: 'P57',
  Win_L: 'P58',
  Alt_L: 'P59',
  Space: 'P60',
  AltGr: 'P61',
  Win_R: 'P62',
  Ctrl_R: 'P63',
  Alt_R: 'P64',
  IntlYen: 'P65',
  NonConvert: 'P66',
  Convert: 'P67',
  KanaMode: 'P68',
  Lang2: 'P69',
  Lang1: 'P70',
} as const satisfies Record<string, string>;

const PHYSICAL_CODE_BY_ID = Object.fromEntries(
  Object.entries(PHYSICAL_KEY_ID_BY_CODE).map(([code, id]) => [id, code]),
) as Record<PhysicalKeyId, string>;

function getAltRightVisualCode(family: KeyboardPhysicalFamily | undefined): 'AltGr' | 'Alt_R' {
  return family === 'ANSI' || family === 'JIS' || family === 'KS' ? 'Alt_R' : 'AltGr';
}

export function getPhysicalKeyIdForCode(
  code: string,
  family?: KeyboardPhysicalFamily,
): PhysicalKeyId | null {
  const visualCode =
    code === 'ShiftLeft'
      ? 'Shift_L'
      : code === 'ShiftRight'
        ? 'Shift_R'
        : code === 'ControlLeft'
          ? 'Ctrl_L'
          : code === 'ControlRight'
            ? 'Ctrl_R'
            : code === 'AltLeft'
              ? 'Alt_L'
              : code === 'AltRight'
                ? getAltRightVisualCode(family)
                : code === 'MetaLeft'
                  ? 'Win_L'
                  : code === 'MetaRight'
                    ? 'Win_R'
                    : code === 'CapsLock'
                      ? 'Caps'
                      : code;

  return (PHYSICAL_KEY_ID_BY_CODE[visualCode] as PhysicalKeyId | undefined) ?? null;
}

export function getCodeForPhysicalKeyId(id: PhysicalKeyId): string | null {
  return PHYSICAL_CODE_BY_ID[id] ?? null;
}

function asPhysicalKeyRows(
  rows: readonly (readonly string[])[],
): readonly (readonly PhysicalKeyId[])[] {
  return rows as readonly (readonly PhysicalKeyId[])[];
}

export const PHYSICAL_KEY_ID_ROWS = {
  ANSI: asPhysicalKeyRows([
    [
      'P01',
      'P02',
      'P03',
      'P04',
      'P05',
      'P06',
      'P07',
      'P08',
      'P09',
      'P10',
      'P11',
      'P12',
      'P13',
      'P14',
    ],
    [
      'P15',
      'P16',
      'P17',
      'P18',
      'P19',
      'P20',
      'P21',
      'P22',
      'P23',
      'P24',
      'P25',
      'P26',
      'P27',
      'P28',
    ],
    ['P29', 'P30', 'P31', 'P32', 'P33', 'P34', 'P35', 'P36', 'P37', 'P38', 'P39', 'P40', 'P41'],
    ['P42', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P55'],
    ['P56', 'P57', 'P58', 'P59', 'P60', 'P64', 'P62', 'P63'],
  ]),

  ISO: asPhysicalKeyRows([
    [
      'P01',
      'P02',
      'P03',
      'P04',
      'P05',
      'P06',
      'P07',
      'P08',
      'P09',
      'P10',
      'P11',
      'P12',
      'P13',
      'P14',
    ],
    ['P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    [
      'P29',
      'P30',
      'P31',
      'P32',
      'P33',
      'P34',
      'P35',
      'P36',
      'P37',
      'P38',
      'P39',
      'P40',
      'P28',
      'P41',
    ],
    ['P42', 'P43', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P55'],
    ['P56', 'P57', 'P58', 'P59', 'P60', 'P61', 'P62', 'P63'],
  ]),

  ABNT2: asPhysicalKeyRows([
    [
      'P01',
      'P02',
      'P03',
      'P04',
      'P05',
      'P06',
      'P07',
      'P08',
      'P09',
      'P10',
      'P11',
      'P12',
      'P13',
      'P14',
    ],
    ['P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    [
      'P29',
      'P30',
      'P31',
      'P32',
      'P33',
      'P34',
      'P35',
      'P36',
      'P37',
      'P38',
      'P39',
      'P40',
      'P28',
      'P41',
    ],
    [
      'P42',
      'P43',
      'P44',
      'P45',
      'P46',
      'P47',
      'P48',
      'P49',
      'P50',
      'P51',
      'P52',
      'P53',
      'P54',
      'P55',
    ],
    ['P56', 'P57', 'P58', 'P59', 'P60', 'P61', 'P62', 'P63'],
  ]),

  BIG_ASS: asPhysicalKeyRows([
    ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14'],
    ['P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    ['P29', 'P30', 'P31', 'P32', 'P33', 'P34', 'P35', 'P36', 'P37', 'P38', 'P39', 'P40', 'P28', 'P41'],
    ['P42', 'P43', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P55'],
    ['P56', 'P57', 'P58', 'P59', 'P60', 'P61', 'P62', 'P63'],
  ]),

  JIS: asPhysicalKeyRows([
    [
      'P01',
      'P02',
      'P03',
      'P04',
      'P05',
      'P06',
      'P07',
      'P08',
      'P09',
      'P10',
      'P11',
      'P12',
      'P13',
      'P65',
      'P14',
    ],
    ['P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    [
      'P29',
      'P30',
      'P31',
      'P32',
      'P33',
      'P34',
      'P35',
      'P36',
      'P37',
      'P38',
      'P39',
      'P40',
      'P28',
      'P41',
    ],
    ['P42', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P54', 'P55'],
    ['P56', 'P57', 'P58', 'P59', 'P66', 'P60', 'P67', 'P68', 'P64', 'P62', 'P63'],
  ]),

  KS: asPhysicalKeyRows([
    [
      'P01',
      'P02',
      'P03',
      'P04',
      'P05',
      'P06',
      'P07',
      'P08',
      'P09',
      'P10',
      'P11',
      'P12',
      'P13',
      'P65',
      'P14',
    ],
    ['P15', 'P16', 'P17', 'P18', 'P19', 'P20', 'P21', 'P22', 'P23', 'P24', 'P25', 'P26', 'P27'],
    ['P29', 'P30', 'P31', 'P32', 'P33', 'P34', 'P35', 'P36', 'P37', 'P38', 'P39', 'P40', 'P41'],
    ['P42', 'P44', 'P45', 'P46', 'P47', 'P48', 'P49', 'P50', 'P51', 'P52', 'P53', 'P55'],
    ['P56', 'P57', 'P58', 'P59', 'P69', 'P60', 'P70', 'P64', 'P62', 'P63'],
  ]),
} satisfies Readonly<Record<KeyboardPhysicalFamily, readonly (readonly PhysicalKeyId[])[]>>;

export function normalizeKeyboardPhysicalFamily(
  family: string | null | undefined,
): KeyboardPhysicalFamily {
  if (family === 'ABNT') return 'ABNT2';
  if (family === 'ANSI' || family === 'ISO' || family === 'ABNT2' || family === 'JIS' || family === 'KS' || family === 'BIG_ASS') {
    return family;
  }
  return 'ISO';
}

export function physicalFamilyHasCode(family: KeyboardPhysicalFamily, code: string): boolean {
  const physicalKeyId = getPhysicalKeyIdForCode(code, family);
  return physicalKeyId ? physicalFamilyHasKeyId(family, physicalKeyId) : false;
}

export function physicalFamilyHasKeyId(family: KeyboardPhysicalFamily, id: PhysicalKeyId): boolean {
  return PHYSICAL_KEY_ID_ROWS[family].some((row) => row.includes(id));
}
