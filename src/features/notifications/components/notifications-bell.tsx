'use client';

/**
 * NotificationsBell — drop-in replacement for the legacy shared/notifications-panel.
 * Keeps the familiar trigger (bell icon + unread badge) but renders items
 * through the v2 NotificationItem (support for APPROVAL / FORM / PROGRESS
 * / ACTIONABLE types with inline actions).
 *
 * Mounted once in the navbar. Uses the existing notifications list endpoint
 * (same as the legacy panel). Socket invalidation is wired globally by
 * NotificationSocketListener in the dashboard layout.
 */

import { Bell, CheckCheck, Loader2, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  useMarkAllReadV2,
  useNotificationsListV2,
} from '../hooks/use-notifications-v2';
import { NotificationItem } from './renderers/notification-item';

export function NotificationsBell() {
  const router = useRouter();
  const { data, isLoading } = useNotificationsListV2({ limit: 30 });
  const markAllRead = useMarkAllReadV2();

  const items = data?.notifications ?? [];
  const unread = data?.totalUnread ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl relative"
          aria-label={
            unread > 0
              ? `Notificações: ${unread} não lida${unread > 1 ? 's' : ''}`
              : 'Notificações: nenhuma nova'
          }
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              role="status"
              aria-live="polite"
              aria-atomic="true"
              aria-label={`${unread} notificação${unread > 1 ? 'ões' : ''} não lida${unread > 1 ? 's' : ''}`}
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] rounded-full flex items-center justify-center"
            >
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 max-w-[96vw] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Notificações</span>
            {unread > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unread} nova{unread > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="h-7 text-[11px] gap-1"
                aria-label="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Marcar todas
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push('/profile?tab=notifications')}
              className="h-7 w-7 p-0"
              aria-label="Preferências"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[420px]">
          <div className="p-2 space-y-1.5">
            {isLoading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Carregando...
              </div>
            )}
            {!isLoading && items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação por enquanto.
                </p>
              </div>
            )}
            {!isLoading &&
              items.map(n => (
                <NotificationItem key={n.id} notification={n} compact />
              ))}
          </div>
        </ScrollArea>

        <div className="border-t p-2">
          <Link
            href="/notifications"
            className="block text-center text-xs text-muted-foreground hover:text-foreground py-1.5"
          >
            Ver todas
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
