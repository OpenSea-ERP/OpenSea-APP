'use client';

/**
 * /hr/punch/health — PunchDevice health (Phase 7 / Plan 07-06 / Task 3).
 *
 * Lists every PunchDevice with ONLINE/OFFLINE badge. Status updates
 * realtime via Socket.IO (`tenant.hr.devices.status-change`) — handled
 * inside `usePunchDevicesHealth()`.
 *
 * Permission-gated: requires `hr.punch-approvals.admin` OR
 * `hr.punch-devices.access` (per nav-map / Plan 07-03).
 */

import { Suspense } from 'react';
import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { usePunchDevicesHealth } from '@/hooks/hr/use-punch-devices-health';
import type { PunchDeviceHealthItem } from '@/services/hr/punch-dashboard.service';
import { Cpu, MapPin, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

function timeSince(iso: string | null): string {
  if (!iso) return 'Sem comunicação';
  try {
    const last = new Date(iso).getTime();
    const diffMs = Date.now() - last;
    if (diffMs < 60_000) return 'agora';
    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) return `há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
  } catch {
    return 'há tempo';
  }
}

function DeviceRow({ device }: { device: PunchDeviceHealthItem }) {
  const isOnline = device.status === 'ONLINE';
  return (
    <li
      data-testid={`punch-health-row-${device.id}`}
      className="flex items-start justify-between gap-3 rounded-md border bg-card p-3 text-sm"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <Cpu className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <div className="truncate font-medium">{device.name}</div>
          {device.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{device.location}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Badge
          data-testid={`punch-health-status-${device.id}`}
          variant="outline"
          className={cn(
            'gap-1',
            isOnline
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
          )}
        >
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          {device.status}
        </Badge>
        <span className="font-mono text-xs text-muted-foreground">
          {timeSince(device.lastSeenAt)}
        </span>
      </div>
    </li>
  );
}

function Content() {
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError, error, refetch } = usePunchDevicesHealth();

  const canAccess =
    hasPermission('hr.punch-approvals.admin') ||
    hasPermission('hr.punch-devices.access') ||
    hasPermission('hr.punch-devices.admin');

  if (!canAccess) return null;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Ponto', href: '/hr/punch/dashboard' },
            { label: 'Saúde de Dispositivos', href: '/hr/punch/health' },
          ]}
        />
        <Header
          title="Saúde dos dispositivos"
          description="Status online/offline atualizado em tempo real"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="punch-health-page" className="space-y-3">
          {isError ? (
            <GridError
              type="server"
              message={error?.message ?? 'Falha ao carregar dispositivos'}
              action={{
                label: 'Tentar novamente',
                onClick: () => {
                  void refetch();
                },
              }}
            />
          ) : isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !data || data.devices.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 p-8 text-center">
              <Cpu className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                Nenhum dispositivo cadastrado.
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs">
                <Badge
                  variant="outline"
                  className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                >
                  <Wifi className="h-3 w-3" />
                  <span data-testid="punch-health-online-count">
                    {data.online}
                  </span>{' '}
                  online
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    data.offline > 0
                      ? 'gap-1 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                      : 'gap-1 text-muted-foreground'
                  }
                >
                  <WifiOff className="h-3 w-3" />
                  <span data-testid="punch-health-offline-count">
                    {data.offline}
                  </span>{' '}
                  offline
                </Badge>
              </div>
              <ul className="space-y-2">
                {data.devices.map(device => (
                  <DeviceRow key={device.id} device={device} />
                ))}
              </ul>
            </>
          )}
        </div>
      </PageBody>
    </PageLayout>
  );
}

export default function PunchHealthPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-2" />}
    >
      <Content />
    </Suspense>
  );
}
