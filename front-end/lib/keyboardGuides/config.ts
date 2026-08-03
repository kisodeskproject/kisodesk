export type HandReferences = {
  left: string;
  right: string;
};

export type HandSide = 'left' | 'right';

export type KeyResolution = {
  baseKey: string;
  requiresShift: boolean;
  modifierKey?: string;
  modifierRequiresShift?: boolean;
};

export type HandOverlayPosition = {
  xRatio: number;
  yRatio: number;
  widthRatio: number;
  heightRatio: number;
};

export type KeyboardGuideConfig = {
  leftHandKeys: Set<string>;
  rightHandKeys: Set<string>;
  leftHandRestKeys: Set<string>;
  rightHandRestKeys: Set<string>;
  expectedKeyMap: Record<string, KeyResolution>;
  svgByKey: Record<string, string>;
  availableHandSvgs: Set<string>;
  handSvgPositions: Record<string, HandOverlayPosition>;
};

export const LEFT_HAND_REST = '/svg/P30-P33.svg';
export const RIGHT_HAND_REST = '/svg/P36-P39-Space.svg';
export const SHIFT_LEFT = '/svg/P42.svg';
export const SHIFT_RIGHT = '/svg/P55.svg';

export const HAND_OVERLAY_WIDTH_RATIO = 1.2;
export const HAND_OVERLAY_HEIGHT_RATIO = 2.4;

export function handOverlayPosition(
  xRatio: number,
  yRatio: number,
  widthRatio = HAND_OVERLAY_WIDTH_RATIO,
  heightRatio = HAND_OVERLAY_HEIGHT_RATIO,
): HandOverlayPosition {
  return { xRatio, yRatio, widthRatio, heightRatio };
}

export const COMMON_HAND_SVG_POSITIONS: Record<string, HandOverlayPosition> = {
  '/svg/P30-P33.svg': handOverlayPosition(-0.15, -0.2),
  '/svg/P36-P39-Space.svg': handOverlayPosition(-0.15, -0.2),

  '/svg/P01.svg': handOverlayPosition(-0.3, -1),
  '/svg/P02.svg': handOverlayPosition(-0.225, -1.03),
  '/svg/P03.svg': handOverlayPosition(-0.15, -1.1),
  '/svg/P04.svg': handOverlayPosition(-0.15, -1.15),
  '/svg/P05.svg': handOverlayPosition(-0.15, -1.15),
  '/svg/P06.svg': handOverlayPosition(-0.1, -1.12),
  '/svg/P07.svg': handOverlayPosition(-0.3, -1.1),
  '/svg/P08.svg': handOverlayPosition(-0.225, -1.15),
  '/svg/P09.svg': handOverlayPosition(-0.225, -1.15),
  '/svg/P10.svg': handOverlayPosition(-0.225, -1.11),
  '/svg/P11.svg': handOverlayPosition(-0.145, -1.03),
  '/svg/P12.svg': handOverlayPosition(-0.1, -1.03),
  '/svg/P13.svg': handOverlayPosition(-0.145, -1.03),
  '/svg/P16.svg': handOverlayPosition(-0.19, -0.87),
  '/svg/P17.svg': handOverlayPosition(-0.1, -0.95),
  '/svg/P18.svg': handOverlayPosition(-0.12, -0.98),
  '/svg/P19.svg': handOverlayPosition(-0.12, -0.97),
  '/svg/P20.svg': handOverlayPosition(-0.07, -0.9),
  '/svg/P21.svg': handOverlayPosition(-0.25, -0.9),
  '/svg/P22.svg': handOverlayPosition(-0.2, -0.96),
  '/svg/P23.svg': handOverlayPosition(-0.21, -1),
  '/svg/P24.svg': handOverlayPosition(-0.21, -0.95),
  '/svg/P25.svg': handOverlayPosition(-0.12, -0.9),
  '/svg/P26.svg': handOverlayPosition(-0.12, -0.9),
  '/svg/P27.svg': handOverlayPosition(-0.12, -0.9),
  '/svg/P28.svg': handOverlayPosition(-0.12, -0.9),
  '/svg/P34.svg': handOverlayPosition(-0.2, -0.18),
  '/svg/P35.svg': handOverlayPosition(-0.11, -0.2),
  '/svg/P40.svg': handOverlayPosition(-0.15, -0.2),
  '/svg/P43.svg': handOverlayPosition(-0.08, -0.7),
  '/svg/P44.svg': handOverlayPosition(-0.08, -0.7),
  '/svg/P45.svg': handOverlayPosition(
    -0.5,
    -0.15,
    HAND_OVERLAY_WIDTH_RATIO * 1.2,
    HAND_OVERLAY_HEIGHT_RATIO * 1.2,
  ),
  '/svg/P46.svg': handOverlayPosition(
    -0.2,
    -0.9,
    HAND_OVERLAY_WIDTH_RATIO * 1.2,
    HAND_OVERLAY_HEIGHT_RATIO * 1.2,
  ),
  '/svg/P47.svg': handOverlayPosition(-0.15, -0.2),
  '/svg/P48.svg': handOverlayPosition(-0.1, -0.2),
  '/svg/P49.svg': handOverlayPosition(-0.225, -0.2),
  '/svg/P50.svg': handOverlayPosition(-0.19, -0.2),
  '/svg/P51.svg': handOverlayPosition(
    -0.34,
    -0.95,
    HAND_OVERLAY_WIDTH_RATIO * 1.26,
    HAND_OVERLAY_HEIGHT_RATIO * 1.26,
  ),
  '/svg/P52.svg': handOverlayPosition(
    -0.11,
    -0.27,
    HAND_OVERLAY_WIDTH_RATIO * 1.33,
    HAND_OVERLAY_HEIGHT_RATIO * 1.33,
  ),
  '/svg/P53.svg': handOverlayPosition(-0.21, -0.71),
  '/svg/P54.svg': handOverlayPosition(-0.21, -0.71),
  '/svg/P42.svg': handOverlayPosition(-0.17, -0.0),
  '/svg/P55.svg': handOverlayPosition(-0.05, -0.0),
};

