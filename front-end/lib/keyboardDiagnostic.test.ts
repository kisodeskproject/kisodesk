import { describe, expect, it } from '@jest/globals';

import { getEnabledLayoutById } from './keyboardLayouts';
import { getKeyboardDiagnosticSteps } from './keyboardDiagnostic';

describe('keyboard diagnostic steps', () => {
  it('walks ANSI printable physical positions while excluding controls', () => {
    const steps = getKeyboardDiagnosticSteps(getEnabledLayoutById('qwerty-latam'), 'ANSI');
    const ids = new Set(steps.map((step) => step.physicalKeyId));

    expect(ids).toContain('P13');
    expect(ids).toContain('P26');
    expect(ids).toContain('P40');
    expect(ids).toContain('P60');
    expect(ids).not.toContain('P14');
    expect(ids).not.toContain('P15');
    expect(ids).not.toContain('P41');
    expect(ids).not.toContain('P42');
    expect(ids).not.toContain('P55');
    expect(ids).not.toContain('P43');
  });

  it('includes ISO-only P43 in the diagnostic sequence', () => {
    const steps = getKeyboardDiagnosticSteps(getEnabledLayoutById('qwerty-latam'), 'ISO');

    expect(steps.some((step) => step.physicalKeyId === 'P43')).toBe(true);
  });

  it('keeps Shift and dead-key layers tied to the same physical position', () => {
    const steps = getKeyboardDiagnosticSteps(getEnabledLayoutById('qwerty-latam'), 'ISO');
    const shiftedZero = steps.find(
      (step) => step.physicalKeyId === 'P11' && step.layer === 'shift',
    );
    const acute = steps.find(
      (step) => step.physicalKeyId === 'P26' && step.character === '´',
    );
    const diaeresis = steps.find(
      (step) => step.physicalKeyId === 'P26' && step.character === '¨',
    );

    expect(shiftedZero).toMatchObject({ character: '=', requiresShift: true });
    expect(acute).toMatchObject({ layer: 'dead', requiresShift: false });
    expect(diaeresis).toMatchObject({ layer: 'dead', requiresShift: true });
  });

  it('includes AltGr layers only when the active family has AltGr', () => {
    const layout = getEnabledLayoutById('qwerty-es');

    expect(getKeyboardDiagnosticSteps(layout, 'ANSI').some((step) => step.requiresAltGr)).toBe(false);
    expect(getKeyboardDiagnosticSteps(layout, 'ISO').some((step) => step.requiresAltGr)).toBe(true);
  });
});
