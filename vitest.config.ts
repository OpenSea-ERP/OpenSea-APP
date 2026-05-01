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
//
// Visual regression toggle:
//  Set `OPENSEA_VISUAL_REGRESSION=1` (see `npm run test:visual` / `test:visual:update`)
//  to filter the storybook project to stories tagged `'visual'` only. Those stories
//  expose a `play` function calling `expect.element(...).toMatchScreenshot('name')`.
//  Baseline images live next to the story file in `__screenshots__/` (created on
//  first run / `--update`). See `.storybook/visual-regression-pattern.md`.
const VISUAL_REGRESSION = process.env.OPENSEA_VISUAL_REGRESSION === '1';

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
            // When OPENSEA_VISUAL_REGRESSION=1, restrict to stories that opt in
            // via `tags: ['visual']` so the screenshot suite is isolated from the
            // a11y gate (which runs on the default `'test'` tag).
            ...(VISUAL_REGRESSION ? { tags: { include: ['visual'] } } : {}),
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
            // Sensible default for visual regression: pixelmatch with a small
            // ratio tolerance to absorb sub-pixel font/AA noise. Stories can
            // override per-call via `toMatchScreenshot(name, { ... })`.
            expect: {
              toMatchScreenshot: {
                comparatorName: 'pixelmatch',
                comparatorOptions: {
                  allowedMismatchedPixelRatio: 0.01,
                },
              },
            },
          },
        },
      },
    ],
  },
});