export const COMMON_AVAILABLE_HAND_SVGS = new Set(Object.keys(COMMON_HAND_SVG_POSITIONS));

export function createBaseQwertyGuideConfig(): KeyboardGuideConfig {
  return {
    leftHandKeys: new Set([
      'q',
      'w',
      'e',
      'r',
      't',
      'a',
      's',
      'd',
      'f',
      'g',
      'z',
      'x',
      'c',
      'v',
      'b',
      '1',
      '2',
      '3',
      '4',
      '5',
    ]),
    rightHandKeys: new Set([
      'y',
      'u',
      'i',
      'o',
      'p',
      'h',
      'j',
      'k',
      'l',
      'n',
      'm',
      '6',
      '7',
      '8',
      '9',
      '0',
      '-',
      '=',
      '[',
      ']',
      '\\',
      ';',
      "'",
      '/',
      '`',
      ',',
      '.',
      ' ',
      'Enter',
      'Backspace',
    ]),
    leftHandRestKeys: new Set(['a', 's', 'd', 'f']),
    rightHandRestKeys: new Set(['j', 'k', 'l', ' ']),
    expectedKeyMap: {
      ' ': { baseKey: ' ', requiresShift: false },
      Enter: { baseKey: 'Enter', requiresShift: false },
      Backspace: { baseKey: 'Backspace', requiresShift: false },
      ',': { baseKey: ',', requiresShift: false },
      '.': { baseKey: '.', requiresShift: false },
      '-': { baseKey: '-', requiresShift: false },
    },
    svgByKey: {
      ' ': RIGHT_HAND_REST,
      ',': '/svg/P51.svg',
      '.': '/svg/P52.svg',
      '-': '/svg/P12.svg',
    },
    availableHandSvgs: new Set(COMMON_AVAILABLE_HAND_SVGS),
    handSvgPositions: { ...COMMON_HAND_SVG_POSITIONS },
  };
}
