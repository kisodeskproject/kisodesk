module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci']],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scopes permitidos (ajustados para frontend)
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'ui',
        'i18n',
        'accesibilidad',
        'contenido',
        'notificaciones',
        'admin',
        'ci',
        'chore',
      ],
    ],
    'scope-empty': [2, 'never'],

    // Asunto
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Longitudes
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};
