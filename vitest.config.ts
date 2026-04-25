import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    css: false,
    environmentMatchGlobs: [
      // DOM-bound tests opt in by living in tests/dom/* or naming files *.dom.test.tsx
      ['tests/dom/**', 'jsdom'],
      ['src/**/*.dom.test.{ts,tsx}', 'jsdom'],
    ],
  },
});
