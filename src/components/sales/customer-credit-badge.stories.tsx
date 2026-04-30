import type { Meta, StoryObj } from '@storybook/react';
import { ShieldCheck, Wallet } from 'lucide-react';
import { CustomerCreditBadge } from './customer-credit-badge';
import { cn } from '@/lib/utils';

/**
 * `CustomerCreditBadge` — pílula compacta do PDV que mostra crédito
 * disponível (limite + store credit). Cores por status:
 *  - **emerald** (≥50% disponível)
 *  - **amber** (10–50%)
 *  - **rose** (<10% ou bloqueado)
 *
 * **Constraint de Storybook:** o componente real chama `useCustomerCredit`
 * (TanStack Query → `customersService.getCredit`). Sem mock de API a query
 * fica em loading e o badge não renderiza nada (early return). Usamos
 * **réplica visual** com o mesmo markup para storiar os 4 tons.
 */
const meta = {
  title: 'Modules/Sales/CustomerCreditBadge',
  component: CustomerCreditBadge,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Pílula compacta de crédito do cliente exibida no PDV antes de fechar venda fiada. Tons mudam por proporção disponível/limite. Stories são réplicas visuais (componente real depende de query).',
      },
    },
  },
} satisfies Meta<typeof CustomerCreditBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const TONE_CLASSES: Record<string, string> = {
  emerald:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30',
  amber:
    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',
  rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30',
};

interface ReplicaProps {
  hasLimit?: boolean;
  isActive?: boolean;
  available?: number;
  creditLimit?: number;
  storeCreditBalance?: number;
  showStoreCredit?: boolean;
}

function CustomerCreditBadgeReplica({
  hasLimit = false,
  isActive = true,
  available = 0,
  creditLimit = 0,
  storeCreditBalance = 0,
  showStoreCredit = true,
}: ReplicaProps) {
  const ratio = hasLimit && creditLimit > 0 ? available / creditLimit : 0;
  const tone = !isActive
    ? 'rose'
    : ratio >= 0.5
      ? 'emerald'
      : ratio >= 0.1
        ? 'amber'
        : 'rose';

  const hasAnything = hasLimit || (showStoreCredit && storeCreditBalance > 0);
  if (!hasAnything) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        Sem dados de crédito — componente retorna null
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {hasLimit && (
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
            TONE_CLASSES[tone]
          )}
          title={
            isActive
              ? `Disponível: ${formatBRL(available)} de ${formatBRL(creditLimit)}`
              : 'Limite de crédito inativo'
          }
        >
          <ShieldCheck className="h-3 w-3" />
          {isActive ? `Crédito: ${formatBRL(available)}` : 'Crédito bloqueado'}
        </span>
      )}
      {showStoreCredit && storeCreditBalance > 0 && (
        <span
          className={cn(
            'inline-flex w-fit items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
            'bg-violet-50 text-violet-700 border-violet-200',
            'dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30'
          )}
          title={`Store credit disponível: ${formatBRL(storeCreditBalance)}`}
        >
          <Wallet className="h-3 w-3" />
          Store credit: {formatBRL(storeCreditBalance)}
        </span>
      )}
    </div>
  );
}

export const HealthyCredit: Story = {
  name: 'Healthy (>50% disponível — verde)',
  render: () => (
    <CustomerCreditBadgeReplica
      hasLimit
      isActive
      available={3500}
      creditLimit={5000}
    />
  ),
};

export const TightCredit: Story = {
  name: 'Tight (10-50% — âmbar)',
  render: () => (
    <CustomerCreditBadgeReplica
      hasLimit
      isActive
      available={1200}
      creditLimit={5000}
    />
  ),
};

export const NearLimit: Story = {
  name: 'Near limit (<10% — rose)',
  render: () => (
    <CustomerCreditBadgeReplica
      hasLimit
      isActive
      available={250}
      creditLimit={5000}
    />
  ),
};

export const Blocked: Story = {
  name: 'Blocked (limite inativo)',
  render: () => (
    <CustomerCreditBadgeReplica
      hasLimit
      isActive={false}
      available={0}
      creditLimit={5000}
    />
  ),
};

export const StoreCreditOnly: Story = {
  name: 'Store credit only (sem limite cadastrado)',
  render: () => (
    <CustomerCreditBadgeReplica hasLimit={false} storeCreditBalance={185.5} />
  ),
};

export const Both: Story = {
  name: 'Both (limite + store credit)',
  render: () => (
    <CustomerCreditBadgeReplica
      hasLimit
      isActive
      available={2800}
      creditLimit={5000}
      storeCreditBalance={75.0}
    />
  ),
};

export const Empty: Story = {
  name: 'Empty (sem nada — retorna null)',
  render: () => <CustomerCreditBadgeReplica />,
};
