import type { Meta, StoryObj } from '@storybook/react';
import type { EventType } from '@/types/calendar';
import { EventTypeBadge } from './event-type-badge';

const meta = {
  title: 'Tools/Calendar/EventTypeBadge',
  component: EventTypeBadge,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Chip do tipo de evento (Calendar Tool) — 11 tipos: MEETING / TASK / REMINDER / DEADLINE / HOLIDAY / BIRTHDAY / VACATION / ABSENCE / FINANCE_DUE / PURCHASE_ORDER / CUSTOM. Cada tipo tem cor própria (definida em `EVENT_TYPE_COLORS`) aplicada como background tint + borda + texto, com ícone Lucide específico.',
      },
    },
  },
} satisfies Meta<typeof EventTypeBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const ALL_TYPES: EventType[] = [
  'MEETING',
  'TASK',
  'REMINDER',
  'DEADLINE',
  'HOLIDAY',
  'BIRTHDAY',
  'VACATION',
  'ABSENCE',
  'FINANCE_DUE',
  'PURCHASE_ORDER',
  'CUSTOM',
];

export const Default: Story = {
  args: { type: 'MEETING' },
};

export const Reuniao: Story = {
  args: { type: 'MEETING' },
};

export const Aniversario: Story = {
  args: { type: 'BIRTHDAY' },
};

export const Ferias: Story = {
  args: { type: 'VACATION' },
};

export const TodosTipos: Story = {
  render: () => (
    <div className="flex max-w-3xl flex-wrap items-center gap-2">
      {ALL_TYPES.map(type => (
        <EventTypeBadge key={type} type={type} />
      ))}
    </div>
  ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex max-w-3xl flex-wrap items-center gap-2">
      {ALL_TYPES.map(type => (
        <EventTypeBadge key={type} type={type} />
      ))}
    </div>
  ),
};
