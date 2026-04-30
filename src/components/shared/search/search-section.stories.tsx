import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SearchSection } from './search-section';

const meta = {
  title: 'Shared/Search/SearchSection',
  component: SearchSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Seção de busca + filtros colapsáveis. Recebe `searchPlaceholder`, callback `onSearch`, painel `filters` (ReactNode) e `activeFiltersCount`. **Gap documentado:** o componente não expõe slot para "count" de resultados nem para CTA primário (botão "Novo"). As stories `WithCount` e `WithCTA` usam wrappers externos para demonstrar o uso real em páginas.',
      },
    },
  },
} satisfies Meta<typeof SearchSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-background min-h-[280px] p-6">{children}</div>
);

export const Default: Story = {
  render: () => (
    <Wrap>
      <SearchSection searchPlaceholder="Buscar produtos..." />
    </Wrap>
  ),
};

export const WithFilters: Story = {
  render: () => (
    <Wrap>
      <SearchSection
        searchPlaceholder="Buscar produtos..."
        activeFiltersCount={2}
        filters={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium mb-2">Categoria</p>
              <div className="text-sm text-muted-foreground">
                Roupas, Acessórios
              </div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Status</p>
              <div className="text-sm text-muted-foreground">Ativo</div>
            </div>
            <div>
              <p className="text-xs font-medium mb-2">Faixa de preço</p>
              <div className="text-sm text-muted-foreground">R$ 0 — R$ 500</div>
            </div>
          </div>
        }
      />
    </Wrap>
  ),
};

export const WithCount: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap:** SearchSection não tem prop `count`. Wrapper externo exibe a contagem abaixo da busca.',
      },
    },
  },
  render: () => (
    <Wrap>
      <SearchSection searchPlaceholder="Buscar funcionários..." />
      <p className="-mt-4 text-sm text-muted-foreground">
        48 colaboradores encontrados
      </p>
    </Wrap>
  ),
};

export const WithCTA: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap:** SearchSection não compõe um CTA primário. Padrão do app: o botão "Novo" vive no `PageHeader` ou `PageActionBar`, não dentro do search. Wrapper externo demonstra a composição real.',
      },
    },
  },
  render: () => (
    <Wrap>
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <SearchSection searchPlaceholder="Buscar pedidos..." />
        </div>
        <Button className="h-12">
          <Plus className="w-4 h-4" /> Novo pedido
        </Button>
      </div>
    </Wrap>
  ),
};
