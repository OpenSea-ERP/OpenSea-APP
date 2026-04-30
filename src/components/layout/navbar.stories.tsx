import type { Meta, StoryObj } from '@storybook/react';
import {
  Bell,
  Crown,
  Grid3x3,
  LayoutDashboard,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navbar } from './navbar';

/**
 * `Navbar` é a barra de navegação flutuante principal do dashboard.
 * Renderiza logo + ações à direita (Central super admin, fila de
 * impressão, carrinho, notificações, abertura de menu, dropdown do
 * usuário).
 *
 * **API gap (provider-dependente):** o componente real depende de
 * `useAuth`, `useUltrawide`, `useDeviceTerminal` e do `NotificationsBell`
 * (que faz fetch). Sem `AuthProvider`/`TenantProvider` ele lança erro.
 * As stories abaixo renderizam um *wireframe* fiel da chrome para fins
 * de catálogo. Para um Default funcional é preciso decorator com mock
 * de `AuthContext` (não disponível no padrão atual de stories).
 */
const meta = {
  title: 'Layout/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Barra de navegação flutuante do dashboard. Stories renderizam wireframe da chrome — o componente real exige AuthProvider/TenantProvider/QueryClient com dados reais. Prop única: `onMenuOpen: () => void`.',
      },
    },
  },
} satisfies Meta<typeof Navbar>;

export default meta;
type Story = StoryObj<typeof meta>;

interface NavbarShellProps {
  isSuperAdmin?: boolean;
  notificationCount?: number;
  cartCount?: number;
  isLoading?: boolean;
  isUltrawide?: boolean;
}

function NavbarShell({
  isSuperAdmin = false,
  notificationCount = 0,
  cartCount = 0,
  isLoading = false,
  isUltrawide = false,
}: NavbarShellProps) {
  return (
    <nav
      aria-label="Barra de navegação principal"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] transition-[max-width] duration-[1000ms] ease-linear ${isUltrawide ? 'max-w-[3840px]' : 'max-w-[1600px]'}`}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg px-3 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:inline">
              OpenSea
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl gap-2 text-amber-600 dark:text-amber-400"
                aria-label="Acessar Central de super admin"
              >
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Central</span>
              </Button>
            )}

            {cartCount > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-xl"
                aria-label={`Carrinho com ${cartCount} itens`}
              >
                <ShoppingCart className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {cartCount}
                </Badge>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
              aria-label={
                isLoading
                  ? 'Carregando notificações'
                  : `Notificações (${notificationCount})`
              }
            >
              <Bell className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
              {notificationCount > 0 && !isLoading && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs bg-red-500">
                  {notificationCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Abrir menu de navegação"
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              className="rounded-xl h-10 px-2 gap-2"
              aria-label="Menu do usuário"
            >
              <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900">
                MS
              </span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[200px]">{children}</div>
);

export const Default: Story = {
  render: () => wrap(<NavbarShell />),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => wrap(<NavbarShell />),
};

export const WithNotifications: Story = {
  render: () =>
    wrap(<NavbarShell notificationCount={5} cartCount={3} isSuperAdmin />),
};

export const Loading: Story = {
  render: () => wrap(<NavbarShell isLoading />),
};
