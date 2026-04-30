import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/types/finance';
import { BulkPayDrawer } from './bulk-pay-drawer';

// ============================================================================
// VISUAL REPLICA
// ----------------------------------------------------------------------------
// O componente real (`BulkPayDrawer`) depende dos hooks `useBankAccounts` e
// `useBulkPayEntries` (TanStack Query + mutation), que não resolvem em
// Storybook. As stories abaixo replicam o layout do drawer com os mesmos
// primitivos (Sheet, Select, Input, Button) e fixtures inline para demonstrar
// a UX de bulk payment de Contas a Pagar/Receber.
// ============================================================================

const PAYMENT_METHODS: PaymentMethod[] = [
  'PIX',
  'BOLETO',
  'TRANSFER',
  'CASH',
  'CHECK',
  'CARD',
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

interface FakeBankAccount {
  id: string;
  name: string;
  bankName?: string;
}

const bankAccountsFixture: FakeBankAccount[] = [
  { id: 'ba_1', name: 'Conta Corrente Principal', bankName: 'Banco do Brasil' },
  { id: 'ba_2', name: 'Conta Pagamentos', bankName: 'Itaú' },
  { id: 'ba_3', name: 'Conta Reserva', bankName: 'Nubank' },
];

interface BulkPayDrawerReplicaProps {
  selectedCount: number;
  totalAmount: number;
  actionLabel: string;
  isSubmitting?: boolean;
  defaultMethod?: PaymentMethod;
  defaultBankAccountId?: string;
  defaultReference?: string;
}

function BulkPayDrawerReplica({
  selectedCount,
  totalAmount,
  actionLabel,
  isSubmitting = false,
  defaultMethod = 'PIX',
  defaultBankAccountId = '',
  defaultReference = '',
}: BulkPayDrawerReplicaProps) {
  const [open, setOpen] = useState(true);
  const [bankAccountId, setBankAccountId] = useState(defaultBankAccountId);
  const [method, setMethod] = useState<PaymentMethod>(defaultMethod);
  const [reference, setReference] = useState(defaultReference);

  const canSubmit = !!bankAccountId && selectedCount > 0 && !isSubmitting;

  return (
    <>
      <Button onClick={() => setOpen(true)}>Reabrir drawer</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md flex flex-col gap-0 p-0"
        >
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle>{actionLabel} em Lote</SheetTitle>
            <SheetDescription>
              Processe {selectedCount}{' '}
              {selectedCount === 1 ? 'lançamento' : 'lançamentos'} em uma única
              operação.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Lançamentos</span>
                <span className="font-semibold">{selectedCount}</span>
              </div>
              <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Valor total
                </span>
                <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sb-bulk-pay-bank">Conta Bancária *</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger id="sb-bulk-pay-bank">
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccountsFixture.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                      {account.bankName ? ` (${account.bankName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sb-bulk-pay-method">Forma de Pagamento *</Label>
              <Select
                value={method}
                onValueChange={v => setMethod(v as PaymentMethod)}
              >
                <SelectTrigger id="sb-bulk-pay-method">
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sb-bulk-pay-ref">Referência (opcional)</Label>
              <Input
                id="sb-bulk-pay-ref"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Número do comprovante, protocolo, etc."
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-border/50 flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              disabled={!canSubmit}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
              ) : (
                <DollarSign className="h-4 w-4 mr-2" aria-hidden />
              )}
              {actionLabel} ({selectedCount})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ============================================================================
// META
// ============================================================================

const meta = {
  title: 'Modules/Finance/BulkPayDrawer',
  component: BulkPayDrawer,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Drawer compacto (single-screen) para baixa em lote de Contas a Pagar/Receber — alternativa ao 3-step wizard `BulkPayModal`. Inspiração Omie.Cash. **Stories usam réplica visual** porque o componente real depende dos hooks `useBankAccounts` + `useBulkPayEntries` que não resolvem em Storybook.',
      },
    },
  },
} satisfies Meta<typeof BulkPayDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// STORIES
// ============================================================================

export const Default: Story = {
  render: () => (
    <BulkPayDrawerReplica
      selectedCount={5}
      totalAmount={6234.56}
      actionLabel="Registrar Pagamento"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '5 lançamentos selecionados, total de R$ 6.234,56 — caso típico ao processar contas a pagar do dia.',
      },
    },
  },
};

export const ManySelected: Story = {
  render: () => (
    <BulkPayDrawerReplica
      selectedCount={47}
      totalAmount={48923.18}
      actionLabel="Registrar Pagamento"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '47 lançamentos — uso pesado, batch de fim de mês com folha de fornecedores.',
      },
    },
  },
};

export const SingleEntry: Story = {
  render: () => (
    <BulkPayDrawerReplica
      selectedCount={1}
      totalAmount={1234.56}
      actionLabel="Registrar Pagamento"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '1 lançamento — texto pluralizado dinâmicamente ("lançamento" no singular).',
      },
    },
  },
};

export const ReceivableContext: Story = {
  render: () => (
    <BulkPayDrawerReplica
      selectedCount={12}
      totalAmount={18750.0}
      actionLabel="Registrar Recebimento"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Mesma UX reaproveitada para Contas a Receber — o `actionLabel` muda o título e o CTA.',
      },
    },
  },
};

export const Submitting: Story = {
  render: () => (
    <BulkPayDrawerReplica
      selectedCount={5}
      totalAmount={6234.56}
      actionLabel="Registrar Pagamento"
      isSubmitting
      defaultBankAccountId="ba_1"
      defaultReference="DOC-2025-05-15-001"
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Estado durante o submit — botão com Loader2 girando e disabled, evitando double-submit em batch grande.',
      },
    },
  },
};

export const WithError: Story = {
  render: () => (
    <div className="relative">
      <BulkPayDrawerReplica
        selectedCount={5}
        totalAmount={6234.56}
        actionLabel="Registrar Pagamento"
      />
      <div
        role="alert"
        className="fixed top-4 right-4 z-[100] w-80 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
      >
        <p className="font-semibold mb-1">Falha em 2 lançamentos</p>
        <p className="text-xs opacity-90">
          3 de 5 lançamentos processados. Revise saldos e tente novamente.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Toast de aviso (warning) renderizado pelo `sonner` quando o backend retorna sucesso parcial — alguns lançamentos foram processados, outros não.',
      },
    },
  },
};
