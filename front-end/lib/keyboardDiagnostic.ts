import { getCodeForPhysicalKeyId, PHYSICAL_KEY_ID_ROWS, physicalFamilyHasKeyId } from './keyboardPhysical';
import type { PhysicalKeyId } from './keyboardPhysical';
import { getDeadKey, getKeyOutput, type KeyboardLayout, type KeyboardPhysicalFamily } from './keyboardLayouts';
import { getShiftPhysicalKeyId } from './keyMappings';
import { getHandReferencesForPhysicalKeyId, requiresHandPosture } from './keyboardPhysicalHands';

export type KeyboardDiagnosticLayer = 'base' | 'shift' | 'altgr' | 'shift-altgr' | 'dead';

export type KeyboardDiagnosticStep = {
  physicalKeyId: PhysicalKeyId;
  eventCode: string;
  character: string;
  layer: KeyboardDiagnosticLayer;
  requiresShift: boolean;
  requiresAltGr: boolean;
  guideKeys: PhysicalKeyId[];
  handSvg: string;
};

function isPrintableOutput(output: string | undefined): output is string {
  return Boolean(output && output !== '\n');
}

function createStep(
  layout: KeyboardLayout,
  family: KeyboardPhysicalFamily,
  physicalKeyId: PhysicalKeyId,
  layer: KeyboardDiagnosticLayer,
  character: string,
  requiresShift: boolean,
  requiresAltGr: boolean,
): KeyboardDiagnosticStep | null {
  const eventCode = getCodeForPhysicalKeyId(physicalKeyId);
  if (!eventCode) return null;

  const handReferences = getHandReferencesForPhysicalKeyId(physicalKeyId, family);
  const handSvg =
    handReferences.left !== '/svg/P30-P33.svg' ? handReferences.left : handReferences.right;
  const guideKeys: PhysicalKeyId[] = [];

  if (requiresShift) guideKeys.push(getShiftPhysicalKeyId(physicalKeyId));
  if (requiresAltGr && physicalFamilyHasKeyId(family, 'P61' as PhysicalKeyId)) {
    guideKeys.push('P61' as PhysicalKeyId);
  }
  guideKeys.push(physicalKeyId);

  return {
    physicalKeyId,
    eventCode,
    character,
    layer,
    requiresShift,
    requiresAltGr,
    guideKeys,
    handSvg,
  };
}

export function getKeyboardDiagnosticSteps(
  layout: KeyboardLayout,
  family: KeyboardPhysicalFamily,
): KeyboardDiagnosticStep[] {
  const steps: KeyboardDiagnosticStep[] = [];

  for (const physicalKeyId of PHYSICAL_KEY_ID_ROWS[family].flat()) {
    if (!requiresHandPosture(physicalKeyId)) continue;

    const deadKey = getDeadKey(layout, physicalKeyId, false);
    const baseOutput = getKeyOutput(layout, physicalKeyId);
    if (deadKey) {
      const step = createStep(
        layout,
        family,
        physicalKeyId,
        'dead',
        deadKey.standaloneMark,
        false,
        false,
      );
      if (step) steps.push(step);
    } else if (isPrintableOutput(baseOutput)) {
      const step = createStep(layout, family, physicalKeyId, 'base', baseOutput, false, false);
      if (step) steps.push(step);
    }

    const shiftedDeadKey = getDeadKey(layout, physicalKeyId, true);
    const shiftedOutput = getKeyOutput(layout, physicalKeyId, true);
    if (shiftedDeadKey) {
      const step = createStep(
        layout,
        family,
        physicalKeyId,
        'dead',
        shiftedDeadKey.standaloneMark,
        true,
        false,
      );
      if (step) steps.push(step);
    } else if (isPrintableOutput(shiftedOutput) && shiftedOutput !== baseOutput) {
      const step = createStep(layout, family, physicalKeyId, 'shift', shiftedOutput, true, false);
      if (step) steps.push(step);
    }

    for (const [shiftKey, layer] of [
      [false, 'altgr'],
      [true, 'shift-altgr'],
    ] as const) {
      const configuredOutput = shiftKey
        ? layout.shiftAltGrKeys?.[physicalKeyId]
        : layout.altGrKeys?.[physicalKeyId];
      if (!isPrintableOutput(configuredOutput) || !physicalFamilyHasKeyId(family, 'P61' as PhysicalKeyId)) {
        continue;
      }
      const output = getKeyOutput(layout, physicalKeyId, shiftKey, true);
      if (!isPrintableOutput(output)) continue;
      const step = createStep(layout, family, physicalKeyId, layer, output, shiftKey, true);
      if (step) steps.push(step);
    }
  }

  return steps;
}
