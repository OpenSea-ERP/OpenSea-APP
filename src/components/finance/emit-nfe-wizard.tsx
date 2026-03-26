'use client';

import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { translateError } from '@/lib/error-messages';
import { useEmitNfe } from '@/hooks/finance/use-fiscal';
import type { EmitNfeData } from '@/types/fiscal';
import type { FiscalDocumentDetailDTO } from '@/types/fiscal';
import {
  CheckCircle2,
  FileCheck,
  FileText,
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

interface EmitNfeWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface NfeItemForm {
  id: string;
  productName: string;
  productCode: string;
  ncm: string;
  cfop: string;
  quantity: number;
  unitPrice: number;
}

interface RecipientForm {
  name: string;
  cnpjCpf: string;
  inscricaoEstadual: string;
  naturezaOperacao: string;
  cfop: string;
}

interface ValidationErrors {
  recipient: Record<string, string | undefined>;
  items: Record<string, Record<string, string>>;
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

function createDefaultItem(defaultCfop: string): NfeItemForm {
  itemIdCounter += 1;
  return {
    id: `wizard-item-${itemIdCounter}`,
    productName: '',
    productCode: '',
    ncm: '',
    cfop: defaultCfop || '5102',
    quantity: 1,
    unitPrice: 0,
  };
}

const INITIAL_RECIPIENT: RecipientForm = {
  name: '',
  cnpjCpf: '',
  inscricaoEstadual: '',
  naturezaOperacao: 'Venda de mercadoria',
  cfop: '5102',
};

// ============================================================================
// VALIDATION
// ============================================================================

function validateRecipient(recipient: RecipientForm): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!recipient.name || recipient.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!recipient.cnpjCpf || recipient.cnpjCpf.replace(/\D/g, '').length < 11) {
    errors.cnpjCpf = 'CNPJ/CPF deve ter pelo menos 11 dígitos';
  }

  if (
    !recipient.naturezaOperacao ||
    recipient.naturezaOperacao.trim().length === 0
  ) {
    errors.naturezaOperacao = 'Natureza da operação é obrigatória';
  }

  if (!recipient.cfop || recipient.cfop.trim().length === 0) {
    errors.cfop = 'CFOP é obrigatório';
  }

  return errors;
}

function validateItems(
  items: NfeItemForm[]
): Record<string, Record<string, string>> {
  const errors: Record<string, Record<string, string>> = {};

  for (const item of items) {
    const itemErrors: Record<string, string> = {};

    if (!item.productName || item.productName.trim().length === 0) {
      itemErrors.productName = 'Descrição é obrigatória';
    }

    if (!item.cfop || item.cfop.trim().length === 0) {
      itemErrors.cfop = 'CFOP é obrigatório';
    }

    if (!item.quantity || item.quantity <= 0) {
      itemErrors.quantity = 'Quantidade deve ser maior que zero';
    }

    if (!item.unitPrice || item.unitPrice <= 0) {
      itemErrors.unitPrice = 'Preço deve ser maior que zero';
    }

    if (Object.keys(itemErrors).length > 0) {
      errors[item.id] = itemErrors;
    }
  }

  return errors;
}

function validateAll(
  recipient: RecipientForm,
  items: NfeItemForm[]
): ValidationErrors {
  return {
    recipient: validateRecipient(recipient),
    items: validateItems(items),
  };
}

