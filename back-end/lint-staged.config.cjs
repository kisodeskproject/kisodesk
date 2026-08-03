module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    // Filtrar archivos de scripts que no deben ser formateados
    const filtered = files.filter((file) => !file.includes('scripts/'));
    if (filtered.length === 0) return 'echo "no JS/TS files to lint"';
    return [
      `eslint --fix --cache --cache-location .eslintcache ${filtered.join(' ')}`,
      `prettier --write ${filtered.join(' ')}`,
    ];
  },
  '*.{json,md,yml,yaml}': (files) => (files.length ? [`prettier --write ${files.join(' ')}`] : []),
};
