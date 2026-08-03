// front-typing/lib/keyboardPhysicalHands
import type { KeyboardPhysicalFamily } from './keyboardLayouts';
import {
  COMMON_HAND_SVG_POSITIONS,
  LEFT_HAND_REST,
  RIGHT_HAND_REST,
  SHIFT_LEFT,
  SHIFT_RIGHT,
  type HandOverlayPosition,
  type HandReferences,
} from './keyboardGuides/config';
import { physicalFamilyHasKeyId, type PhysicalKeyId } from './keyboardPhysical';

type HandSide = 'left' | 'right';

type PhysicalFinger = {
  side: HandSide;
  svg: string;
};

const LEFT_REST_KEYS = new Set<PhysicalKeyId>(['P30', 'P31', 'P32', 'P33'] as PhysicalKeyId[]);

const RIGHT_REST_KEYS = new Set<PhysicalKeyId>([
  'P36',
  'P37',
  'P38',
  'P39',
  'P60',
] as PhysicalKeyId[]);

const NON_PRACTICABLE_KEYS = new Set<PhysicalKeyId>([
  'P14',
  'P15',
  'P29',
  'P41',
  'P42',
  'P55',
  'P56',
  'P57',
  'P58',
  'P59',
  'P61',
  'P62',
  'P63',
  'P64',
  'P66',
  'P67',
  'P68',
  'P69',
  'P70',
] as PhysicalKeyId[]);

export function requiresHandPosture(physicalKeyId: PhysicalKeyId): boolean {
  return !NON_PRACTICABLE_KEYS.has(physicalKeyId);
}

const POSTURE_BY_PHYSICAL_KEY_ID: Readonly<Record<string, PhysicalFinger>> = {
  P01: { side: 'left', svg: '/svg/P01.svg' },
  P02: { side: 'left', svg: '/svg/P02.svg' },
  P03: { side: 'left', svg: '/svg/P03.svg' },
  P04: { side: 'left', svg: '/svg/P04.svg' },
  P05: { side: 'left', svg: '/svg/P05.svg' },
  P06: { side: 'left', svg: '/svg/P06.svg' },
  P07: { side: 'right', svg: '/svg/P07.svg' },
  P08: { side: 'right', svg: '/svg/P08.svg' },
  P09: { side: 'right', svg: '/svg/P09.svg' },
  P10: { side: 'right', svg: '/svg/P10.svg' },
  P11: { side: 'right', svg: '/svg/P11.svg' },
  P12: { side: 'right', svg: '/svg/P12.svg' },
  P13: { side: 'right', svg: '/svg/P13.svg' },
  P65: { side: 'right', svg: '/svg/P65.svg' },

  P16: { side: 'left', svg: '/svg/P16.svg' },
  P17: { side: 'left', svg: '/svg/P17.svg' },
  P18: { side: 'left', svg: '/svg/P18.svg' },
  P19: { side: 'left', svg: '/svg/P19.svg' },
  P20: { side: 'left', svg: '/svg/P20.svg' },
  P21: { side: 'right', svg: '/svg/P21.svg' },
  P22: { side: 'right', svg: '/svg/P22.svg' },
  P23: { side: 'right', svg: '/svg/P23.svg' },
  P24: { side: 'right', svg: '/svg/P24.svg' },
  P25: { side: 'right', svg: '/svg/P25.svg' },
  P26: { side: 'right', svg: '/svg/P26.svg' },
  P27: { side: 'right', svg: '/svg/P27.svg' },
  P28: { side: 'right', svg: '/svg/P28.svg' },

  P34: { side: 'left', svg: '/svg/P34.svg' },
  P35: { side: 'right', svg: '/svg/P35.svg' },
  P40: { side: 'right', svg: '/svg/P40.svg' },

  P43: { side: 'left', svg: '/svg/P43.svg' },
  P44: { side: 'left', svg: '/svg/P44.svg' },
  P45: { side: 'left', svg: '/svg/P45.svg' },
  P46: { side: 'left', svg: '/svg/P46.svg' },
  P47: { side: 'left', svg: '/svg/P47.svg' },
  P48: { side: 'left', svg: '/svg/P48.svg' },
  P49: { side: 'right', svg: '/svg/P49.svg' },
  P50: { side: 'right', svg: '/svg/P50.svg' },
  P51: { side: 'right', svg: '/svg/P51.svg' },
  P52: { side: 'right', svg: '/svg/P52.svg' },
  P53: { side: 'right', svg: '/svg/P53.svg' },
  P54: { side: 'right', svg: '/svg/P54.svg' },
};

function getFinger(
  physicalKeyId: PhysicalKeyId,
  family: KeyboardPhysicalFamily,
): PhysicalFinger | null {
  if (!physicalFamilyHasKeyId(family, physicalKeyId)) {
    return null;
  }

  return POSTURE_BY_PHYSICAL_KEY_ID[physicalKeyId] ?? null;
}

