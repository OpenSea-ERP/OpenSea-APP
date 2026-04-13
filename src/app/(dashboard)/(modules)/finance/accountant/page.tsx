/**
 * Portal do Contador — Página de gerenciamento
 * Lista contadores convidados com ações de revogar e reenviar convite.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  Check,
  Clock,
  Copy,
  MoreVertical,
  Shield,
  ShieldOff,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { InviteAccountantModal } from '@/components/finance/invite-accountant-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useAccountantAccesses,
  useRevokeAccountant,
} from '@/hooks/finance/use-accountant';
import type { AccountantAccess } from '@/types/finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Nunca';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusInfo(access: AccountantAccess) {
  if (!access.isActive) {
    return {
      label: 'Revogado',
      variant: 'outline' as const,
      className:
        'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
      icon: ShieldOff,
    };
  }
  if (access.expiresAt && new Date(access.expiresAt) < new Date()) {
    return {
      label: 'Expirado',
      variant: 'outline' as const,
      className:
        'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
      icon: Clock,
    };
  }
  return {
    label: 'Ativo',
    variant: 'outline' as const,
    className:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    icon: Shield,
  };
}

// =============================================================================
// ACCOUNTANT CARD
// =============================================================================

function AccountantCard({
  access,
  onRevoke,
  onCopyLink,
}: {
  access: AccountantAccess;
  onRevoke: (access: AccountantAccess) => void;
  onCopyLink: (access: AccountantAccess) => void;
}) {
  const status = getStatusInfo(access);
  const StatusIcon = status.icon;

  return (
    <Card className={cn('transition-colors', !access.isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
              <Calculator className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{access.name}</h3>
                <Badge
                  variant={status.variant}
                  className={cn('shrink-0 text-xs', status.className)}
                >
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {status.label}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {access.email}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                {access.crc && <span>CRC: {access.crc}</span>}
                {access.cpfCnpj && <span>CPF/CNPJ: {access.cpfCnpj}</span>}
                <span>Último acesso: {formatDate(access.lastAccessAt)}</span>
                {access.expiresAt && (
                  <span>Expira em: {formatDate(access.expiresAt)}</span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopyLink(access)}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar Link de Acesso
              </DropdownMenuItem>
              {access.isActive && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600 dark:text-rose-400"
                    onClick={() => onRevoke(access)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revogar Acesso
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-80" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ onInvite }: { onInvite: () => void }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
            <Calculator className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-2">Portal do Contador</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
          Convide seu contador para ter acesso de leitura aos dados financeiros
          da empresa. Ele poderá visualizar lançamentos, categorias, relatórios
          DRE e exportar arquivos SPED — sem poder editar nada.
        </p>
        <Button onClick={onInvite}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Contador
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function AccountantPortalPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AccountantAccess | null>(
    null
  );

  const { data, isLoading, error, refetch } = useAccountantAccesses();
  const revokeMutation = useRevokeAccountant();

  const accesses = data?.accesses ?? [];

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await revokeMutation.mutateAsync(revokeTarget.id);
      toast.success('Acesso do contador revogado');
      refetch();
      setRevokeTarget(null);
    } catch {
      toast.error('Erro ao revogar acesso');
    }
  };

  const handleCopyLink = (access: AccountantAccess) => {
    const url = `${window.location.origin}/accountant/${access.accessToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado para a área de transferência');
  };

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Portal do Contador' },
        ]}
        hasPermission={hasPermission}
        buttons={[
          {
            id: 'invite',
            title: 'Convidar Contador',
            icon: UserPlus,
            variant: 'default',
            onClick: () => setInviteOpen(true),
          },
        ]}
      />

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-rose-600">
            Erro ao carregar acessos de contadores.
          </CardContent>
        </Card>
      ) : accesses.length === 0 ? (
        <EmptyState onInvite={() => setInviteOpen(true)} />
      ) : (
        <div className="space-y-3">
          {accesses.map(access => (
            <AccountantCard
              key={access.id}
              access={access}
              onRevoke={setRevokeTarget}
              onCopyLink={handleCopyLink}
            />
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <InviteAccountantModal
        open={inviteOpen}
        onOpenChange={open => {
          setInviteOpen(open);
          if (!open) refetch();
        }}
      />

      {/* Revoke PIN Confirmation */}
      <VerifyActionPinModal
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onSuccess={handleRevoke}
        title="Revogar Acesso do Contador"
        description={`Digite seu PIN de ação para revogar o acesso de ${revokeTarget?.name ?? 'este contador'}.`}
      />
    </div>
  );
}
