/**
 * BudgetConfigModal
 * NavigationWizardDialog para configurar orçamentos mensais por categoria.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Calendar, DollarSign, Copy, Divide } from 'lucide-react';
import { toast } from 'sonner';
import { useFinanceCategories } from '@/hooks/finance/use-finance-categories';
import { useBudgetConfig, useSaveBudget } from '@/hooks/finance/use-budgets';
import type { SaveBudgetRequest } from '@/types/finance';

// ============================================================================
// TYPES
// ============================================================================

interface BudgetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
}

type SectionId = 'period' | 'budgets';

const MONTH_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

// ============================================================================
// COMPONENT
// ============================================================================

export function BudgetConfigModal({
  open,
  onOpenChange,
  year: initialYear,
}: BudgetConfigModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('period');
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [fillAll, setFillAll] = useState(false);
  const [fillAllAmount, setFillAllAmount] = useState(0);
  const [budgetData, setBudgetData] = useState<
    Record<string, Record<number, number>>
  >({});

  // Fetch categories (expense only)
  const { data: categoriesData } = useFinanceCategories({ type: 'EXPENSE' });
  const categories = useMemo(
    () => categoriesData?.categories ?? [],
    [categoriesData]
  );

  // Fetch existing budget config
  const { data: configData } = useBudgetConfig(selectedYear);

  // Initialize budget data from config
  useEffect(() => {
    if (!configData?.items || categories.length === 0) return;
    const newData: Record<string, Record<number, number>> = {};
    for (const cat of categories) {
      newData[cat.id] = {};
      for (let m = 1; m <= 12; m++) {
        const item = configData.items.find(
          (i) => i.categoryId === cat.id && i.month === m
        );
        newData[cat.id][m] = item?.amount ?? 0;
      }
    }
    setBudgetData(newData);
  }, [configData, categories]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setActiveSection('period');
      setSelectedYear(initialYear);
    }
  }, [open, initialYear]);

  // Update cell
  const updateCell = useCallback(
    (categoryId: string, month: number, value: number) => {
      setBudgetData((prev) => ({
        ...prev,
        [categoryId]: {
          ...(prev[categoryId] ?? {}),
          [month]: value,
        },
      }));
    },
    []
  );

  // Copy previous month
  const copyPreviousMonth = useCallback((month: number) => {
    if (month <= 1) return;
    setBudgetData((prev) => {
      const next = { ...prev };
      for (const catId of Object.keys(next)) {
        next[catId] = {
          ...next[catId],
          [month]: next[catId]?.[month - 1] ?? 0,
        };
      }
      return next;
    });
    toast.success(
      `Valores de ${MONTH_SHORT[month - 2]} copiados para ${MONTH_SHORT[month - 1]}`
    );
  }, []);

  // Distribute equally
  const distributeEqually = useCallback(
    (categoryId: string) => {
      const total = Object.values(budgetData[categoryId] ?? {}).reduce(
        (sum, v) => sum + v,
        0
      );
      if (total <= 0) {
        toast.error('Defina um valor anual primeiro para distribuir.');
        return;
      }
      const monthly = Math.round((total / 12) * 100) / 100;
      setBudgetData((prev) => {
        const months: Record<number, number> = {};
        for (let m = 1; m <= 12; m++) months[m] = monthly;
        return { ...prev, [categoryId]: months };
      });
    },
    [budgetData]
  );

  // Fill all months with same amount
  useEffect(() => {
    if (!fillAll || fillAllAmount <= 0 || categories.length === 0) return;
    const monthly = Math.round((fillAllAmount / 12) * 100) / 100;
    const newData: Record<string, Record<number, number>> = {};
    for (const cat of categories) {
      newData[cat.id] = {};
      for (let m = 1; m <= 12; m++) newData[cat.id][m] = monthly;
    }
    setBudgetData(newData);
  }, [fillAll, fillAllAmount, categories]);

  // Save
  const saveMutation = useSaveBudget();
  const isPending = saveMutation.isPending;

  const handleSave = useCallback(async () => {
    const items: SaveBudgetRequest['items'] = [];
    for (const [categoryId, months] of Object.entries(budgetData)) {
      for (const [monthStr, amount] of Object.entries(months)) {
        if (amount > 0) {
          items.push({ categoryId, month: Number(monthStr), amount });
        }
      }
    }
    try {
      await saveMutation.mutateAsync({ year: selectedYear, items });
      toast.success('Orçamentos salvos com sucesso!');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao salvar orçamentos.');
    }
  }, [budgetData, selectedYear, saveMutation, onOpenChange]);

  const handleClose = useCallback(
    (val: boolean) => {
      if (isPending) return;
      onOpenChange(val);
    },
    [isPending, onOpenChange]
  );

  // Navigation sections
  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'period',
        label: 'Período',
        icon: <Calendar className="h-4 w-4" />,
        description: 'Ano e preenchimento automático',
      },
      {
        id: 'budgets',
        label: 'Orçamentos',
        icon: <DollarSign className="h-4 w-4" />,
        description: 'Valores mensais por categoria',
      },
    ],
    []
  );

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title="Configurar Orçamentos"
      subtitle={`Definir orçamento mensal por categoria — ${selectedYear}`}
      sections={sections}
      activeSection={activeSection}
      onSectionChange={(id) => setActiveSection(id as SectionId)}
      isPending={isPending}
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Orçamentos'
            )}
          </Button>
        </>
      }
    >
      {/* Section: Período */}
      {activeSection === 'period' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Ano</Label>
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => setSelectedYear(Number(v))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={fillAll}
              onCheckedChange={setFillAll}
              id="fill-all"
            />
            <Label htmlFor="fill-all" className="text-sm">
              Preencher todos os meses com valor uniforme
            </Label>
          </div>
          {fillAll && (
            <div className="space-y-2">
              <Label>Valor anual total por categoria</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={fillAllAmount || ''}
                onChange={(e) =>
                  setFillAllAmount(parseFloat(e.target.value) || 0)
                }
                placeholder="Ex: 12000"
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Cada mês receberá{' '}
                {fillAllAmount > 0
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(fillAllAmount / 12)
                  : 'R$ 0,00'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section: Orçamentos */}
      {activeSection === 'budgets' && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-3">
            Defina o orçamento mensal para cada categoria de despesa.
          </p>
          <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-background">
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-semibold text-xs uppercase text-muted-foreground sticky left-0 bg-background min-w-[140px]">
                    Categoria
                  </th>
                  {MONTH_SHORT.map((m, idx) => (
                    <th
                      key={m}
                      className="text-center py-2 px-1 font-semibold text-xs uppercase text-muted-foreground min-w-[80px]"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{m}</span>
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => copyPreviousMonth(idx + 1)}
                            className="text-[9px] text-violet-500 hover:text-violet-700 flex items-center gap-0.5"
                            title={`Copiar de ${MONTH_SHORT[idx - 1]}`}
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="text-center py-2 px-1 font-semibold text-xs uppercase text-muted-foreground min-w-[50px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} className="border-b border-border/30">
                    <td className="py-1.5 px-2 text-sm font-medium sticky left-0 bg-background truncate max-w-[140px]">
                      {cat.name}
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(
                      (month) => (
                        <td key={month} className="py-1 px-1">
                          <Input
                            type="number"
                            min={0}
                            step={50}
                            value={budgetData[cat.id]?.[month] || ''}
                            onChange={(e) =>
                              updateCell(
                                cat.id,
                                month,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-7 w-full text-xs text-center px-1"
                            placeholder="0"
                          />
                        </td>
                      )
                    )}
                    <td className="py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => distributeEqually(cat.id)}
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-violet-600"
                        title="Distribuir igualmente"
                      >
                        <Divide className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </NavigationWizardDialog>
  );
}
