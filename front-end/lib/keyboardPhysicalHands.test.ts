import { describe, expect, it } from '@jest/globals';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import {
  getHandReferencesForPhysicalKeyId,
  getHandSvgPositionsForPhysicalFamily,
  requiresHandPosture,
} from './keyboardPhysicalHands';
import {
  getPhysicalKeyIdForCode,
  PHYSICAL_KEY_ID_ROWS,
  type PhysicalKeyId,
} from './keyboardPhysical';
import { getSvgKeyIdForPhysicalKeyId } from './keyMappings';
import { KEYBOARD_LAYOUTS } from './keyboardLayouts';

describe('physical keyboard hand guides', () => {
  it('keeps overlay-position sources independent by physical family', () => {
    expect(getHandSvgPositionsForPhysicalFamily('ANSI')).not.toBe(
      getHandSvgPositionsForPhysicalFamily('ISO'),
    );
    expect(getHandSvgPositionsForPhysicalFamily('ISO')).not.toBe(
      getHandSvgPositionsForPhysicalFamily('ABNT2'),
    );
  });

  it('assigns a finger to ISO and ABNT2-only codes', () => {
    expect(
      getHandReferencesForPhysicalKeyId(getPhysicalKeyIdForCode('IntlBackslash'), 'ISO').left,
    ).toBe('/svg/P43.svg');
    expect(getHandReferencesForPhysicalKeyId(getPhysicalKeyIdForCode('IntlRo'), 'ABNT2').right).toBe(
      '/svg/P54.svg',
    );
    expect(getHandReferencesForPhysicalKeyId(getPhysicalKeyIdForCode('IntlRo'), 'ISO').right).toBe(
      '/svg/P36-P39-Space.svg',
    );
  });

  it('keeps shared home-row postures keyed by physical code', () => {
    for (const code of ['KeyA', 'KeyS', 'KeyD', 'KeyF']) {
      expect(getHandReferencesForPhysicalKeyId(getPhysicalKeyIdForCode(code), 'ISO').left).toBe(
        '/svg/P30-P33.svg',
      );
    }
    for (const code of ['KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Space']) {
      expect(getHandReferencesForPhysicalKeyId(getPhysicalKeyIdForCode(code), 'ISO').right).toBe(
        '/svg/P36-P39-Space.svg',
      );
    }
  });

  it('keeps ANSI symbol postures separated by one physical key pitch', () => {
    const positions = getHandSvgPositionsForPhysicalFamily('ANSI');
    const pitch = 19 / 295;

    expect(positions['/svg/P13.svg'].xRatio).toBe(positions['/svg/P12.svg'].xRatio + pitch);
    expect(positions['/svg/P26.svg'].xRatio).toBe(positions['/svg/P25.svg'].xRatio + pitch);
    expect(positions['/svg/P27.svg'].xRatio).toBe(positions['/svg/P25.svg'].xRatio + pitch * 2);
    expect(positions['/svg/P28.svg'].xRatio).toBe(positions['/svg/P25.svg'].xRatio + pitch * 3);
    expect(positions['/svg/P40.svg'].xRatio).toBe(
      positions['/svg/P36-P39-Space.svg'].xRatio + pitch,
    );
  });

  it('moves the ISO IntlBackslash posture one physical key left of KeyZ', () => {
    const positions = getHandSvgPositionsForPhysicalFamily('ISO');

    expect(positions['/svg/P43.svg'].xRatio).toBe(
      positions['/svg/P44.svg'].xRatio - 19 / 295,
    );
  });

  it('places the ABNT2 IntlRo posture one physical key right of Slash', () => {
    const positions = getHandSvgPositionsForPhysicalFamily('ABNT2');

    expect(positions['/svg/P54.svg'].xRatio).toBe(
      positions['/svg/P53.svg'].xRatio + 19 / 295,
    );
  });

  it.each(['ANSI', 'ISO', 'ABNT2', 'BIG_ASS'] as const)(
    'references existing hand SVG files for every practicable %s code',
    (family) => {
      for (const physicalKeyId of PHYSICAL_KEY_ID_ROWS[family].flat()) {
        if (!requiresHandPosture(physicalKeyId)) continue;
        const references = getHandReferencesForPhysicalKeyId(physicalKeyId, family);
        for (const src of [references.left, references.right]) {
          expect(src.startsWith('/svg/')).toBe(true);
          expect(existsSync(join(process.cwd(), 'public', src))).toBe(true);
        }
      }
    },
  );

  it('marks controls and modifiers as not requiring a hand posture', () => {
    for (const code of ['Enter', 'Backspace', 'Tab', 'Ctrl_L', 'AltGr', 'Caps', 'Shift_L']) {
      expect(requiresHandPosture(getPhysicalKeyIdForCode(code)!)).toBe(false);
    }
    for (const code of [
      'KeyA',
      'Digit1',
      'Backquote',
      'Semicolon',
      'IntlBackslash',
      'IntlRo',
      'Space',
    ]) {
      expect(requiresHandPosture(getPhysicalKeyIdForCode(code)!)).toBe(true);
    }
  });

  it.each(KEYBOARD_LAYOUTS)(
    'maps every practicable layout position to its family SVG and posture for $id',
    (layout) => {
      const family = layout.physicalType ?? 'ISO';
      for (const physicalKeyId of Object.keys(layout.keys) as PhysicalKeyId[]) {
        expect(getSvgKeyIdForPhysicalKeyId(physicalKeyId, family)).toBe(`key-${physicalKeyId}`);
        if (!requiresHandPosture(physicalKeyId)) continue;
        const references = getHandReferencesForPhysicalKeyId(physicalKeyId, family);
        for (const src of [references.left, references.right]) {
          expect(existsSync(join(process.cwd(), 'public', src))).toBe(true);
        }
      }
    },
  );
});
