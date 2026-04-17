/**
 * Overdue Escalation Configuration Page
 * Lista de réguas de cobrança com cards e ações contextuais.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  Check,
  Copy,
  Mail,
  MessageCircle,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { usePermissions } from '@/hooks/use-permissions';
import {
  useEscalations,
  useDeleteEscalation,
  useDuplicateEscalation,
  useToggleEscalationActive,
} from '@/hooks/finance/use-escalations';
import { EscalationConfigModal } from '@/components/finance/escalation-config-modal';
import type { EscalationChannel, EscalationConfig } from '@/types/finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// HELPERS
// ============================================================================

const CHANNEL_ICONS: Record<EscalationChannel, React.ElementType> = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  INTERNAL_NOTE: Bell,
  SYSTEM_ALERT: AlertTriangle,
};

function getUniqueChannels(config: EscalationConfig): EscalationChannel[] {
  const channels = new Set<EscalationChannel>();
  for (const step of config.steps) {
    channels.add(step.channel);
  }
  return Array.from(channels);
}

// ============================================================================
// ESCALATION CARD
// ============================================================================

function EscalationCard({
  config,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
}: {
  config: EscalationConfig;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const channels = getUniqueChannels(config);

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-sm truncate">{config.name}</h3>
              {config.isDefault && (
                <Badge
                  variant="outline"
                  className="text-xs bg-violet-50 text-violet-700 border-violet-600/25 dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-500/20"
                >
                  Padrão
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  config.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-600/25 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-500/20'
                    : 'bg-slate-50 text-slate-500 border-slate-600/25 dark:bg-slate-500/8 dark:text-slate-400 dark:border-slate-500/20'
                )}
              >
                {config.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                {config.steps.length}{' '}
                {config.steps.length === 1 ? 'etapa' : 'etapas'}
              </span>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5">
                {channels.map(ch => {
                  const Icon = CHANNEL_ICONS[ch];
                  return (
                    <Icon
                      key={ch}
                      className="h-3.5 w-3.5 text-muted-foreground"
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Context Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {config.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function EscalationLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function EscalationsPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useEscalations();
  const deleteMutation = useDeleteEscalation();
  const duplicateMutation = useDuplicateEscalation();
  const toggleActiveMutation = useToggleEscalationActive();

  const escalations = useMemo(() => data?.escalations ?? [], [data]);

  const invalidateEscalations = () => {
    queryClient.invalidateQueries({ queryKey: ['escalations'] });
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateMutation.mutateAsync(id);
      toast.success('Régua de cobrança duplicada com sucesso!');
      invalidateEscalations();
    } catch {
      toast.error('Erro ao duplicar régua de cobrança.');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActiveMutation.mutateAsync(id);
      toast.success('Status da régua de cobrança atualizado!');
      invalidateEscalations();
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Régua de cobrança excluída com sucesso!');
      invalidateEscalations();
      setDeleteId(null);
    } catch {
      toast.error('Erro ao excluir régua de cobrança.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Régua de Cobrança' },
        ]}
        hasPermission={hasPermission}
        buttons={[
          {
            id: 'new',
            title: 'Nova Régua',
            icon: Plus,
            variant: 'default',
            onClick: () => setCreateOpen(true),
          },
        ]}
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/finance')}
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Régua de Cobrança</h1>
            <p className="text-sm text-muted-foreground">
              Configure etapas automáticas de cobrança para lançamentos vencidos
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <EscalationLoadingSkeleton />
      ) : escalations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              Nenhuma régua de cobrança configurada.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Régua
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {escalations.map(config => (
            <EscalationCard
              key={config.id}
              config={config}
              onEdit={() => setEditId(config.id)}
              onDuplicate={() => handleDuplicate(config.id)}
              onToggleActive={() => handleToggleActive(config.id)}
              onDelete={() => setDeleteId(config.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <EscalationConfigModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          invalidateEscalations();
          setCreateOpen(false);
        }}
      />

      {/* Edit Modal */}
      {editId && (
        <EscalationConfigModal
          open={!!editId}
          onOpenChange={open => !open && setEditId(null)}
          escalationId={editId}
          onSaved={() => {
            invalidateEscalations();
            setEditId(null);
          }}
        />
      )}

      {/* Delete confirmation */}
      <VerifyActionPinModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onSuccess={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description="Digite seu PIN de ação para excluir esta régua de cobrança."
      />
    </div>
  );
}
