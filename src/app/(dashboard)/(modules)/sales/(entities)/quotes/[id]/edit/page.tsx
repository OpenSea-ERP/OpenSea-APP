/**
 * OpenSea OS - Edit Quote Page
 * Página de edição do orçamento (apenas DRAFT)
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useQuote,
  useUpdateQuote,
  useDeleteQuote,
} from '@/hooks/sales/use-quotes';
import { usePermissions } from '@/hooks/use-permissions';
import { quotesConfig } from '@/config/entities/quotes.config';
import { logger } from '@/lib/logger';
import type { Quote, QuoteItem } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Loader2,
  Minus,
  NotebookText,
  Package,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
// ITEM ROW TYPE
// =============================================================================

interface ItemRow {
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const quoteId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: quoteData,
    isLoading: isLoadingQuote,
    error,
  } = useQuote(quoteId);

  const quote = quoteData?.quote as Quote | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateQuote();
  const deleteMutation = useDeleteQuote();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (quote) {
      setTitle(quote.title || '');
      setValidUntil(
        quote.validUntil
          ? new Date(quote.validUntil).toISOString().split('T')[0]
          : ''
      );
      setNotes(quote.notes || '');
      setItems(
        (quote.items ?? []).map((item: QuoteItem) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        }))
      );
    }
  }, [quote]);

  // ============================================================================
  // ITEM HANDLERS
  // ============================================================================

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { productName: '', quantity: 1, unitPrice: 0, discount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemRow, value: string | number) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: quoteId,
        data: {
          title: title.trim(),
          validUntil: validUntil || undefined,
          notes: notes.trim() || undefined,
          items: items
            .filter(item => item.productName.trim())
            .map(item => ({
              productName: item.productName.trim(),
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || undefined,
            })),
        },
      });

      toast.success('Orçamento atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['quotes', quoteId],
      });
      router.push(`/sales/quotes/${quoteId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar orçamento',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar orçamento', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(quoteId);
      toast.success('Orçamento excluído com sucesso!');
      router.push('/sales/quotes');
    } catch (err) {
      logger.error(
        'Erro ao deletar orçamento',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar orçamento', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(quotesConfig.permissions.delete)
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
      disabled: isSaving || !title.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Orçamentos', href: '/sales/quotes' },
    {
      label: quote?.title || '...',
      href: `/sales/quotes/${quoteId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingQuote) {
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

  if (error || !quote) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Orçamento não encontrado"
            message="O orçamento solicitado não foi encontrado."
            action={{
              label: 'Voltar para Orçamentos',
              onClick: () => router.push('/sales/quotes'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  if (quote.status !== 'DRAFT') {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Edição não permitida"
            message="Apenas orçamentos com status Rascunho podem ser editados."
            action={{
              label: 'Ver Orçamento',
              onClick: () => router.push(`/sales/quotes/${quoteId}`),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-sky-500 to-cyan-600">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando orçamento
              </p>
              <h1 className="text-xl font-bold truncate">{quote.title}</h1>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados do Orçamento */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados do Orçamento"
                subtitle="Informações básicas do orçamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Título <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Título do orçamento"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="validUntil">Válido até</Label>
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

        {/* Form Card: Itens */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Package}
                title="Itens"
                subtitle="Produtos e serviços do orçamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_80px_120px_120px_40px] gap-3 items-end border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div className="grid gap-2">
                      <Label>Produto</Label>
                      <Input
                        value={item.productName}
                        onChange={e =>
                          updateItem(index, 'productName', e.target.value)
                        }
                        placeholder="Nome do produto"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Qtd.</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e =>
                          updateItem(
                            index,
                            'quantity',
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Preço Unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unitPrice}
                        onChange={e =>
                          updateItem(
                            index,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Desconto</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.discount}
                        onChange={e =>
                          updateItem(
                            index,
                            'discount',
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                      className="h-10 w-10 text-muted-foreground hover:text-rose-600"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="h-9 px-2.5"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Adicionar Item
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas adicionais do orçamento"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas internas sobre o orçamento..."
                    rows={4}
                  />
                </div>
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
        title="Excluir Orçamento"
        description={`Digite seu PIN de ação para excluir o orçamento "${quote.title}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
