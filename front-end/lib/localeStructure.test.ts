import { describe, expect, it } from '@jest/globals';

import { getTranslation } from './i18n';
import { KEYBOARD_DETECTION_QUESTIONS } from './keyboardDetection';
import { SUPPORTED_LOCALES } from './locales';

describe('locale structure', () => {
  it.each(SUPPORTED_LOCALES)(
    'resolves every keyboard-identification message for %s',
    (locale) => {
      const keys = [
        'components.lessons.keyboardDetectionWizard.general.title',
        'components.lessons.keyboardDetectionWizard.general.intro.title',
        'components.lessons.keyboardDetectionWizard.general.capture.focus',
        'components.lessons.keyboardDetectionWizard.general.errors.wrongKey',
        'components.lessons.keyboardDetectionWizard.general.result.detectedTitle',
        ...KEYBOARD_DETECTION_QUESTIONS.flatMap((question) => [question.titleKey, question.helpKey]),
      ];

      for (const key of keys) {
        expect(getTranslation(locale, key)).not.toBe(key);
      }
    },
  );

  it('returns the key for missing or empty localized values', () => {
    expect(getTranslation('en-US', 'missing.translation.key')).toBe('missing.translation.key');
  });
});
