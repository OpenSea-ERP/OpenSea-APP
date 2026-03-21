'use client';

import { useState, useMemo, useEffect } from 'react';
import { CentralPageHeader } from '@/components/central/central-page-header';
import { CentralCard } from '@/components/central/central-card';
import {
  CentralBadge,
  CentralBadgeVariant,
} from '@/components/central/central-badge';
import { useSkillTree, useUpsertSkillPricing } from '@/hooks/admin/use-admin';
import { SkillTreeNode, SkillPricing } from '@/types/admin/catalog.types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Package,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
  Brain,
  ChevronRight,
  Pencil,
  Search,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

// ========================
// Constants
// ========================

const MODULE_OPTIONS = [
  { value: 'ALL', label: 'Todos os módulos' },
  { value: 'STOCK', label: 'Estoque' },
  { value: 'SALES', label: 'Vendas' },
  { value: 'HR', label: 'RH' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'TOOLS', label: 'Ferramentas' },
  { value: 'AI', label: 'Inteligência Artificial' },
];

const MODULE_ICONS: Record<string, React.ElementType> = {
  STOCK: Package,
  SALES: ShoppingCart,
  HR: Users,
  FINANCE: Wallet,
  TOOLS: Wrench,
  AI: Brain,
};

const PRICING_BADGE_VARIANT: Record<string, CentralBadgeVariant> = {
  FLAT: 'violet',
  PER_UNIT: 'sky',
  USAGE: 'teal',
};

const PRICING_LABELS: Record<string, string> = {
  FLAT: 'Fixo',
  PER_UNIT: 'Por Unidade',
  USAGE: 'Por Uso',
};

// ========================
// Helpers
// ========================

function formatPricing(pricing?: SkillPricing): string {
  if (!pricing) return 'Sem preço definido';

  switch (pricing.pricingType) {
    case 'FLAT':
      return `R$ ${(pricing.flatPrice ?? 0).toFixed(2)}/mês`;
    case 'PER_UNIT':
      return `R$ ${(pricing.unitPrice ?? 0).toFixed(2)}/${pricing.unitMetricLabel ?? 'unidade'}`;
    case 'USAGE':
      return `${pricing.usageIncluded ?? 0} grátis, R$ ${(pricing.usagePrice ?? 0).toFixed(2)}/${pricing.usageMetricLabel ?? 'uso'}`;
    default:
      return 'Sem preço definido';
  }
}

