import type { Meta, StoryObj } from '@storybook/react';
import { AlertTriangle, Info, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from './confirm-dialog';

const meta = {
  title: 'Shared/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Diálogo de confirmação genérico (`components/shared/confirm-dialog.tsx`). Possui `DialogTitle` e `DialogDescription` para acessibilidade. Variants: `default` (azul), `destructive` (vermelho — ver gap A11y abaixo), `warning`, `success`. **Gap documentado:** o componente usa `bg-red-500` para destructive; o sistema de cores do app padroniza destrutivo em rose (CLAUDE.md §9.1). A correção é uma edição do componente (fora do escopo desta story).',
      },
    },
  },
} satisfies Meta<typeof ConfirmDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Hook usage extracted to a named PascalCase component (react-hooks/rules-of-hooks)
function ConfirmDialogPlayground(props: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  icon?: React.ReactNode;
  simulateLoading?: boolean;
}) {
  const {
    triggerLabel,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant,
    icon,
    simulateLoading,
  } = props;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = () => {
    if (simulateLoading) {
      setBusy(true);
      // Note: ConfirmDialog auto-closes on confirm. The "Loading" story keeps it
      // open by re-opening immediately to showcase a busy label state.
      setTimeout(() => {
        setBusy(false);
        setOpen(false);
      }, 1500);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>
      <ConfirmDialog
        open={open}
        onOpenChange={value => {
          if (busy) return;
          setOpen(value);
        }}
        title={title}
        description={description}
        confirmLabel={simulateLoading && busy ? 'Processando...' : confirmLabel}
        cancelLabel={cancelLabel}
        onConfirm={handleConfirm}
        variant={variant}
        icon={
          simulateLoading && busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            icon
          )
        }
      />
    </>
  );
}

export const Default: Story = {
  render: () => (
    <ConfirmDialogPlayground
      triggerLabel="Abrir confirmação"
      title="Confirmar ação"
      description="Deseja prosseguir com esta operação? Você poderá revisá-la depois."
      icon={<Info className="w-5 h-5" />}
    />
  ),
};

export const Destructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variante destrutiva. **Gap:** o componente usa `bg-red-500`; o padrão do app é rose (CLAUDE.md §9.1). Ajuste no componente recomendado.',
      },
    },
  },
  render: () => (
    <ConfirmDialogPlayground
      triggerLabel="Excluir item"
      title="Excluir produto"
      description="Esta ação removerá o produto permanentemente e não poderá ser desfeita."
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
      variant="destructive"
      icon={<Trash2 className="w-5 h-5" />}
    />
  ),
};

export const WithCustomLabels: Story = {
  render: () => (
    <ConfirmDialogPlayground
      triggerLabel="Publicar"
      title="Publicar relatório"
      description="O relatório ficará visível para todos os usuários do tenant."
      confirmLabel="Publicar agora"
      cancelLabel="Manter rascunho"
      variant="default"
      icon={<AlertTriangle className="w-5 h-5" />}
    />
  ),
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado de loading durante o confirm. **Gap de API:** o componente não expõe prop `isLoading` nem desabilita o botão de confirmação; aqui simulamos via label e ícone. Ideal seria adicionar `isLoading?: boolean` ao componente.',
      },
    },
  },
  render: () => (
    <ConfirmDialogPlayground
      triggerLabel="Salvar alterações"
      title="Salvando alterações"
      description="Aguarde enquanto processamos a sua solicitação."
      confirmLabel="Confirmar"
      variant="default"
      icon={<Info className="w-5 h-5" />}
      simulateLoading
    />
  ),
};
