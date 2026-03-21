'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCustomers } from '@/hooks/sales/use-customers';
import { useCreateOrder } from '@/hooks/sales/use-orders';
import { usePaymentConditionsInfinite } from '@/hooks/sales/use-payment-conditions';
import type { Customer } from '@/types/sales';
import type { CreateOrderRequest } from '@/types/sales';
import {
  ArrowLeft,
  ArrowRight,
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
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

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

// ─── Step Indicator ────────────────────────────────────────────

const STEPS = [
  { label: 'Cliente', icon: User },
  { label: 'Itens', icon: Package },
  { label: 'Condições', icon: FileText },
  { label: 'Revisão', icon: Check },
] as const;

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => {
        const step = STEPS[i];
        const StepIcon = step.icon;
        const isActive = i + 1 === current;
        const isDone = i + 1 < current;
        return (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-8 ${isDone ? 'bg-primary' : 'bg-border'}`}
              />
            )}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isDone
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <StepIcon className="h-3.5 w-3.5" />
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
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
  const { data, isLoading } = useCustomers();
  const customers = data?.customers ?? [];

  const filtered = useMemo(
    () =>
      search.trim()
        ? customers.filter(
            (c) =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              (c.document ?? '').includes(search),
          )
        : customers,
    [customers, search],
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
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-1">
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
          filtered.map((c) => (
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
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
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
    [items],
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
    onItemsChange(items.filter((i) => i.id !== id));
  }

  function handleQtyChange(id: string, newQty: number) {
    onItemsChange(
      items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, newQty) } : i)),
    );
  }

  return (
    <div className="space-y-4">
      {/* Add item form */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
        <h3 className="text-sm font-medium mb-3">Adicionar item</h3>
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <Input
              placeholder="Nome do produto *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Input
              placeholder="SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min={1}
              placeholder="Qtd"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="Preço unit."
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
      </Card>

      {/* Items list */}
      {items.length > 0 && (
        <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Produto</th>
                <th className="text-center px-2 py-2 font-medium w-20">Qtd</th>
                <th className="text-right px-4 py-2 font-medium w-28">
                  Preço Unit.
                </th>
                <th className="text-right px-4 py-2 font-medium w-28">
                  Total
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b last:border-b-0">
                  <td className="px-4 py-2">
                    <p className="font-medium">{it.name}</p>
                    {it.sku && (
                      <p className="text-xs text-muted-foreground">{it.sku}</p>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) =>
                        handleQtyChange(it.id, Number(e.target.value))
                      }
                      className="h-8 text-center w-16 mx-auto"
                    />
                  </td>
                  <td className="text-right px-4 py-2">
                    R$ {it.unitPrice.toFixed(2)}
                  </td>
                  <td className="text-right px-4 py-2 font-medium">
                    R$ {(it.unitPrice * it.quantity).toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
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
          <div className="px-4 py-3 border-t bg-muted/30 flex justify-end">
            <span className="font-semibold">
              Subtotal: R$ {subtotal.toFixed(2)}
            </span>
          </div>
        </Card>
      )}

      {items.length === 0 && (
        <p className="text-center text-muted-foreground py-6">
          Nenhum item adicionado. Adicione ao menos um item para continuar.
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Condições ─────────────────────────────────────────

function StepConditions({
  paymentConditionId,
  onPaymentConditionChange,
  notes,
  onNotesChange,
  expiresAt,
  onExpiresAtChange,
}: {
  paymentConditionId: string;
  onPaymentConditionChange: (id: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  expiresAt: string;
  onExpiresAtChange: (v: string) => void;
}) {
  const { data: pcData } = usePaymentConditionsInfinite(undefined, 50);
  const conditions = pcData?.pages?.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Condição de Pagamento</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={paymentConditionId}
          onChange={(e) => onPaymentConditionChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {conditions.map((pc) => (
            <option key={pc.id} value={pc.id}>
              {pc.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label>Data de Validade / Previsão de Fechamento</Label>
        <Input
          type="date"
          value={expiresAt}
          onChange={(e) => onExpiresAtChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Notas adicionais sobre o pedido..."
          rows={4}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 4: Revisão ───────────────────────────────────────────

function StepReview({
  customer,
  items,
  paymentConditionId,
  notes,
  expiresAt,
}: {
  customer: Customer | null;
  items: WizardItem[];
  paymentConditionId: string;
  notes: string;
  expiresAt: string;
}) {
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Customer */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Cliente
        </h3>
        {customer ? (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customer.document ?? customer.email ?? '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Pedido anônimo</p>
        )}
      </Card>

      {/* Items summary */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
        <h3 className="text-sm font-medium text-muted-foreground px-4 pt-3 pb-2">
          Itens ({items.length})
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-1.5 font-medium">Produto</th>
              <th className="text-center px-2 py-1.5 font-medium w-16">Qtd</th>
              <th className="text-right px-4 py-1.5 font-medium w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b last:border-b-0">
                <td className="px-4 py-1.5">{it.name}</td>
                <td className="text-center px-2 py-1.5">{it.quantity}</td>
                <td className="text-right px-4 py-1.5">
                  R$ {(it.unitPrice * it.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t bg-muted/30 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
          <span className="font-semibold text-lg">
            R$ {subtotal.toFixed(2)}
          </span>
        </div>
      </Card>

      {/* Conditions summary */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Condições
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Pagamento:</span>{' '}
            {paymentConditionId ? 'Definido' : 'Não informado'}
          </div>
          <div>
            <span className="text-muted-foreground">Validade:</span>{' '}
            {expiresAt || 'Sem prazo'}
          </div>
        </div>
        {notes && (
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">Notas:</span>{' '}
            <span className="italic">{notes}</span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

const ANONYMOUS_CUSTOMER_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_PIPELINE_ID = 'default';
const DEFAULT_STAGE_ID = 'default';

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();

  // ── Wizard state
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // ── Form state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [items, setItems] = useState<WizardItem[]>([]);
  const [paymentConditionId, setPaymentConditionId] = useState('');
  const [notes, setNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  // ── Navigation guards
  const canAdvance = useCallback((): boolean => {
    switch (step) {
      case 1:
        return customer !== null || isAnonymous;
      case 2:
        return items.length > 0;
      case 3:
        return true; // conditions are optional
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, customer, isAnonymous, items.length]);

  function handleNext() {
    if (step < totalSteps && canAdvance()) {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSkipCustomer() {
    setCustomer(null);
    setIsAnonymous(true);
    setStep(2);
  }

  function handleSelectCustomer(c: Customer | null) {
    setCustomer(c);
    if (c) {
      setIsAnonymous(false);
    }
  }

  // ── Submit
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
      items: items.map((it, idx) => ({
        variantId: it.variantId,
        name: it.name,
        sku: it.sku || undefined,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discountPercent: it.discountPercent,
        discountValue: it.unitPrice * (it.discountPercent / 100) * it.quantity,
      })),
    };

    try {
      await createOrder.mutateAsync(payload);
      toast.success(
        type === 'QUOTE'
          ? 'Orçamento criado com sucesso!'
          : 'Pedido criado com sucesso!',
      );
      router.push('/sales/orders');
    } catch {
      toast.error('Erro ao criar o pedido. Tente novamente.');
    }
  }

  // ── Render step content
  function renderStep() {
    switch (step) {
      case 1:
        return (
          <StepCustomer
            selected={customer}
            onSelect={handleSelectCustomer}
            onSkip={handleSkipCustomer}
          />
        );
      case 2:
        return <StepItems items={items} onItemsChange={setItems} />;
      case 3:
        return (
          <StepConditions
            paymentConditionId={paymentConditionId}
            onPaymentConditionChange={setPaymentConditionId}
            notes={notes}
            onNotesChange={setNotes}
            expiresAt={expiresAt}
            onExpiresAtChange={setExpiresAt}
          />
        );
      case 4:
        return (
          <StepReview
            customer={customer}
            items={items}
            paymentConditionId={paymentConditionId}
            notes={notes}
            expiresAt={expiresAt}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/sales/orders')}
            className="h-9 px-2.5"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Novo Pedido</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados para criar um pedido ou orçamento
            </p>
          </div>
        </div>
        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={totalSteps} />

      {/* Step content */}
      <Card className="bg-white/5 p-6 mb-6 min-h-[400px]">
        {renderStep()}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="gap-1.5"
            >
              Avançar
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleSubmit('QUOTE')}
                disabled={createOrder.isPending}
                className="gap-1.5"
              >
                {createOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Salvar como Orçamento
              </Button>
              <Button
                onClick={() => handleSubmit('ORDER')}
                disabled={createOrder.isPending}
                className="gap-1.5"
              >
                {createOrder.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Confirmar Pedido
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
