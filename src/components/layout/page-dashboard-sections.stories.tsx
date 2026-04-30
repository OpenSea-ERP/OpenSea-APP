import type { Meta, StoryObj } from '@storybook/react';
import {
  Boxes,
  CalendarClock,
  ClipboardList,
  Layers,
  Package,
  Tags,
  Truck,
  Warehouse,
} from 'lucide-react';
import {
  PageDashboardSections,
  type DashboardSection,
} from './page-dashboard-sections';

/**
 * `PageDashboardSections` é o componente reutilizável de seções de cards do
 * dashboard — usado nas home pages dos módulos (Estoque, Vendas, RH, etc).
 *
 * Renderiza cards agrupados por seção, com:
 * - filtragem por permissão (`card.permission`)
 * - badge de contagem (`countKey` + `counts`)
 * - skeleton enquanto `countsLoading` é `true`
 * - link via Next `<Link>` (`card.href`)
 *
 * Todas as props são puras (sem dependência de provider), então as stories
 * passam fixtures inline e simulam `hasPermission` via callback.
 */
const meta = {
  title: 'Layout/PageDashboardSections',
  component: PageDashboardSections,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Seções de cards do dashboard com filtragem por permissão, contadores e grid responsivo. Componente prop-driven (sem provider) — usado nas home pages dos módulos.',
      },
    },
  },
} satisfies Meta<typeof PageDashboardSections>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-screen p-6 space-y-8">{children}</div>
);

const sections: DashboardSection[] = [
  {
    title: 'Cadastros',
    cards: [
      {
        id: 'products',
        title: 'Produtos',
        description: 'Gerencie o catálogo de produtos',
        icon: Package,
        href: '/stock/products',
        gradient: 'from-blue-500 to-indigo-600',
        hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
        countKey: 'products',
      },
      {
        id: 'variants',
        title: 'Variantes',
        description: 'Cores, tamanhos e SKUs',
        icon: Layers,
        href: '/stock/variants',
        gradient: 'from-violet-500 to-purple-600',
        hoverBg: 'hover:bg-violet-50 dark:hover:bg-violet-500/10',
        countKey: 'variants',
      },
      {
        id: 'categories',
        title: 'Categorias',
        description: 'Organize produtos por categoria',
        icon: Tags,
        href: '/stock/categories',
        gradient: 'from-pink-500 to-rose-600',
        hoverBg: 'hover:bg-pink-50 dark:hover:bg-pink-500/10',
        countKey: 'categories',
      },
    ],
  },
  {
    title: 'Operações',
    cards: [
      {
        id: 'warehouses',
        title: 'Armazéns',
        description: 'Locais físicos de armazenamento',
        icon: Warehouse,
        href: '/stock/warehouses',
        gradient: 'from-emerald-500 to-teal-600',
        hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-500/10',
        countKey: 'warehouses',
      },
      {
        id: 'movements',
        title: 'Movimentações',
        description: 'Entradas, saídas e transferências',
        icon: Truck,
        href: '/stock/movements',
        gradient: 'from-amber-500 to-orange-600',
        hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
        countKey: 'movements',
        permission: 'stock.movements.access',
      },
      {
        id: 'counts',
        title: 'Contagens',
        description: 'Inventários e ajustes',
        icon: ClipboardList,
        href: '/stock/counts',
        gradient: 'from-slate-500 to-slate-600',
        hoverBg: 'hover:bg-slate-50 dark:hover:bg-slate-500/10',
        countKey: 'counts',
      },
    ],
  },
];

const fullCounts: Record<string, number | null> = {
  products: 1247,
  variants: 3581,
  categories: 42,
  warehouses: 6,
  movements: 8902,
  counts: 14,
};

const allowAll = () => true;
const denyMovements = (permission: string) =>
  permission !== 'stock.movements.access';

export const Default: Story = {
  render: () =>
    wrap(
      <PageDashboardSections
        sections={sections}
        counts={fullCounts}
        countsLoading={false}
        hasPermission={allowAll}
      />
    ),
};

export const WithStats: Story = {
  name: 'WithStats (extra section)',
  render: () => {
    const extended: DashboardSection[] = [
      ...sections,
      {
        title: 'Estatísticas',
        cards: [
          {
            id: 'low-stock',
            title: 'Estoque baixo',
            description: 'Itens próximos do mínimo',
            icon: Boxes,
            href: '/stock/low-stock',
            gradient: 'from-rose-500 to-red-600',
            hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-500/10',
            countKey: 'lowStock',
          },
          {
            id: 'expiring',
            title: 'Validade próxima',
            description: 'Produtos com validade nos próximos 30 dias',
            icon: CalendarClock,
            href: '/stock/expiring',
            gradient: 'from-amber-500 to-orange-600',
            hoverBg: 'hover:bg-amber-50 dark:hover:bg-amber-500/10',
            countKey: 'expiring',
          },
        ],
      },
    ];
    return wrap(
      <PageDashboardSections
        sections={extended}
        counts={{ ...fullCounts, lowStock: 23, expiring: 7 }}
        countsLoading={false}
        hasPermission={denyMovements}
      />
    );
  },
};

export const Empty: Story = {
  name: 'Empty (nenhuma permissão)',
  render: () =>
    wrap(
      <PageDashboardSections
        sections={sections.map(section => ({
          ...section,
          cards: section.cards.map(card => ({
            ...card,
            permission: 'never.granted.permission',
          })),
        }))}
        counts={{}}
        countsLoading={false}
        hasPermission={() => false}
      />
    ),
};

export const Loading: Story = {
  render: () =>
    wrap(
      <PageDashboardSections
        sections={sections}
        counts={{}}
        countsLoading
        hasPermission={allowAll}
      />
    ),
};
