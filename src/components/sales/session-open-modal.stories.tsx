import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SessionOpenModal } from './session-open-modal';

/**
 * `SessionOpenModal` — abertura de caixa do PDV. Operador informa o fundo
 * de troco via Numpad (touch-first: botões 56–64px). Chamado obrigatório
 * em terminais com `requiresSession`.
 */
const meta = {
  title: 'Modules/Sales/SessionOpenModal',
  component: SessionOpenModal,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal de abertura de caixa. Wrapper de `NavigationWizardDialog` com Numpad central. Touch targets do Numpad atendem 44px+ — operador opera de pé, com pressa.',
      },
    },
  },
} satisfies Meta<typeof SessionOpenModal>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveTemplate({ isPending }: { isPending?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <SessionOpenModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onConfirm={() => setOpen(false)}
      isPending={isPending}
    />
  );
}

export const Default: Story = {
  render: () => <InteractiveTemplate />,
};

export const Pending: Story = {
  name: 'Pending (abrindo caixa)',
  render: () => <InteractiveTemplate isPending />,
};

export const Closed: Story = {
  name: 'Closed (fechado — para validar early return)',
  args: {
    isOpen: false,
    onClose: () => {},
    onConfirm: () => {},
  },
};
