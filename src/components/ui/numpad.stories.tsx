import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Numpad } from './numpad';

// Project Numpad is a touch-friendly calculator-style entry pad: it stores
// value in CENTS (integer), formats display as BRL via Intl.NumberFormat,
// and supports keyboard input on mount. There is no `disabled`, `compact`,
// or `onlyNumbers` prop in the current API — Numpad is always currency.
// Stories below document the actual API and note where conventions deviate
// from the task brief.

const meta = {
  title: 'UI/NumPad',
  component: Numpad,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Numpad>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState(0);
  return (
    <div className="w-72">
      <Numpad value={value} onChange={setValue} />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

// API mismatch: there is no `onlyNumbers` mode. The Numpad always emits
// integer cents; "only-numbers" semantically means "treat the display value
// as plain integer, not currency" — we document this by reading `value/100`
// in the consumer instead. Here we just show the raw integer below the pad.
function OnlyNumbersRender() {
  const [value, setValue] = useState(1234);
  return (
    <div className="w-72 space-y-3">
      <Numpad value={value} onChange={setValue} />
      <p className="text-center text-sm text-muted-foreground tabular-nums">
        Valor inteiro: {Math.floor(value / 100)}
      </p>
    </div>
  );
}

export const OnlyNumbers: Story = {
  render: () => <OnlyNumbersRender />,
};

function WithValueRender() {
  // 2500 cents = R$ 25,00
  const [value, setValue] = useState(2500);
  return (
    <div className="w-72">
      <Numpad value={value} onChange={setValue} />
    </div>
  );
}

export const WithValue: Story = {
  render: () => <WithValueRender />,
};

// API mismatch: there is no `disabled` prop. PDV-style pages typically wrap
// the Numpad in a div with `pointer-events-none opacity-50` to simulate
// a locked state. We replicate that pattern here.
function DisabledRender() {
  const [value, setValue] = useState(9999);
  return (
    <div
      className="w-72 pointer-events-none opacity-50"
      aria-disabled
      aria-label="Numpad bloqueado"
    >
      <Numpad value={value} onChange={setValue} />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// API mismatch: there is no `compact` size variant. Pages that need a
// smaller pad pass a custom `className` to scale via Tailwind. This story
// shows the intended composition pattern.
function CompactRender() {
  const [value, setValue] = useState(0);
  return (
    <div className="w-56">
      <Numpad
        value={value}
        onChange={setValue}
        className="gap-2 [&_button]:h-11 [&_button]:text-base"
      />
    </div>
  );
}

export const Compact: Story = {
  render: () => <CompactRender />,
};

function WithShortcutsRender() {
  const [value, setValue] = useState(0);
  return (
    <div className="w-72">
      <Numpad
        value={value}
        onChange={setValue}
        shortcuts={[
          { label: 'R$ 10', value: 1000 },
          { label: 'R$ 25', value: 2500 },
          { label: 'R$ 50', value: 5000 },
        ]}
        maxValue={1000000}
      />
    </div>
  );
}

export const WithShortcuts: Story = {
  render: () => <WithShortcutsRender />,
};
