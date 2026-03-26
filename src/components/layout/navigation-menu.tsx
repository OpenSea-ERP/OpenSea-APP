/**
 * Navigation Menu Component
 * Menu de navegação estilo macOS com pesquisa e submenu
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePermissions } from '@/hooks/use-permissions';
import type { MenuItem } from '@/types/menu';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

export function NavigationMenu({
  isOpen,
  onClose,
  menuItems,
}: NavigationMenuProps) {
  const router = useRouter();
  const { hasPermission, hasAnyPermission, isLoading } = usePermissions();
  const [menuHistory, setMenuHistory] = useState<MenuItem[][]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Função para verificar se o usuário tem permissão para ver o item
  const hasMenuPermission = (item: MenuItem): boolean => {
    // Durante carregamento, mostrar todos os itens (será filtrado depois)
    if (isLoading) {
      return true;
    }

    // Se não tem requisito de permissão, permite acesso
    if (!item.requiredPermission && !item.requiredPermissions) {
      return true;
    }

    // Verifica permissão única
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission);
    }

    // Verifica múltiplas permissões (OR - precisa de pelo menos uma)
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return hasAnyPermission(...item.requiredPermissions);
    }

    return true;
  };

  // Filtrar itens do menu baseado nas permissões
  const filterMenuByPermissions = (items: MenuItem[]): MenuItem[] => {
    return items
      .filter(item => {
        const canAccessItem = hasMenuPermission(item);
        // Se tem submenu, verificar se algum filho é acessível
        if (item.submenu && item.submenu.length > 0) {
          const filteredSubmenu = item.submenu.filter(sub =>
            hasMenuPermission(sub)
          );
          // Manter o item pai se tiver pelo menos um filho acessível
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

  const handleMenuItemClick = (item: MenuItem) => {
    // Não permitir clique em itens inativos
    if (item.variant === 'inactive') {
      return;
    }

    if (item.submenu && item.submenu.length > 0) {
      setMenuHistory([...menuHistory, item.submenu]);
      setSearchQuery('');
    } else if (item.href) {
      router.push(item.href);
      handleClose();
    }
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

          {/* Menu Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-2 sm:inset-4 z-70 flex items-start justify-center pt-4 sm:pt-20"
            onClick={handleClose}
          >
            <div
              className="w-full max-w-5xl bg-white/98 dark:bg-gray-900/98 border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header with Search */}
              <div className="p-4 sm:p-8 pb-4 sm:pb-6 border-b border-gray-200/50 dark:border-white/10">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-3">
                    {menuHistory.length > 0 && (
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                      {menuHistory.length > 0 ? 'Menu' : 'Aplicações'}
                    </h2>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Buscar aplicações..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-12 h-11 sm:h-14 text-base sm:text-lg bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10 rounded-2xl"
                  />
                </div>
              </div>

              {/* Menu Grid */}
              <div className="p-3 sm:p-6 max-h-[60vh] overflow-y-auto">
                {filteredMenu.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-white/60">
                      Nenhum resultado encontrado para &quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {filteredMenu.map((item, index) => {
                      const variant = item.variant || 'primary';
                      const styles = getVariantStyles(variant);
                      const isDisabled = variant === 'inactive';

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuItemClick(item)}
                          disabled={isDisabled}
                          className={`group relative aspect-square rounded-2xl border p-3 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 transition-colors duration-150 ${styles.button}`}
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
                            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg ${styles.icon}`}
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
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