function filterTree(nodes: SkillTreeNode[], search: string): SkillTreeNode[] {
  if (!search.trim()) return nodes;
  const lower = search.toLowerCase();

  return nodes
    .map(node => {
      const filteredChildren = filterTree(node.children, search);
      const matches =
        node.skill.code.toLowerCase().includes(lower) ||
        node.skill.name.toLowerCase().includes(lower);

      if (matches || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean) as SkillTreeNode[];
}

// ========================
// SkillRow Component
// ========================

function SkillRow({
  node,
  depth,
  onEdit,
}: {
  node: SkillTreeNode;
  depth: number;
  onEdit: (node: SkillTreeNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const pricing = node.pricing ?? node.skill.pricing;

  return (
    <div>
      <div
        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-5 h-5 flex items-center justify-center rounded transition-transform"
          >
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              style={{ color: 'var(--central-text-secondary)' }}
            />
          </button>
        ) : (
          <span className="w-5 h-5" />
        )}

        {/* Code */}
        <code
          className="text-xs font-mono min-w-[180px]"
          style={{ color: 'var(--central-text-secondary)' }}
        >
          {node.skill.code}
        </code>

        {/* Name */}
        <span
          className="text-sm font-medium flex-1"
          style={{ color: 'var(--central-text-primary)' }}
        >
          {node.skill.name}
        </span>

        {/* Pricing badge */}
        {pricing ? (
          <CentralBadge
            variant={PRICING_BADGE_VARIANT[pricing.pricingType] ?? 'default'}
          >
            {PRICING_LABELS[pricing.pricingType] ?? pricing.pricingType}
          </CentralBadge>
        ) : (
          <CentralBadge variant="default">Sem preço</CentralBadge>
        )}

        {/* Price text */}
        <span
          className="text-xs min-w-[160px] text-right"
          style={{ color: 'var(--central-text-secondary)' }}
        >
          {formatPricing(pricing)}
        </span>

        {/* Edit button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => onEdit(node)}
        >
          <Pencil className="w-3 h-3 mr-1" />
          Editar
        </Button>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div>
          {node.children.map(child => (
            <SkillRow
              key={child.skill.code}
              node={child}
              depth={depth + 1}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ========================
// SkillModuleSection Component
// ========================

function SkillModuleSection({
  node,
  onEdit,
}: {
  node: SkillTreeNode;
  onEdit: (node: SkillTreeNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const Icon = MODULE_ICONS[node.skill.module ?? ''] ?? Package;
  const pricing = node.pricing ?? node.skill.pricing;

  return (
    <CentralCard className="overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-3 p-4">
          <CollapsibleTrigger asChild>
            <button
              className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              type="button"
            >
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                style={{ color: 'var(--central-text-secondary)' }}
              />
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'var(--central-accent)',
                  color: '#fff',
                }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-sm font-semibold"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  {node.skill.name}
                </span>
                <span
                  className="text-xs ml-2"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  {node.skill.code}
                </span>
              </div>
            </button>
          </CollapsibleTrigger>

          {pricing ? (
            <>
              <CentralBadge
                variant={
                  PRICING_BADGE_VARIANT[pricing.pricingType] ?? 'default'
                }
              >
                {PRICING_LABELS[pricing.pricingType] ?? pricing.pricingType}
              </CentralBadge>
              <span
                className="text-xs font-medium"
                style={{ color: 'var(--central-text-secondary)' }}
              >
                {formatPricing(pricing)}
              </span>
            </>
          ) : (
            <CentralBadge variant="default">Sem preço</CentralBadge>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs shrink-0"
            onClick={() => onEdit(node)}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Editar
          </Button>
        </div>

        <CollapsibleContent>
          <div
            className="border-t"
            style={{ borderColor: 'var(--central-border)' }}
          >
            {node.children.length > 0 ? (
              node.children.map(child => (
                <SkillRow
                  key={child.skill.code}
                  node={child}
                  depth={1}
                  onEdit={onEdit}
                />
              ))
            ) : (
              <p
                className="py-4 px-6 text-sm italic"
                style={{ color: 'var(--central-text-muted)' }}
              >
                Nenhuma skill filha cadastrada
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CentralCard>
  );
}

// ========================
// PricingEditDialog Component
// ========================

interface PricingFormData {
  pricingType: 'FLAT' | 'PER_UNIT' | 'USAGE';
  flatPrice: string;
  unitPrice: string;
  unitMetric: string;
  unitMetricLabel: string;
  usageIncluded: string;
  usagePrice: string;
  usageMetric: string;
  usageMetricLabel: string;
  annualDiscount: string;
}

const DEFAULT_FORM: PricingFormData = {
  pricingType: 'FLAT',
  flatPrice: '',
  unitPrice: '',
  unitMetric: '',
  unitMetricLabel: '',
  usageIncluded: '',
  usagePrice: '',
  usageMetric: '',
  usageMetricLabel: '',
  annualDiscount: '',
};

function PricingEditDialog({
  node,
  open,
  onOpenChange,
}: {
  node: SkillTreeNode | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const upsertMutation = useUpsertSkillPricing();
  const pricing = node?.pricing ?? node?.skill.pricing;

  const [form, setForm] = useState<PricingFormData>(DEFAULT_FORM);

  // Sync form when dialog opens with different node
  useEffect(() => {
    if (open && pricing) {
      setForm({
        pricingType: pricing.pricingType,
        flatPrice: pricing.flatPrice?.toString() ?? '',
        unitPrice: pricing.unitPrice?.toString() ?? '',
        unitMetric: pricing.unitMetric ?? '',
        unitMetricLabel: pricing.unitMetricLabel ?? '',
        usageIncluded: pricing.usageIncluded?.toString() ?? '',
        usagePrice: pricing.usagePrice?.toString() ?? '',
        usageMetric: pricing.usageMetric ?? '',
        usageMetricLabel: pricing.usageMetricLabel ?? '',
        annualDiscount: pricing.annualDiscount?.toString() ?? '',
      });
    } else if (open) {
      setForm(DEFAULT_FORM);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, node?.skill.code]);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  const updateField = (field: keyof PricingFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!node) return;

    const data: Record<string, unknown> = {
      pricingType: form.pricingType,
    };

    if (form.pricingType === 'FLAT') {
      data.flatPrice = parseFloat(form.flatPrice) || 0;
    } else if (form.pricingType === 'PER_UNIT') {
      data.unitPrice = parseFloat(form.unitPrice) || 0;
      data.unitMetric = form.unitMetric || undefined;
      data.unitMetricLabel = form.unitMetricLabel || undefined;
    } else if (form.pricingType === 'USAGE') {
      data.usageIncluded = parseInt(form.usageIncluded) || 0;
      data.usagePrice = parseFloat(form.usagePrice) || 0;
      data.usageMetric = form.usageMetric || undefined;
      data.usageMetricLabel = form.usageMetricLabel || undefined;
    }

    if (form.annualDiscount) {
      data.annualDiscount = parseFloat(form.annualDiscount);
    }

    try {
      await upsertMutation.mutateAsync({
        skillCode: node.skill.code,
        data: data as Parameters<typeof upsertMutation.mutateAsync>[0]['data'],
      });
      toast.success('Preço atualizado com sucesso');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao atualizar preço');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[480px]"
        style={{
          background: 'var(--central-card-bg)',
          color: 'var(--central-text-primary)',
          borderColor: 'var(--central-separator)',
        }}
      >
        <DialogHeader>
          <DialogTitle>Editar Preço</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Skill name (read-only) */}
          <div className="space-y-1.5">
            <Label
              className="text-xs font-medium"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              Skill
            </Label>
            <div className="text-sm font-medium">
              {node?.skill.name}{' '}
              <code
                className="text-xs ml-1"
                style={{ color: 'var(--central-text-secondary)' }}
              >
                ({node?.skill.code})
              </code>
            </div>
          </div>

          {/* Pricing type */}
          <div className="space-y-1.5">
            <Label
              htmlFor="pricingType"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              Tipo de Preço
            </Label>
            <Select
              value={form.pricingType}
              onValueChange={v =>
                updateField('pricingType', v as PricingFormData['pricingType'])
              }
            >
              <SelectTrigger
                style={{
                  background: 'var(--central-card-bg)',
                  color: 'var(--central-text-primary)',
                  borderColor: 'var(--central-separator)',
                }}
              >
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FLAT">Fixo (mensal)</SelectItem>
                <SelectItem value="PER_UNIT">Por Unidade</SelectItem>
                <SelectItem value="USAGE">Por Uso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields */}
          {form.pricingType === 'FLAT' && (
            <div className="space-y-1.5">
              <Label
                htmlFor="flatPrice"
                style={{ color: 'var(--central-text-secondary)' }}
              >
                Preço Mensal (R$)
              </Label>
              <Input
                id="flatPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.flatPrice}
                onChange={e => updateField('flatPrice', e.target.value)}
                style={{
                  background: 'var(--central-card-bg)',
                  color: 'var(--central-text-primary)',
                  borderColor: 'var(--central-separator)',
                }}
              />
            </div>
          )}

          {form.pricingType === 'PER_UNIT' && (
            <>
              <div className="space-y-1.5">
                <Label
                  htmlFor="unitPrice"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Preço por Unidade (R$)
                </Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.unitPrice}
                  onChange={e => updateField('unitPrice', e.target.value)}
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="unitMetric"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Métrica
                  </Label>
                  <Input
                    id="unitMetric"
                    placeholder="ex: user"
                    value={form.unitMetric}
                    onChange={e => updateField('unitMetric', e.target.value)}
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="unitMetricLabel"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Rótulo da Métrica
                  </Label>
                  <Input
                    id="unitMetricLabel"
                    placeholder="ex: usuário"
                    value={form.unitMetricLabel}
                    onChange={e =>
                      updateField('unitMetricLabel', e.target.value)
                    }
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {form.pricingType === 'USAGE' && (
            <>
              <div className="space-y-1.5">
                <Label
                  htmlFor="usageIncluded"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Uso Incluso (grátis)
                </Label>
                <Input
                  id="usageIncluded"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.usageIncluded}
                  onChange={e => updateField('usageIncluded', e.target.value)}
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="usagePrice"
                  style={{ color: 'var(--central-text-secondary)' }}
                >
                  Preço por Uso Excedente (R$)
                </Label>
                <Input
                  id="usagePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.usagePrice}
                  onChange={e => updateField('usagePrice', e.target.value)}
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="usageMetric"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Métrica
                  </Label>
                  <Input
                    id="usageMetric"
                    placeholder="ex: email"
                    value={form.usageMetric}
                    onChange={e => updateField('usageMetric', e.target.value)}
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="usageMetricLabel"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    Rótulo da Métrica
                  </Label>
                  <Input
                    id="usageMetricLabel"
                    placeholder="ex: e-mail"
                    value={form.usageMetricLabel}
                    onChange={e =>
                      updateField('usageMetricLabel', e.target.value)
                    }
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Annual discount */}
          <div className="space-y-1.5">
            <Label
              htmlFor="annualDiscount"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              Desconto Anual (%)
            </Label>
            <Input
              id="annualDiscount"
              type="number"
              step="1"
              min="0"
              max="100"
              placeholder="0"
              value={form.annualDiscount}
              onChange={e => updateField('annualDiscount', e.target.value)}
              style={{
                background: 'var(--central-card-bg)',
                color: 'var(--central-text-primary)',
                borderColor: 'var(--central-separator)',
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ========================
// Main Page
// ========================

export default function CatalogPage() {
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [editingNode, setEditingNode] = useState<SkillTreeNode | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: tree,
    isLoading,
    error,
  } = useSkillTree(moduleFilter !== 'ALL' ? moduleFilter : undefined);

  const filteredTree = useMemo(() => {
    if (!tree) return [];
    return filterTree(tree, search);
  }, [tree, search]);

  const handleEdit = (node: SkillTreeNode) => {
    setEditingNode(node);
    setDialogOpen(true);
  };

  return (
    <div className="px-6 py-5 space-y-4">
      <CentralPageHeader
        title="Catálogo de Módulos & Skills"
        description="Gerencie os módulos, skills e preços disponíveis para tenants"
      />

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <Input
            placeholder="Buscar skill..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            style={{
              backgroundColor: 'var(--central-card-bg)',
              borderColor: 'var(--central-border)',
              color: 'var(--central-text-primary)',
            }}
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger
            className="w-[200px]"
            style={{
              backgroundColor: 'var(--central-card-bg)',
              borderColor: 'var(--central-border)',
              color: 'var(--central-text-primary)',
            }}
          >
            <SelectValue placeholder="Filtrar por módulo" />
          </SelectTrigger>
          <SelectContent>
            {MODULE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="w-6 h-6 animate-spin"
            style={{ color: 'var(--central-accent)' }}
          />
          <span
            className="ml-2 text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            Carregando catálogo...
          </span>
        </div>
      ) : error ? (
        <CentralCard className="p-8 text-center">
          <p
            className="text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            Erro ao carregar o catálogo. Tente novamente.
          </p>
        </CentralCard>
      ) : filteredTree.length === 0 ? (
        <CentralCard className="p-8 text-center">
          <BookOpen
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: 'var(--central-text-muted)' }}
          />
          <p
            className="text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {search
              ? 'Nenhuma skill encontrada para a busca.'
              : 'Nenhuma skill cadastrada ainda.'}
          </p>
        </CentralCard>
      ) : (
        <div className="space-y-3">
          {filteredTree.map(node => (
            <SkillModuleSection
              key={node.skill.code}
              node={node}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Pricing Edit Dialog */}
      <PricingEditDialog
        node={editingNode}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
