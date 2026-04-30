import type { Meta, StoryObj } from '@storybook/react';
import {
  BarChart3,
  Boxes,
  DollarSign,
  Package,
  Plus,
  Upload,
  Users,
} from 'lucide-react';
import { PageHeroBanner } from './page-hero-banner';

/**
 * `PageHeroBanner` é o banner principal de páginas overview de módulo.
 * Renderiza título, descrição, ícone com gradiente e botões de ação com
 * gating RBAC via `hasPermission`.
 *
 * Cada botão (`HeroBannerButton`) traz seu próprio `gradient` (classes
 * Tailwind ex: `from-emerald-500 to-emerald-600`). Quando `onButtonClick` é
 * fornecido, navegação por `href` é suprimida e o callback é chamado.
 */
const meta = {
  title: 'Layout/PageHeroBanner',
  component: PageHeroBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Banner principal de overview de módulo. Aceita ícone + gradiente, botões com gradiente individual e gating RBAC via `hasPermission`. Quando `onButtonClick` é provido, suprime navegação `href` e dispara callback.',
      },
    },
  },
} satisfies Meta<typeof PageHeroBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-screen p-6">{children}</div>
);

const allowAll = () => true;

export const Default: Story = {
  render: () =>
    wrap(
      <PageHeroBanner
        title="Estoque"
        description="Gerencie produtos, movimentações, etiquetas e armazéns da sua operação."
        icon={Package}
        iconGradient="from-emerald-500 to-emerald-600"
        buttons={[
          {
            id: 'new-product',
            label: 'Novo produto',
            icon: Plus,
            href: '/stock/products/new',
            gradient: 'from-emerald-500 to-emerald-600',
          },
          {
            id: 'import',
            label: 'Importar',
            icon: Upload,
            href: '/stock/products/import',
            gradient: 'from-slate-500 to-slate-600',
          },
        ]}
        hasPermission={allowAll}
      />
    ),
};

export const WithGradient: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Variantes de gradiente — cada módulo tem sua paleta canônica: estoque (emerald), finanças (blue), RH (purple), vendas (orange).',
      },
    },
  },
  render: () => (
    <div className="bg-background min-h-screen p-6 space-y-6">
      <PageHeroBanner
        title="Financeiro"
        description="Contas a pagar, contas a receber, empréstimos e centros de custo."
        icon={DollarSign}
        iconGradient="from-blue-500 to-indigo-600"
        buttons={[
          {
            id: 'new-entry',
            label: 'Novo lançamento',
            icon: Plus,
            href: '/finance/entries/new',
            gradient: 'from-blue-500 to-indigo-600',
          },
        ]}
        hasPermission={allowAll}
      />
      <PageHeroBanner
        title="RH"
        description="Funcionários, departamentos, folha de pagamento e jornadas."
        icon={Users}
        iconGradient="from-purple-500 to-fuchsia-600"
        buttons={[
          {
            id: 'new-employee',
            label: 'Novo colaborador',
            icon: Plus,
            href: '/hr/employees/new',
            gradient: 'from-purple-500 to-fuchsia-600',
          },
        ]}
        hasPermission={allowAll}
      />
    </div>
  ),
};

export const WithCTA: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'CTAs múltiplos com permissões — botões só renderizam se `hasPermission(btn.permission)` retornar `true`. Aqui mockamos `() => true` para mostrar todos.',
      },
    },
  },
  render: () =>
    wrap(
      <PageHeroBanner
        title="Almoxarifado"
        description="Controle de itens, movimentações e relatórios de uso."
        icon={Boxes}
        iconGradient="from-amber-500 to-orange-600"
        buttons={[
          {
            id: 'new-item',
            label: 'Novo item',
            icon: Plus,
            href: '/stock/items/new',
            gradient: 'from-amber-500 to-orange-600',
            permission: 'stock.items.register',
          },
          {
            id: 'reports',
            label: 'Relatórios',
            icon: BarChart3,
            href: '/stock/items/reports',
            gradient: 'from-slate-500 to-slate-600',
            permission: 'stock.items.access',
          },
        ]}
        hasPermission={allowAll}
      />
    ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () =>
    wrap(
      <PageHeroBanner
        title="Estoque"
        description="Gerencie produtos, movimentações e armazéns."
        icon={Package}
        iconGradient="from-emerald-500 to-emerald-600"
        buttons={[
          {
            id: 'new-product',
            label: 'Novo produto',
            icon: Plus,
            href: '/stock/products/new',
            gradient: 'from-emerald-500 to-emerald-600',
          },
        ]}
        hasPermission={allowAll}
      />
    ),
};
