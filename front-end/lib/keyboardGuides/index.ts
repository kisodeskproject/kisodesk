import { getEnabledLayoutById, type KeyboardLayoutId } from '@/lib/keyboardLayouts';
import { resolveCharacterToPhysicalKey } from '@/lib/keyMappings';
import { getHandReferencesForPhysicalKeyId } from '@/lib/keyboardPhysicalHands';
import type { PhysicalKeyId } from '@/lib/keyboardPhysical';

import {
  createBaseQwertyGuideConfig,
  type HandOverlayPosition,
  type HandReferences,
  type KeyboardGuideConfig,
} from './config';
import { createQwertyLatamGuideConfig } from './qwertyLatam';
import { createQwertyEsGuideConfig } from './qwertyEs';
import { createQwertyEnGuideConfig } from './qwertyEn';
import { createQwertyDaGuideConfig } from './qwertyDa';

const KEYBOARD_GUIDE_CONFIGS: Partial<Record<KeyboardLayoutId, KeyboardGuideConfig>> = {
  'qwerty-es': createQwertyEsGuideConfig(),
  'qwerty-latam': createQwertyLatamGuideConfig(),
  'qwerty-en': createQwertyEnGuideConfig(),
  'qwerty-da': createQwertyDaGuideConfig(),
};

const BASE_GUIDE_CONFIG = createBaseQwertyGuideConfig();

function getKeyboardGuideConfig(layoutId?: string | null) {
  const normalizedLayoutId = (layoutId ?? '') as KeyboardLayoutId;
  return KEYBOARD_GUIDE_CONFIGS[normalizedLayoutId] ?? BASE_GUIDE_CONFIG;
}

export function getNextPendingTargetKey(targetKeys: string[], pressedKeys: string[]) {
  const pressedSet = new Set(pressedKeys.map((key) => key.toLocaleLowerCase('es')));

  return targetKeys.find((key) => !pressedSet.has(key.toLocaleLowerCase('es'))) ?? null;
}

export function getHandReferencesForExpectedKey(
  expectedKey?: string | null,
  layoutId?: string | null,
): HandReferences {
  const layout = getEnabledLayoutById(layoutId);
  const resolution = expectedKey
    ? resolveCharacterToPhysicalKey(expectedKey, layout)
    : null;
  const primaryKeyId = resolution?.deadKey?.physicalKeyId ?? resolution?.physicalKeyId;
  const primary = getHandReferencesForPhysicalKeyId(primaryKeyId, layout.physicalType ?? 'ISO');

  if (!resolution?.shiftPhysicalKeyId) return primary;

  const modifier = getHandReferencesForPhysicalKeyId(
    resolution.shiftPhysicalKeyId,
    layout.physicalType ?? 'ISO',
  );
  return {
    left: modifier.left.includes('Shift') ? modifier.left : primary.left,
    right: modifier.right.includes('Shift') ? modifier.right : primary.right,
  };
}

export function getKeyboardGuideKeysForExpectedKey(
  expectedKey?: string | null,
  layoutId?: string | null,
): PhysicalKeyId[] {
  if (!expectedKey) {
    return [];
  }

  const physicalKey = resolveCharacterToPhysicalKey(
    expectedKey,
    getEnabledLayoutById(layoutId),
  );
  if (!physicalKey) return [];

  const keys: PhysicalKeyId[] = [];
  if (physicalKey.deadKey) {
    if (physicalKey.deadKey.shiftPhysicalKeyId) keys.push(physicalKey.deadKey.shiftPhysicalKeyId);
    keys.push(physicalKey.deadKey.physicalKeyId);
  }
  if (physicalKey.shiftPhysicalKeyId) keys.push(physicalKey.shiftPhysicalKeyId);
  keys.push(physicalKey.physicalKeyId);
  return Array.from(new Set(keys));
}

export function getHandSvgPositionsForLayout(
  layoutId?: string | null,
): Record<string, HandOverlayPosition> {
  return getKeyboardGuideConfig(layoutId).handSvgPositions;
}

export type { HandOverlayPosition, HandReferences };
