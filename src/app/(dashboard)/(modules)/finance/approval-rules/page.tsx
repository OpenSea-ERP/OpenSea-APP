/**
 * Finance Approval Rules Page
 * Lista de regras de aprovação automática com cards e ações contextuais.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  ShieldCheck,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useApprovalRules,
  useDeleteApprovalRule,
  useToggleApprovalRuleActive,
} from '@/hooks/finance/use-approval-rules';
import { ApprovalRuleModal } from '@/components/finance/approval-rule-modal';
import type {
  FinanceApprovalAction,
  FinanceApprovalRule,
} from '@/types/finance';
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_ACTION_COLORS,
} from '@/types/finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// APPROVAL RULE CARD
// ============================================================================

function ApprovalRuleCard({
  rule,
  onEdit,
  onToggleActive,
  onDelete,
}: {
  rule: FinanceApprovalRule;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}) {
  const actionColors = APPROVAL_ACTION_COLORS[rule.action];
  const conditions = rule.conditions;
  const conditionCount = [
    conditions?.categoryIds?.length ? 1 : 0,
    conditions?.supplierNames?.length ? 1 : 0,
    conditions?.entryType ? 1 : 0,
    conditions?.minRecurrence ? 1 : 0,
    rule.maxAmount ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border hover:border-violet-200 dark:hover:border-violet-800/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <h3 className="font-semibold text-sm truncate">{rule.name}</h3>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  actionColors.bg,
                  actionColors.text,
                  actionColors.border
                )}
              >
                {APPROVAL_ACTION_LABELS[rule.action]}
              </Badge>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  rule.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/8 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-500/8 dark:text-slate-400 dark:border-slate-700'
                )}
              >
                {rule.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
              {rule.priority > 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-800"
                >
                  Prioridade: {rule.priority}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {rule.maxAmount && (
                <span>
                  Até R$ {Number(rule.maxAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}
              {conditionCount > 0 && (
                <>
                  {rule.maxAmount && <span className="text-border">|</span>}
                  <span>
                    {conditionCount}{' '}
                    {conditionCount === 1 ? 'condição' : 'condições'}
                  </span>
                </>
              )}
              <span className="text-border">|</span>
              <span>
                {rule.appliedCount}{' '}
                {rule.appliedCount === 1 ? 'aplicação' : 'aplicações'}
              </span>
            </div>
          </div>

          {/* Context Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {rule.isActive ? (
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

function ApprovalRuleLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ApprovalRulesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string>('_all');
  const [filterStatus, setFilterStatus] = useState<string>('_all');

  const { data, isLoading, refetch } = useApprovalRules({
    limit: 100,
    isActive: filterStatus === '_all' ? undefined : filterStatus === 'active',
    action:
      filterAction === '_all'
        ? undefined
        : (filterAction as FinanceApprovalAction),
  });

  const deleteMutation = useDeleteApprovalRule();
  const toggleActiveMutation = useToggleApprovalRuleActive();

  const rules = useMemo(() => data?.rules ?? [], [data]);

  const handleToggleActive = async (rule: FinanceApprovalRule) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: rule.id,
        isActive: !rule.isActive,
      });
      toast.success(
        rule.isActive
          ? 'Regra desativada com sucesso!'
          : 'Regra ativada com sucesso!'
      );
    } catch {
      toast.error('Erro ao alterar status da regra.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('Regra de aprovação excluída com sucesso!');
      setDeleteId(null);
    } catch {
      toast.error('Erro ao excluir regra de aprovação.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Regras de Aprovação' },
        ]}
        hasPermission={hasPermission}
        buttons={[
          {
            id: 'new',
            title: 'Nova Regra',
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
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
            <ShieldCheck className="h-6 w-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Regras de Aprovação</h1>
            <p className="text-sm text-muted-foreground">
              Configure regras automáticas de aprovação e pagamento de lançamentos
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todas as Ações</SelectItem>
            <SelectItem value="AUTO_PAY">Pagamento Automático</SelectItem>
            <SelectItem value="AUTO_APPROVE">Aprovação Automática</SelectItem>
            <SelectItem value="FLAG_REVIEW">Sinalizar Revisão</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Todos</SelectItem>
            <SelectItem value="active">Ativas</SelectItem>
            <SelectItem value="inactive">Inativas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <ApprovalRuleLoadingSkeleton />
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              Nenhuma regra de aprovação configurada.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <ApprovalRuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => setEditId(rule.id)}
              onToggleActive={() => handleToggleActive(rule)}
              onDelete={() => setDeleteId(rule.id)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ApprovalRuleModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={() => {
          refetch();
          setCreateOpen(false);
        }}
      />

      {/* Edit Modal */}
      {editId && (
        <ApprovalRuleModal
          open={!!editId}
          onOpenChange={(open) => !open && setEditId(null)}
          ruleId={editId}
          onSaved={() => {
            refetch();
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
        description="Digite seu PIN de ação para excluir esta regra de aprovação."
      />
    </div>
  );
}
