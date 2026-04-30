import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RecurrencePicker } from './recurrence-picker';

const meta = {
  title: 'Tools/Calendar/RecurrencePicker',
  component: RecurrencePicker,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Picker de recorrência iCalendar (RRULE) — escolhe frequência (DAILY / WEEKLY / MONTHLY / YEARLY), intervalo numérico, dias da semana (apenas WEEKLY) e total de ocorrências (COUNT). Emite uma string RRULE (`RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR`). Aceita `accentColor` para casar com a cor do calendário e `titleSlot` para um header opcional.',
      },
    },
  },
} satisfies Meta<typeof RecurrencePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledPicker({
  initial = null,
  accentColor,
  titleSlot,
}: {
  initial?: string | null;
  accentColor?: string;
  titleSlot?: React.ReactNode;
}) {
  const [value, setValue] = useState<string | null>(initial);
  return (
    <div className="max-w-xl space-y-3">
      <RecurrencePicker
        value={value}
        onChange={setValue}
        accentColor={accentColor}
        titleSlot={titleSlot}
      />
      <pre className="rounded-md bg-muted p-2 text-[11px] text-muted-foreground">
        {value ?? '(sem recorrência)'}
      </pre>
    </div>
  );
}

export const Default: Story = {
  render: () => <ControlledPicker />,
};

export const Semanal: Story = {
  render: () => <ControlledPicker initial="RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR" />,
};

export const Mensal: Story = {
  render: () => <ControlledPicker initial="RRULE:FREQ=MONTHLY;INTERVAL=2" />,
};

export const ComContador: Story = {
  render: () => (
    <ControlledPicker initial="RRULE:FREQ=DAILY;INTERVAL=1;COUNT=10" />
  ),
};

export const ComAccentColorETitulo: Story = {
  render: () => (
    <ControlledPicker
      initial="RRULE:FREQ=WEEKLY;BYDAY=TU,TH"
      accentColor="#10b981"
      titleSlot={
        <div className="text-sm font-semibold text-foreground">
          Repete a cada
        </div>
      }
    />
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <ControlledPicker
      initial="RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR"
      accentColor="#a855f7"
    />
  ),
};
