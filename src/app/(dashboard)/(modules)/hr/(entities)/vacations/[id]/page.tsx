'use client';

/**
 * OpenSea OS - Vacation Period Detail Page (HR)
 *
 * Página de detalhes de um período de férias.
 */

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { VacationPeriod } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  CalendarDays,
  CalendarX2,
  Clock,
  DollarSign,
  FileText,
  Palmtree,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  vacationsApi,
  vacationKeys,
  formatDate,
  getStatusLabel,
  getStatusColor,
  formatDaysInfo,
  useScheduleVacation,
  useSellVacationDays,
  useCancelVacationSchedule,
  ScheduleModal,
  SellDaysModal,
} from '../src';

export default function VacationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vacationId = params.id as string;

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSellOpen, setIsSellOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: vacation, isLoading } = useQuery<VacationPeriod>({
    queryKey: vacationKeys.detail(vacationId),
    queryFn: async () => {
      const response = await vacationsApi.get(vacationId);
      return response.vacationPeriod;
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const scheduleMutation = useScheduleVacation({
    onSuccess: () => setIsScheduleOpen(false),
  });

  const sellDaysMutation = useSellVacationDays({
    onSuccess: () => setIsSellOpen(false),
  });

  const cancelScheduleMutation = useCancelVacationSchedule();

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const usedPercent =
    vacation && vacation.totalDays > 0
      ? Math.round(
          ((vacation.usedDays + vacation.soldDays) / vacation.totalDays) * 100
        )
      : 0;

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'RH', href: '/hr' },
    { label: 'Férias', href: '/hr/vacations' },
    ...(vacation
      ? [
          {
            label: `Período ${formatDate(vacation.acquisitionStart)} - ${formatDate(vacation.acquisitionEnd)}`,
          },
        ]
      : []),
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Férias', href: '/hr/vacations' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!vacation) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Férias', href: '/hr/vacations' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Palmtree className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Período de férias não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/vacations')}>
              Voltar para Férias
            </Button>
          </Card>
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
        <PageActionBar breadcrumbItems={breadcrumbItems} />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-green-500 to-green-600">
              <Palmtree className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Período Aquisitivo {formatDate(vacation.acquisitionStart)} -{' '}
                  {formatDate(vacation.acquisitionEnd)}
                </h1>
                <Badge variant={getStatusColor(vacation.status)}>
                  {getStatusLabel(vacation.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDaysInfo(
                  vacation.totalDays,
                  vacation.usedDays,
                  vacation.soldDays,
                  vacation.remainingDays
                )}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {vacation.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span>
                    {new Date(vacation.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {vacation.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(vacation.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Período Aquisitivo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Calendar className="h-5 w-5" />
            Período Aquisitivo
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Início"
              value={formatDate(vacation.acquisitionStart)}
            />
            <InfoField
              label="Fim"
              value={formatDate(vacation.acquisitionEnd)}
            />
          </div>
        </Card>

        {/* Período Concessivo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <CalendarDays className="h-5 w-5" />
            Período Concessivo
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Início"
              value={formatDate(vacation.concessionStart)}
            />
            <InfoField label="Fim" value={formatDate(vacation.concessionEnd)} />
          </div>
        </Card>

        {/* Saldo de Dias */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Saldo de Dias
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-lg font-semibold mt-1">{vacation.totalDays}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usados</p>
              <p className="text-lg font-semibold mt-1 text-blue-600">
                {vacation.usedDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vendidos</p>
              <p className="text-lg font-semibold mt-1 text-amber-600">
                {vacation.soldDays}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Restantes</p>
              <p className="text-lg font-semibold mt-1 text-green-600">
                {vacation.remainingDays}
              </p>
            </div>
          </div>
          <Progress value={usedPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {usedPercent}% utilizado ({vacation.usedDays} usados +{' '}
            {vacation.soldDays} vendidos)
          </p>
        </Card>

        {/* Agendamento (only if scheduled) */}
        {(vacation.scheduledStart || vacation.scheduledEnd) && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <CalendarDays className="h-5 w-5" />
              Agendamento
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Início Agendado"
                value={formatDate(vacation.scheduledStart)}
              />
              <InfoField
                label="Fim Agendado"
                value={formatDate(vacation.scheduledEnd)}
              />
            </div>
          </Card>
        )}

        {/* Observações (only if notes exist) */}
        {vacation.notes && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Observações
            </h3>
            <p className="text-sm">{vacation.notes}</p>
          </Card>
        )}

        {/* Action Buttons */}
        {vacation.status === 'AVAILABLE' && (
          <div className="flex gap-3">
            <Button onClick={() => setIsScheduleOpen(true)} className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Agendar
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsSellOpen(true)}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Vender Dias
            </Button>
          </div>
        )}

        {vacation.status === 'SCHEDULED' && (
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => cancelScheduleMutation.mutate(vacation.id)}
              disabled={cancelScheduleMutation.isPending}
              className="gap-2"
            >
              <CalendarX2 className="h-4 w-4" />
              Cancelar Agendamento
            </Button>
          </div>
        )}
      </PageBody>

      {/* Modals */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        vacationId={vacation.id}
        onSchedule={(id, data) => scheduleMutation.mutate({ id, data })}
        isSubmitting={scheduleMutation.isPending}
      />

      <SellDaysModal
        isOpen={isSellOpen}
        onClose={() => setIsSellOpen(false)}
        vacationId={vacation.id}
        onSell={(id, data) => sellDaysMutation.mutate({ id, data })}
        isSubmitting={sellDaysMutation.isPending}
      />
    </PageLayout>
  );
}
