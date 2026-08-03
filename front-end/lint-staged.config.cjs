module.exports = {
  '*.{js,jsx,ts,tsx}': (files) => {
    const filtered = files.filter((f) => !/next-env\.d\.ts$/.test(f));
    if (filtered.length === 0) return 'echo "no JS/TS files to lint"';
    return [
      `eslint --fix --max-warnings=0 --cache --cache-location .eslintcache ${filtered.join(' ')}`,
      `prettier --write ${filtered.join(' ')}`,
    ];
  },
  '*.{json,md,yml,yaml}': (files) => (files.length ? [`prettier --write ${files.join(' ')}`] : []),
};
