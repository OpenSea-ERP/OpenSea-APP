/**
 * Tools Panel Component
 * Painel unificado com abas de Navegação e Ferramentas
 * Substitui o NavigationMenu como overlay principal do Grid3x3
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ToolConfig } from '@/config/tools-config';
import { TOOLS } from '@/config/tools-config';
import { useEmailUnreadCount } from '@/hooks/email/use-email-unread-count';
import { usePermissions } from '@/hooks/use-permissions';
import type { MenuItem } from '@/types/menu';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Mapeamento de nomes de ícones Lucide para componentes
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FolderOpen,
  Calendar,
  Mail,
  KanbanSquare,
  FileSignature,
};

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

type TabId = 'navigation' | 'tools';

export function ToolsPanel({ isOpen, onClose, menuItems }: ToolsPanelProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  const [menuHistory, setMenuHistory] = useState<MenuItem[][]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('navigation');

  // ──────────── Permissões do menu ────────────

  const hasMenuPermission = (item: MenuItem): boolean => {
    if (isLoading) return true;
    if (!item.requiredPermission && !item.requiredPermissions) return true;
    if (item.requiredPermission) return hasPermission(item.requiredPermission);
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return hasAnyPermission(...item.requiredPermissions);
    }
    return true;
  };

  const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => {
        const canAccessItem = hasMenuPermission(item);
        if (item.submenu && item.submenu.length > 0) {
          const filteredSubmenu = item.submenu.filter(sub =>
            hasMenuPermission(sub)
          );
          return filteredSubmenu.length > 0;
        }
        return canAccessItem;
      })
      .map(item => ({
        ...item,
        submenu: item.submenu
          ? filterMenuByPermissions(item.submenu)
          : undefined,
      }));
  };

  // ──────────── Estado do menu de navegação ────────────

  const currentMenu =
    menuHistory.length > 0
      ? filterMenuByPermissions(menuHistory[menuHistory.length - 1])
      : filterMenuByPermissions(menuItems);

  const filteredMenu = searchQuery
    ? currentMenu.filter(
        item =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.submenu?.some(sub =>
            sub.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : currentMenu;

  // ──────────── Ferramentas filtradas por permissão ────────────

  const emailUnreadCount = useEmailUnreadCount();

  const visibleTools = TOOLS.filter(tool => {
    if (tool.requiredPermission) return hasPermission(tool.requiredPermission);
    return true;
  }).map(tool => {
    // Inject dynamic unread badge for email tool
    if (tool.id === 'email' && emailUnreadCount > 0) {
      return {
        ...tool,
        badge: emailUnreadCount > 99 ? '99+' : String(emailUnreadCount),
      };
    }
    return tool;
  });

  const filteredTools = searchQuery
    ? visibleTools.filter(
        tool =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : visibleTools;

  // ──────────── Handlers ────────────

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.variant === 'inactive') return;

    if (item.submenu && item.submenu.length > 0) {
      setMenuHistory([...menuHistory, item.submenu]);
      setSearchQuery('');
    } else if (item.href) {
      router.push(item.href);
      handleClose();
    }
  };

  const handleToolClick = (tool: ToolConfig) => {
    if (tool.disabled || !tool.href) return;
    router.push(tool.href);
    handleClose();
  };

  const handleBack = () => {
    setMenuHistory(menuHistory.slice(0, -1));
    setSearchQuery('');
  };

  const handleClose = () => {
    setMenuHistory([]);
    setSearchQuery('');
    onClose();
  };

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setMenuHistory([]);
    setSearchQuery('');
  };

  // ──────────── Rendering helpers ────────────

  const renderIcon = (icon: React.ReactNode) => {
    if (
      typeof icon === 'object' &&
      icon !== null &&
      'type' in icon &&
      typeof icon.type === 'function'
    ) {
      const IconComponent = icon.type as React.ComponentType<{
        className?: string;
      }>;
      return <IconComponent className="w-8 h-8" />;
    }
    return icon;
  };

  const getVariantStyles = (variant: MenuItem['variant'] = 'primary') => {
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
  };

  // ──────────── Título dinâmico ────────────

  const getTitle = () => {
    if (activeTab === 'tools') return 'Ferramentas';
    if (menuHistory.length > 0) return 'Menu';
    return 'Aplicações';
  };

  const getSearchPlaceholder = () => {
    if (activeTab === 'tools') return 'Buscar ferramentas...';
    return 'Buscar aplicações...';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-60"
            onClick={handleClose}
          />

          {/* Panel Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-4 z-70 flex items-start justify-center pt-20"
            onClick={handleClose}
          >
            <div
              className="w-full max-w-5xl bg-white/98 dark:bg-gray-900/98 border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Tabs and Search */}
              <div className="p-8 pb-6 border-b border-gray-200/50 dark:border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {menuHistory.length > 0 && activeTab === 'navigation' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBack}
                        className="rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
                        aria-label="Voltar"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {getTitle()}
                    </h2>
                  </div>

                  {/* Tab Switcher */}
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
                    <button
                      onClick={() => handleTabChange('navigation')}
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
                      onClick={() => handleTabChange('tools')}
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

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder={getSearchPlaceholder()}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-lg bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 rounded-2xl"
                  />
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {activeTab === 'navigation' ? (
                    <motion.div
                      key="navigation"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Navigation Grid (same as old NavigationMenu) */}
                      {filteredMenu.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-white/60">
                            Nenhum resultado encontrado para &quot;{searchQuery}
                            &quot;
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {filteredMenu.map(item => {
                            const variant = item.variant || 'primary';
                            const styles = getVariantStyles(variant);
                            const isDisabled = variant === 'inactive';

                            return (
                              <button
                                key={item.id}
                                onClick={() => handleMenuItemClick(item)}
                                disabled={isDisabled}
                                className={`group relative aspect-square rounded-2xl border p-6 flex flex-col items-center justify-center gap-3 transition-colors duration-150 ${styles.button}`}
                              >
                                {/* Badge */}
                                {item.badge && (
                                  <Badge
                                    className={`absolute top-3 right-3 text-xs ${styles.badge}`}
                                  >
                                    {item.badge}
                                  </Badge>
                                )}

                                {/* Icon */}
                                <div
                                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg ${styles.icon}`}
                                >
                                  {renderIcon(item.icon)}
                                </div>

                                {/* Label */}
                                <span
                                  className={`font-semibold text-sm text-center leading-tight ${styles.label}`}
                                >
                                  {item.label}
                                </span>

                                {/* Submenu Indicator */}
                                {item.submenu &&
                                  item.submenu.length > 0 &&
                                  !isDisabled && (
                                    <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-gray-400" />
                                  )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="tools"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.15 }}
                    >
                      {/* Tools Grid */}
                      {filteredTools.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-gray-600 dark:text-white/60">
                            Nenhuma ferramenta encontrada para &quot;
                            {searchQuery}&quot;
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredTools.map(tool => {
                            const IconComponent = ICON_MAP[tool.icon];
                            const isDisabled = tool.disabled;

                            return (
                              <button
                                key={tool.id}
                                onClick={() => handleToolClick(tool)}
                                disabled={isDisabled}
                                className={`group relative rounded-2xl border p-6 flex items-start gap-4 transition-all duration-200 text-left ${
                                  isDisabled
                                    ? 'bg-white/20 dark:bg-white/5 border-gray-200/30 dark:border-white/5 opacity-60 cursor-not-allowed'
                                    : 'bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/10 hover:shadow-xl cursor-pointer'
                                }`}
                              >
                                {/* Badge */}
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

                                {/* Icon */}
                                <div
                                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                                    isDisabled
                                      ? 'bg-gray-400 dark:bg-gray-600'
                                      : 'bg-linear-to-br from-blue-500 to-purple-600'
                                  }`}
                                >
                                  {IconComponent && (
                                    <IconComponent className="w-7 h-7" />
                                  )}
                                </div>

                                {/* Text */}
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
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
