import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { addDays, subDays } from 'date-fns';
import { DatePicker } from './date-picker';
import { Label } from './label';

function DefaultRender() {
  const [value, setValue] = useState<Date | string | null>(null);
  return (
    <div className="w-72">
      <DatePicker value={value} onChange={setValue} />
    </div>
  );
}

function WithLabelRender() {
  const [value, setValue] = useState<Date | string | null>(null);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="admission-date">Data de admissão</Label>
      <DatePicker
        id="admission-date"
        value={value}
        onChange={setValue}
        placeholder="Selecionar data de admissão"
      />
    </div>
  );
}

function WithErrorRender() {
  const [value, setValue] = useState<Date | string | null>(null);
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="due-date" className="text-destructive">
        Vencimento
      </Label>
      <DatePicker
        id="due-date"
        value={value}
        onChange={setValue}
        className="border-destructive focus-visible:ring-destructive/30"
      />
      <p className="text-sm text-destructive">
        Selecione uma data de vencimento.
      </p>
    </div>
  );
}

function DisabledRender() {
  const [value, setValue] = useState<Date | string | null>('2026-04-30');
  return (
    <div className="w-72">
      <DatePicker value={value} onChange={setValue} disabled />
    </div>
  );
}

function MinMaxRender() {
  const [value, setValue] = useState<Date | string | null>(null);
  const today = new Date();
  return (
    <div className="w-72">
      <DatePicker
        value={value}
        onChange={setValue}
        fromDate={subDays(today, 30)}
        toDate={addDays(today, 30)}
      />
    </div>
  );
}

function PrefilledRender() {
  const [value, setValue] = useState<Date | string | null>('2026-04-15');
  return (
    <div className="w-72 space-y-2">
      <Label htmlFor="event-date">Data do evento</Label>
      <DatePicker id="event-date" value={value} onChange={setValue} />
    </div>
  );
}

const meta = {
  title: 'UI/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Uncontrolled-feel demo with internal state — click the trigger to open the
// popover; the picker emits ISO strings by default (`valueFormat="iso"`).
export const Default: Story = {
  render: () => <DefaultRender />,
};

// Visible label tied to the trigger via htmlFor/id — required for a11y.
export const WithLabel: Story = {
  render: () => <WithLabelRender />,
};

// Field-level error treatment: red border on the trigger plus an inline
// message rendered below it. The component itself doesn't have a built-in
// `error` prop — pages compose validation around it (see input-form pattern).
export const WithError: Story = {
  render: () => <WithErrorRender />,
};

// Disabled trigger — popover cannot be opened.
export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// Constrain the calendar to ±30 days. The component forwards `fromDate`/
// `toDate` to <Calendar/>; even though react-day-picker v9 prefers
// `startMonth`/`endMonth` + `disabled` matchers, the wrapper keeps the
// older prop names for backward-compat with existing pages.
export const MinMax: Story = {
  render: () => <MinMaxRender />,
};

// Pre-selected ISO value — confirms the component renders formatted PT-BR.
export const Prefilled: Story = {
  render: () => <PrefilledRender />,
};
