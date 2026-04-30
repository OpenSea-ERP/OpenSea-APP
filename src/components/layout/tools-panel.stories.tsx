import type { Meta, StoryObj } from '@storybook/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  Calendar,
  ChevronRight,
  FileSignature,
  FolderOpen,
  KanbanSquare,
  Layout,
  Mail,
  Search,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToolsPanel } from './tools-panel';

/**
 * `ToolsPanel` é o painel modal full-screen acionado pelo ícone Grid3x3 da
 * navbar. Combina **Navegação** (menu hierárquico de módulos) e
 * **Ferramentas** (atalhos para apps: Email, Tarefas, Calendário, Storage,
 * Assinatura, IA) em duas abas.
 *
 * **Constraint de Storybook:** o componente real depende de múltiplos
 * providers — `useAuth`, `useTenant`, `usePermissions`, `useModules`,
 * `useEmailUnreadCount` (último também faz queries autenticadas). Sem o
 * stack inteiro, os hooks lançam erro.
 *
 * Para storiar os estados visuais sem montar 4 providers + MSW, usamos uma
 * réplica visual (`ToolsPanelPreview`) com o **mesmo markup** do componente
 * real (mesmas classes Tailwind, mesma `framer-motion`, mesmos
 * `Badge`/`Button`/`Input`). A réplica recebe:
 * - `tools` (`ToolPreview[]`) — lista filtrada por permissão
 * - `menuItems` (`MenuItemPreview[]`) — itens de navegação visíveis
 * - `tab` — aba inicial (`'navigation'` | `'tools'`)
 * - `viewport` (apenas Mobile story) — força layout estreito
 *
 * O componente real é exportado via `meta.component` para autodocs (props
 * documentadas), mas não é renderizado diretamente.
 */
const meta = {
  title: 'Layout/ToolsPanel',
  component: ToolsPanel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Painel modal full-screen com abas Navegação + Ferramentas. Componente real depende de auth + tenant + permissions + modules — Storybook usa réplica visual.',
      },
    },
  },
} satisfies Meta<typeof ToolsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

interface ToolPreview {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  disabled?: boolean;
}

interface MenuItemPreview {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  hasSubmenu?: boolean;
  variant?: 'primary' | 'alert' | 'new' | 'inactive';
}

interface PreviewProps {
  tools: ToolPreview[];
  menuItems: MenuItemPreview[];
  initialTab?: 'navigation' | 'tools';
}

const allTools: ToolPreview[] = [
  {
    id: 'file-manager',
    name: 'Gerenciador de Arquivos',
    description: 'Gerencie documentos e arquivos da empresa',
    icon: FolderOpen,
  },
  {
    id: 'calendar',
    name: 'Calendário',
    description: 'Eventos e compromissos',
    icon: Calendar,
  },
  {
    id: 'email',
    name: 'E-mail',
    description: 'Caixa de entrada e envio de e-mails',
    icon: Mail,
    badge: '12',
  },
  {
    id: 'tasks',
    name: 'Tarefas',
    description: 'Quadros de tarefas e gerenciamento de projetos',
    icon: KanbanSquare,
  },
  {
    id: 'signature',
    name: 'Assinatura Digital',
    description: 'Assinatura eletrônica e certificados digitais',
    icon: FileSignature,
  },
  {
    id: 'ai',
    name: 'Assistente IA',
    description: 'Assistente inteligente com IA para análise e automação',
    icon: Bot,
    badge: 'Beta',
  },
];

const defaultMenu: MenuItemPreview[] = [
  { id: 'stock', label: 'Estoque', icon: FolderOpen, hasSubmenu: true },
  { id: 'sales', label: 'Vendas', icon: KanbanSquare, hasSubmenu: true },
  { id: 'finance', label: 'Financeiro', icon: Calendar, hasSubmenu: true },
  { id: 'hr', label: 'Recursos Humanos', icon: Mail, badge: '3' },
  {
    id: 'production',
    label: 'Produção',
    icon: FileSignature,
    variant: 'inactive',
  },
];

