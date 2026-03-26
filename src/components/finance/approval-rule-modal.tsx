/**
 * ApprovalRuleModal
 * NavigationWizardDialog para criar/editar regras de aprovação automática.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, Loader2, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCreateApprovalRule,
  useUpdateApprovalRule,
  useApprovalRule,
} from '@/hooks/finance/use-approval-rules';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import type {
  FinanceApprovalAction,
  ApprovalRuleConditions,
} from '@/types/finance';
import {
  APPROVAL_ACTION_LABELS,
  APPROVAL_ACTION_COLORS,
} from '@/types/finance';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId?: string;
  onSaved?: () => void;
}

// ============================================================================
// FORM STATE
// ============================================================================

interface FormState {
  name: string;
  action: FinanceApprovalAction;
  priority: number;
  maxAmount: string;
  isActive: boolean;
  categoryIds: string[];
  supplierNames: string[];
  entryType: '' | 'PAYABLE' | 'RECEIVABLE';
  minRecurrence: string;
}

const defaultForm: FormState = {
  name: '',
  action: 'AUTO_APPROVE',
  priority: 0,
  maxAmount: '',
  isActive: true,
  categoryIds: [],
  supplierNames: [],
  entryType: '',
  minRecurrence: '',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ApprovalRuleModal({
  open,
  onOpenChange,
  ruleId,
  onSaved,
}: ApprovalRuleModalProps) {
  const isEditing = !!ruleId;
  const [form, setForm] = useState<FormState>(defaultForm);
  const [supplierInput, setSupplierInput] = useState('');

  const { data: ruleData, isLoading: loadingRule } = useApprovalRule(
    ruleId ?? ''
  );
  const { data: categoriesData } = useFinanceCategories();
  const createMutation = useCreateApprovalRule();
  const updateMutation = useUpdateApprovalRule();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Load rule data into form
  useEffect(() => {
    if (isEditing && ruleData?.rule) {
      const r = ruleData.rule;
      const conditions = r.conditions as ApprovalRuleConditions;
      setForm({
        name: r.name,
        action: r.action,
        priority: r.priority,
        maxAmount: r.maxAmount ? String(r.maxAmount) : '',
        isActive: r.isActive,
        categoryIds: conditions?.categoryIds ?? [],
        supplierNames: conditions?.supplierNames ?? [],
        entryType: conditions?.entryType ?? '',
        minRecurrence: conditions?.minRecurrence
          ? String(conditions.minRecurrence)
          : '',
      });
    } else if (!isEditing && open) {
      setForm(defaultForm);
      setSupplierInput('');
    }
  }, [isEditing, ruleData, open]);

  const handleAddSupplier = useCallback(() => {
    const trimmed = supplierInput.trim();
    if (trimmed && !form.supplierNames.includes(trimmed)) {
      setForm((f) => ({
        ...f,
        supplierNames: [...f.supplierNames, trimmed],
      }));
      setSupplierInput('');
    }
  }, [supplierInput, form.supplierNames]);

  const handleRemoveSupplier = useCallback((name: string) => {
    setForm((f) => ({
      ...f,
      supplierNames: f.supplierNames.filter((n) => n !== name),
    }));
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome da regra é obrigatório.');
      return;
    }

    const conditions: ApprovalRuleConditions = {};
    if (form.categoryIds.length > 0) conditions.categoryIds = form.categoryIds;
    if (form.supplierNames.length > 0)
      conditions.supplierNames = form.supplierNames;
    if (form.entryType) conditions.entryType = form.entryType as 'PAYABLE' | 'RECEIVABLE';
    if (form.minRecurrence && Number(form.minRecurrence) > 0)
      conditions.minRecurrence = Number(form.minRecurrence);

    const payload = {
      name: form.name.trim(),
      action: form.action,
      priority: form.priority,
      maxAmount: form.maxAmount ? Number(form.maxAmount) : undefined,
      isActive: form.isActive,
      conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
    };

    try {
      if (isEditing && ruleId) {
        await updateMutation.mutateAsync({ id: ruleId, data: payload });
        toast.success('Regra de aprovação atualizada com sucesso!');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('Regra de aprovação criada com sucesso!');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing
          ? 'Erro ao atualizar regra de aprovação.'
          : 'Erro ao criar regra de aprovação.'
      );
    }
  };

  // Categories for multi-select
  const categories = categoriesData?.categories ?? [];

  const handleToggleCategory = (catId: string) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter((id) => id !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  // ============================================================================
  // SECTIONS
  // ============================================================================

  const sections: NavigationSection[] = [
    {
      id: 'basic',
      label: 'Dados Básicos',
      icon: Settings2,
      content: (
        <div className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="rule-name">Nome da Regra</Label>
            <Input
              id="rule-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Pagamentos pequenos até R$ 500"
              maxLength={128}
            />
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label>Ação</Label>
            <Select
              value={form.action}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  action: v as FinanceApprovalAction,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ['AUTO_PAY', 'AUTO_APPROVE', 'FLAG_REVIEW'] as const
                ).map((action) => {
                  const colors = APPROVAL_ACTION_COLORS[action];
                  return (
                    <SelectItem key={action} value={action}>
                      <span className={cn(colors.text)}>
                        {APPROVAL_ACTION_LABELS[action]}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="rule-priority">Prioridade</Label>
            <Input
              id="rule-priority"
              type="number"
              min={0}
              value={form.priority}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  priority: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Maior valor = avaliada primeiro
            </p>
          </div>

          {/* Max Amount */}
          <div className="space-y-2">
            <Label htmlFor="rule-max-amount">Valor Máximo (R$)</Label>
            <Input
              id="rule-max-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.maxAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxAmount: e.target.value }))
              }
              placeholder="Sem limite"
            />
            <p className="text-xs text-muted-foreground">
              Lançamentos com valor até este limite serão avaliados
            </p>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <Label htmlFor="rule-active">Ativa</Label>
            <Switch
              id="rule-active"
              checked={form.isActive}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, isActive: checked }))
              }
            />
          </div>
        </div>
      ),
    },
    {
      id: 'conditions',
      label: 'Condições',
      icon: Filter,
      content: (
        <div className="space-y-5">
          {/* Entry Type */}
          <div className="space-y-2">
            <Label>Tipo de Lançamento</Label>
            <Select
              value={form.entryType || '_all'}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  entryType: v === '_all' ? '' : (v as 'PAYABLE' | 'RECEIVABLE'),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos</SelectItem>
                <SelectItem value="PAYABLE">Somente A Pagar</SelectItem>
                <SelectItem value="RECEIVABLE">Somente A Receber</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categories Multi-Select */}
          <div className="space-y-2">
            <Label>Categorias (opcional)</Label>
            <div className="border rounded-lg p-3 max-h-40 overflow-auto space-y-1">
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma categoria encontrada
                </p>
              ) : (
                categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={cn(
                      'w-full text-left px-3 py-1.5 rounded text-sm transition-colors',
                      form.categoryIds.includes(cat.id)
                        ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300'
                        : 'hover:bg-muted/50'
                    )}
                    onClick={() => handleToggleCategory(cat.id)}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
            {form.categoryIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {form.categoryIds.length} categoria(s) selecionada(s)
              </p>
            )}
          </div>

          {/* Supplier Names Tags */}
          <div className="space-y-2">
            <Label>Fornecedores (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={supplierInput}
                onChange={(e) => setSupplierInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSupplier();
                  }
                }}
                placeholder="Digite e pressione Enter"
              />
            </div>
            {form.supplierNames.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.supplierNames.map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="text-xs gap-1 bg-slate-50 dark:bg-slate-800"
                  >
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplier(name)}
                      className="ml-0.5 hover:text-rose-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Min Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="rule-min-recurrence">
              Recorrência mínima do fornecedor
            </Label>
            <Input
              id="rule-min-recurrence"
              type="number"
              min={0}
              value={form.minRecurrence}
              onChange={(e) =>
                setForm((f) => ({ ...f, minRecurrence: e.target.value }))
              }
              placeholder="Sem mínimo"
            />
            <p className="text-xs text-muted-foreground">
              Fornecedor deve ter pelo menos X lançamentos anteriores
            </p>
          </div>
        </div>
      ),
    },
  ];

  if (loadingRule && isEditing) {
    return (
      <NavigationWizardDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Carregando..."
        sections={[
          {
            id: 'loading',
            label: 'Carregando',
            icon: Loader2,
            content: (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ),
          },
        ]}
        onSave={() => {}}
        isSaving={false}
      />
    );
  }

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Regra de Aprovação' : 'Nova Regra de Aprovação'}
      sections={sections}
      onSave={handleSave}
      isSaving={isSubmitting}
      saveLabel={isEditing ? 'Salvar Alterações' : 'Criar Regra'}
    />
  );
}
