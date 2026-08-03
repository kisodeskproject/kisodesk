import { describe, expect, it } from '@jest/globals';
import { composeDeadKeyInput } from './deadKeyInput';
import { getEnabledLayoutById } from './keyboardLayouts';
import { getPhysicalKeyIdForCode } from './keyboardPhysical';

describe('composeDeadKeyInput', () => {
  const spanishLayout = getEnabledLayoutById('qwerty-es');
  const physicalKey = (code: string) => getPhysicalKeyIdForCode(code)!;

  it('compone vocales con acento agudo', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('Quote'), shiftKey: false }, 'a', spanishLayout)).toBe('á');
  });

  it('compone la dieresis mediante Shift', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('Quote'), shiftKey: true }, 'u', spanishLayout)).toBe('ü');
  });

  it('produce el acento aislado al pulsar espacio', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('Quote'), shiftKey: false }, ' ', spanishLayout)).toBe('´');
  });

  it('compone vocales con tilde grave', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('BracketLeft'), shiftKey: false }, 'e', spanishLayout)).toBe(
      'è',
    );
  });

  it('mantiene acentos y diéresis en la distribución latinoamericana', () => {
    const latinAmericanLayout = getEnabledLayoutById('qwerty-latam');

    expect(
      composeDeadKeyInput({ physicalKeyId: physicalKey('BracketLeft'), shiftKey: false }, 'á', latinAmericanLayout),
    ).toBe('á');
    expect(
      composeDeadKeyInput({ physicalKeyId: physicalKey('BracketLeft'), shiftKey: true }, 'u', latinAmericanLayout),
    ).toBe('ü');
  });

  it('conserva explícitamente la marca y el carácter cuando no se pueden componer', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('Quote'), shiftKey: false }, '1', spanishLayout)).toBe('´1');
  });

  it('compone letras no vocales cuando Unicode dispone de una forma normalizada', () => {
    expect(composeDeadKeyInput({ physicalKeyId: physicalKey('Quote'), shiftKey: false }, 'c', spanishLayout)).toBe('ć');
  });
});
