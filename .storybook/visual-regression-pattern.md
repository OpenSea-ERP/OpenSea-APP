# Visual Regression Pattern

Storybook stories opt into pixel-by-pixel screenshot comparison using
`@vitest/browser`'s `toMatchScreenshot` matcher (Playwright/Chromium provider).
The same Storybook + Vitest stack that powers the a11y gate is reused — no new
runner, no new dependency.

## How it works

1. A story declares `tags: ['visual']` and a `play` function.
2. The `play` function imports `{ page }` from `@vitest/browser/context` and
   `{ expect }` from `vitest`, then calls
   `await expect.element(page.getByTestId(...)).toMatchScreenshot('name')`.
3. `npm run test:visual` sets `OPENSEA_VISUAL_REGRESSION=1`, which makes
   `vitest.config.ts` filter the Storybook project to `tags.include: ['visual']`.
   Only opted-in stories run; everything else is skipped.
4. On first run (or `--update`), Vitest writes the baseline image. On every
   subsequent run, the new screenshot is compared against the baseline. A
   mismatch fails the test, blocking the workflow.

## Where baselines live

Baselines are written next to each story:

```
src/components/ui/__screenshots__/button.stories.tsx/<browser>/<name>.png
```

The exact directory is resolved by `resolveScreenshotPath` from
`@vitest/browser`. Commit baselines to git so CI compares against the same
reference.

## Updating baselines

When an intentional visual change is made, regenerate baselines:

```bash
npm run test:visual:update
```

Inspect the diff in git, confirm the change is intended, and commit the new
PNGs alongside the source change.

## Opting in a story

```tsx
import { expect } from 'vitest';
import { page } from '@vitest/browser/context';

export const AllVariants: Story = {
  tags: ['visual'],
  render: () => (
    <div data-testid="my-story-root" className="...">
      ...
    </div>
  ),
  play: async () => {
    await expect
      .element(page.getByTestId('my-story-root'))
      .toMatchScreenshot('my-story-name');
  },
};
```

Guidelines:

- Always wrap the rendered tree in a `data-testid` so the screenshot scope is
  deterministic.
- Pick stories that are **stable by design** — flat, no animation, no time, no
  network. Animated or stateful demos are bad candidates.
- Prefer one screenshot per story. Multiple screenshots per story are allowed
  but make diffs noisier.
- Stories tagged `'visual'` still run in the standard Storybook test project
  (a11y gate). The `'visual'` tag is additive.

## Comparator defaults

`vitest.config.ts` sets:

```ts
expect: {
  toMatchScreenshot: {
    comparatorName: 'pixelmatch',
    comparatorOptions: { allowedMismatchedPixelRatio: 0.01 },
  },
}
```

Stories can override per-call:

```ts
await expect.element(locator).toMatchScreenshot('name', {
  comparatorOptions: { allowedMismatchedPixelRatio: 0.005 },
});
```

## CI behavior

`npm run test:visual` exits non-zero on any mismatch or missing baseline,
which fails the workflow. There is no auto-update in CI — baselines must be
regenerated locally and committed.

## Scripts

| Script                       | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `npm run test:visual`        | Run only stories tagged `'visual'`. Compare to baselines |
| `npm run test:visual:update` | Same, but rewrite baselines (use after intended changes) |

## Currently opted-in stories

- `src/components/ui/button.stories.tsx` → `AllVariants`
- `src/components/ui/badge.stories.tsx` → `AllVariants`
- `src/components/shared/page-header.stories.tsx` → `Default`

Add the `'visual'` tag + `play` function to any story you want gated. Start
with high-value, stable surfaces (component variants matrix, header chrome,
empty states) before low-value ones.
