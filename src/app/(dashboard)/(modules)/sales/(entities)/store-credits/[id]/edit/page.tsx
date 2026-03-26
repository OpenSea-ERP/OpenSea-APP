/**
 * OpenSea OS - Edit Store Credit Page
 * Pagina de edicao de credito de loja (campos limitados apos criacao)
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useStoreCredit,
  useDeleteStoreCredit,
} from '@/hooks/sales/use-store-credits';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { StoreCreditDTO } from '@/types/sales';
import { STORE_CREDIT_SOURCE_LABELS } from '@/types/sales';
import {
  Calendar,
  CreditCard,
  FileText,
  Info,
  Loader2,
  Save,
  Trash2,
  Wallet,
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
// HELPERS
// =============================================================================

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditStoreCreditPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const id = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: creditData,
    isLoading,
    error,
  } = useStoreCredit(id);

  const storeCredit = creditData?.storeCredit as StoreCreditDTO | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteStoreCredit();

  // ============================================================================
  // STATE
  // ============================================================================

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (storeCredit) {
      setExpiresAt(toDateInputValue(storeCredit.expiresAt));
      setIsActive(storeCredit.isActive ?? true);
      // Notes are not in the DTO but we provide the field for future use
      setNotes('');
    }
  }, [storeCredit]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    // Store credits have no update endpoint — this page is mostly informational
    // with the ability to delete. Show a toast explaining the limitation.
    toast.info(
      'Creditos de loja nao podem ser editados apos a criacao. Utilize a exclusao se necessario.'
    );
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Credito excluido com sucesso!');
      router.push('/sales/store-credits');
    } catch (err) {
      logger.error(
        'Erro ao deletar credito',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar credito', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.STORE_CREDITS.REMOVE)
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
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Creditos de Loja', href: '/sales/store-credits' },
    {
      label: storeCredit ? formatCurrency(storeCredit.amount) : '...',
      href: `/sales/store-credits/${id}`,
    },
    { label: 'Editar' },
  ];

  if (isLoading) {
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

  if (error || !storeCredit) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Credito nao encontrado"
            message="O credito de loja solicitado nao foi encontrado."
            action={{
              label: 'Voltar para Creditos',
              onClick: () => router.push('/sales/store-credits'),
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-emerald-500 to-teal-600">
              <Wallet className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Detalhes do credito de loja
              </p>
              <h1 className="text-xl font-bold truncate">
                {formatCurrency(storeCredit.amount)}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {storeCredit.isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch
                  checked={storeCredit.isActive}
                  disabled
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Valores (read-only) */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={CreditCard}
                title="Valores"
                subtitle="Valor original e saldo atual (somente leitura)"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Valor Original</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(storeCredit.amount)}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Saldo Atual</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(storeCredit.balance)}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Origem</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {STORE_CREDIT_SOURCE_LABELS[storeCredit.source] ??
                          storeCredit.source}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Validade */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Calendar}
                title="Validade"
                subtitle="Data de expiracao do credito"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Expira em</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        {storeCredit.expiresAt
                          ? new Date(storeCredit.expiresAt).toLocaleDateString(
                              'pt-BR',
                              {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              }
                            )
                          : 'Sem data de expiracao'}
                      </span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Cliente</Label>
                    <div className="flex items-center h-10 px-3 rounded-md border border-border bg-muted/50">
                      <span className="text-sm text-muted-foreground truncate">
                        {storeCredit.customerName ?? storeCredit.customerId}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Info notice */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Informacoes"
                subtitle="Creditos de loja nao podem ser editados apos a criacao"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <p className="text-sm text-muted-foreground">
                  Creditos de loja sao imutaveis apos a criacao. Para corrigir
                  um credito, exclua-o e crie um novo. O saldo e atualizado
                  automaticamente conforme o uso.
                </p>
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
        title="Excluir Credito"
        description={`Digite seu PIN de acao para excluir este credito de loja de ${formatCurrency(storeCredit.amount)}. Esta acao nao pode ser desfeita.`}
      />
    </PageLayout>
  );
}
