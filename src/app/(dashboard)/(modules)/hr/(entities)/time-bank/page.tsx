'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { SearchBar } from '@/components/layout/search-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { exportToCSV } from '@/lib/csv-export';
import type { TimeBank } from '@/types/hr';
import {
  Calendar,
  Download,
  ExternalLink,
  Eye,
  Hourglass,
  Minus,
  Plus,
  SlidersHorizontal,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useMemo, useState } from 'react';
import {
  formatBalance,
  getBalanceColor,
  formatYear,
  timeBankConfig,
  useListTimeBanks,
  useCreditTimeBank,
  useDebitTimeBank,
  useAdjustTimeBank,
} from './src';

const CreditModal = dynamic(
  () =>
    import('./src/modals/credit-modal').then(m => ({ default: m.CreditModal })),
  { ssr: false }
);
const DebitModal = dynamic(
  () =>
    import('./src/modals/debit-modal').then(m => ({ default: m.DebitModal })),
  { ssr: false }
);
const AdjustModal = dynamic(
  () =>
    import('./src/modals/adjust-modal').then(m => ({ default: m.AdjustModal })),
  { ssr: false }
);
const ViewModal = dynamic(
  () => import('./src/modals/view-modal').then(m => ({ default: m.ViewModal })),
  { ssr: false }
);
import { HRSelectionToolbar } from '../../_shared/components/hr-selection-toolbar';

export default function TimeBankPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <TimeBankPageContent />
    </Suspense>
  );
}

