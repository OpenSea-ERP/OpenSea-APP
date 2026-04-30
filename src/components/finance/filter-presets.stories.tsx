import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FilterPresets } from './filter-presets';

// ============================================================================
// Wrapper React component (rules-of-hooks)
// ============================================================================

function FilterPresetsHarness({
  pageKey,
  initialFilters,
  quickPresets,
}: {
  pageKey: string;
  initialFilters: Record<string, string | undefined>;
  quickPresets?: {
    label: string;
    filters: Record<string, string | undefined>;
  }[];
}) {
  const [activeFilters, setActiveFilters] =
    useState<Record<string, string | undefined>>(initialFilters);

  return (
    <div className="space-y-3">
      <FilterPresets
        pageKey={pageKey}
        currentFilters={activeFilters}
        onApply={setActiveFilters}
        quickPresets={quickPresets}
      />
      <div
        className="rounded-md border border-border bg-muted/30 p-3 text-xs font-mono"
        aria-label="Filtros ativos"
      >
        <div className="text-muted-foreground mb-1">Filtros ativos:</div>
        {Object.entries(activeFilters).filter(([, v]) => v && v !== 'ALL')
          .length === 0 ? (
          <div className="text-muted-foreground italic">nenhum</div>
        ) : (
          Object.entries(activeFilters)
            .filter(([, v]) => v && v !== 'ALL')
            .map(([k, v]) => (
              <div key={k}>
                {k}: <span className="font-semibold">{v}</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Quick presets típicos do módulo Contas a Pagar / Receber
// ============================================================================

const payableQuickPresets = [
  {
    label: 'Vencidos hoje',
    filters: { status: 'OVERDUE', dueDateTo: '2025-05-15' },
  },
  {
    label: 'Próximos 7 dias',
    filters: {
      status: 'PENDING',
      dueDateFrom: '2025-05-15',
      dueDateTo: '2025-05-22',
    },
  },
  {
    label: 'Em atraso 30+ dias',
    filters: { status: 'OVERDUE', overdueRange: '60+' },
  },
];

// ============================================================================
// Meta
// ============================================================================

const meta = {
  title: 'Modules/Finance/FilterPresets',
  component: FilterPresets,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Componente de filtros salvos para páginas financeiras — combina presets rápidos hardcoded (Vencidos hoje, Próximos 7 dias) com presets personalizados que o usuário salva via dialog. Persistência em `localStorage` por `pageKey`. Padrão inspirado em Linear/Notion para listas com filtros recorrentes.',
      },
    },
  },
} satisfies Meta<typeof FilterPresets>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Stories
// ============================================================================

export const Default: Story = {
  render: () => (
    <FilterPresetsHarness
      pageKey="storybook-filter-default"
      initialFilters={{ status: 'ALL' }}
      quickPresets={payableQuickPresets}
    />
  ),
};

export const WithActiveFilters: Story = {
  render: () => (
    <FilterPresetsHarness
      pageKey="storybook-filter-active"
      initialFilters={{
        status: 'OVERDUE',
        supplierName: 'Banco do Brasil',
      }}
      quickPresets={payableQuickPresets}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Quando há filtros ativos diferentes do default, o botão "Salvar Filtro" aparece para que o usuário possa nomear e armazenar a combinação.',
      },
    },
  },
};

export const NoQuickPresets: Story = {
  render: () => (
    <FilterPresetsHarness
      pageKey="storybook-filter-no-quick"
      initialFilters={{ status: 'ALL' }}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Sem `quickPresets` o componente expõe somente filtros salvos pelo usuário — variação usada em páginas onde não há atalhos óbvios pré-definidos.',
      },
    },
  },
};

export const ReceivableContext: Story = {
  render: () => (
    <FilterPresetsHarness
      pageKey="storybook-filter-receivable"
      initialFilters={{ status: 'ALL' }}
      quickPresets={[
        {
          label: 'A receber esta semana',
          filters: { status: 'PENDING', dueDateTo: '2025-05-22' },
        },
        {
          label: 'Inadimplentes',
          filters: { status: 'OVERDUE' },
        },
        {
          label: 'Recebidos este mês',
          filters: {
            status: 'RECEIVED',
            dueDateFrom: '2025-05-01',
            dueDateTo: '2025-05-31',
          },
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Conjunto de presets típico da página de Contas a Receber — atalhos para a semana, inadimplentes e recebidos do mês.',
      },
    },
  },
};