function hasErrors(errors: ValidationErrors): boolean {
  return (
    Object.keys(errors.recipient).length > 0 ||
    Object.keys(errors.items).length > 0
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmitNfeWizard({
  open,
  onOpenChange,
  onSuccess,
}: EmitNfeWizardProps) {
  const emitMutation = useEmitNfe();

  // State
  const [activeSection, setActiveSection] = useState('recipient');
  const [recipient, setRecipient] = useState<RecipientForm>({
    ...INITIAL_RECIPIENT,
  });
  const [items, setItems] = useState<NfeItemForm[]>(() => [
    createDefaultItem('5102'),
  ]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({
    recipient: {},
    items: {},
  });
  const [emissionResult, setEmissionResult] =
    useState<FiscalDocumentDetailDTO | null>(null);

  // Computed
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

  const isFormValid = useMemo(() => {
    const v = validateAll(recipient, items);
    return !hasErrors(v) && items.length > 0;
  }, [recipient, items]);

  const sectionErrors = useMemo(() => {
    const v = validateAll(recipient, items);
    return {
      recipient: Object.keys(v.recipient).length > 0,
      items: Object.keys(v.items).length > 0 || items.length === 0,
      confirm: false,
    };
  }, [recipient, items]);

  // Sections
  const sections: NavigationSection[] = useMemo(
    () => [
      {
        id: 'recipient',
        label: 'Destinatário',
        icon: <User className="h-4 w-4" />,
        description: 'Dados do destinatário',
      },
      {
        id: 'items',
        label: 'Itens',
        icon: <ListOrdered className="h-4 w-4" />,
        description: 'Produtos da nota fiscal',
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

  // Handlers — Recipient
  const handleRecipientChange = useCallback(
    (field: keyof RecipientForm, value: string) => {
      setRecipient(prev => ({ ...prev, [field]: value }));
      setErrors(prev => ({
        ...prev,
        recipient: { ...prev.recipient, [field]: undefined },
      }));
    },
    []
  );

  // Handlers — Items
  const handleAddItem = useCallback(() => {
    setItems(prev => [...prev, createDefaultItem(recipient.cfop)]);
  }, [recipient.cfop]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleUpdateItem = useCallback(
    (itemId: string, field: keyof NfeItemForm, value: string | number) => {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
      setErrors(prev => {
        const itemErrors = { ...prev.items };
        if (itemErrors[itemId]) {
          const updated = { ...itemErrors[itemId] };
          delete updated[field];
          if (Object.keys(updated).length === 0) {
            delete itemErrors[itemId];
          } else {
            itemErrors[itemId] = updated;
          }
        }
        return { ...prev, items: itemErrors };
      });
    },
    []
  );

  // Emit
  const handleEmit = useCallback(async () => {
    const validation = validateAll(recipient, items);

    if (hasErrors(validation) || items.length === 0) {
      setErrors(validation);
      toast.error('Corrija os campos obrigatórios antes de emitir.');
      return;
    }

    try {
      const data: EmitNfeData = {
        recipientName: recipient.name.trim(),
        recipientCnpjCpf: recipient.cnpjCpf.replace(/\D/g, ''),
        naturezaOperacao: recipient.naturezaOperacao.trim(),
        cfop: recipient.cfop.trim(),
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
      toast.success('NF-e emitida com sucesso!');
      onSuccess?.();
    } catch (err) {
      toast.error(translateError(err));
    }
  }, [recipient, items, emitMutation, onSuccess]);

  // Close / Reset
  const handleClose = useCallback(() => {
    if (emitMutation.isPending) return;
    setEmissionResult(null);
    setActiveSection('recipient');
    setRecipient({ ...INITIAL_RECIPIENT });
    setItems([createDefaultItem('5102')]);
    setAdditionalInfo('');
    setErrors({ recipient: {}, items: {} });
    onOpenChange(false);
  }, [emitMutation.isPending, onOpenChange]);

  // Footer
  const footer = useMemo(() => {
    if (emissionResult) {
      return <Button onClick={handleClose}>Fechar</Button>;
    }

    return (
      <>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={emitMutation.isPending}
        >
          Cancelar
        </Button>
        {activeSection === 'confirm' ? (
          <Button
            onClick={handleEmit}
            disabled={emitMutation.isPending || !isFormValid}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {emitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            Emitir NF-e
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
    isFormValid,
    sections,
  ]);

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={handleClose}
      title="Emitir NF-e"
      subtitle="Emissão de NF-e diretamente pela área fiscal"
      sections={sections}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      footer={footer}
      isPending={emitMutation.isPending}
      sectionErrors={sectionErrors}
    >
      {/* ================================================================ */}
      {/* SUCCESS STATE                                                     */}
      {/* ================================================================ */}
      {emissionResult ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                NF-e emitida com sucesso!
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                O documento foi emitido e transmitido à SEFAZ.
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
              <Badge
                className={cn(
                  'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300'
                )}
              >
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
              <div className="flex flex-col gap-1">
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
          {/* ============================================================ */}
          {/* SECTION 1: DESTINATÁRIO                                       */}
          {/* ============================================================ */}
          {activeSection === 'recipient' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold mb-1">
                  Dados do Destinatário
                </h3>
                <p className="text-sm text-muted-foreground">
                  Informe os dados do destinatário da NF-e.
                </p>
              </div>

              <div className="space-y-4">
                {/* Nome / Razão Social */}
                <div className="space-y-2">
                  <Label className="text-xs">Nome / Razão Social *</Label>
                  <Input
                    value={recipient.name}
                    onChange={e =>
                      handleRecipientChange('name', e.target.value)
                    }
                    placeholder="Ex: Empresa Ltda ou João da Silva"
                    className={cn(
                      errors.recipient.name &&
                        'border-rose-500 focus-visible:ring-rose-500'
                    )}
                  />
                  {errors.recipient.name && (
                    <p className="text-xs text-rose-500">
                      {errors.recipient.name}
                    </p>
                  )}
                </div>

                {/* CNPJ / CPF */}
                <div className="space-y-2">
                  <Label className="text-xs">CNPJ / CPF *</Label>
                  <Input
                    value={recipient.cnpjCpf}
                    onChange={e =>
                      handleRecipientChange('cnpjCpf', e.target.value)
                    }
                    placeholder="Ex: 12.345.678/0001-90 ou 123.456.789-00"
                    className={cn(
                      errors.recipient.cnpjCpf &&
                        'border-rose-500 focus-visible:ring-rose-500'
                    )}
                  />
                  {errors.recipient.cnpjCpf && (
                    <p className="text-xs text-rose-500">
                      {errors.recipient.cnpjCpf}
                    </p>
                  )}
                </div>

                {/* Inscrição Estadual */}
                <div className="space-y-2">
                  <Label className="text-xs">Inscrição Estadual</Label>
                  <Input
                    value={recipient.inscricaoEstadual}
                    onChange={e =>
                      handleRecipientChange('inscricaoEstadual', e.target.value)
                    }
                    placeholder="Opcional"
                  />
                </div>

                <div className="border-t pt-4 space-y-4">
                  {/* Natureza da Operação */}
                  <div className="space-y-2">
                    <Label className="text-xs">Natureza da Operação *</Label>
                    <Input
                      value={recipient.naturezaOperacao}
                      onChange={e =>
                        handleRecipientChange(
                          'naturezaOperacao',
                          e.target.value
                        )
                      }
                      placeholder="Ex: Venda de mercadoria"
                      className={cn(
                        errors.recipient.naturezaOperacao &&
                          'border-rose-500 focus-visible:ring-rose-500'
                      )}
                    />
                    {errors.recipient.naturezaOperacao && (
                      <p className="text-xs text-rose-500">
                        {errors.recipient.naturezaOperacao}
                      </p>
                    )}
                  </div>

                  {/* CFOP Padrão */}
                  <div className="space-y-2">
                    <Label className="text-xs">CFOP Padrão *</Label>
                    <Input
                      value={recipient.cfop}
                      onChange={e =>
                        handleRecipientChange('cfop', e.target.value)
                      }
                      placeholder="Ex: 5102"
                      maxLength={4}
                      className={cn(
                        errors.recipient.cfop &&
                          'border-rose-500 focus-visible:ring-rose-500'
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Este CFOP será usado como padrão para novos itens.
                    </p>
                    {errors.recipient.cfop && (
                      <p className="text-xs text-rose-500">
                        {errors.recipient.cfop}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION 2: ITENS                                              */}
          {/* ============================================================ */}
          {activeSection === 'items' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold mb-1">
                    Itens da NF-e
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione os produtos que serão incluídos na nota fiscal.
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
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <ListOrdered className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum item adicionado. Clique em &quot;Adicionar Item&quot;
                    para começar.
                  </p>
                </div>
              )}

              <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                {items.map((item, index) => {
                  const itemErrors = errors.items[item.id] || {};
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'rounded-lg border p-4 space-y-3',
                        Object.keys(itemErrors).length > 0 &&
                          'border-rose-300 dark:border-rose-800'
                      )}
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

                      {/* Descrição do Produto */}
                      <div className="space-y-2">
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
                            itemErrors.productName &&
                              'border-rose-500 focus-visible:ring-rose-500'
                          )}
                        />
                        {itemErrors.productName && (
                          <p className="text-xs text-rose-500">
                            {itemErrors.productName}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Código do Produto */}
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

                        {/* NCM */}
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

                        {/* CFOP */}
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
                              itemErrors.cfop &&
                                'border-rose-500 focus-visible:ring-rose-500'
                            )}
                          />
                          {itemErrors.cfop && (
                            <p className="text-xs text-rose-500">
                              {itemErrors.cfop}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Quantidade */}
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
                              itemErrors.quantity &&
                                'border-rose-500 focus-visible:ring-rose-500'
                            )}
                          />
                          {itemErrors.quantity && (
                            <p className="text-xs text-rose-500">
                              {itemErrors.quantity}
                            </p>
                          )}
                        </div>

                        {/* Preço Unitário */}
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
                              itemErrors.unitPrice &&
                                'border-rose-500 focus-visible:ring-rose-500'
                            )}
                          />
                          {itemErrors.unitPrice && (
                            <p className="text-xs text-rose-500">
                              {itemErrors.unitPrice}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <span className="text-sm font-mono text-muted-foreground">
                          Subtotal:{' '}
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs">
                  Informações Adicionais (opcional)
                </Label>
                <Textarea
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  placeholder="Observações que aparecerão no documento fiscal..."
                  rows={2}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {additionalInfo.length}/2000
                </p>
              </div>

              {/* Running Total */}
              <div className="flex items-center justify-between rounded-lg bg-teal-50 dark:bg-teal-500/8 px-4 py-3 border border-teal-200 dark:border-teal-500/20">
                <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
                  Total
                </span>
                <span className="text-lg font-mono font-bold text-teal-700 dark:text-teal-300">
                  {formatCurrency(totalValue)}
                </span>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SECTION 3: CONFIRMAÇÃO                                        */}
          {/* ============================================================ */}
          {activeSection === 'confirm' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold mb-1">
                  Confirmar Emissão
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revise os dados antes de emitir a NF-e.
                </p>
              </div>

              {/* Summary Card */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge
                    className={cn(
                      'bg-teal-50 text-teal-700 dark:bg-teal-500/8 dark:text-teal-300'
                    )}
                  >
                    NF-e
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Destinatário
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-medium block">
                      {recipient.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {recipient.cnpjCpf}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Natureza da Operação
                  </span>
                  <span className="text-sm">{recipient.naturezaOperacao}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    CFOP Padrão
                  </span>
                  <span className="text-sm font-mono">{recipient.cfop}</span>
                </div>

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

              {/* Items Table Preview */}
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
                      <div className="min-w-0 flex-1">
                        <span className="text-sm block truncate">
                          {item.productName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                          {item.productCode && ` | Cód: ${item.productCode}`}
                          {item.ncm && ` | NCM: ${item.ncm}`}
                          {` | CFOP: ${item.cfop}`}
                        </span>
                      </div>
                      <span className="text-sm font-mono ml-4 shrink-0">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              {additionalInfo.trim() && (
                <div className="rounded-lg border p-4">
                  <span className="text-xs text-muted-foreground block mb-1">
                    Informações Adicionais
                  </span>
                  <p className="text-sm whitespace-pre-wrap">
                    {additionalInfo}
                  </p>
                </div>
              )}

              {/* Validation Warnings */}
              {!isFormValid && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-500/10 p-3">
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    Existem campos obrigatórios não preenchidos. Volte às seções
                    anteriores para corrigir.
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
