/**
 * Notifications Panel
 * Painel unificado de notificações com dados reais do backend
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAutoEmailSync,
  useDeleteNotification,
  useForceNotificationCheck,
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotificationsList,
} from '@/hooks/notifications';
import { usePermissions } from '@/hooks/use-permissions';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { BackendNotification } from '@/types/admin';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  DollarSign,
  Inbox,
  Loader2,
  Mail,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

// ── Icon + color mapping by entityType / notification type ─────────

interface NotificationVisual {
  icon: React.ElementType;
  gradient: string;
}

function resolveVisual(n: BackendNotification): NotificationVisual {
  // Module-specific by entityType
  switch (n.entityType) {
    case 'email_message':
      return { icon: Mail, gradient: 'from-blue-500 to-blue-600' };
    case 'email_account':
      return { icon: Inbox, gradient: 'from-blue-400 to-blue-500' };
    case 'CALENDAR_EVENT':
      return { icon: Calendar, gradient: 'from-emerald-500 to-emerald-600' };
    case 'calendar_invite':
      return { icon: Calendar, gradient: 'from-purple-500 to-purple-600' };
    case 'finance_entry':
      return { icon: DollarSign, gradient: 'from-yellow-500 to-yellow-600' };
    case 'sales_order':
      return { icon: ShoppingCart, gradient: 'from-green-500 to-green-600' };
    case 'stock_item':
      return { icon: Package, gradient: 'from-orange-500 to-orange-600' };
    case 'hr_employee':
      return { icon: Users, gradient: 'from-pink-500 to-pink-600' };
    default:
      break;
  }

  // Fallback by notification type
  switch (n.type) {
    case 'WARNING':
      return { icon: AlertTriangle, gradient: 'from-orange-500 to-orange-600' };
    case 'ERROR':
      return { icon: AlertTriangle, gradient: 'from-red-500 to-red-600' };
    case 'SUCCESS':
      return { icon: Check, gradient: 'from-green-500 to-green-600' };
    case 'REMINDER':
      return { icon: Calendar, gradient: 'from-purple-500 to-purple-600' };
    default:
      return { icon: Bell, gradient: 'from-slate-500 to-slate-600' };
  }
}

function formatTimeAgo(dateStr: string) {
  try {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();

    // Less than 1 minute → "Agora"
    if (diff < 60_000) return 'Agora';

    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: ptBR,
    })
      .replace('cerca de ', '')
      .replace(' minutos', ' min')
      .replace(' minuto', ' min')
      .replace(' horas', 'h')
      .replace(' hora', 'h')
      .replace(' dias', 'd')
      .replace(' dia', 'd')
      .replace(' meses', ' meses')
      .replace(' mês', ' mês')
      .replace('há ', '');
  } catch {
    return '';
  }
}

/** Resolve friendly title + subtitle based on entityType */
function resolveContent(n: BackendNotification): {
  title: string;
  subtitle: string;
} {
  switch (n.entityType) {
    case 'email_message':
      return { title: n.title, subtitle: n.message };
    case 'email_account':
      return { title: 'Conta de e-mail', subtitle: n.message };
    case 'CALENDAR_EVENT':
      return { title: 'Novo evento na agenda', subtitle: n.message };
    case 'calendar_invite':
      return { title: 'Convite de evento', subtitle: n.message };
    case 'finance_entry':
      return { title: 'Lançamento financeiro', subtitle: n.message };
    case 'sales_order':
      return { title: 'Pedido de venda', subtitle: n.message };
    case 'stock_item':
      return { title: 'Movimentação de estoque', subtitle: n.message };
    case 'hr_employee':
      return { title: 'Recursos Humanos', subtitle: n.message };
    default:
      return { title: n.title, subtitle: n.message };
  }
}

// ── Main component ─────────────────────────────────────────────────

type SyncStatus = 'idle' | 'syncing' | 'done';

