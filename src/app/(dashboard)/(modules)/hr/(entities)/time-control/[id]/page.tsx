'use client';

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
import { useEmployeeMap } from '@/hooks/use-employee-map';
import { timeControlService } from '@/services/hr/time-control.service';
import type { TimeEntry } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  Globe,
  MapPin,
  Network,
  StickyNote,
  Timer,
  TimerOff,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import {
  formatDateTime,
  getEntryTypeColor,
  getEntryTypeLabel,
} from '../src/utils';

export default function TimeControlDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: entry, isLoading } = useQuery<TimeEntry>({
    queryKey: ['time-entries', entryId],
    queryFn: async () => {
      const response = await timeControlService.getTimeEntry(entryId);
      return response.timeEntry;
    },
  });

  const { getName } = useEmployeeMap(entry ? [entry.employeeId] : []);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR');

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatFullDateTime = (date: string) =>
    new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

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
              { label: 'Controle de Ponto', href: '/hr/time-control' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // NOT FOUND STATE
  // ============================================================================

  if (!entry) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Controle de Ponto', href: '/hr/time-control' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <TimerOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Registro de ponto não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/time-control')}>
              Voltar para Controle de Ponto
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const hasLocation = entry.latitude != null && entry.longitude != null;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Controle de Ponto', href: '/hr/time-control' },
            { label: getEntryTypeLabel(entry.entryType) },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-cyan-500 to-cyan-600">
              <Timer className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getEntryTypeLabel(entry.entryType)}
                </h1>
                <Badge className={getEntryTypeColor(entry.entryType)}>
                  {getEntryTypeLabel(entry.entryType)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getName(entry.employeeId)} &middot;{' '}
                {formatDate(entry.timestamp)} &agrave;s{' '}
                {formatTime(entry.timestamp)}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-cyan-500" />
                <span>{formatDate(entry.createdAt)}</span>
              </div>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Registro */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Dados do Registro
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Tipo"
              value={getEntryTypeLabel(entry.entryType)}
              badge={
                <Badge className={getEntryTypeColor(entry.entryType)}>
                  {getEntryTypeLabel(entry.entryType)}
                </Badge>
              }
            />
            <InfoField
              label="Funcionário"
              value={getName(entry.employeeId)}
              showCopyButton
              copyTooltip="Copiar nome do funcionário"
            />
            <InfoField label="Data" value={formatDate(entry.timestamp)} />
            <InfoField label="Horário" value={formatTime(entry.timestamp)} />
            <InfoField
              label="Data/Hora Completa"
              value={formatFullDateTime(entry.timestamp)}
            />
            <InfoField
              label="Registrado em"
              value={formatDateTime(entry.createdAt)}
            />
          </div>
        </Card>

        {/* Localização */}
        {hasLocation && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              Localização
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Latitude"
                value={entry.latitude?.toFixed(6)}
                showCopyButton
                copyTooltip="Copiar latitude"
              />
              <InfoField
                label="Longitude"
                value={entry.longitude?.toFixed(6)}
                showCopyButton
                copyTooltip="Copiar longitude"
              />
            </div>
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps?q=${entry.latitude},${entry.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <Globe className="h-4 w-4" />
                Ver no Google Maps
              </a>
            </div>
          </Card>
        )}

        {/* Rede */}
        {entry.ipAddress && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <Network className="h-5 w-5" />
              Informações de Rede
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Endereço IP"
                value={entry.ipAddress}
                showCopyButton
                copyTooltip="Copiar endereço IP"
              />
            </div>
          </Card>
        )}

        {/* Observações */}
        {entry.notes && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <StickyNote className="h-5 w-5" />
              Observações
            </h3>
            <InfoField
              label="Notas"
              value={entry.notes}
              showCopyButton
              copyTooltip="Copiar observações"
            />
          </Card>
        )}
      </PageBody>
    </PageLayout>
  );
}
