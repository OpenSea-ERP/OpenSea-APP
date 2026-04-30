import type { Meta, StoryObj } from '@storybook/react';
import { addDays } from 'date-fns';
import { useState } from 'react';
import { DateTimePicker } from './date-time-picker';
import { Label } from './label';

// Project DateTimePicker is a Popover wrapping a Calendar (pt-BR) plus
// hour/minute inputs and quick-time chips. Locale is hard-coded to ptBR.
// API: `value: Date | null`, `onChange: (date: Date | null) => void`,
// `placeholder?`, `disabled?`. There is no `min`/`max` prop in the
// current implementation — we document that gap below.

const meta = {
  title: 'UI/DateTimePicker',
  component: DateTimePicker,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof DateTimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <div className="w-72">
      <DateTimePicker value={value} onChange={setValue} />
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

// API gap: the current component does not accept `fromDate`/`toDate`.
// Pages that need a min/max constrain the value via the onChange callback
// (clamp to range) and surface validation messages below the trigger. We
// reproduce that pattern here.
function WithMinMaxRender() {
  const today = new Date();
  const min = today;
  const max = addDays(today, 7);
  const [value, setValue] = useState<Date | null>(null);
  const outOfRange = value !== null && (value < min || value > max);

  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="agendamento">Agendamento (próximos 7 dias)</Label>
      <DateTimePicker
        value={value}
        onChange={setValue}
        placeholder="Escolher data e hora"
      />
      {outOfRange && (
        <p className="text-sm text-destructive">
          Selecione uma data dentro dos próximos 7 dias.
        </p>
      )}
    </div>
  );
}

export const WithMinMax: Story = {
  render: () => <WithMinMaxRender />,
};

function DisabledRender() {
  const [value, setValue] = useState<Date | null>(new Date());
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="evento-bloq">Início do evento (bloqueado)</Label>
      <DateTimePicker value={value} onChange={setValue} disabled />
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// The popover footer already surfaces a "Hoje" shortcut. The header
// shortcuts row ("Amanhã", "Próxima semana") isn't part of the component;
// pages compose it as buttons next to the trigger. We illustrate that.
function ShortcutsRowRender() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="prazo">Prazo</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            d.setHours(18, 0, 0, 0);
            setValue(d);
          }}
          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          Hoje 18h
        </button>
        <button
          type="button"
          onClick={() => {
            const d = addDays(new Date(), 1);
            d.setHours(9, 0, 0, 0);
            setValue(d);
          }}
          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          Amanhã 9h
        </button>
        <button
          type="button"
          onClick={() => {
            const d = addDays(new Date(), 7);
            d.setHours(9, 0, 0, 0);
            setValue(d);
          }}
          className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
        >
          Próxima semana
        </button>
      </div>
      <DateTimePicker value={value} onChange={setValue} />
    </div>
  );
}

export const ShortcutsRow: Story = {
  render: () => <ShortcutsRowRender />,
};

// Locale: the component imports ptBR statically — there is no locale prop.
// The trigger formats the value as "dd MMM yyyy HH:mm" with PT-BR month
// abbreviations (e.g. "30 abr 2026 14:30"). This story confirms the
// formatted output via a pre-set value.
function WithLocaleRender() {
  const initial = new Date();
  initial.setMonth(3); // April
  initial.setDate(30);
  initial.setHours(14, 30, 0, 0);
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="reuniao">Reunião (PT-BR)</Label>
      <DateTimePicker value={value} onChange={setValue} />
      <p className="text-xs text-muted-foreground">
        Mês exibido em português abreviado (jan, fev, mar...).
      </p>
    </div>
  );
}

export const WithLocale: Story = {
  render: () => <WithLocaleRender />,
};
