import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './calendar';

function DefaultRender() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} />
  );
}

function RangeRender() {
  const today = new Date();
  const [range, setRange] = useState<DateRange | undefined>({
    from: subDays(today, 4),
    to: addDays(today, 2),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      locale={ptBR}
      numberOfMonths={2}
    />
  );
}

function DisabledDaysRender() {
  const [date, setDate] = useState<Date | undefined>();
  const today = new Date();
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={ptBR}
      disabled={[{ before: today }, { dayOfWeek: [0, 6] }]}
    />
  );
}

function WithMinMaxRender() {
  const [date, setDate] = useState<Date | undefined>();
  const today = new Date();
  const min = subDays(today, 30);
  const max = addDays(today, 30);
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={ptBR}
      defaultMonth={today}
      startMonth={min}
      endMonth={max}
      disabled={[{ before: min }, { after: max }]}
    />
  );
}

function LocaleRender() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      locale={ptBR}
      captionLayout="dropdown"
    />
  );
}

const meta = {
  title: 'UI/Calendar',
  component: Calendar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Single-date controlled selection — the most common usage of <Calendar />.
export const Default: Story = {
  render: () => <DefaultRender />,
};

// Range mode is used by audit-logs / stock filters to pick a date interval.
export const Range: Story = {
  render: () => <RangeRender />,
};

// Disable past days plus weekends — typical for scheduling future events.
export const DisabledDays: Story = {
  render: () => <DisabledDaysRender />,
};

// Constrain selection to a 60-day window.
// NOTE: react-day-picker v9 deprecates `fromDate`/`toDate` in favor of the
// `disabled` matcher; using the matcher form to stay forward-compatible.
export const WithMinMax: Story = {
  render: () => <WithMinMaxRender />,
};

// PT-BR locale renders dia/mês labels in Portuguese (e.g., "abril", "seg").
export const Locale: Story = {
  render: () => <LocaleRender />,
};
