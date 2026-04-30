import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

const sharedAlias = {
  '@': path.resolve(dirname, './src'),
  '@lib': path.resolve(dirname, './src/lib'),
  '@components': path.resolve(dirname, './src/components'),
  '@hooks': path.resolve(dirname, './src/hooks'),
  '@types': path.resolve(dirname, './src/types'),
  '@services': path.resolve(dirname, './src/services'),
  '@contexts': path.resolve(dirname, './src/contexts'),
};

// Vitest 4 multi-project setup:
//  - "unit": existing happy-dom unit/integration tests (tests/**, src/**.spec.tsx)
//  - "storybook": Storybook stories rendered in real browser (Playwright/Chromium)
//    via @storybook/addon-vitest. Drives the a11y gate (parameters.a11y.test='error'
//    in .storybook/preview.tsx). Run with: npx vitest run --project=storybook
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.test.ts', '**/*.test.tsx'],
    },
    projects: [
      {
        extends: false,
        resolve: { alias: sharedAlias },
        test: {
          name: 'unit',
          environment: 'happy-dom',
          setupFiles: ['./tests/setup.ts'],
          globals: true,
          include: [
            'tests/**/*.test.ts',
            'tests/**/*.test.tsx',
            'src/**/*.spec.ts',
            'src/**/*.spec.tsx',
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
          ],
          exclude: [
            'node_modules',
            'dist',
            '.next',
            'build',
            '**/*.stories.tsx',
          ],
        },
      },
      {
        extends: false,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        resolve: { alias: sharedAlias },
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
