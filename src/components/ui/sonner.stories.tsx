import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Button } from './button';
import { Toaster } from './sonner';

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default toast — neutral slate background with title only.
export const Default: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={() => toast('Operação registrada')}>
        Disparar toast padrão
      </Button>
      <Toaster />
    </div>
  ),
};

// All four semantic variants the project styles in sonner.tsx (success /
// error / warning / info). Each button emits one variant.
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="default"
          onClick={() =>
            toast.success('Produto salvo', {
              description: 'As alterações foram aplicadas com sucesso.',
            })
          }
        >
          Sucesso
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            toast.error('Falha ao salvar', {
              description: 'Verifique os campos obrigatórios.',
            })
          }
        >
          Erro
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            toast.warning('Estoque baixo', {
              description: 'Restam 2 unidades em estoque.',
            })
          }
        >
          Aviso
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast.info('Sincronização agendada', {
              description: 'Os dados serão atualizados em 5 minutos.',
            })
          }
        >
          Informação
        </Button>
      </div>
      <Toaster />
    </div>
  ),
};

// Toast with an action button — typical for "Desfazer" affordances.
export const WithAction: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={() =>
          toast('Item movido para a lixeira', {
            description: 'Você pode reverter esta ação.',
            action: {
              label: 'Desfazer',
              onClick: () => toast.success('Ação desfeita'),
            },
          })
        }
      >
        Mover para a lixeira
      </Button>
      <Toaster />
    </div>
  ),
};

// `toast.promise(...)` shows a loading state while a promise is pending and
// transitions to success/error based on the resolved value.
export const Promise: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={() => {
          const job = new globalThis.Promise<{ name: string }>(
            (resolve, reject) => {
              setTimeout(() => {
                if (Math.random() > 0.3) resolve({ name: 'Relatório.pdf' });
                else reject(new Error('Timeout do servidor'));
              }, 1500);
            }
          );

          toast.promise(job, {
            loading: 'Processando relatório...',
            success: data => `${data.name} pronto para download`,
            error: err => `Falha: ${(err as Error).message}`,
          });
        }}
      >
        Gerar relatório
      </Button>
      <Toaster />
    </div>
  ),
};
