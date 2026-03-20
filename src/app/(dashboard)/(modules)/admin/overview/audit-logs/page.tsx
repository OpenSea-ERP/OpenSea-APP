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
import { AccessDenied } from '@/components/rbac/access-denied';
import { usePermissions } from '@/hooks/use-permissions';
import { ADMIN_PERMISSIONS } from '@/config/rbac/permission-codes';
import { auditLogService } from '@/services/audit/audit-log.service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { AuditEventsList, DetailModal, FiltersBar } from './src';
import {
  getActionLabel,
  getEntityLabel,
  getModuleLabel,
} from './src/constants';
import type { AuditLog, AuditLogFilters } from './src/types';

export default function AuditLogsPage() {
  const { hasPermission, isLoading: isLoadingPermissions } = usePermissions();

  const canViewAuditLogs = hasPermission(ADMIN_PERMISSIONS.AUDIT.ACCESS);

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // ============================================================================
  // QUERY
  // ============================================================================

  const queryFilters = useMemo(() => {
    const filters: AuditLogFilters = {
      limit: 50,
    };
    if (selectedModules.length) filters.module = selectedModules[0];
    if (selectedEntities.length) filters.entity = selectedEntities[0];
    if (selectedActions.length) filters.action = selectedActions[0];
    if (startDate) filters.startDate = `${startDate}T00:00:00.000Z`;
    if (endDate) filters.endDate = `${endDate}T23:59:59.999Z`;
    return filters;
  }, [selectedModules, selectedEntities, selectedActions, startDate, endDate]);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['audit-logs', queryFilters],
    queryFn: ({ pageParam = 1 }) =>
      auditLogService.listAuditLogs({ ...queryFilters, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    enabled: canViewAuditLogs,
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const allLogs = useMemo(
    () => data?.pages.flatMap(page => page.logs) ?? [],
    [data]
  );

  // Client-side search filter (backend doesn't support search param)
  const logs = useMemo(() => {
    if (!searchQuery.trim()) return allLogs;
    const term = searchQuery.toLowerCase();
    return allLogs.filter(log => {
      const searchable = [
        log.userName,
        log.description,
        log.entityId,
        log.affectedUser,
        getActionLabel(log.action),
        getEntityLabel(log.entity),
        getModuleLabel(log.module),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(term);
    });
  }, [allLogs, searchQuery]);

  const availableModules = useMemo(() => {
    const unique = [...new Set(allLogs.map(l => l.module))];
    return unique
      .map(id => ({ id, label: getModuleLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [allLogs]);

  const availableEntities = useMemo(() => {
    const unique = [...new Set(allLogs.map(l => l.entity))];
    return unique
      .map(id => ({ id, label: getEntityLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [allLogs]);

  const availableActions = useMemo(() => {
    const unique = [...new Set(allLogs.map(l => l.action))];
    return unique
      .map(id => ({ id, label: getActionLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [allLogs]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleModulesChange = useCallback((ids: string[]) => {
    setSelectedModules(ids);
  }, []);

  const handleEntitiesChange = useCallback((ids: string[]) => {
    setSelectedEntities(ids);
  }, []);

  const handleActionsChange = useCallback((ids: string[]) => {
    setSelectedActions(ids);
  }, []);

  const handleStartDateChange = useCallback((date: string) => {
    setStartDate(date);
  }, []);

  const handleEndDateChange = useCallback((date: string) => {
    setEndDate(date);
  }, []);

  const handleLogClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(
    () => [
      {
        id: 'refresh-audit-logs',
        title: 'Atualizar',
        icon: RefreshCw,
        onClick: handleRefresh,
        variant: 'outline',
        disabled: isLoading,
      },
    ],
    [handleRefresh, isLoading]
  );

  // ============================================================================
  // ACCESS CHECK
  // ============================================================================

  if (isLoadingPermissions) {
    return (
      <PageLayout>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!canViewAuditLogs) {
    return (
      <AccessDenied
        title="Acesso Restrito"
        message="Você não tem permissão para visualizar os logs de auditoria."
      />
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout className="h-[calc(100dvh-10rem)] flex flex-col overflow-hidden">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Logs de Auditoria', href: '/admin/overview/audit-logs' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Logs de Auditoria"
          description="Visualização e análise de logs de auditoria do sistema"
        />
      </PageHeader>

      <PageBody className="flex-1 min-h-0 flex flex-col">
        {/* Barra de pesquisa */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar nos logs por ação, entidade ou descrição..."
          onSearch={handleSearchChange}
          onClear={() => handleSearchChange('')}
          showClear
          size="md"
        />

        {/* Linha de filtros */}
        <FiltersBar
          moduleOptions={availableModules}
          modules={selectedModules}
          onModulesChange={handleModulesChange}
          entityOptions={availableEntities}
          entities={selectedEntities}
          onEntitiesChange={handleEntitiesChange}
          actionOptions={availableActions}
          actions={selectedActions}
          onActionsChange={handleActionsChange}
          startDate={startDate}
          onStartDateChange={handleStartDateChange}
          endDate={endDate}
          onEndDateChange={handleEndDateChange}
        />

        {/* Lista de eventos */}
        {isLoading ? (
          <GridLoading count={6} layout="list" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar logs de auditoria"
            message="Ocorreu um erro ao tentar carregar os logs. Por favor, tente novamente ou ajuste os filtros."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            <AuditEventsList
              logs={logs}
              onSelectLog={handleLogClick}
              onLoadMore={handleLoadMore}
              hasMore={!!hasNextPage}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        )}

        {/* Modal de detalhes */}
        <DetailModal
          isOpen={isDetailModalOpen}
          onOpenChange={setIsDetailModalOpen}
          log={selectedLog}
        />
      </PageBody>
    </PageLayout>
  );
}
