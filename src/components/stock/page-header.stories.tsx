import type { Meta, StoryObj } from '@storybook/react';
import { Download, Filter, Plus, Printer } from 'lucide-react';
import { PageHeader } from './page-header';

/**
 * `PageHeader` (stock) — header padrão das páginas do módulo Estoque.
 *
 * **Atenção:** existe outro `PageHeader` em `components/shared/page-header.tsx`
 * com API e visual diferentes. Este aqui é específico do estoque, com:
 * - Botão "Voltar" via `useRouter` (mostrado por padrão)
 * - Botões de ação responsivos: ícone-only no mobile (`< sm`), ícone + texto no desktop
 * - Suporte a `badge` numérico nos botões e cores customizáveis
 */
const meta = {
  title: 'Modules/Stock/PageHeader',
  component: PageHeader,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Header de página do módulo Estoque com título, descrição opcional, botão de voltar e até N botões de ação. Renderização adapta layout entre mobile (icon-only) e desktop (icon + label).',
      },
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[200px] p-6">{children}</div>
);

const noop = () => {};

export const Default: Story = {
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Gerencie o catálogo completo de produtos da empresa"
      />
    ),
};

export const WithSinglePrimaryAction: Story = {
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos cadastrados"
        buttons={[
          {
            text: 'Novo Produto',
            icon: Plus,
            onClick: noop,
          },
        ]}
      />
    ),
};

export const WithMultipleActions: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Cenário típico: ações de filtro, exportação, impressão e botão primário lado a lado.',
      },
    },
  },
  render: () =>
    wrap(
      <PageHeader
        title="Variantes"
        description="Camiseta básica · 24 variantes ativas"
        buttons={[
          {
            text: 'Filtros',
            icon: Filter,
            variant: 'outline',
            onClick: noop,
            badge: 3,
          },
          {
            text: 'Exportar',
            icon: Download,
            variant: 'outline',
            onClick: noop,
          },
          {
            text: 'Imprimir Etiquetas',
            icon: Printer,
            variant: 'outline',
            onClick: noop,
          },
          {
            text: 'Nova Variante',
            icon: Plus,
            onClick: noop,
          },
        ]}
      />
    ),
};

export const WithLoadingButton: Story = {
  render: () =>
    wrap(
      <PageHeader
        title="Importar produtos"
        description="Aguarde o processamento da planilha enviada"
        buttons={[
          {
            text: 'Importando',
            icon: Download,
            onClick: noop,
            loading: true,
            disabled: true,
          },
        ]}
      />
    ),
};

export const NoBackButton: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Página raiz do módulo: `showBackButton={false}` esconde a seta de voltar.',
      },
    },
  },
  render: () =>
    wrap(
      <PageHeader
        title="Estoque"
        description="Visão geral do estoque"
        showBackButton={false}
        buttons={[
          {
            text: 'Novo Produto',
            icon: Plus,
            onClick: noop,
          },
        ]}
      />
    ),
};

export const Mobile: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story:
          'No viewport mobile (< sm) os botões aparecem como ícone-only com `aria-label` para acessibilidade. A descrição é ocultada nessa breakpoint.',
      },
    },
  },
  render: () =>
    wrap(
      <PageHeader
        title="Variantes"
        description="Esta descrição não aparece em mobile por design"
        buttons={[
          { text: 'Filtros', icon: Filter, variant: 'outline', onClick: noop },
          {
            text: 'Exportar',
            icon: Download,
            variant: 'outline',
            onClick: noop,
          },
          { text: 'Nova Variante', icon: Plus, onClick: noop },
        ]}
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Catálogo de produtos cadastrados"
        buttons={[
          {
            text: 'Novo Produto',
            icon: Plus,
            onClick: noop,
          },
        ]}
      />
    ),
};
