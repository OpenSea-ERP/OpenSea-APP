/**
 * OpenSea OS - Documentos Fiscais (NF-e / NFC-e)
 * Listagem de documentos fiscais com infinite scroll, filtros server-side e EntityGrid
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { fiscalDocumentConfig } from '@/config/entities/fiscal-document.config';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useFiscalDocumentsInfinite,
  useCancelDocument,
  useCorrectionLetter,
  type FiscalDocumentsFilters,
} from '@/hooks/finance/use-fiscal';
import { EmitNfceWizard } from '@/components/finance/emit-nfce-wizard';
import { EmitNfeWizard } from '@/components/finance/emit-nfe-wizard';
import { cn } from '@/lib/utils';
import type {
  FiscalDocumentDTO,
  FiscalDocumentStatus,
  FiscalDocumentType,
} from '@/types/fiscal';
import {
  FISCAL_DOCUMENT_STATUS_LABELS,
  FISCAL_DOCUMENT_TYPE_LABELS,
} from '@/types/fiscal';
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Loader2,
  PenLine,
  Plus,
  Receipt,
  Settings,
  XCircle,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { id: 'DRAFT', label: 'Rascunho' },
  { id: 'PENDING', label: 'Pendente' },
  { id: 'AUTHORIZED', label: 'Autorizada' },
  { id: 'CANCELLED', label: 'Cancelada' },
  { id: 'DENIED', label: 'Denegada' },
  { id: 'CORRECTED', label: 'Corrigida' },
  { id: 'INUTILIZED', label: 'Inutilizada' },
];

const TYPE_OPTIONS = [
  { id: 'NFE', label: 'NF-e' },
  { id: 'NFCE', label: 'NFC-e' },
  { id: 'NFSE', label: 'NFS-e' },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function getStatusColor(status: FiscalDocumentStatus): string {
  const colors: Record<FiscalDocumentStatus, string> = {
    AUTHORIZED:
      'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
    PENDING:
      'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
    CANCELLED:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    DENIED:
      'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
    DRAFT:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
    CORRECTED:
      'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
    INUTILIZED:
      'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  };
  return colors[status] ?? colors.DRAFT;
}

function getTypeColor(type: FiscalDocumentType): string {
  const colors: Record<FiscalDocumentType, string> = {
    NFE: 'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
    NFCE: 'border-teal-600/25 dark:border-teal-500/20 bg-teal-50 dark:bg-teal-500/8 text-teal-700 dark:text-teal-300',
    NFSE: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  };
  return colors[type] ?? colors.NFE;
}

// ============================================================================
// TYPES
// ============================================================================

type ActionButtonWithPermission = HeaderButton & {
  permission?: string;
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function FiscalPage() {
  return (
    <Suspense
      fallback={<GridLoading count={9} layout="list" size="md" gap="gap-4" />}
    >
      <FiscalPageContent />
    </Suspense>
  );
}

function FiscalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = usePermissions();

  // ============================================================================
  // PERMISSION FLAGS
  // ============================================================================

  const canView = hasPermission(FINANCE_PERMISSIONS.FISCAL.ACCESS);
  const canCreate = hasPermission(FINANCE_PERMISSIONS.FISCAL.REGISTER);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.FISCAL.REMOVE);

  // ============================================================================
  // FILTER STATE (synced with URL params)
  // ============================================================================

  const statusIds = useMemo(() => {
    const raw = searchParams.get('status');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const typeIds = useMemo(() => {
    const raw = searchParams.get('type');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sorting state (server-side)
  const [sortBy, setSortBy] = useState<
    'createdAt' | 'number' | 'totalValue' | 'status'
  >('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // ============================================================================
  // STATE
  // ============================================================================

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionTarget, setCorrectionTarget] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState('');
  const [nfeWizardOpen, setNfeWizardOpen] = useState(false);
  const [nfceWizardOpen, setNfceWizardOpen] = useState(false);

  // ============================================================================
  // DATA: Infinite scroll documents + filter dropdown sources
  // ============================================================================

  const filters: FiscalDocumentsFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status:
        statusIds.length === 1
          ? (statusIds[0] as FiscalDocumentStatus)
          : undefined,
      type:
        typeIds.length === 1 ? (typeIds[0] as FiscalDocumentType) : undefined,
      sortBy,
      sortOrder,
    }),
    [debouncedSearch, statusIds, typeIds, sortBy, sortOrder]
  );

  const {
    documents,
    total,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useFiscalDocumentsInfinite(filters);

  // Mutations
  const cancelMutation = useCancelDocument();
  const correctionMutation = useCorrectionLetter();

  // ============================================================================
  // SUMMARY COUNTS
  // ============================================================================

  const summaryCounts = useMemo(() => {
    const nfeCount = documents.filter(d => d?.type === 'NFE').length;
    const nfceCount = documents.filter(d => d?.type === 'NFCE').length;
    const authorizedCount = documents.filter(
      d => d?.status === 'AUTHORIZED'
    ).length;
    const pendingCount = documents.filter(d => d?.status === 'PENDING').length;
    return { nfeCount, nfceCount, authorizedCount, pendingCount };
  }, [documents]);

  // ============================================================================
  // INFINITE SCROLL SENTINEL
  // ============================================================================

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      observerEntries => {
        if (
          observerEntries[0].isIntersecting &&
          hasNextPage &&
          !isFetchingNextPage
        ) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // URL FILTER HELPERS
  // ============================================================================

  const buildFilterUrl = useCallback(
    (params: { status?: string[]; type?: string[] }) => {
      const parts: string[] = [];
      const sts = params.status !== undefined ? params.status : statusIds;
      const tp = params.type !== undefined ? params.type : typeIds;
      if (sts.length > 0) parts.push(`status=${sts.join(',')}`);
      if (tp.length > 0) parts.push(`type=${tp.join(',')}`);
      return parts.length > 0
        ? `/finance/fiscal?${parts.join('&')}`
        : '/finance/fiscal';
    },
    [statusIds, typeIds]
  );

  const setStatusFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ status: ids })),
    [router, buildFilterUrl]
  );

  const setTypeFilter = useCallback(
    (ids: string[]) => router.push(buildFilterUrl({ type: ids })),
    [router, buildFilterUrl]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/finance/fiscal/${ids[0]}`);
    }
  };

  const handleDownloadDanfe = useCallback(
    (ids: string[]) => {
      if (ids.length === 1) {
        const doc = documents.find(d => d.id === ids[0]);
        if (doc?.danfePdfUrl) {
          window.open(doc.danfePdfUrl, '_blank');
        } else {
          toast.error('DANFE não disponível para este documento.');
        }
      }
    },
    [documents]
  );

  const handleCancelDocument = useCallback((ids: string[]) => {
    if (ids.length === 1) {
      setCancelTarget(ids[0]);
      setCancelReason('');
      setCancelModalOpen(true);
    }
  }, []);

  const handleCorrectionLetter = useCallback((ids: string[]) => {
    if (ids.length === 1) {
      setCorrectionTarget(ids[0]);
      setCorrectionText('');
      setCorrectionModalOpen(true);
    }
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync({
        id: cancelTarget,
        data: { reason: cancelReason },
      });
      setCancelModalOpen(false);
      setCancelTarget(null);
      setCancelReason('');
      toast.success('Documento fiscal cancelado com sucesso.');
    } catch {
      toast.error('Erro ao cancelar documento fiscal.');
    }
  }, [cancelTarget, cancelReason, cancelMutation]);

  const handleCorrectionConfirm = useCallback(async () => {
    if (!correctionTarget) return;
    try {
      await correctionMutation.mutateAsync({
        id: correctionTarget,
        data: { correctionText },
      });
      setCorrectionModalOpen(false);
      setCorrectionTarget(null);
      setCorrectionText('');
      toast.success('Carta de correção emitida com sucesso.');
    } catch {
      toast.error('Erro ao emitir carta de correção.');
    }
  }, [correctionTarget, correctionText, correctionMutation]);

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: FiscalDocumentDTO, isSelected: boolean) => {
    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        actions={[
          ...(canView && item.danfePdfUrl
            ? [
                {
                  id: 'download-danfe',
                  label: 'Baixar DANFE',
                  icon: Download,
                  onClick: handleDownloadDanfe,
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canView && item.status === 'AUTHORIZED'
            ? [
                {
                  id: 'correction-letter',
                  label: 'Carta de Correção',
                  icon: PenLine,
                  onClick: handleCorrectionLetter,
                },
              ]
            : []),
          ...(canDelete && item.status === 'AUTHORIZED'
            ? [
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  icon: XCircle,
                  onClick: handleCancelDocument,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={
            item.recipientName
              ? `${FISCAL_DOCUMENT_TYPE_LABELS[item.type]} ${item.series}/${item.number}`
              : `${FISCAL_DOCUMENT_TYPE_LABELS[item.type]} ${item.series}/${item.number}`
          }
          subtitle={item.recipientName ?? 'Sem destinatario'}
          icon={item.type === 'NFCE' ? Receipt : FileText}
          iconBgColor={
            item.type === 'NFCE'
              ? 'bg-linear-to-br from-teal-500 to-teal-600'
              : 'bg-linear-to-br from-violet-500 to-violet-600'
          }
          badges={[
            {
              label: FISCAL_DOCUMENT_STATUS_LABELS[item.status],
              variant: 'outline' as const,
              color: getStatusColor(item.status),
            },
            {
              label: FISCAL_DOCUMENT_TYPE_LABELS[item.type],
              variant: 'outline' as const,
              color: getTypeColor(item.type),
            },
          ]}
          footer={{
            type: 'split',
            left: {
              label: formatCurrency(item.totalValue),
              onClick: () => {},
              color: 'secondary',
            },
            right: {
              label: formatDate(item.createdAt),
              onClick: () => {},
              color: 'secondary',
            },
          }}
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        />
      </EntityContextMenu>
    );
  };

  const renderListCard = (item: FiscalDocumentDTO, isSelected: boolean) => {
    const listBadges: {
      label: string;
      variant: 'outline';
      color: string;
    }[] = [
      {
        label: FISCAL_DOCUMENT_STATUS_LABELS[item.status],
        variant: 'outline',
        color: getStatusColor(item.status),
      },
      {
        label: FISCAL_DOCUMENT_TYPE_LABELS[item.type],
        variant: 'outline',
        color: getTypeColor(item.type),
      },
    ];

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={canView ? handleContextView : undefined}
        actions={[
          ...(canView && item.danfePdfUrl
            ? [
                {
                  id: 'download-danfe',
                  label: 'Baixar DANFE',
                  icon: Download,
                  onClick: handleDownloadDanfe,
                  separator: 'before' as const,
                },
              ]
            : []),
          ...(canView && item.status === 'AUTHORIZED'
            ? [
                {
                  id: 'correction-letter',
                  label: 'Carta de Correção',
                  icon: PenLine,
                  onClick: handleCorrectionLetter,
                },
              ]
            : []),
          ...(canDelete && item.status === 'AUTHORIZED'
            ? [
                {
                  id: 'cancel',
                  label: 'Cancelar',
                  icon: XCircle,
                  onClick: handleCancelDocument,
                  variant: 'destructive' as const,
                  separator: 'before' as const,
                },
              ]
            : []),
        ]}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {FISCAL_DOCUMENT_TYPE_LABELS[item.type]} {item.series}/
                {item.number}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.recipientName ?? 'Sem destinatario'}
              </span>
            </span>
          }
          metadata={
            <div className="flex items-center gap-1.5 mt-0.5">
              {listBadges.map((badge, i) => (
                <span
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0',
                    badge.color
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          }
          icon={item.type === 'NFCE' ? Receipt : FileText}
          iconBgColor={
            item.type === 'NFCE'
              ? 'bg-linear-to-br from-teal-500 to-teal-600'
              : 'bg-linear-to-br from-violet-500 to-violet-600'
          }
          isSelected={isSelected}
          showSelection={false}
          clickable={false}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={false}
        >
          {/* Right zone: value + date */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold font-mono text-gray-900 dark:text-white">
              {formatCurrency(item.totalValue)}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(item.createdAt)}
            </span>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const initialIds = useMemo(() => documents.filter(Boolean).map(d => d.id), [documents]);

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION (permission-aware)
  // ============================================================================

  const actionButtons = useMemo<ActionButtonWithPermission[]>(
    () => [
      {
        id: 'config',
        title: 'Configurações',
        icon: Settings,
        onClick: () => router.push('/finance/fiscal/config'),
        variant: 'outline',
        permission: FINANCE_PERMISSIONS.FISCAL.ADMIN,
      },
      {
        id: 'emit-nfce',
        title: 'Emitir NFC-e',
        icon: Receipt,
        onClick: () => setNfceWizardOpen(true),
        variant: 'outline',
        permission: FINANCE_PERMISSIONS.FISCAL.REGISTER,
      },
      {
        id: 'emit-nfe',
        title: 'Emitir NF-e',
        icon: Plus,
        onClick: () => setNfeWizardOpen(true),
        variant: 'default',
        permission: FINANCE_PERMISSIONS.FISCAL.REGISTER,
      },
    ],
    [router]
  );

  const visibleActionButtons = useMemo<HeaderButton[]>(
    () =>
      actionButtons
        .filter(button =>
          button.permission ? hasPermission(button.permission) : true
        )
        .map(({ permission, ...button }) => button),
    [actionButtons, hasPermission]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'fiscal-documents',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Documentos Fiscais', href: '/finance/fiscal' },
            ]}
            buttons={visibleActionButtons}
          />

          <Header
            title="Documentos Fiscais"
            description="Gerencie notas fiscais eletrônicas (NF-e, NFC-e)"
          />
        </PageHeader>

        <PageBody>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-violet-500" />
                <span className="text-sm text-muted-foreground">
                  Total NF-e
                </span>
              </div>
              <p className="text-xl font-bold">{summaryCounts.nfeCount}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-teal-500" />
                <span className="text-sm text-muted-foreground">
                  Total NFC-e
                </span>
              </div>
              <p className="text-xl font-bold">{summaryCounts.nfceCount}</p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">
                  Autorizadas
                </span>
              </div>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {summaryCounts.authorizedCount}
              </p>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-sky-500" />
                <span className="text-sm text-muted-foreground">Pendentes</span>
              </div>
              <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                {summaryCounts.pendingCount}
              </p>
            </Card>
          </div>

          {/* Search Bar */}
          <SearchBar
            placeholder={fiscalDocumentConfig.display.labels.searchPlaceholder}
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {/* Grid */}
          {isLoading ? (
            <GridLoading count={9} layout="list" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar documentos fiscais"
              message="Ocorreu um erro ao tentar carregar os documentos fiscais. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <>
              <EntityGrid
                config={fiscalDocumentConfig}
                items={documents}
                showItemCount={false}
                toolbarStart={
                  <>
                    <FilterDropdown
                      label="Status"
                      icon={CheckCircle}
                      options={STATUS_OPTIONS}
                      selected={statusIds}
                      onSelectionChange={setStatusFilter}
                      activeColor="emerald"
                      searchPlaceholder="Buscar status..."
                      emptyText="Nenhum status encontrado."
                    />
                    <FilterDropdown
                      label="Tipo"
                      icon={FileText}
                      options={TYPE_OPTIONS}
                      selected={typeIds}
                      onSelectionChange={setTypeFilter}
                      activeColor="violet"
                      searchPlaceholder="Buscar tipo..."
                      emptyText="Nenhum tipo encontrado."
                    />
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      {total} {total === 1 ? 'documento' : 'documentos'}
                      {documents.length < total &&
                        ` (${documents.length} carregados)`}
                    </p>
                  </>
                }
                renderGridItem={renderGridCard}
                renderListItem={renderListCard}
                isLoading={isLoading}
                isSearching={!!debouncedSearch}
                onItemDoubleClick={item =>
                  router.push(`/finance/fiscal/${item.id}`)
                }
                showSorting={true}
                defaultSortField="createdAt"
                defaultSortDirection="desc"
                onSortChange={(field, direction) => {
                  if (field !== 'custom') {
                    setSortBy(field as typeof sortBy);
                    setSortOrder(direction);
                  }
                }}
              />

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="h-1" />
              {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </>
          )}

          {/* Cancel Document — PIN Confirmation */}
          <VerifyActionPinModal
            isOpen={cancelModalOpen}
            onClose={() => {
              setCancelModalOpen(false);
              setCancelTarget(null);
              setCancelReason('');
            }}
            onSuccess={handleCancelConfirm}
            title="Cancelar Documento Fiscal"
            description="Digite seu PIN de Ação para confirmar o cancelamento deste documento fiscal. Esta ação não pode ser desfeita."
          />

          {/* Cancel Reason Dialog (shown after PIN) */}
          {cancelTarget && !cancelModalOpen && cancelReason === '' && (
            <Dialog
              open={!!cancelTarget && !cancelModalOpen}
              onOpenChange={open => {
                if (!open) {
                  setCancelTarget(null);
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Motivo do Cancelamento</DialogTitle>
                  <DialogDescription>
                    Informe o motivo do cancelamento do documento fiscal.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="cancel-reason">Motivo</Label>
                    <Textarea
                      id="cancel-reason"
                      placeholder="Descreva o motivo do cancelamento..."
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCancelTarget(null)}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelConfirm}
                    disabled={!cancelReason.trim() || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending
                      ? 'Cancelando...'
                      : 'Confirmar Cancelamento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Correction Letter Dialog */}
          <Dialog
            open={correctionModalOpen}
            onOpenChange={open => {
              if (!open) {
                setCorrectionModalOpen(false);
                setCorrectionTarget(null);
                setCorrectionText('');
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Carta de Correção</DialogTitle>
                <DialogDescription>
                  Informe o texto de correção para o documento fiscal.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="correction-text">Texto de Correção</Label>
                  <Textarea
                    id="correction-text"
                    placeholder="Descreva a correção a ser feita..."
                    value={correctionText}
                    onChange={e => setCorrectionText(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCorrectionModalOpen(false);
                    setCorrectionTarget(null);
                    setCorrectionText('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCorrectionConfirm}
                  disabled={
                    !correctionText.trim() || correctionMutation.isPending
                  }
                >
                  {correctionMutation.isPending
                    ? 'Enviando...'
                    : 'Emitir Carta de Correção'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* NF-e Emission Wizard */}
          <EmitNfeWizard
            open={nfeWizardOpen}
            onOpenChange={setNfeWizardOpen}
            onSuccess={() => setNfeWizardOpen(false)}
          />

          {/* NFC-e Emission Wizard */}
          <EmitNfceWizard
            open={nfceWizardOpen}
            onOpenChange={setNfceWizardOpen}
            onSuccess={() => setNfceWizardOpen(false)}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
