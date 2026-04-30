import type { Meta, StoryObj } from '@storybook/react';
import {
  Building2,
  ChevronDown,
  LogOut,
  Maximize,
  Monitor,
  MonitorIcon,
  Moon,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { UserDropdown } from './user-dropdown';

/**
 * `UserDropdown` é o avatar + dropdown de ações do usuário no canto
 * superior direito da `Navbar`. Inclui perfil, configurações, troca
 * de tema, layout ultrawide, fullscreen e logout — além do indicador
 * de terminal POS quando o dispositivo está pareado.
 *
 * **API gap (provider-dependente):** depende de `useAuth`,
 * `useDeviceTerminal`, `useFullscreen`, `useUltrawide`, `next-themes`
 * e `useRouter`. Sem `AuthProvider` ele lança erro. As stories abaixo
 * renderizam um *wireframe* fiel da chrome (avatar + popover) para
 * fins de catálogo.
 */
const meta = {
  title: 'Layout/UserDropdown',
  component: UserDropdown,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Dropdown do usuário (avatar + ações). Stories renderizam wireframe — o componente real exige AuthProvider/QueryClient/next-themes para hidratar `useAuth`, terminais POS, tema e layout. Sem props.',
      },
    },
  },
} satisfies Meta<typeof UserDropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

interface UserShellProps {
  name?: string;
  email?: string;
  initials?: string;
  showTerminal?: boolean;
  terminalOpen?: boolean;
  showTenants?: boolean;
  loggingOut?: boolean;
  loaded?: boolean;
  open?: boolean;
}

function UserDropdownShell({
  name = 'Maria Silva',
  email = 'maria@empresa.com',
  initials = 'MS',
  showTerminal = false,
  terminalOpen = false,
  showTenants = false,
  loggingOut = false,
  loaded = true,
  open = true,
}: UserShellProps) {
  return (
    <div className="relative inline-flex flex-col items-end gap-2">
      <Button
        variant="ghost"
        className="rounded-xl h-10 px-2 gap-2"
        aria-label="Menu do usuário"
      >
        <span
          aria-hidden
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 ${loaded ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700 animate-pulse'}`}
        >
          {loaded ? initials : ''}
        </span>
      </Button>

      {open && (
        <div
          role="menu"
          aria-label={`Ações do usuário ${name}`}
          className="w-64 bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-white/10 rounded-md shadow-lg p-2"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {loaded ? name : 'Carregando...'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {loaded ? email : '—'}
            </p>
          </div>

          {showTerminal && (
            <>
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <div className="px-3 py-3 rounded-lg flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${terminalOpen ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-zinc-100 dark:bg-zinc-800'}`}
                >
                  <Monitor
                    className={`h-4 w-4 ${terminalOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Caixa 01</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    PDV-001
                  </p>
                </div>
                <Badge
                  className={`border-0 text-xs ${terminalOpen ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}
                >
                  {terminalOpen ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            </>
          )}

          {showTenants && (
            <>
              <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Empresas
              </div>
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium flex-1 text-left">
                  Empresa Demo
                </span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                  Atual
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="w-full px-3 py-2 flex items-center gap-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Building2 className="w-5 h-5 opacity-50" />
                <span className="text-sm font-medium flex-1 text-left">
                  Filial Norte
                </span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </>
          )}

          <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <Users className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Perfil</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <Settings className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">Configurações</span>
          </button>

          <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <Moon className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium flex-1 text-left">
              Modo Escuro
            </span>
            <Kbd>F9</Kbd>
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <MonitorIcon className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium flex-1 text-left">
              Layout Ultrawide
            </span>
            <Kbd>F10</Kbd>
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <Maximize className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium flex-1 text-left">
              Tela Cheia
            </span>
            <Kbd>F11</Kbd>
          </button>

          <div className="my-2 h-px bg-gray-200 dark:bg-white/10" />

          <button
            type="button"
            role="menuitem"
            disabled={loggingOut}
            aria-busy={loggingOut}
            className="w-full px-3 py-3 flex items-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 disabled:opacity-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium">
              {loggingOut ? 'Saindo...' : 'Sair'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export const Default: Story = {
  render: () => <UserDropdownShell />,
};

export const WithTenants: Story = {
  render: () => <UserDropdownShell showTenants showTerminal terminalOpen />,
};

export const Logout: Story = {
  render: () => <UserDropdownShell loggingOut />,
};

export const NotLoaded: Story = {
  render: () => <UserDropdownShell loaded={false} />,
};
