import type { Meta, StoryObj } from '@storybook/react';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { QuickCreateModal } from './quick-create-modal';

const meta = {
  title: 'Shared/Modals/QuickCreateModal',
  component: QuickCreateModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof QuickCreateModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const noopSubmit = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 400);
  });

function DefaultRender() {
  const [open, setOpen] = useState(true);
  return (
    <QuickCreateModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onSubmit={noopSubmit}
      title="Cadastro rápido de cliente"
      description="Informe apenas o nome — você poderá completar os dados depois."
      inputLabel="Nome do cliente"
      inputPlaceholder="Ex.: Maria Silva"
      submitButtonText="Cadastrar"
      icon={<UserPlus className="w-5 h-5 text-yellow-500" />}
    />
  );
}

function WithErrorRender() {
  const [open, setOpen] = useState(true);
  return (
    <QuickCreateModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onSubmit={async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        throw new Error('Já existe um cliente com este nome.');
      }}
      title="Cadastro rápido de cliente"
      description="Falha ao cadastrar — verifique se o nome já não está em uso."
    />
  );
}

function SubmittingRender() {
  const [open, setOpen] = useState(true);
  return (
    <QuickCreateModal
      isOpen={open}
      onClose={() => setOpen(false)}
      // Never resolves — keeps `isLoading=true` for visual inspection of the
      // disabled-button + "Criando..." copy.
      onSubmit={() => new Promise<void>(() => {})}
      title="Cadastro rápido de produto"
      description="Salvando..."
      inputLabel="Nome do produto"
      submitButtonText="Cadastrar"
    />
  );
}

// Default open state — single Nome input, focused via internal effect.
// Press Enter to submit (handled by handleKeyDown).
export const Default: Story = {
  render: () => <DefaultRender />,
};

// Error state — `onSubmit` rejects. The component logs and stays open with
// `isLoading=false` reset; user can retry without the input being cleared.
export const WithError: Story = {
  render: () => <WithErrorRender />,
};

// Loading state — `onSubmit` never resolves so the "Criando..." button copy
// and disabled inputs stay visible. Note: input remains empty because the
// component only resets `name` after the promise resolves successfully.
export const Submitting: Story = {
  render: () => <SubmittingRender />,
};
