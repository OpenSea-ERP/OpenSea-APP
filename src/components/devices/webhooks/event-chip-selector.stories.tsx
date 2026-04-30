import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import type { WebhookEventType } from '@/types/system';
import { WebhookEventChipSelector } from './event-chip-selector';

const meta = {
  title: 'Modules/Devices/WebhookEventChipSelector',
  component: WebhookEventChipSelector,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Multiselect de chip-cards para os 5 eventos `punch.*` (Phase 11 D-16/D-17, UI-SPEC §Passo 2). Cada chip mostra rótulo formal pt-BR, código técnico (mono) e descrição. Selecionados ganham ring âmbar. Padrão visual derivado de pos-terminals/page.tsx.',
      },
    },
  },
} satisfies Meta<typeof WebhookEventChipSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

function ControlledSelector({
  initial = [],
  error = false,
}: {
  initial?: WebhookEventType[];
  error?: boolean;
}) {
  const [value, setValue] = useState<WebhookEventType[]>(initial);
  return (
    <div className="max-w-2xl">
      <WebhookEventChipSelector
        value={value}
        onChange={setValue}
        error={error}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        {value.length} evento(s) selecionado(s)
      </p>
    </div>
  );
}

export const NenhumSelecionado: Story = {
  render: () => <ControlledSelector />,
};

export const ParcialSelecionado: Story = {
  render: () => (
    <ControlledSelector
      initial={['punch.time-entry.created', 'punch.approval.requested']}
    />
  ),
};

export const TodosSelecionados: Story = {
  render: () => (
    <ControlledSelector
      initial={[
        'punch.time-entry.created',
        'punch.approval.requested',
        'punch.approval.resolved',
        'punch.device.paired',
        'punch.device.revoked',
      ]}
    />
  ),
};

export const ComErro: Story = {
  render: () => <ControlledSelector error />,
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <ControlledSelector
      initial={['punch.device.paired', 'punch.device.revoked']}
    />
  ),
};
