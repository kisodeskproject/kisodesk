import { createBaseQwertyGuideConfig, type KeyboardGuideConfig } from './config';

export function createQwertyDaGuideConfig(): KeyboardGuideConfig {
  const config = createBaseQwertyGuideConfig();

  ['å', 'æ', 'ø'].forEach((key) => config.rightHandKeys.add(key));

  return config;
}
