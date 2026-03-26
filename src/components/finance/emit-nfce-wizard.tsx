'use client';

import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/error-messages';
import { useEmitNfce } from '@/hooks/finance/use-fiscal';
import type { EmitNfceData } from '@/types/fiscal';
import {
  CheckCircle2,
  FileCheck,
  FileText,
  Info,
  ListOrdered,
  Loader2,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

interface EmitNfceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface NfceItem {
  id: string;
  productName: string;
  productCode: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
}

interface EmissionResult {
  id: string;
  number: number;
  accessKey?: string;
  status: string;
  danfePdfUrl?: string;
  totalValue: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

let itemIdCounter = 0;

function createDefaultItem(): NfceItem {
  itemIdCounter += 1;
  return {
    id: `nfce-item-${itemIdCounter}`,
    productName: '',
    productCode: '',
    ncm: '',
    cfop: '5102',
    quantity: 1,
    unitPrice: 0,
  };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmitNfceWizard({
  open,
  onOpenChange,
  onSuccess,
}: EmitNfceWizardProps) {
  const emitMutation = useEmitNfce();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState('consumer');
  const [recipientName, setRecipientName] = useState('');
  const [recipientCpf, setRecipientCpf] = useState('');
  const [items, setItems] = useState<NfceItem[]>(() => [createDefaultItem()]);
  const [emissionResult, setEmissionResult] = useState<EmissionResult | null>(
    null
  );

  // ── Computed ───────────────────────────────────────────────────────────────
  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [items]
  );

  const hasValidItems = useMemo(
    () =>
      items.length > 0 &&
      items.every(
        item =>
          item.productName.trim().length > 0 &&
          item.cfop.trim().length > 0 &&
          item.quantity > 0 &&
          item.unitPrice > 0
      ),
    [items]
  );

  const sectionErrors = useMemo(() => {
    return {
      consumer: false, // consumer fields are all optional
      items: items.length === 0 || !hasValidItems,
      confirm: false,
    };
  }, [items.length, hasValidItems]);

  // ── Sections ───────────────────────────────────────────────────────────────
  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'consumer',
        label: 'Consumidor',
        icon: <User className="h-4 w-4" />,
        description: 'Dados do consumidor (opcional)',
      },
      {
        id: 'items',
        label: 'Itens',
        icon: <ListOrdered className="h-4 w-4" />,
        description: 'Produtos da NFC-e',
      },
      {
        id: 'confirm',
        label: 'Confirmação',
        icon: <FileCheck className="h-4 w-4" />,
        description: 'Revisão e emissão',
      },
    ],
    []
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAddItem = useCallback(() => {
    setItems(prev => [...prev, createDefaultItem()]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string, field: keyof NfceItem, value: string | number) => {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  const handleEmit = useCallback(async () => {
    if (!hasValidItems) {
      toast.error('Preencha todos os campos obrigatórios dos itens.');
      return;
    }

    try {
      const data: EmitNfceData = {
        ...(recipientName.trim()
          ? { recipientName: recipientName.trim() }
          : {}),
        ...(recipientCpf.trim()
          ? { recipientCnpjCpf: recipientCpf.trim() }
          : {}),
        items: items.map(item => ({
          productName: item.productName.trim(),
          ...(item.productCode.trim()
            ? { productCode: item.productCode.trim() }
            : {}),
          ...(item.ncm.trim() ? { ncm: item.ncm.trim() } : {}),
          cfop: item.cfop.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const result = await emitMutation.mutateAsync(data);
      setEmissionResult(result.document);
      toast.success('NFC-e emitida com sucesso!');
      onSuccess?.();
    } catch (err) {
      toast.error(translateError(err));
    }
  }, [
    hasValidItems,
    recipientName,
    recipientCpf,
    items,
    emitMutation,
    onSuccess,
  ]);

  const handleClose = useCallback(() => {
    if (emitMutation.isPending) return;
    setEmissionResult(null);
    setActiveSection('consumer');
    setRecipientName('');
    setRecipientCpf('');
    setItems([createDefaultItem()]);
    onOpenChange(false);
  }, [emitMutation.isPending, onOpenChange]);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = useMemo(() => {
    if (emissionResult) {
      return <Button onClick={handleClose}>Fechar</Button>;
    }

    return (
      <>
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        {activeSection === 'confirm' ? (
          <Button
            onClick={handleEmit}
            disabled={emitMutation.isPending || !hasValidItems}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {emitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            Emitir NFC-e
          </Button>
        ) : (
          <Button
            onClick={() => {
              const currentIdx = sections.findIndex(
                s => s.id === activeSection
              );
              if (currentIdx < sections.length - 1) {
                setActiveSection(sections[currentIdx + 1].id);
              }
            }}
          >
            Próximo
          </Button>
        )}
      </>
    );
  }, [
    emissionResult,
    activeSection,
    handleClose,
    handleEmit,
    emitMutation.isPending,
    hasValidItems,
    sections,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title="Emitir NFC-e"
      subtitle="Nota Fiscal de Consumidor Eletrônica"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      footer={footer}
      isPending={emitMutation.isPending}
      sectionErrors={sectionErrors}
    >
      {/* ── Success State ─────────────────────────────────────────────────── */}
      {emissionResult ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                NFC-e emitida com sucesso!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                O cupom fiscal eletrônico foi emitido junto à SEFAZ.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Número</span>
              <span className="text-sm font-medium">
                {emissionResult.number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
                {emissionResult.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="text-sm font-mono font-medium">
                {formatCurrency(emissionResult.totalValue)}
              </span>
            </div>
            {emissionResult.accessKey && (
              <div className="flex flex-col gap-1 pt-2 border-t">
                <span className="text-sm text-muted-foreground">
                  Chave de Acesso
                </span>
                <span className="text-xs font-mono break-all text-muted-foreground">
                  {emissionResult.accessKey}
                </span>
              </div>
            )}
            {emissionResult.danfePdfUrl && (
              <a
                href={emissionResult.danfePdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block pt-2"
              >
                <Button variant="outline" className="w-full gap-2">
                  <FileText className="h-4 w-4" />
                  Abrir DANFE (PDF)
                </Button>
              </a>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* ── Section: Consumidor ─────────────────────────────────────── */}
          {activeSection === 'consumer' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-1">
                  Dados do Consumidor
                </h3>
                <p className="text-sm text-muted-foreground">
                  Informe os dados do consumidor, se desejar identificá-lo na
                  NFC-e.
                </p>
              </div>

              <div className="rounded-lg border border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-500/10 p-3 flex gap-3">
                <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  Para NFC-e, os dados do consumidor são opcionais. Se não
                  informados, será emitida como &ldquo;Consumidor Final&rdquo;.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nfce-consumer-name">Nome do Consumidor</Label>
                  <Input
                    id="nfce-consumer-name"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nfce-consumer-cpf">CPF do Consumidor</Label>
                  <Input
                    id="nfce-consumer-cpf"
                    value={recipientCpf}
                    onChange={e => setRecipientCpf(e.target.value)}
                    placeholder="Ex: 000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Section: Itens ──────────────────────────────────────────── */}
          {activeSection === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold mb-1">
                    Itens da NFC-e
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione os produtos que compõem o cupom fiscal.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar Item
                </Button>
              </div>

              {items.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <ListOrdered className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado. Clique em &ldquo;Adicionar
                    Item&rdquo; para começar.
                  </p>
                </div>
              )}

              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Product Name + Product Code */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">
                          Descrição do Produto *
                        </Label>
                        <Input
                          value={item.productName}
                          onChange={e =>
                            handleUpdateItem(
                              item.id,
                              'productName',
                              e.target.value
                            )
                          }
                          placeholder="Nome do produto"
                          className={cn(
                            !item.productName.trim() &&
                              'border-rose-300 dark:border-rose-700'
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Código do Produto</Label>
                        <Input
                          value={item.productCode}
                          onChange={e =>
                            handleUpdateItem(
                              item.id,
                              'productCode',
                              e.target.value
                            )
                          }
                          placeholder="Opcional"
                        />
                      </div>
                    </div>

                    {/* Row 2: NCM + CFOP */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">NCM</Label>
                        <Input
                          value={item.ncm}
                          onChange={e =>
                            handleUpdateItem(item.id, 'ncm', e.target.value)
                          }
                          placeholder="Ex: 84714900"
                          maxLength={8}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">CFOP *</Label>
                        <Input
                          value={item.cfop}
                          onChange={e =>
                            handleUpdateItem(item.id, 'cfop', e.target.value)
                          }
                          placeholder="Ex: 5102"
                          maxLength={4}
                          className={cn(
                            !item.cfop.trim() &&
                              'border-rose-300 dark:border-rose-700'
                          )}
                        />
                      </div>
                    </div>

                    {/* Row 3: Quantity + Unit Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Quantidade *</Label>
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={e =>
                            handleUpdateItem(
                              item.id,
                              'quantity',
                              Number(e.target.value)
                            )
                          }
                          className={cn(
                            item.quantity <= 0 &&
                              'border-rose-300 dark:border-rose-700'
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Preço Unitário *</Label>
                        <Input
                          type="number"
                          min={0.01}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={e =>
                            handleUpdateItem(
                              item.id,
                              'unitPrice',
                              Number(e.target.value)
                            )
                          }
                          className={cn(
                            item.unitPrice <= 0 &&
                              'border-rose-300 dark:border-rose-700'
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span className="text-sm font-mono text-muted-foreground">
                        Subtotal:{' '}
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Running total */}
              {items.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-base font-mono font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Section: Confirmação ────────────────────────────────────── */}
          {activeSection === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-1">
                  Confirmar Emissão
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revise os dados antes de emitir a NFC-e.
                </p>
              </div>

              {/* Summary card */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300">
                    NFC-e
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Consumidor
                  </span>
                  <span className="text-sm font-medium">
                    {recipientName.trim() || 'Consumidor Final'}
                  </span>
                </div>

                {recipientCpf.trim() && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">CPF</span>
                    <span className="text-sm font-mono">
                      {recipientCpf.trim()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Quantidade de Itens
                  </span>
                  <span className="text-sm">{items.length}</span>
                </div>

                <div className="border-t pt-3 flex justify-between">
                  <span className="text-sm font-medium">Valor Total</span>
                  <span className="text-base font-mono font-bold text-teal-600 dark:text-teal-400">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>

              {/* Items table preview */}
              <div className="rounded-lg border">
                <div className="px-4 py-2 border-b bg-muted/30">
                  <span className="text-xs font-medium text-muted-foreground">
                    Itens
                  </span>
                </div>
                <div className="divide-y">
                  {items.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-2 flex justify-between items-center"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <span className="text-sm truncate block">
                          {item.productName || '(sem descrição)'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                          {item.cfop && ` | CFOP ${item.cfop}`}
                        </span>
                      </div>
                      <span className="text-sm font-mono shrink-0">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!hasValidItems && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-500/10 p-3">
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Existem itens com campos obrigatórios não preenchidos. Volte
                    à seção de itens para corrigir.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </NavigationWizardDialog>
  );
}
