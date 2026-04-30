import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageActionBar } from './page-action-bar';

/**
 * `PageActionBar` é a barra superior de páginas de detalhe/edit. Combina
 * breadcrumbs (à esquerda) com botões de ação (à direita). Suporta:
 * - `breadcrumbItems` — caminho de navegação
 * - `buttons` — array de `HeaderButton` (label, icon, onClick, variant)
 * - `actionButtons` — links com permissão (Next router)
 * - `hasPermission` — callback de RBAC (gate de visibilidade)
 * - `actions` / `children` — slots para conteúdo customizado
 *
 * **API surprise**: a prop `actions` é tipada como `any` no componente real
 * (eslint-disable inline). Mantemos a passagem como ReactNode aqui.
 */
const meta = {
  title: 'Layout/PageActionBar',
  component: PageActionBar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Barra de ação de páginas de detalhe/edit. Breadcrumbs à esquerda, botões à direita. Aceita `buttons` (HeaderButton[]), `actionButtons` (links com permissão), `actions`/`children` (slots customizados) e `hasPermission` para gating RBAC.',
      },
    },
  },
} satisfies Meta<typeof PageActionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[120px] p-6">{children}</div>
);

const breadcrumbs = [
  { label: 'Estoque', href: '/stock' },
  { label: 'Produtos', href: '/stock/products' },
  { label: 'Editar', href: '/stock/products/123/edit' },
];

const allowAll = () => true;

export const Default: Story = {
  render: () =>
    wrap(
      <PageActionBar
        breadcrumbItems={breadcrumbs}
        buttons={[
          {
            id: 'cancel',
            title: 'Cancelar',
            icon: X,
            variant: 'outline',
            onClick: () => {},
          },
          {
            id: 'save',
            title: 'Salvar',
            icon: Save,
            variant: 'default',
            onClick: () => {},
          },
        ]}
      />
    ),
};

export const WithChildren: Story = {
  render: () =>
    wrap(
      <PageActionBar breadcrumbItems={breadcrumbs}>
        <Button size="sm" variant="outline" aria-label="Importar planilha">
          <Upload className="size-4" /> Importar
        </Button>
        <Button size="sm" aria-label="Novo produto">
          <Plus className="size-4" /> Novo
        </Button>
      </PageActionBar>
    ),
};

export const WithDestructive: Story = {
  render: () =>
    wrap(
      <PageActionBar
        breadcrumbItems={breadcrumbs}
        buttons={[
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            variant: 'destructive',
            onClick: () => {},
          },
          {
            id: 'save',
            title: 'Salvar',
            icon: Save,
            variant: 'default',
            onClick: () => {},
          },
        ]}
      />
    ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () =>
    wrap(
      <PageActionBar
        breadcrumbItems={breadcrumbs}
        buttons={[
          {
            id: 'save',
            title: 'Salvar',
            icon: Save,
            variant: 'default',
            onClick: () => {},
          },
        ]}
      />
    ),
};

export const WithPermission: Story = {
  render: () =>
    wrap(
      <PageActionBar
        breadcrumbItems={breadcrumbs}
        actionButtons={[
          {
            id: 'new',
            label: 'Novo produto',
            icon: Plus,
            href: '/stock/products/new',
            variant: 'default',
            permission: 'stock.products.register',
          },
          {
            id: 'import',
            label: 'Importar',
            icon: Upload,
            href: '/stock/products/import',
            variant: 'outline',
            permission: 'stock.products.import',
          },
        ]}
        hasPermission={allowAll}
      />
    ),
};
