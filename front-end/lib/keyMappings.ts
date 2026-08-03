import { KEYBOARD_LAYOUTS, getKeyOutput } from './keyboardLayouts';
import type { KeyboardLayout, KeyboardPhysicalFamily } from './keyboardLayouts';
import { physicalFamilyHasKeyId, type PhysicalKeyId } from './keyboardPhysical';

export function getCharacterForPhysicalKey(
  physicalKeyId: PhysicalKeyId,
  layoutId: string,
  shiftKey = false,
): string | undefined {
  const layout = KEYBOARD_LAYOUTS.find((candidate) => candidate.id === layoutId);
  return layout ? getKeyOutput(layout, physicalKeyId, shiftKey) : undefined;
}

export const getVisualKeyForPhysicalKeyId = getCharacterForPhysicalKey;

export function getSvgKeyIdForPhysicalKeyId(
  physicalKeyId: PhysicalKeyId,
  physicalFamily: KeyboardPhysicalFamily = 'ISO',
): string | null {
  if (!physicalFamilyHasKeyId(physicalFamily, physicalKeyId)) return null;
  return `key-${physicalKeyId}`;
}

export function getKeyboardPhysicalFamily(layout: KeyboardLayout): KeyboardPhysicalFamily {
  return layout.physicalType ?? 'ISO';
}

const LEFT_HAND_KEYS = new Set<PhysicalKeyId>([
  'P01', 'P02', 'P03', 'P04', 'P05', 'P06',
  'P16', 'P17', 'P18', 'P19', 'P20',
  'P30', 'P31', 'P32', 'P33', 'P34',
  'P43', 'P44', 'P45', 'P46', 'P47', 'P48',
] as PhysicalKeyId[]);

export function getShiftPhysicalKeyId(physicalKeyId: PhysicalKeyId): PhysicalKeyId {
  return LEFT_HAND_KEYS.has(physicalKeyId) ? ('P55' as PhysicalKeyId) : ('P42' as PhysicalKeyId);
}

export interface PhysicalKeyResolution {
  physicalKeyId: PhysicalKeyId;
  displayValue: string;
  requiresShift: boolean;
  shiftPhysicalKeyId?: PhysicalKeyId;
  requiresAltGr: boolean;
  deadKey?: {
    physicalKeyId: PhysicalKeyId;
    requiresShift: boolean;
    shiftPhysicalKeyId?: PhysicalKeyId;
  };
}

function normalizeCharacter(character: string): string {
  return character.normalize('NFC');
}

export function resolveCharacterToPhysicalKey(
  character: string,
  layout: KeyboardLayout,
): PhysicalKeyResolution | null {
  const target = normalizeCharacter(character);

  for (const physicalKeyId of Object.keys(layout.keys) as PhysicalKeyId[]) {
    const baseOutput = getKeyOutput(layout, physicalKeyId);
    if (baseOutput !== undefined && normalizeCharacter(baseOutput) === target) {
      return {
        physicalKeyId,
        displayValue: baseOutput,
        requiresShift: false,
        requiresAltGr: false,
      };
    }

    const shiftedOutput = getKeyOutput(layout, physicalKeyId, true);
    if (shiftedOutput !== undefined && normalizeCharacter(shiftedOutput) === target) {
      return {
        physicalKeyId,
        displayValue: shiftedOutput,
        requiresShift: true,
        shiftPhysicalKeyId: getShiftPhysicalKeyId(physicalKeyId),
        requiresAltGr: false,
      };
    }

    for (const shiftKey of [false, true]) {
      const altGrOutput = getKeyOutput(layout, physicalKeyId, shiftKey, true);
      const configuredAltGrOutput = shiftKey
        ? layout.shiftAltGrKeys?.[physicalKeyId]
        : layout.altGrKeys?.[physicalKeyId];
      if (configuredAltGrOutput === undefined || altGrOutput === undefined) continue;
      if (normalizeCharacter(altGrOutput) !== target) continue;
      return {
        physicalKeyId,
        displayValue: altGrOutput,
        requiresShift: shiftKey,
        shiftPhysicalKeyId: shiftKey ? getShiftPhysicalKeyId(physicalKeyId) : undefined,
        requiresAltGr: true,
      };
    }
  }

  for (const deadKey of layout.deadKeys ?? []) {
    for (const physicalKeyId of Object.keys(layout.keys) as PhysicalKeyId[]) {
      for (const shiftKey of [false, true]) {
        const baseOutput = getKeyOutput(layout, physicalKeyId, shiftKey);
        if (!baseOutput) continue;
        if (normalizeCharacter(`${baseOutput}${deadKey.combiningMark}`) !== target) continue;

        return {
          physicalKeyId,
          displayValue: baseOutput,
          requiresShift: shiftKey,
          shiftPhysicalKeyId: shiftKey ? getShiftPhysicalKeyId(physicalKeyId) : undefined,
          requiresAltGr: false,
          deadKey: {
            physicalKeyId: deadKey.physicalKeyId,
            requiresShift: deadKey.shiftKey,
            shiftPhysicalKeyId: deadKey.shiftKey ? getShiftPhysicalKeyId(deadKey.physicalKeyId) : undefined,
          },
        };
      }
    }
  }

  return null;
}