export function NotificationsPanel() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  // Background auto-sync: triggers email sync every 60s
  // so new emails are detected without manual "Verificar"
  useAutoEmailSync();

  // Permission check: hide finance notifications from unauthorized users
  const { hasPermission } = usePermissions();
  const canAccessFinance = hasPermission(FINANCE_PERMISSIONS.ENTRIES.ACCESS);

  // Fetch notifications — polls every 30s
  const { data, isLoading } = useNotificationsList({
    limit: 30,
  });

  // Filter out module-specific notifications the user has no permission for
  const allNotifications = data?.notifications ?? [];
  const notifications = allNotifications.filter(n => {
    if (n.entityType === 'finance_entry' && !canAccessFinance) return false;
    return true;
  });
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mutations
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotif = useDeleteNotification();
  const forceCheck = useForceNotificationCheck();

  // Auto-reset sync status after 3s
  useEffect(() => {
    if (syncStatus !== 'done') return;
    const timer = setTimeout(() => setSyncStatus('idle'), 3000);
    return () => clearTimeout(timer);
  }, [syncStatus]);

  const handleForceCheck = useCallback(() => {
    if (syncStatus !== 'idle') return;
    setSyncStatus('syncing');
    forceCheck.mutate(undefined, {
      onSettled: () => setSyncStatus('done'),
    });
  }, [syncStatus, forceCheck]);

  function handleNotificationClick(n: BackendNotification) {
    // Mark as read on click
    if (!n.isRead) {
      markAsRead.mutate(n.id);
    }
    // Navigate if actionUrl is present
    if (n.actionUrl) {
      setIsOpen(false);
      router.push(n.actionUrl);
    }
  }

  return (
    <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative"
          aria-label="Notificações"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={22}
        className="w-96 bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-white/10 p-0"
      >
        {/* Row 1 — Title */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Notificações
          </h3>
        </div>

        {/* Row 2 — Count + Actions */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Badge
                variant="default"
                className="bg-rose-500 text-white text-xs"
              >
                {unreadCount} nova{unreadCount !== 1 && 's'}
              </Badge>
            ) : (
              <span className="text-xs text-gray-500 dark:text-white/40">
                {notifications.length} notificaç
                {notifications.length !== 1 ? 'ões' : 'ão'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Sync icon / badge state machine */}
            <AnimatePresence mode="wait">
              {syncStatus === 'idle' && (
                <motion.div
                  key="sync-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleForceCheck}
                        className="h-7 w-7 p-0"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Verificar notificações</TooltipContent>
                  </Tooltip>
                </motion.div>
              )}

              {syncStatus === 'syncing' && (
                <motion.div
                  key="sync-badge"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Badge className="h-7 px-2.5 text-xs gap-1.5 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sincronizando
                  </Badge>
                </motion.div>
              )}

              {syncStatus === 'done' && (
                <motion.div
                  key="sync-done"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Badge className="h-7 px-2.5 text-xs gap-1.5 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30">
                    <Check className="w-3.5 h-3.5" />
                    Atualizado
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mark all as read */}
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAllAsRead.mutate()}
                    disabled={markAllAsRead.isPending}
                    className="h-7 w-7 p-0"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Marcar todas como lidas</TooltipContent>
              </Tooltip>
            )}

            {/* Archive all (only when all read) */}
            {unreadCount === 0 && notifications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      notifications.forEach(n => deleteNotif.mutate(n.id));
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Archive className="w-3.5 h-3.5 text-gray-500 dark:text-white/50" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Arquivar todas</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="my-0" />

        {/* Notifications List */}
        <ScrollArea className="h-[380px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 dark:text-white/60">
                Carregando notificações...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Nenhuma notificação
              </p>
              <p className="text-xs text-gray-600 dark:text-white/60 text-center">
                Você está em dia! Não há notificações no momento.
              </p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const { icon: Icon, gradient } = resolveVisual(notification);
                  const { title, subtitle } = resolveContent(notification);
                  const isUnread = !notification.isRead;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <DropdownMenuItem
                        className={`p-2.5 mb-1 cursor-pointer rounded-lg transition-colors ${
                          isUnread
                            ? 'bg-blue-50 dark:bg-blue-500/10'
                            : 'hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                        onSelect={e => {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }}
                      >
                        <div className="flex gap-2.5 w-full min-w-0 overflow-hidden">
                          {/* Col 1 — Icon */}
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isUnread
                                ? `bg-linear-to-br ${gradient}`
                                : 'bg-gray-100 dark:bg-white/10'
                            }`}
                          >
                            <Icon
                              className={`w-4 h-4 ${
                                isUnread
                                  ? 'text-white'
                                  : 'text-gray-400 dark:text-white/40'
                              }`}
                            />
                          </div>

                          {/* Col 2 — Content (flexible, truncated) */}
                          <div className="flex-1 min-w-0 max-w-[calc(100%-3rem)] overflow-hidden">
                            <div className="flex items-baseline justify-between gap-2">
                              <h4
                                className={`text-sm truncate ${
                                  isUnread
                                    ? 'font-semibold text-gray-900 dark:text-white'
                                    : 'font-medium text-gray-600 dark:text-white/60'
                                }`}
                              >
                                {title}
                              </h4>
                              <span className="text-[10px] text-gray-400 dark:text-white/30 shrink-0 whitespace-nowrap">
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-xs text-gray-500 dark:text-white/40 truncate">
                                {subtitle}
                              </p>
                              <div
                                className="flex gap-0.5 shrink-0"
                                onClick={e => e.stopPropagation()}
                              >
                                {isUnread && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={e => {
                                          e.stopPropagation();
                                          markAsRead.mutate(notification.id);
                                        }}
                                        className="h-5 w-5 p-0"
                                      >
                                        <Check className="w-3 h-3 text-gray-400 dark:text-white/40" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Marcar como lida
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={e => {
                                        e.stopPropagation();
                                        deleteNotif.mutate(notification.id);
                                      }}
                                      className="h-5 w-5 p-0"
                                    >
                                      <X className="w-3 h-3 text-gray-400 dark:text-white/40" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Remover notificação
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>

        {/* Footer — always visible */}
        <DropdownMenuSeparator className="my-0" />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm font-medium"
            onClick={() => {
              setIsOpen(false);
              router.push('/notifications');
            }}
          >
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