function getVariantStyles(variant: MenuItemPreview['variant'] = 'primary') {
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

/**
 * Synthetic replica of `ToolsPanel` — same markup, no providers.
 * Always rendered open (`isOpen=true`) for story preview.
 */
function ToolsPanelPreview({
  tools,
  menuItems,
  initialTab = 'tools',
}: PreviewProps) {
  const [activeTab, setActiveTab] = useState<'navigation' | 'tools'>(
    initialTab
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = searchQuery
    ? tools.filter(
        tool =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tools;

  const filteredMenu = searchQuery
    ? menuItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : menuItems;

  const title = activeTab === 'tools' ? 'Ferramentas' : 'Aplicações';
  const placeholder =
    activeTab === 'tools' ? 'Buscar ferramentas...' : 'Buscar aplicações...';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 z-60"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-2 sm:inset-4 z-70 flex items-start justify-center pt-4 sm:pt-20"
      >
        <div className="w-full max-w-5xl bg-white/98 dark:bg-gray-900/98 border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-8 pb-4 sm:pb-6 border-b border-gray-200/50 dark:border-white/10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
              </div>

              {/* Tab Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('navigation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'navigation'
                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Layout className="w-4 h-4" />
                  Navegação
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tools')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === 'tools'
                      ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Ferramentas
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <label htmlFor="tools-panel-search" className="sr-only">
                {placeholder}
              </label>
              <Input
                id="tools-panel-search"
                placeholder={placeholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-12 h-11 sm:h-14 text-base sm:text-lg bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 rounded-2xl"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-3 sm:p-6 max-h-[60vh] overflow-y-auto">
            {activeTab === 'tools' ? (
              filteredTools.length === 0 ? (
                <EmptyResult query={searchQuery} kind="tools" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTools.map(tool => {
                    const Icon = tool.icon;
                    const isDisabled = tool.disabled;
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        disabled={isDisabled}
                        className={`group relative rounded-2xl border p-6 flex items-start gap-4 transition-all duration-200 text-left ${
                          isDisabled
                            ? 'bg-white/20 dark:bg-white/5 border-gray-200/30 dark:border-white/5 opacity-60 cursor-not-allowed'
                            : 'bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-xl cursor-pointer'
                        }`}
                      >
                        {tool.badge && (
                          <Badge
                            className={`absolute top-4 right-4 text-xs ${
                              isDisabled
                                ? 'bg-gray-400 dark:bg-gray-600 text-white dark:text-gray-300'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {tool.badge}
                          </Badge>
                        )}
                        <div
                          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                            isDisabled
                              ? 'bg-gray-400 dark:bg-gray-600'
                              : 'bg-linear-to-br from-blue-500 to-purple-600'
                          }`}
                        >
                          <Icon className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <span
                            className={`font-semibold text-base ${
                              isDisabled
                                ? 'text-gray-500 dark:text-gray-600'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {tool.name}
                          </span>
                          <span
                            className={`text-sm leading-relaxed ${
                              isDisabled
                                ? 'text-gray-400 dark:text-gray-600'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {tool.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : filteredMenu.length === 0 ? (
              <EmptyResult query={searchQuery} kind="menu" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {filteredMenu.map(item => {
                  const Icon = item.icon;
                  const variant = item.variant ?? 'primary';
                  const styles = getVariantStyles(variant);
                  const isDisabled = variant === 'inactive';
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={isDisabled}
                      className={`group relative aspect-square rounded-2xl border p-3 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-colors duration-150 ${styles.button}`}
                    >
                      {item.badge && (
                        <Badge
                          className={`absolute top-3 right-3 text-xs ${styles.badge}`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ${styles.icon}`}
                      >
                        <Icon className="w-8 h-8" />
                      </div>
                      <span
                        className={`font-semibold text-sm text-center leading-tight ${styles.label}`}
                      >
                        {item.label}
                      </span>
                      {item.hasSubmenu && !isDisabled && (
                        <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function EmptyResult({
  query,
  kind,
}: {
  query: string;
  kind: 'tools' | 'menu';
}) {
  const message =
    kind === 'tools'
      ? `Nenhuma ferramenta encontrada para "${query || ''}"`
      : `Nenhum resultado encontrado para "${query || ''}"`;
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 dark:text-white/60">{message}</p>
    </div>
  );
}

export const Default: Story = {
  name: 'Default (todas as 6 ferramentas)',
  render: () => <ToolsPanelPreview tools={allTools} menuItems={defaultMenu} />,
};

export const FilteredByPermission: Story = {
  name: 'FilteredByPermission (apenas Email + Tarefas)',
  render: () => (
    <ToolsPanelPreview
      tools={allTools.filter(t => t.id === 'email' || t.id === 'tasks')}
      menuItems={defaultMenu.filter(m => m.id === 'stock' || m.id === 'sales')}
    />
  ),
};

export const Empty: Story = {
  name: 'Empty (nenhuma ferramenta visível)',
  render: () => <ToolsPanelPreview tools={[]} menuItems={[]} />,
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <ToolsPanelPreview tools={allTools} menuItems={defaultMenu} />,
};
