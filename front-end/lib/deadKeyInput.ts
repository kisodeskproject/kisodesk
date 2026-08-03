//front-typing/lib/deadkeyinput
import { getDeadKey, type KeyboardLayout } from '@/lib/keyboardLayouts';
import type { PhysicalKeyId } from '@/lib/keyboardPhysical';

export interface PendingDeadKey {
  physicalKeyId: PhysicalKeyId;
  shiftKey: boolean;
}

const LETTER_PATTERN = /^\p{L}$/u;

export function composeDeadKeyInput(
  deadKey: PendingDeadKey,
  input: string,
  layout: KeyboardLayout,
): string {
  const normalizedInput = input.normalize('NFC');
  const composition = getDeadKey(layout, deadKey.physicalKeyId, deadKey.shiftKey);

  if (!composition) return normalizedInput;
  if (normalizedInput === ' ') return composition.standaloneMark;
  if (LETTER_PATTERN.test(normalizedInput)) {
    if (normalizedInput.normalize('NFD').endsWith(composition.combiningMark)) {
      return normalizedInput;
    }
    return `${normalizedInput}${composition.combiningMark}`.normalize('NFC');
  }
  return `${composition.standaloneMark}${normalizedInput}`.normalize('NFC');
}
