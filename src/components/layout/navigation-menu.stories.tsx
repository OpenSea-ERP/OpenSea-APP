import type { Meta, StoryObj } from '@storybook/react';
import {
  Boxes,
  ChevronRight,
  CreditCard,
  Crown,
  Search,
  ShoppingCart,
  Users,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { MenuItem } from '@/types/menu';
import { NavigationMenu } from './navigation-menu';

/**
 * `NavigationMenu` é o launcher estilo macOS aberto pelo botão de grade
 * da `Navbar`. Mostra os módulos do plano com filtragem por busca,
 * variantes coloridas (primary/alert/new/inactive) e suporte a submenus.
 *
 * **API gap (provider-dependente):** depende de `usePermissions`,
 * `useModules` e `useRouter` para filtrar os módulos do plano e navegar.
 * Sem `AuthProvider`/`TenantProvider` ele lança erro. As stories abaixo
 * renderizam um *wireframe* fiel do launcher (mesmo grid + variantes)
 * usando `MenuItem[]` reais para fins de catálogo.
 */
const meta = {
  title: 'Layout/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Launcher de aplicações estilo macOS. Stories renderizam wireframe — o componente real exige AuthProvider/TenantProvider para `usePermissions`/`useModules`. Props: `isOpen`, `onClose`, `menuItems: MenuItem[]`.',
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseMenuItems: MenuItem[] = [
  {
    id: 'stock',
    label: 'Estoque',
    icon: <Boxes className="w-8 h-8" />,
    href: '/stock',
    variant: 'primary',
  },
  {
    id: 'sales',
    label: 'Vendas',
    icon: <ShoppingCart className="w-8 h-8" />,
    href: '/sales',
    variant: 'primary',
    badge: '12',
  },
  {
    id: 'hr',
    label: 'RH',
    icon: <Users className="w-8 h-8" />,
    href: '/hr',
    variant: 'primary',
  },
  {
    id: 'finance',
    label: 'Financeiro',
    icon: <Wallet className="w-8 h-8" />,
    href: '/finance',
    variant: 'primary',
  },
  {
    id: 'admin',
    label: 'Admin',
    icon: <Crown className="w-8 h-8" />,
    href: '/admin',
    variant: 'alert',
    badge: 'Super',
  },
  {
    id: 'cashier',
    label: 'PDV',
    icon: <CreditCard className="w-8 h-8" />,
    href: '/cashier',
    variant: 'new',
    badge: 'Novo',
  },
];

interface MenuShellProps {
  items: MenuItem[];
  search?: string;
  showBack?: boolean;
  highlightId?: string;
  collapsed?: boolean;
}

function getVariantStyles(variant: MenuItem['variant'] = 'primary') {
  const styles = {
    primary: {
      button:
        'bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-xl cursor-pointer',
      icon: 'bg-linear-to-br from-blue-500 to-purple-600',
      label: 'text-gray-900 dark:text-white',
      badge: 'bg-blue-500 text-white',
    },
    alert: {
      button:
        'bg-white/50 dark:bg-white/5 border-red-200/50 dark:border-red-500/20 hover:bg-red-50/80 dark:hover:bg-red-500/10 hover:shadow-xl cursor-pointer',
      icon: 'bg-linear-to-br from-red-500 to-orange-600',
      label: 'text-gray-900 dark:text-white',
      badge: 'bg-red-500 text-white',
    },
    new: {
      button:
        'bg-white/50 dark:bg-white/5 border-green-200/50 dark:border-green-500/20 hover:bg-green-50/80 dark:hover:bg-green-500/10 hover:shadow-xl cursor-pointer',
      icon: 'bg-linear-to-br from-green-500 to-emerald-600',
      label: 'text-gray-900 dark:text-white',
      badge: 'bg-green-500 text-white',
    },
    inactive: {
      button:
        'bg-white/20 dark:bg-white/5 border-gray-200/30 dark:border-white/5 opacity-50 cursor-not-allowed',
      icon: 'bg-gray-400 dark:bg-gray-600 dark:text-gray-300',
      label: 'text-gray-500 dark:text-gray-600',
      badge: 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300',
    },
  };
  return styles[variant];
}

function MenuShell({
  items,
  search = '',
  showBack = false,
  highlightId,
  collapsed = false,
}: MenuShellProps) {
  const [query, setQuery] = useState(search);
  const filtered = query
    ? items.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  return (
    <nav
      aria-label="Menu de aplicações"
      className="relative w-full min-h-screen bg-black/50"
    >
      <div className="absolute inset-2 sm:inset-4 z-10 flex items-start justify-center pt-4 sm:pt-20">
        <div className="w-full max-w-5xl bg-white/98 dark:bg-gray-900/98 border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-4 sm:p-8 pb-4 sm:pb-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {showBack ? 'Menu' : 'Aplicações'}
                </h2>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar aplicações..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Buscar aplicações"
                className="pl-12 h-11 sm:h-14 text-base sm:text-lg bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 rounded-2xl"
              />
            </div>
          </div>
          <div className="p-3 sm:p-6 max-h-[60vh] overflow-y-auto">
            <div
              className={
                collapsed
                  ? 'grid grid-cols-1 gap-2'
                  : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'
              }
            >
              {filtered.map(item => {
                const variant = item.variant || 'primary';
                const styles = getVariantStyles(variant);
                const isDisabled = variant === 'inactive';
                const isHighlighted = highlightId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isDisabled}
                    aria-current={isHighlighted ? 'page' : undefined}
                    className={`group relative ${collapsed ? 'flex items-center gap-3 px-3 py-2' : 'aspect-square flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-6'} rounded-2xl border transition-colors duration-150 ${styles.button} ${isHighlighted ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    {item.badge && (
                      <Badge
                        className={`absolute top-3 right-3 text-xs ${styles.badge}`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                    <div
                      className={`${collapsed ? 'w-10 h-10' : 'w-12 h-12 sm:w-16 sm:h-16'} rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ${styles.icon}`}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={`font-semibold text-sm ${collapsed ? 'text-left' : 'text-center'} leading-tight ${styles.label}`}
                    >
                      {item.label}
                    </span>
                    {item.submenu && item.submenu.length > 0 && !isDisabled && (
                      <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export const Default: Story = {
  render: () => <MenuShell items={baseMenuItems} />,
};

export const WithActiveItem: Story = {
  render: () => <MenuShell items={baseMenuItems} highlightId="sales" />,
};

export const Collapsed: Story = {
  render: () => <MenuShell items={baseMenuItems} collapsed />,
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <MenuShell items={baseMenuItems} />,
};
