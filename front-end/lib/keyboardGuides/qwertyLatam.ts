import { createBaseQwertyGuideConfig, type KeyboardGuideConfig } from './config';

export function createQwertyLatamGuideConfig(): KeyboardGuideConfig {
  const base = createBaseQwertyGuideConfig();

  base.leftHandKeys.add('°');
  base.rightHandKeys.add("'");
  base.rightHandKeys.add('¿');
  base.rightHandKeys.add('´');
  base.rightHandKeys.add('+');
  base.rightHandKeys.add('{');
  base.rightHandKeys.add('}');
  base.rightHandKeys.add('ñ');
  base.rightHandRestKeys.add('ñ');

  Object.assign(base.expectedKeyMap, {
    '!': { baseKey: '1', requiresShift: true },
    '"': { baseKey: '2', requiresShift: true },
    '#': { baseKey: '3', requiresShift: true },
    $: { baseKey: '4', requiresShift: true },
    '%': { baseKey: '5', requiresShift: true },
    '&': { baseKey: '6', requiresShift: true },
    '/': { baseKey: '7', requiresShift: true },
    '(': { baseKey: '8', requiresShift: true },
    ')': { baseKey: '9', requiresShift: true },
    '=': { baseKey: '0', requiresShift: true },
    "'": { baseKey: "'", requiresShift: false },
    '?': { baseKey: "'", requiresShift: true },
    '¿': { baseKey: '¿', requiresShift: false },
    '¡': { baseKey: '¿', requiresShift: true },
    '´': { baseKey: '´', requiresShift: false },
    '¨': { baseKey: '´', requiresShift: false, modifierKey: '´', modifierRequiresShift: true },
    '+': { baseKey: '+', requiresShift: false },
    '*': { baseKey: '+', requiresShift: true },
    '{': { baseKey: '{', requiresShift: false },
    '}': { baseKey: '}', requiresShift: false },
    '°': { baseKey: '°', requiresShift: false },
    á: { baseKey: 'a', requiresShift: false, modifierKey: '´' },
    é: { baseKey: 'e', requiresShift: false, modifierKey: '´' },
    í: { baseKey: 'i', requiresShift: false, modifierKey: '´' },
    ó: { baseKey: 'o', requiresShift: false, modifierKey: '´' },
    ú: { baseKey: 'u', requiresShift: false, modifierKey: '´' },
    ü: { baseKey: 'u', requiresShift: false, modifierKey: '´', modifierRequiresShift: true },
  });

  Object.assign(base.svgByKey, {
    '°': '/svg/P01.svg',
    "'": '/svg/P12.svg',
    '¿': '/svg/P13.svg',
    '´': '/svg/P26.svg',
    '+': '/svg/P27.svg',
    '{': '/svg/P40.svg',
    '}': '/svg/P28.svg',
    ñ: '/svg/P36-P39-Space.svg',
  });

  return base;
}
