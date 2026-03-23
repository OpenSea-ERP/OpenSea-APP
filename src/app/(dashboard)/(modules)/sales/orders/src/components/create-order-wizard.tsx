'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCustomersInfinite } from '@/hooks/sales/use-customers';
import { usePaymentConditionsInfinite } from '@/hooks/sales/use-payment-conditions';
import type { Customer, CreateOrderRequest } from '@/types/sales';
import {
  Check,
  FileText,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

// ─── Local Types ───────────────────────────────────────────────

interface WizardItem {
  id: string;
  name: string;
  sku: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

interface CreateOrderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateOrderRequest) => Promise<void>;
  isSubmitting?: boolean;
}

// ─── Step 1: Selecionar Cliente ────────────────────────────────

function StepCustomer({
  selected,
  onSelect,
  onSkip,
}: {
  selected: Customer | null;
  onSelect: (c: Customer | null) => void;
  onSkip: () => void;
}) {
  const [search, setSearch] = useState('');
  const { customers, isLoading } = useCustomersInfinite();

  const filtered = useMemo(
    () =>
      search.trim()
        ? customers.filter(
            c =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.document ?? '').includes(search)
          )
        : customers,
    [customers, search]
  );

  if (selected) {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Cliente selecionado
        </h3>
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{selected.name}</p>
              <p className="text-sm text-muted-foreground">
                {selected.document ?? selected.email ?? 'Sem documento'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelect(null)}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Alterar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por nome ou documento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-[240px] overflow-y-auto space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando clientes...
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum cliente encontrado.
          </p>
        ) : (
          filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className="w-full text-left rounded-lg px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{c.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.document ?? c.email ?? '—'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          Pular — pedido anônimo
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Adicionar Itens ───────────────────────────────────

function StepItems({
  items,
  onItemsChange,
}: {
  items: WizardItem[];
  onItemsChange: (items: WizardItem[]) => void;
}) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');

  const subtotal = useMemo(
    () =>
      items.reduce((acc, it) => {
        const disc = it.unitPrice * (it.discountPercent / 100);
        return acc + (it.unitPrice - disc) * it.quantity;
      }, 0),
    [items]
  );

  function handleAdd() {
    if (!name.trim() || !price.trim()) return;
    const newItem: WizardItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      sku: sku.trim(),
      quantity: Math.max(1, Number(qty) || 1),
      unitPrice: Math.max(0, Number(price) || 0),
      discountPercent: 0,
    };
    onItemsChange([...items, newItem]);
    setName('');
    setSku('');
    setQty('1');
    setPrice('');
  }

  function handleRemove(id: string) {
    onItemsChange(items.filter(i => i.id !== id));
  }

  function handleQtyChange(id: string, newQty: number) {
    onItemsChange(
      items.map(i =>
        i.id === id ? { ...i, quantity: Math.max(1, newQty) } : i
      )
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-4">
          <Input
            placeholder="Nome do produto *"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Input
            placeholder="SKU"
            value={sku}
            onChange={e => setSku(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Input
            type="number"
            min={1}
            placeholder="Qtd"
            value={qty}
            onChange={e => setQty(e.target.value)}
          />
        </div>
        <div className="col-span-3">
          <Input
            type="number"
            min={0}
            step={0.01}
            placeholder="Preço unitário"
            value={price}
            onChange={e => setPrice(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex items-center">
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!name.trim() || !price.trim()}
            className="w-full"
          >
            +
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Produto</th>
                <th className="text-center px-2 py-2 font-medium w-16">Qtd</th>
                <th className="text-right px-3 py-2 font-medium w-24">Preço</th>
                <th className="text-right px-3 py-2 font-medium w-24">Total</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">
                    <p className="font-medium truncate">{it.name}</p>
                    {it.sku && (
                      <p className="text-xs text-muted-foreground">{it.sku}</p>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={e =>
                        handleQtyChange(it.id, Number(e.target.value))
                      }
                      className="h-7 text-center w-14 mx-auto"
                    />
                  </td>
                  <td className="text-right px-3 py-2">
                    R$ {it.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right px-3 py-2 font-medium">
                    R$ {(it.unitPrice * it.quantity).toFixed(2)}
                  </td>
                  <td className="px-1 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(it.id)}
                      className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 border-t bg-muted/30 flex justify-end">
            <span className="font-semibold text-sm">
              Subtotal: R$ {subtotal.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-6 text-sm">
          Nenhum item adicionado. Adicione ao menos um item para continuar.
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Condições e Revisão ──────────────────────────────

function StepConditionsAndReview({
  customer,
  items,
  paymentConditionId,
  onPaymentConditionChange,
  notes,
  onNotesChange,
  expiresAt,
  onExpiresAtChange,
}: {
  customer: Customer | null;
  items: WizardItem[];
  paymentConditionId: string;
  onPaymentConditionChange: (id: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  expiresAt: string;
  onExpiresAtChange: (v: string) => void;
}) {
  const { data: pcData } = usePaymentConditionsInfinite(undefined, 50);
  const conditions = pcData?.pages?.flatMap(p => p.data) ?? [];
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{customer?.name ?? 'Pedido anônimo'}</span>
        </div>
        <div className="text-sm font-semibold">
          {items.length} {items.length === 1 ? 'item' : 'itens'} — R${' '}
          {subtotal.toFixed(2)}
        </div>
      </div>

      {/* Condição de pagamento */}
      <div className="space-y-2">
        <Label>Condição de Pagamento</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={paymentConditionId}
          onChange={e => onPaymentConditionChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {conditions.map(pc => (
            <option key={pc.id} value={pc.id}>
              {pc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Data de validade */}
      <div className="space-y-2">
        <Label>Data de Validade / Previsão</Label>
        <Input
          type="date"
          value={expiresAt}
          onChange={e => onExpiresAtChange(e.target.value)}
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas adicionais sobre o pedido..."
          rows={3}
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Main Wizard Component ────────────────────────────────────

const ANONYMOUS_CUSTOMER_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_PIPELINE_ID = 'default';
const DEFAULT_STAGE_ID = 'default';

export function CreateOrderWizard({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateOrderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [items, setItems] = useState<WizardItem[]>([]);
  const [paymentConditionId, setPaymentConditionId] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setCustomer(null);
    setIsAnonymous(false);
    setItems([]);
    setPaymentConditionId('');
    setNotes('');
    setExpiresAt('');
    onOpenChange(false);
  }, [onOpenChange]);

  function handleSkipCustomer() {
    setCustomer(null);
    setIsAnonymous(true);
    setCurrentStep(2);
  }

  function handleSelectCustomer(c: Customer | null) {
    setCustomer(c);
    if (c) {
      setIsAnonymous(false);
    }
  }

  async function handleSubmit(type: 'QUOTE' | 'ORDER') {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const payload: CreateOrderRequest = {
      type,
      customerId: customer?.id ?? ANONYMOUS_CUSTOMER_ID,
      pipelineId: DEFAULT_PIPELINE_ID,
      stageId: DEFAULT_STAGE_ID,
      channel: 'MANUAL' as const,
      subtotal,
      paymentConditionId: paymentConditionId || undefined,
      notes: notes || undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      items: items.map(it => ({
        variantId: it.variantId,
        name: it.name,
        sku: it.sku || undefined,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent,
        discountValue: it.unitPrice * (it.discountPercent / 100) * it.quantity,
      })),
    };

    await onSubmit(payload);
    handleClose();
  }

  const steps: WizardStep[] = [
    {
      title: 'Selecione o Cliente',
      description: 'Escolha um cliente existente ou crie um pedido anônimo.',
      icon: <User className="h-16 w-16 text-sky-400" strokeWidth={1.2} />,
      content: (
        <StepCustomer
          selected={customer}
          onSelect={handleSelectCustomer}
          onSkip={handleSkipCustomer}
        />
      ),
      isValid: customer !== null || isAnonymous,
    },
    {
      title: 'Adicione os Itens',
      description: 'Informe os produtos e quantidades do pedido.',
      icon: (
        <Package className="h-16 w-16 text-emerald-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(1),
      content: <StepItems items={items} onItemsChange={setItems} />,
      isValid: items.length > 0,
    },
    {
      title: 'Condições e Finalização',
      description: 'Defina as condições de pagamento e finalize o pedido.',
      icon: (
        <ShoppingCart className="h-16 w-16 text-violet-400" strokeWidth={1.2} />
      ),
      onBack: () => setCurrentStep(2),
      content: (
        <StepConditionsAndReview
          customer={customer}
          items={items}
          paymentConditionId={paymentConditionId}
          onPaymentConditionChange={setPaymentConditionId}
          notes={notes}
          onNotesChange={setNotes}
          expiresAt={expiresAt}
          onExpiresAtChange={setExpiresAt}
        />
      ),
      isValid: true,
      footer: (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit('QUOTE')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Salvar como Orçamento
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit('ORDER')}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirmar Pedido
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
