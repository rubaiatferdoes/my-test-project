import tseslint from 'typescript-eslint';

export default tseslint.config(...tseslint.configs.recommended, {
  ignores: ['reports/**', 'test-results/**', 'discovery/artifacts/**', 'node_modules/**'],
});
