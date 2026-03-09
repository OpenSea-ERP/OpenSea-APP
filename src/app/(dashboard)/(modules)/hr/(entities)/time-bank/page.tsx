'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import type { ContextMenuAction } from '@/core/components/entity-context-menu';
import { useEmployeeMap } from '@/hooks/use-employee-map';
import type { TimeBank } from '@/types/hr';
import { Eye, Hourglass, Minus, Plus, SlidersHorizontal } from 'lucide-react';
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
  CreditModal,
  DebitModal,
  AdjustModal,
  ViewModal,
} from './src';

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
  // ============================================================================
  // FILTERS
  // ============================================================================

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

  const employeeIds = useMemo(() => timeBanks.map(tb => tb.employeeId), [timeBanks]);
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

  const initialIds = useMemo(
    () => timeBanks.map(i => i.id),
    [timeBanks]
  );

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

  // ============================================================================
  // CONTEXT MENU
  // ============================================================================

  const contextActions: ContextMenuAction[] = useMemo(
    () => [
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
        badges={[
          { label: formatYear(item.year), variant: 'outline' },
        ]}
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
        showSelection={false}
        clickable={false}
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
        badges={[
          { label: formatYear(item.year), variant: 'outline' },
        ]}
        metadata={
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={`font-bold font-mono ${getBalanceColor(item.balance)}`}>
              {formatBalance(item.balance)}
            </span>
            <span>
              Atualizado em{' '}
              {new Date(item.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        }
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
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
          'border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950',
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
    []
  );

  // ============================================================================
  // FILTERS UI
  // ============================================================================

  const hasActiveFilters = filterEmployeeId || filterYear;

  const clearFilters = useCallback(() => {
    setFilterEmployeeId('');
    setFilterYear('');
  }, []);

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
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-64">
              <EmployeeSelector
                value={filterEmployeeId}
                onChange={id => setFilterEmployeeId(id)}
                placeholder="Filtrar por funcionário..."
              />
            </div>

            <Input
              type="number"
              min={2020}
              max={2100}
              placeholder={String(new Date().getFullYear())}
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="w-28"
            />

            {hasActiveFilters && (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/10"
                onClick={clearFilters}
              >
                Limpar filtros
              </Badge>
            )}
          </div>

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
              items={timeBanks}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={false}
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
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
