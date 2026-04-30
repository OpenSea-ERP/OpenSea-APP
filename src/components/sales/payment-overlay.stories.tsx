import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  Banknote,
  CreditCard,
  QrCode,
  Wallet,
  MoreHorizontal,
  X,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { PaymentOverlay } from './payment-overlay';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';

/**
 * `PaymentOverlay` — fullscreen payment screen do PDV. Mistura múltiplas
 * formas de pagamento (Dinheiro, Cartão, PIX, Crédito Loja, Outro), com
 * suporte a gateway (InfinitePay/Asaas) e modo manual.
 *
 * **Constraint de Storybook:** o componente real consome `useReceivePayment`,
 * `usePaymentConfig`, `useCreateCharge`, `useChargeStatus` (todos hooks com
 * mutações/queries). Sem mocks de API, abrir a overlay real fica preso em
 * loading. Usamos uma **réplica visual** dos estados-chave (selector,
 * pagamentos adicionados, troco, rodapé com CTA).
 *
 * Touch targets: cards de método `min-h-[80px]`, CTA `h-14` (56px),
 * botões secundários `size-11` (44px) — todos atendem o alvo POS.
 */
const meta = {
  title: 'Modules/Sales/PaymentOverlay',
  component: PaymentOverlay,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Overlay de pagamento do PDV. Suporta split entre métodos (multi-pagamento), troco automático, gateway (PIX QR + cartão checkout link). Stories usam réplica visual.',
      },
    },
  },
} satisfies Meta<typeof PaymentOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

type Method =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PIX'
  | 'STORE_CREDIT'
  | 'OTHER';

const METHOD_LABELS: Record<Method, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX',
  STORE_CREDIT: 'Crédito Loja',
  OTHER: 'Outro',
};

const METHODS: Array<{
  type: Method;
  label: string;
  icon: React.ElementType;
  gateway?: boolean;
}> = [
  { type: 'CASH', label: 'Dinheiro', icon: Banknote },
  {
    type: 'CREDIT_CARD',
    label: 'Cartão Crédito',
    icon: CreditCard,
    gateway: true,
  },
  {
    type: 'DEBIT_CARD',
    label: 'Cartão Débito',
    icon: CreditCard,
    gateway: true,
  },
  { type: 'PIX', label: 'PIX', icon: QrCode, gateway: true },
  { type: 'STORE_CREDIT', label: 'Crédito Loja', icon: Wallet },
  { type: 'OTHER', label: 'Outro', icon: MoreHorizontal },
];

interface AddedPayment {
  id: string;
  method: Method;
  amount: number;
  fromGateway?: boolean;
}

interface ReplicaProps {
  total: number;
  added: AddedPayment[];
  showGatewayBadges?: boolean;
}

function PaymentOverlayReplica({
  total,
  added,
  showGatewayBadges = true,
}: ReplicaProps) {
  const [payments] = useState<AddedPayment[]>(added);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - totalPaid);
  const change = totalPaid > total ? totalPaid - total : 0;
  const canConfirm = totalPaid >= total && payments.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          PAGAMENTO — {formatCurrency(total)}
        </h1>
        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {payments.length > 0 && (
          <div className="mb-4 space-y-2">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              Pagamentos adicionados
            </h2>
            {payments.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {METHOD_LABELS[p.method]}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {formatCurrency(p.amount)}
                  </span>
                  {p.fromGateway && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <Zap className="size-3" />
                      Gateway
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                  aria-label="Remover pagamento"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}

            {remaining > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Restante: {formatCurrency(remaining)}
              </div>
            )}
          </div>
        )}

        {/* Method Selection */}
        {remaining > 0 || payments.length === 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {METHODS.map(({ type, label, icon: Icon, gateway }) => (
              <button
                key={type}
                type="button"
                className={cn(
                  'flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-4',
                  'min-h-[80px] select-none transition-all duration-150',
                  'hover:border-violet-300 hover:shadow-md active:scale-95',
                  'dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-500/50'
                )}
              >
                <Icon className="size-7 text-violet-600 dark:text-violet-400" />
                <span className="text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
                {showGatewayBadges && gateway && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                    <Zap className="size-2.5" />
                    Gateway
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        {change > 0 && (
          <div className="mb-3 text-center text-lg font-bold text-emerald-600 dark:text-emerald-400">
            Troco: {formatCurrency(change)}
          </div>
        )}
        <Button
          disabled={!canConfirm}
          className={cn(
            'h-14 w-full rounded-xl text-base font-bold',
            'bg-violet-600 text-white hover:bg-violet-700',
            'disabled:opacity-50'
          )}
        >
          CONFIRMAR PAGAMENTO
        </Button>
      </div>
    </div>
  );
}

export const MethodSelection: Story = {
  name: 'Method selection (sem pagamento adicionado)',
  render: () => <PaymentOverlayReplica total={89.9} added={[]} />,
};

export const SinglePayment: Story = {
  name: 'Single payment (Dinheiro com troco)',
  render: () => (
    <PaymentOverlayReplica
      total={45.5}
      added={[{ id: 'p-1', method: 'CASH', amount: 50.0 }]}
    />
  ),
};

export const SplitTwoMethods: Story = {
  name: 'Split (2 formas — Cartão + PIX)',
  render: () => (
    <PaymentOverlayReplica
      total={250.0}
      added={[
        { id: 'p-1', method: 'CREDIT_CARD', amount: 150.0, fromGateway: true },
        { id: 'p-2', method: 'PIX', amount: 100.0, fromGateway: true },
      ]}
    />
  ),
};

export const SplitWithRemaining: Story = {
  name: 'Split with remaining (parcial — falta fechar)',
  render: () => (
    <PaymentOverlayReplica
      total={500.0}
      added={[
        { id: 'p-1', method: 'CREDIT_CARD', amount: 200.0, fromGateway: true },
        { id: 'p-2', method: 'STORE_CREDIT', amount: 150.0 },
      ]}
    />
  ),
};

export const NoGateway: Story = {
  name: 'No gateway (sem badges — config offline)',
  render: () => (
    <PaymentOverlayReplica total={89.9} added={[]} showGatewayBadges={false} />
  ),
};
