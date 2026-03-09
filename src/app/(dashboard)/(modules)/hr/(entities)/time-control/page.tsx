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
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import type { TimeEntry } from '@/types/hr';
import { Calculator, LogIn, LogOut } from 'lucide-react';
import { Suspense, useCallback, useMemo, useState } from 'react';
import {
  CalculateHoursModal,
  ClockInModal,
  ClockOutModal,
  formatTimestamp,
  getDateLabel,
  getEntryTypeColor,
  getEntryTypeLabel,
  groupEntriesByDate,
  timeControlConfig,
  useClockIn,
  useClockOut,
  useListTimeEntries,
  ViewEntryModal,
} from './src';

export default function TimeControlPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="list" size="md" gap="gap-2" />}
    >
      <TimeControlPageContent />
    </Suspense>
  );
}

function TimeControlPageContent() {
  const { hasPermission } = usePermissions();

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [clockInOpen, setClockInOpen] = useState(false);
  const [clockOutOpen, setClockOutOpen] = useState(false);
  const [calculateOpen, setCalculateOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<TimeEntry | null>(null);

  // Data
  const params = useMemo(
    () => ({
      employeeId: employeeFilter || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      perPage: 100,
    }),
    [employeeFilter, startDate, endDate]
  );

  const { data, isLoading, error, refetch } = useListTimeEntries(params);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const entries = data?.timeEntries ?? [];
  const groupedEntries = useMemo(
    () => groupEntriesByDate(entries),
    [entries]
  );
  const sortedDates = useMemo(
    () => Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a)),
    [groupedEntries]
  );

  // Handlers
  const handleClockIn = useCallback(
    async (data: { employeeId: string; notes?: string }) => {
      await clockIn.mutateAsync(data);
      setClockInOpen(false);
    },
    [clockIn]
  );

  const handleClockOut = useCallback(
    async (data: { employeeId: string; notes?: string }) => {
      await clockOut.mutateAsync(data);
      setClockOutOpen(false);
    },
    [clockOut]
  );

  // Filters UI
  const hasActiveFilters = employeeFilter || startDate || endDate;

  const clearFilters = useCallback(() => {
    setEmployeeFilter('');
    setStartDate('');
    setEndDate('');
  }, []);

  // Header buttons
  const actionButtons = useMemo<HeaderButton[]>(
    () => [
      {
        id: 'calculate',
        title: 'Calcular Horas',
        icon: Calculator,
        onClick: () => setCalculateOpen(true),
        variant: 'outline',
      },
      {
        id: 'clock-out',
        title: 'Registrar Saída',
        icon: LogOut,
        onClick: () => setClockOutOpen(true),
        variant: 'outline',
      },
      {
        id: 'clock-in',
        title: 'Registrar Entrada',
        icon: LogIn,
        onClick: () => setClockInOpen(true),
        variant: 'default',
      },
    ],
    []
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Controle de Ponto', href: '/hr/time-control' },
          ]}
          buttons={actionButtons}
        />
        <Header
          title="Controle de Ponto"
          description="Registre entradas, saídas e acompanhe a jornada dos funcionários"
        />
      </PageHeader>

      <PageBody>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64">
            <EmployeeSelector
              value={employeeFilter}
              onChange={id => setEmployeeFilter(id)}
              placeholder="Filtrar por funcionário..."
            />
          </div>

          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-40"
            placeholder="Data início"
          />
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-40"
            placeholder="Data fim"
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

        {/* Content */}
        {isLoading ? (
          <GridLoading count={6} layout="list" size="md" gap="gap-2" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar registros"
            message="Ocorreu um erro ao carregar os registros de ponto. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => { refetch(); },
            }}
          />
        ) : entries.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {timeControlConfig.display.labels.emptyState}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => (
              <div key={date}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">
                  {getDateLabel(date)}
                </h3>
                <div className="space-y-1">
                  {groupedEntries[date]
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map(entry => (
                      <Card
                        key={entry.id}
                        className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => setViewEntry(entry)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge
                              className={getEntryTypeColor(entry.entryType)}
                            >
                              {getEntryTypeLabel(entry.entryType)}
                            </Badge>
                            <span className="font-mono text-sm font-medium">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                            {entry.notes && (
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {entry.notes}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">
                            {entry.employeeId.slice(0, 8)}...
                          </span>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <ClockInModal
          isOpen={clockInOpen}
          onClose={() => setClockInOpen(false)}
          onSubmit={handleClockIn}
          isLoading={clockIn.isPending}
        />

        <ClockOutModal
          isOpen={clockOutOpen}
          onClose={() => setClockOutOpen(false)}
          onSubmit={handleClockOut}
          isLoading={clockOut.isPending}
        />

        <ViewEntryModal
          isOpen={!!viewEntry}
          onClose={() => setViewEntry(null)}
          entry={viewEntry}
        />

        <CalculateHoursModal
          isOpen={calculateOpen}
          onClose={() => setCalculateOpen(false)}
          employeeId={employeeFilter || undefined}
        />
      </PageBody>
    </PageLayout>
  );
}