export function getHandReferencesForPhysicalKeyId(
  physicalKeyId: PhysicalKeyId | null | undefined,
  family: KeyboardPhysicalFamily,
): HandReferences {
  if (!physicalKeyId) {
    return {
      left: LEFT_HAND_REST,
      right: RIGHT_HAND_REST,
    };
  }

  if (physicalKeyId === 'P42') {
    return {
      left: SHIFT_LEFT,
      right: RIGHT_HAND_REST,
    };
  }

  if (physicalKeyId === 'P55') {
    return {
      left: LEFT_HAND_REST,
      right: SHIFT_RIGHT,
    };
  }

  if (physicalFamilyHasKeyId(family, physicalKeyId) && LEFT_REST_KEYS.has(physicalKeyId)) {
    return {
      left: LEFT_HAND_REST,
      right: RIGHT_HAND_REST,
    };
  }

  if (physicalFamilyHasKeyId(family, physicalKeyId) && RIGHT_REST_KEYS.has(physicalKeyId)) {
    return {
      left: LEFT_HAND_REST,
      right: RIGHT_HAND_REST,
    };
  }

  const finger = getFinger(physicalKeyId, family);

  if (!finger) {
    return {
      left: LEFT_HAND_REST,
      right: RIGHT_HAND_REST,
    };
  }

  return finger.side === 'left'
    ? {
        left: finger.svg,
        right: RIGHT_HAND_REST,
      }
    : {
        left: LEFT_HAND_REST,
        right: finger.svg,
      };
}

// Cada familia conserva un objeto independiente para poder corregir
// sus posiciones sin modificar las demás familias.
const ANSI_KEY_PITCH_RATIO = 19 / 295;

export const ANSI_HAND_SVG_POSITIONS = {
  ...COMMON_HAND_SVG_POSITIONS,

  '/svg/P13.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P12.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P12.svg'].xRatio + ANSI_KEY_PITCH_RATIO,
  },

  '/svg/P26.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'].xRatio + ANSI_KEY_PITCH_RATIO,
  },

  '/svg/P27.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'].xRatio + ANSI_KEY_PITCH_RATIO * 2,
  },

  '/svg/P28.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'].xRatio + ANSI_KEY_PITCH_RATIO * 3,
  },

  '/svg/P40.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P36-P39-Space.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P36-P39-Space.svg'].xRatio + ANSI_KEY_PITCH_RATIO,
  },
} satisfies Record<string, HandOverlayPosition>;

const ISO_KEY_PITCH_RATIO = 19 / 295;

const ISO_P40_HAND_POSITION: HandOverlayPosition = {
  ...COMMON_HAND_SVG_POSITIONS['/svg/P36-P39-Space.svg'],
  xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P36-P39-Space.svg'].xRatio + ISO_KEY_PITCH_RATIO,
};

const ISO_P43_HAND_POSITION: HandOverlayPosition = {
  ...COMMON_HAND_SVG_POSITIONS['/svg/P44.svg'],
  xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P44.svg'].xRatio - ISO_KEY_PITCH_RATIO,
};

export const ISO_HAND_SVG_POSITIONS = {
  // Objeto ISO independiente. Las correcciones posteriores se harán
  // manualmente aquí sin modificar ANSI.
  ...COMMON_HAND_SVG_POSITIONS,

  '/svg/P13.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P12.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P12.svg'].xRatio + ISO_KEY_PITCH_RATIO,
  },

  '/svg/P26.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'].xRatio + ISO_KEY_PITCH_RATIO,
  },

  '/svg/P27.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P25.svg'].xRatio + ISO_KEY_PITCH_RATIO * 2,
  },

  '/svg/P40.svg': ISO_P40_HAND_POSITION,

  '/svg/P28.svg': {
    ...ISO_P40_HAND_POSITION,
    xRatio: ISO_P40_HAND_POSITION.xRatio + 0.085,
    yRatio: ISO_P40_HAND_POSITION.yRatio - 0.5,
  },

  '/svg/P43.svg': ISO_P43_HAND_POSITION,

  '/svg/P42.svg': {
    ...ISO_P43_HAND_POSITION,
    xRatio: ISO_P43_HAND_POSITION.xRatio - ISO_KEY_PITCH_RATIO,
  },

  '/svg/P55.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'].xRatio + ISO_KEY_PITCH_RATIO * 1.1,
  },
} satisfies Record<string, HandOverlayPosition>;

export const ABNT2_HAND_SVG_POSITIONS = {
  ...COMMON_HAND_SVG_POSITIONS,
  '/svg/P43.svg': ISO_P43_HAND_POSITION,
  '/svg/P54.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'].xRatio + ISO_KEY_PITCH_RATIO,
  },
  '/svg/P55.svg': {
    ...COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'],
    xRatio: COMMON_HAND_SVG_POSITIONS['/svg/P53.svg'].xRatio + ISO_KEY_PITCH_RATIO * 2,
  },
} satisfies Record<string, HandOverlayPosition>;

export const BIG_ASS_HAND_SVG_POSITIONS = {
  ...ISO_HAND_SVG_POSITIONS,
} satisfies Record<string, HandOverlayPosition>;

export const JIS_HAND_SVG_POSITIONS = {
  ...COMMON_HAND_SVG_POSITIONS,
} satisfies Record<string, HandOverlayPosition>;

export const KS_HAND_SVG_POSITIONS = {
  ...COMMON_HAND_SVG_POSITIONS,
} satisfies Record<string, HandOverlayPosition>;

export function getHandSvgPositionsForPhysicalFamily(
  family: KeyboardPhysicalFamily,
): Record<string, HandOverlayPosition> {
  switch (family) {
    case 'ANSI':
      return ANSI_HAND_SVG_POSITIONS;
    case 'ISO':
      return ISO_HAND_SVG_POSITIONS;
    case 'ABNT2':
      return ABNT2_HAND_SVG_POSITIONS;
    case 'BIG_ASS':
      return BIG_ASS_HAND_SVG_POSITIONS;
    case 'JIS':
      return JIS_HAND_SVG_POSITIONS;
    case 'KS':
      return KS_HAND_SVG_POSITIONS;
  }
}
