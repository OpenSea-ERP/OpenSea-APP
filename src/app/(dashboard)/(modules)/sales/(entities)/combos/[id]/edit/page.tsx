/**
 * OpenSea OS - Edit Combo Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCombo,
  useUpdateCombo,
  useDeleteCombo,
} from '@/hooks/sales/use-combos';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { Combo, ComboDiscountType, ComboType } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useVariantsPaginated } from '@/hooks/stock/use-variants';
import {
  Calendar,
  DollarSign,
  GripVertical,
  Info,
  Loader2,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// COMBO ITEM ROW TYPE
// =============================================================================

interface ComboItemRow {
  localId: string;
  variantId: string;
  variantName: string;
  quantity: number;
  isRequired: boolean;
  position: number;
}

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditComboPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const comboId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: comboData,
    isLoading: isLoadingCombo,
    error,
  } = useCombo(comboId);

  const combo = comboData?.combo as Combo | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateCombo();
  const deleteMutation = useDeleteCombo();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ComboType>('FIXED');
  const [fixedPrice, setFixedPrice] = useState('');
  const [discountType, setDiscountType] = useState<ComboDiscountType | ''>('');
  const [discountValue, setDiscountValue] = useState('');
  const [minItems, setMinItems] = useState('');
  const [maxItems, setMaxItems] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  // Items state
  const [items, setItems] = useState<ComboItemRow[]>([]);
  const [variantSearchQuery, setVariantSearchQuery] = useState('');
  const [showVariantSearch, setShowVariantSearch] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(
    null
  );

  // Variant search
  const variantSearchParams = useMemo(
    () => ({
      search: variantSearchQuery || undefined,
      limit: 10,
      page: 1,
    }),
    [variantSearchQuery]
  );

  const { data: variantsData } = useVariantsPaginated(
    variantSearchQuery.length >= 2 ? variantSearchParams : undefined
  );

  const searchResults = useMemo(() => {
    if (!variantsData) return [];
    return variantsData.variants ?? [];
  }, [variantsData]);

  // Item management callbacks
  const addItem = useCallback(() => {
    setItems(prev => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        variantId: '',
        variantName: '',
        quantity: 1,
        isRequired: true,
        position: prev.length,
      },
    ]);
  }, []);

  const removeItem = useCallback((localId: string) => {
    setItems(prev =>
      prev
        .filter(item => item.localId !== localId)
        .map((item, idx) => ({ ...item, position: idx }))
    );
  }, []);

  const updateItem = useCallback(
    (localId: string, updates: Partial<ComboItemRow>) => {
      setItems(prev =>
        prev.map(item =>
          item.localId === localId ? { ...item, ...updates } : item
        )
      );
    },
    []
  );

  const selectVariant = useCallback(
    (localId: string, variant: { id: string; name: string; sku?: string }) => {
      updateItem(localId, {
        variantId: variant.id,
        variantName: variant.sku
          ? `${variant.name} (${variant.sku})`
          : variant.name,
      });
      setShowVariantSearch(false);
      setVariantSearchQuery('');
      setActiveSearchIndex(null);
    },
    [updateItem]
  );

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (combo) {
      setName(combo.name || '');
      setDescription(combo.description || '');
      setType(combo.type || 'FIXED');
      setFixedPrice(combo.fixedPrice != null ? String(combo.fixedPrice) : '');
      setDiscountType(combo.discountType || '');
      setDiscountValue(
        combo.discountValue != null ? String(combo.discountValue) : ''
      );
      setMinItems(combo.minItems != null ? String(combo.minItems) : '');
      setMaxItems(combo.maxItems != null ? String(combo.maxItems) : '');
      setIsActive(combo.isActive ?? true);
      setValidFrom(combo.validFrom ? combo.validFrom.substring(0, 10) : '');
      setValidUntil(combo.validUntil ? combo.validUntil.substring(0, 10) : '');
    }
  }, [combo]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome e obrigatório');
      return;
    }

    try {
      setIsSaving(true);

      // Build items payload (only items with a variant selected)
      const validItems = items
        .filter(item => item.variantId)
        .map((item, idx) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          isRequired: item.isRequired,
          position: idx,
        }));

      await updateMutation.mutateAsync({
        comboId,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          type,
          fixedPrice: fixedPrice ? Number(fixedPrice) : null,
          discountType: discountType || null,
          discountValue: discountValue ? Number(discountValue) : null,
          minItems: minItems ? Number(minItems) : null,
          maxItems: maxItems ? Number(maxItems) : null,
          isActive,
          validFrom: validFrom || null,
          validUntil: validUntil || null,
          items: validItems,
        },
      });

      toast.success('Combo atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['combos', comboId],
      });
      router.push(`/sales/combos/${comboId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar combo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar combo', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(comboId);
      toast.success('Combo excluído com sucesso!');
      router.push('/sales/combos');
    } catch (err) {
      logger.error(
        'Erro ao deletar combo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar combo', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.COMBOS.REMOVE)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Combos', href: '/sales/combos' },
    {
      label: combo?.name || '...',
      href: `/sales/combos/${comboId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingCombo) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !combo) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Combo não encontrado"
            message="O combo solicitado não foi encontrado."
            action={{
              label: 'Voltar para Combos',
              onClick: () => router.push('/sales/combos'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <Package className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando combo</p>
              <h1 className="text-xl font-bold truncate">{combo.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados do Combo */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Dados do Combo"
                subtitle="Informações básicas de identificação"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do combo"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as ComboType)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">Preço Fixo</SelectItem>
                        <SelectItem value="DYNAMIC">Dinamico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição do combo..."
                    rows={3}
                  />
                </div>

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Preços e Descontos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={DollarSign}
                title="Preços e Descontos"
                subtitle="Configuração de valores do combo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {type === 'FIXED' && (
                    <div className="grid gap-2">
                      <Label htmlFor="fixedPrice">Preço Fixo (R$)</Label>
                      <Input
                        id="fixedPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={fixedPrice}
                        onChange={e => setFixedPrice(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="discountType">Tipo de Desconto</Label>
                    <Select
                      value={discountType}
                      onValueChange={v =>
                        setDiscountType(v as ComboDiscountType | '')
                      }
                    >
                      <SelectTrigger id="discountType">
                        <SelectValue placeholder="Sem desconto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                        <SelectItem value="FIXED_VALUE">Valor Fixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {discountType && (
                    <div className="grid gap-2">
                      <Label htmlFor="discountValue">
                        {discountType === 'PERCENTAGE'
                          ? 'Desconto (%)'
                          : 'Desconto (R$)'}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                        min="0"
                        max={discountType === 'PERCENTAGE' ? '100' : undefined}
                        value={discountValue}
                        onChange={e => setDiscountValue(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="minItems">Mínimo de Itens</Label>
                    <Input
                      id="minItems"
                      type="number"
                      min="0"
                      value={minItems}
                      onChange={e => setMinItems(e.target.value)}
                      placeholder="Sem mínimo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxItems">Máximo de Itens</Label>
                    <Input
                      id="maxItems"
                      type="number"
                      min="0"
                      value={maxItems}
                      onChange={e => setMaxItems(e.target.value)}
                      placeholder="Sem máximo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Período de Validade */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Período de Validade"
                subtitle="Defina quando o combo estara disponivel"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="validFrom">Valido a partir de</Label>
                    <Input
                      id="validFrom"
                      type="date"
                      value={validFrom}
                      onChange={e => setValidFrom(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="validUntil">Valido ate</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Itens do Combo */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Package}
                title="Itens do Combo"
                subtitle="Produtos incluidos neste combo"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum item adicionado ao combo.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clique no botao abaixo para adicionar produtos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Table Header */}
                    <div className="hidden sm:grid sm:grid-cols-[1fr_100px_80px_40px] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <span>Produto / Variante</span>
                      <span className="text-center">Quantidade</span>
                      <span className="text-center">Obrigatório</span>
                      <span />
                    </div>

                    {/* Item Rows */}
                    {items.map((item, index) => (
                      <div
                        key={item.localId}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_40px] gap-3 items-center rounded-lg border border-border bg-gray-50 dark:bg-slate-700/40 px-3 py-3"
                      >
                        {/* Variant selector */}
                        <div className="relative">
                          {item.variantId ? (
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {item.variantName}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(item.localId, {
                                    variantId: '',
                                    variantName: '',
                                  })
                                }
                                className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 text-muted-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Buscar variante por nome ou SKU..."
                                  className="pl-9"
                                  value={
                                    activeSearchIndex === index
                                      ? variantSearchQuery
                                      : ''
                                  }
                                  onChange={e => {
                                    setVariantSearchQuery(e.target.value);
                                    setShowVariantSearch(true);
                                    setActiveSearchIndex(index);
                                  }}
                                  onFocus={() => {
                                    setShowVariantSearch(true);
                                    setActiveSearchIndex(index);
                                  }}
                                  onBlur={() => {
                                    // Delay to allow click on search results
                                    setTimeout(() => {
                                      if (activeSearchIndex === index) {
                                        setShowVariantSearch(false);
                                        setActiveSearchIndex(null);
                                      }
                                    }, 200);
                                  }}
                                />
                              </div>
                              {showVariantSearch &&
                                activeSearchIndex === index &&
                                variantSearchQuery.length >= 2 && (
                                  <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-white dark:bg-slate-800 shadow-lg">
                                    {searchResults.length === 0 ? (
                                      <div className="px-4 py-3 text-sm text-muted-foreground">
                                        Nenhuma variante encontrada
                                      </div>
                                    ) : (
                                      searchResults.map(variant => (
                                        <button
                                          key={variant.id}
                                          type="button"
                                          className="w-full text-left px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                          onMouseDown={e => e.preventDefault()}
                                          onClick={() =>
                                            selectVariant(item.localId, variant)
                                          }
                                        >
                                          <p className="text-sm font-medium truncate">
                                            {variant.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {variant.sku
                                              ? `SKU: ${variant.sku}`
                                              : ''}{' '}
                                            {variant.price != null
                                              ? `| R$ ${Number(variant.price).toFixed(2)}`
                                              : ''}
                                          </p>
                                        </button>
                                      ))
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <Label className="sm:hidden text-xs text-muted-foreground mb-1">
                            Quantidade
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={e =>
                              updateItem(item.localId, {
                                quantity: Math.max(
                                  1,
                                  Number(e.target.value) || 1
                                ),
                              })
                            }
                            className="text-center"
                          />
                        </div>

                        {/* Required toggle */}
                        <div className="flex items-center justify-center gap-2">
                          <Label className="sm:hidden text-xs text-muted-foreground">
                            Obrigatório
                          </Label>
                          <Switch
                            checked={item.isRequired}
                            onCheckedChange={checked =>
                              updateItem(item.localId, { isRequired: checked })
                            }
                          />
                        </div>

                        {/* Remove button */}
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.localId)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add item button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="w-full mt-2 border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Combo"
        description={`Digite seu PIN de ação para excluir o combo "${combo.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