function TimeBankPageContent() {
  const router = useRouter();

  // ============================================================================
  // FILTERS
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const queryParams = useMemo(
    () => ({
      employeeId: filterEmployeeId || undefined,
      year: filterYear ? Number(filterYear) : undefined,
    }),
    [filterEmployeeId, filterYear]
  );

  // ============================================================================
  // DATA
  // ============================================================================

  const { data, isLoading, error, refetch } = useListTimeBanks(queryParams);
  const credit = useCreditTimeBank({ onSuccess: () => setCreditOpen(false) });
  const debit = useDebitTimeBank({ onSuccess: () => setDebitOpen(false) });
  const adjust = useAdjustTimeBank({ onSuccess: () => setAdjustOpen(false) });

  const timeBanks = data?.timeBanks ?? [];

  const employeeIds = useMemo(
    () => timeBanks.map(tb => tb.employeeId),
    [timeBanks]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // ============================================================================
  // STATE
  // ============================================================================

  const [creditOpen, setCreditOpen] = useState(false);
  const [debitOpen, setDebitOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState<TimeBank | null>(null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return timeBanks;
    const q = searchQuery.toLowerCase();
    return timeBanks.filter(tb => {
      const name = getName(tb.employeeId).toLowerCase();
      return name.includes(q);
    });
  }, [timeBanks, searchQuery, getName]);

  const initialIds = useMemo(() => filteredItems.map(i => i.id), [filteredItems]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCredit = useCallback(
    async (data: { employeeId: string; hours: number; year?: number }) => {
      await credit.mutateAsync(data);
    },
    [credit]
  );

  const handleDebit = useCallback(
    async (data: { employeeId: string; hours: number; year?: number }) => {
      await debit.mutateAsync(data);
    },
    [debit]
  );

  const handleAdjust = useCallback(
    async (data: { employeeId: string; newBalance: number; year?: number }) => {
      await adjust.mutateAsync(data);
    },
    [adjust]
  );

  const handleViewItem = useCallback(
    (ids: string[]) => {
      if (ids.length > 0) {
        const item = timeBanks.find(tb => tb.id === ids[0]);
        if (item) {
          setViewTarget(item);
          setIsViewOpen(true);
        }
      }
    },
    [timeBanks]
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const items =
        ids.length > 0
          ? timeBanks.filter(tb => ids.includes(tb.id))
          : timeBanks;
      exportToCSV(
        items,
        [
          { header: 'Funcionário', accessor: tb => getName(tb.employeeId) },
          { header: 'Ano', accessor: tb => tb.year },
          { header: 'Saldo (horas)', accessor: tb => tb.balance },
          {
            header: 'Atualizado em',
            accessor: tb => new Date(tb.updatedAt).toLocaleDateString('pt-BR'),
          },
        ],
        'banco-de-horas'
      );
    },
    [timeBanks, getName]
  );

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(
    () => [
      {
        id: 'open',
        label: 'Abrir',
        icon: ExternalLink,
        onClick: (ids: string[]) => {
          if (ids.length > 0) router.push(`/hr/time-bank/${ids[0]}`);
        },
      },
      {
        id: 'view',
        label: 'Visualizar',
        icon: Eye,
        onClick: handleViewItem,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderGridCard = (item: TimeBank, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={handleViewItem}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={getName(item.employeeId)}
        subtitle={formatBalance(item.balance)}
        icon={Hourglass}
        iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
        badges={[{ label: formatYear(item.year), variant: 'outline' }]}
        metadata={
          <div className="flex flex-col gap-1">
            <p
              className={`text-2xl font-bold font-mono ${getBalanceColor(item.balance)}`}
            >
              {formatBalance(item.balance)}
            </p>
            <p className="text-xs text-muted-foreground">
              Atualizado em{' '}
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/time-bank/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: TimeBank, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={handleViewItem}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={getName(item.employeeId)}
        subtitle={formatBalance(item.balance)}
        icon={Hourglass}
        iconBgColor="bg-linear-to-br from-teal-500 to-teal-600"
        badges={[{ label: formatYear(item.year), variant: 'outline' }]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span
              className={`font-bold font-mono ${getBalanceColor(item.balance)}`}
            >
              {formatBalance(item.balance)}
            </span>
            <span>
              Atualizado em{' '}
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={true}
        clickable
        onClick={() => router.push(`/hr/time-bank/${item.id}`)}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons = useMemo<HeaderButton[]>(
    () => [
      {
        id: 'export',
        title: 'Exportar',
        icon: Download,
        onClick: () => handleExport([]),
        variant: 'outline',
      },
      {
        id: 'adjust',
        title: 'Ajustar',
        icon: SlidersHorizontal,
        onClick: () => setAdjustOpen(true),
        variant: 'outline',
      },
      {
        id: 'debit',
        title: 'Debitar',
        icon: Minus,
        onClick: () => setDebitOpen(true),
        variant: 'outline',
        className:
          'border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950',
      },
      {
        id: 'credit',
        title: 'Creditar',
        icon: Plus,
        onClick: () => setCreditOpen(true),
        variant: 'default',
        className: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      },
    ],
    [handleExport]
  );

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  const employeeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const tb of timeBanks) {
      if (!seen.has(tb.employeeId)) {
        seen.set(tb.employeeId, getName(tb.employeeId));
      }
    }
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [timeBanks, getName]);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    for (const tb of timeBanks) {
      years.add(tb.year);
    }
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    return Array.from(years)
      .sort((a, b) => b - a)
      .map(y => ({ id: String(y), label: String(y) }));
  }, [timeBanks]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <CoreProvider
      selection={{
        namespace: 'time-bank',
        initialIds,
      }}
    >
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Banco de Horas', href: '/hr/time-bank' },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Banco de Horas"
            description="Gerencie o banco de horas dos funcionários"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder="Buscar por funcionário..."
            onSearch={value => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={9} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar banco de horas"
              message="Ocorreu um erro ao carregar os registros de banco de horas. Por favor, tente novamente."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
            />
          ) : (
            <EntityGrid
              config={timeBankConfig}
              items={filteredItems}
              toolbarStart={
                <>
                  <FilterDropdown
                    label="Funcionário"
                    icon={User}
                    options={employeeOptions}
                    value={filterEmployeeId}
                    onChange={v => setFilterEmployeeId(v)}
                    activeColor="violet"
                    searchPlaceholder="Buscar funcionário..."
                    emptyText="Nenhum funcionário encontrado."
                  />
                  <FilterDropdown
                    label="Ano"
                    icon={Calendar}
                    options={yearOptions}
                    value={filterYear}
                    onChange={v => setFilterYear(v)}
                    activeColor="cyan"
                    searchPlaceholder="Buscar ano..."
                    emptyText="Nenhum ano encontrado."
                  />
                </>
              }
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!searchQuery}
              onItemDoubleClick={item => {
                setViewTarget(item);
                setIsViewOpen(true);
              }}
              showSorting={true}
              defaultSortField="createdAt"
              defaultSortDirection="desc"
            />
          )}

          <CreditModal
            isOpen={creditOpen}
            onClose={() => setCreditOpen(false)}
            onSubmit={handleCredit}
            isLoading={credit.isPending}
          />

          <DebitModal
            isOpen={debitOpen}
            onClose={() => setDebitOpen(false)}
            onSubmit={handleDebit}
            isLoading={debit.isPending}
          />

          <AdjustModal
            isOpen={adjustOpen}
            onClose={() => setAdjustOpen(false)}
            onSubmit={handleAdjust}
            isLoading={adjust.isPending}
          />

          <ViewModal
            isOpen={isViewOpen}
            onClose={() => {
              setIsViewOpen(false);
              setViewTarget(null);
            }}
            timeBank={viewTarget}
          />

          <HRSelectionToolbar
            totalItems={filteredItems.length}
            defaultActions={{
              export: true,
            }}
            handlers={{
              onExport: handleExport,
            }}
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
