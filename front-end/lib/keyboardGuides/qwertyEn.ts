import { createBaseQwertyGuideConfig, type KeyboardGuideConfig } from './config';

export function createQwertyEnGuideConfig(): KeyboardGuideConfig {
  const config = createBaseQwertyGuideConfig();

  Object.assign(config.expectedKeyMap, {
    '!': { baseKey: '1', requiresShift: true },
    '@': { baseKey: '2', requiresShift: true },
    '#': { baseKey: '3', requiresShift: true },
    $: { baseKey: '4', requiresShift: true },
    '%': { baseKey: '5', requiresShift: true },
    '^': { baseKey: '6', requiresShift: true },
    '&': { baseKey: '7', requiresShift: true },
    '*': { baseKey: '8', requiresShift: true },
    '(': { baseKey: '9', requiresShift: true },
    ')': { baseKey: '0', requiresShift: true },
    _: { baseKey: '-', requiresShift: true },
    '+': { baseKey: '=', requiresShift: true },
    '[': { baseKey: '[', requiresShift: false },
    '{': { baseKey: '[', requiresShift: true },
    ']': { baseKey: ']', requiresShift: false },
    '}': { baseKey: ']', requiresShift: true },
    ';': { baseKey: ';', requiresShift: false },
    ':': { baseKey: ';', requiresShift: true },
    "'": { baseKey: "'", requiresShift: false },
    '"': { baseKey: "'", requiresShift: true },
    '/': { baseKey: '/', requiresShift: false },
    '?': { baseKey: '/', requiresShift: true },
  });

  return config;
}
