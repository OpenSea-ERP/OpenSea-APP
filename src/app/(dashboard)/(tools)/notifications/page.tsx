'use client';

import {
  Bell,
  CheckCheck,
  Filter,
  Loader2,
  RefreshCw,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import { NotificationItem } from '@/features/notifications/components/renderers/notification-item';
import {
  useMarkAllReadV2,
  useNotificationsInfiniteV2,
} from '@/features/notifications/hooks/use-notifications-v2';

type ReadFilter = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const filters = useMemo(() => {
    const f: {
      limit: number;
      isRead?: boolean;
      kind?: string;
    } = { limit: 30 };
    if (readFilter === 'read') f.isRead = true;
    if (readFilter === 'unread') f.isRead = false;
    if (kindFilter !== 'all') f.kind = kindFilter;
    return f;
  }, [readFilter, kindFilter]);

  const {
    data,
    isLoading,
    refetch,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useNotificationsInfiniteV2(filters);
  const markAll = useMarkAllReadV2();

  const items = useMemo(
    () => data?.pages.flatMap(p => p.notifications) ?? [],
    [data]
  );
  const unread = data?.pages[0]?.totalUnread ?? 0;
  const total = data?.pages[0]?.total ?? 0;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[{ label: 'Notificações', href: '/notifications' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`}
              />
              Atualizar
            </Button>
            {unread > 0 && (
              <Button
                size="sm"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </Button>
            )}
            <Button asChild size="sm" variant="ghost" className="gap-2">
              <Link href="/profile?tab=notifications">
                <Settings className="w-4 h-4" />
                Preferências
              </Link>
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </div>

          <Select
            value={readFilter}
            onValueChange={v => setReadFilter(v as ReadFilter)}
          >
            <SelectTrigger className="w-40 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="unread">Não lidas</SelectItem>
              <SelectItem value="read">Lidas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={kindFilter} onValueChange={v => setKindFilter(v)}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="INFORMATIONAL">Informativa</SelectItem>
              <SelectItem value="LINK">Link</SelectItem>
              <SelectItem value="ACTIONABLE">Com ações</SelectItem>
              <SelectItem value="APPROVAL">Aprovação</SelectItem>
              <SelectItem value="FORM">Formulário</SelectItem>
              <SelectItem value="PROGRESS">Progresso</SelectItem>
              <SelectItem value="SYSTEM_BANNER">Banner do sistema</SelectItem>
              <SelectItem value="IMAGE_BANNER">Banner com imagem</SelectItem>
              <SelectItem value="REPORT">Relatório</SelectItem>
              <SelectItem value="EMAIL_PREVIEW">Preview de e-mail</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{items.length} listadas</Badge>
            {unread > 0 && (
              <Badge variant="destructive">{unread} não lidas</Badge>
            )}
            <span>· total: {total}</span>
          </div>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="p-4 rounded-full bg-muted/50">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Nenhuma notificação
              </p>
              <p className="text-sm text-muted-foreground">
                {readFilter === 'unread'
                  ? 'Você leu tudo. Volte mais tarde.'
                  : 'Você não recebeu notificações ainda.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(n => (
            <NotificationItem key={n.id} notification={n} />
          ))}
          {hasNextPage && (
            <div
              ref={sentinelRef}
              className="flex items-center justify-center py-4"
            >
              {isFetchingNextPage && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          )}
          {!hasNextPage && items.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground py-3">
              Você chegou ao fim.
            </p>
          )}
          {isFetching && !isFetchingNextPage && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
