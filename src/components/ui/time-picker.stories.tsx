import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from './label';
import { TimePicker } from './time-picker';

// Project TimePicker is a Popover wrapping a free-text "HH:MM" input plus a
// preset grid generated from `interval` (default 15min). Format is fixed at
// 24h "HH:MM" — there is no AM/PM mode and no seconds support. API:
// `value: string`, `onChange: (value: string) => void`, `interval?`,
// `placeholder?`, `disabled?`, `className?`. We document the gaps below.

const meta = {
  title: 'UI/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState('');
  return (
    <div className="w-44 space-y-2">
      <Label htmlFor="horario">Horário</Label>
      <TimePicker
        value={value}
        onChange={setValue}
        className="w-full"
        aria-label="Selecionar horário"
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

// API gap: no 24h vs 12h mode. The TimePicker always renders 24h "HH:MM".
// Pages that need 12h display format the string for display but keep the
// underlying value in 24h. We show both side-by-side.
function FormatComparisonRender() {
  const [value, setValue] = useState('14:30');
  const display12h = (() => {
    if (!/^\d{2}:\d{2}$/.test(value)) return '--';
    const [h, m] = value.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  })();
  return (
    <div className="w-64 space-y-3">
      <div className="space-y-2">
        <Label htmlFor="horario-24h">24h (nativo)</Label>
        <TimePicker value={value} onChange={setValue} className="w-full" />
      </div>
      <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        Equivalente em 12h: <span className="font-medium">{display12h}</span>
      </div>
    </div>
  );
}

export const Format24hVs12h: Story = {
  render: () => <FormatComparisonRender />,
};

// API gap: no seconds support. The internal input is fixed at maxLength 5
// ("HH:MM"). Pages that need seconds compose two inputs (one TimePicker for
// HH:MM, a separate input for SS). We show that pattern here.
function WithSecondsRender() {
  const [time, setTime] = useState('08:15');
  const [seconds, setSeconds] = useState('30');
  return (
    <div className="w-64 space-y-2">
      <Label id="ponto-label">Ponto exato (HH:MM:SS)</Label>
      <div className="flex items-center gap-2" aria-labelledby="ponto-label">
        <TimePicker value={time} onChange={setTime} />
        <span className="text-muted-foreground">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={seconds}
          onChange={e => setSeconds(e.target.value)}
          className="h-8 w-14 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Segundos"
        />
      </div>
    </div>
  );
}

export const WithSeconds: Story = {
  render: () => <WithSecondsRender />,
};

function DisabledRender() {
  const [value, setValue] = useState('09:00');
  return (
    <div className="w-44 space-y-2">
      <Label htmlFor="horario-bloq">Horário fixo</Label>
      <TimePicker
        value={value}
        onChange={setValue}
        disabled
        className="w-full"
      />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// API gap: no built-in min/max. The component generates a full 24h preset
// grid based on `interval`. Pages that need a window (e.g. business hours)
// validate after onChange and surface a message. We replicate that.
function MinMaxRender() {
  const min = '08:00';
  const max = '18:00';
  const [value, setValue] = useState('07:30');
  const outOfRange = !!value && (value < min || value > max);
  return (
    <div className="w-64 space-y-2">
      <Label htmlFor="atendimento">Janela de atendimento (08:00–18:00)</Label>
      <TimePicker
        value={value}
        onChange={setValue}
        interval={30}
        className="w-full"
      />
      {outOfRange && (
        <p className="text-sm text-destructive">
          Horário fora da janela permitida.
        </p>
      )}
    </div>
  );
}

export const MinMax: Story = {
  render: () => <MinMaxRender />,
};
