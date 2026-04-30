import type { Meta, StoryObj } from '@storybook/react';
import { Pencil, Sparkles, Trash2, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';
import { DialogHeader } from './dialog-header';

const meta = {
  title: 'Shared/Modals/DialogHeader',
  component: DialogHeader,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DialogHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// The component renders `absolute w-full` and includes a `<DialogTitle>` from
// radix-ui — both require a positioned ancestor and a `Dialog.Root` context.
// Wrap each story inside a real (forced-open) Dialog with a sized
// DialogContent so the absolute header has a frame to live in. We disable the
// Radix DialogContent close button via no extra props — the DialogHeader's
// own `onClose` is what we're showcasing.
function HeaderFrame({ children }: { children: React.ReactNode }) {
  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="relative h-64 w-[640px] max-w-none overflow-hidden p-0">
        <DialogDescription className="sr-only">
          Demonstração visual do DialogHeader compartilhado.
        </DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  );
}

// Default — title + description + Lucide icon, default variant (gradient
// slate background) and `align="between"`.
export const Default: Story = {
  render: () => (
    <HeaderFrame>
      <DialogHeader
        title="Editar colaborador"
        description="Atualize os dados pessoais e contratuais."
        icon={User}
      />
    </HeaderFrame>
  ),
};

// Without description — title only. Useful in compact dialogs.
export const WithoutDescription: Story = {
  render: () => (
    <HeaderFrame>
      <DialogHeader title="Confirmação rápida" icon={Sparkles} />
    </HeaderFrame>
  ),
};

// Variant `solid` (slate-900 background, white text) — the closest thing the
// component exposes to a "gradient" preset distinct from default. The
// `default` variant already uses a `bg-linear-to-br` gradient under the
// hood. We also override `iconBgClassName` to a brand gradient.
export const WithGradient: Story = {
  render: () => (
    <HeaderFrame>
      <DialogHeader
        title="Painel premium"
        description="Recursos exclusivos para o plano Enterprise."
        icon={Sparkles}
        variant="solid"
        iconBgClassName="bg-linear-to-br from-amber-500 to-rose-600 text-white"
      />
    </HeaderFrame>
  ),
};

// Without icon — only title + description. Tests the alignment when the
// icon slot is collapsed.
export const WithoutIcon: Story = {
  render: () => (
    <HeaderFrame>
      <DialogHeader
        title="Sem ícone"
        description="O slot de ícone fica oculto quando `icon` não é informado."
        variant="subtle"
      />
    </HeaderFrame>
  ),
};

// With close button + custom action buttons — exercises the actions array
// and the rightmost X button (with tooltip). The Radix DialogContent already
// renders its own close button in the corner; the one demoed here is the
// header's secondary one (with explicit aria-label for a11y).
export const WithCloseButton: Story = {
  render: () => (
    <HeaderFrame>
      <DialogHeader
        title="Editar produto"
        description="Pressione Esc ou clique em Fechar para sair."
        icon={Pencil}
        actions={[
          {
            id: 'delete',
            label: 'Excluir',
            icon: Trash2,
            variant: 'destructive',
            onClick: () => {
              // no-op in stories
            },
            tooltip: 'Excluir produto',
          },
        ]}
        onClose={() => {
          // no-op in stories
        }}
        closeTooltip="Fechar diálogo"
      />
    </HeaderFrame>
  ),
};
