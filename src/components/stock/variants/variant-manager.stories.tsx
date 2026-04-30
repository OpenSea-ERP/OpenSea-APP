import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Variant } from '@/types/stock';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { VariantList } from './variant-list';
import { VariantManager } from './variant-manager';

/**
 * `VariantManager` é o orquestrador completo de variantes em página de
 * detalhe de produto: alterna entre lista, criação e edição.
 *
 * **Constraint de Storybook:** o componente real depende de:
 * - `useProductVariants(productId)` — fetch das variantes
 * - `useQuery(['products', id])` + `useQuery(['templates', id])` — produto e template
 * - `useCreateVariant` / `useUpdateVariant` / `useDeleteVariant` — mutações
 * - `confirm()` nativo do navegador para delete (TODO: migrar para `VerifyActionPinModal`)
 *
 * Sem QueryClient pré-populado, o componente fica em loading state ou exibe
 * empty list. Por isso storiamos uma **réplica visual** do shell (header
 * sticky + alerta de erro + VariantList) — o flow de form (create/edit) é
 * coberto pelas stories próprias de `VariantList` e `VariantForm`.
 *
 * **API gap notado:** o componente não expõe props para mockar dados.
 * Refactor sugerido: extrair "VariantManagerView" (presentational) que
 * recebe `variants`, `isLoading`, `deleteError`, callbacks. Aí storiamos
 * sem replica.
 */
const meta = {
  title: 'Modules/Stock/VariantManager',
  component: VariantManager,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Orquestrador de variantes (lista ↔ form). Storybook usa réplica visual do shell — ver descrição da story para detalhes do gap de API.',
      },
    },
  },
} satisfies Meta<typeof VariantManager>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[500px] p-6">{children}</div>
);

interface ShellProps {
  variants: Variant[];
  isLoading?: boolean;
  deleteError?: string;
}

/** Réplica visual do view-mode 'list' do VariantManager. */
function VariantManagerShell({
  variants,
  isLoading = false,
  deleteError,
}: ShellProps) {
  const [error, setError] = useState(deleteError);

  if (isLoading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando variantes...
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 py-4 z-10 border-b border-gray-200 dark:border-slate-700 -mx-6 px-6 pb-8">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Variantes ({variants.length})
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie todas as variantes do produto
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Variante
        </Button>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Erro ao excluir variante
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {error}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(undefined)}
            aria-label="Fechar alerta"
          >
            ✕
          </Button>
        </div>
      )}

      <VariantList
        variants={variants}
        onEdit={() => {}}
        onDelete={() => {}}
        onAdd={() => {}}
      />
    </div>
  );
}

const sampleVariants: Variant[] = [
  {
    id: 'v-1',
    productId: 'p-1',
    name: 'Camiseta básica - Preto - P',
    reference: 'CAM-PT-P',
    price: 89.9,
    costPrice: 32.5,
    profitMargin: 63.85,
    attributes: {},
    colorHex: '#0f172a',
    outOfLine: false,
    isActive: true,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'v-2',
    productId: 'p-1',
    name: 'Camiseta básica - Branco - M',
    reference: 'CAM-BR-M',
    price: 89.9,
    costPrice: 32.5,
    profitMargin: 63.85,
    attributes: {},
    colorHex: '#f8fafc',
    minStock: 10,
    maxStock: 100,
    reorderPoint: 15,
    outOfLine: false,
    isActive: true,
    createdAt: '2026-04-01T10:05:00Z',
  },
  {
    id: 'v-3',
    productId: 'p-1',
    name: 'Camiseta básica - Vermelho - G',
    reference: 'CAM-VM-G',
    price: 99.9,
    attributes: {},
    colorHex: '#dc2626',
    outOfLine: true,
    isActive: true,
    createdAt: '2026-04-01T10:10:00Z',
  },
];

export const Default: Story = {
  name: 'Default (3 variantes)',
  render: () => wrap(<VariantManagerShell variants={sampleVariants} />),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Produto novo, sem variantes — header continua visível e VariantList mostra empty CTA.',
      },
    },
  },
  render: () => wrap(<VariantManagerShell variants={[]} />),
};

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Loading inicial enquanto `useProductVariants` resolve: card centralizado com spinner azul.',
      },
    },
  },
  render: () => wrap(<VariantManagerShell variants={[]} isLoading />),
};

export const WithDeleteError: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Erro de exclusão exibido em alert vermelho dismissível acima da lista.',
      },
    },
  },
  render: () =>
    wrap(
      <VariantManagerShell
        variants={sampleVariants}
        deleteError="Esta variante possui itens em estoque vinculados e não pode ser excluída."
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => wrap(<VariantManagerShell variants={sampleVariants} />),
};
