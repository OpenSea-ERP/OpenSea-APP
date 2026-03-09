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
import { overtimeService } from '@/services/hr/overtime.service';
import type { Overtime } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  NotebookText,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  overtimeKeys,
  formatDate,
  formatHours,
  getApprovalLabel,
  getApprovalColor,
  useApproveOvertime,
  ApproveModal,
} from '../src';

export default function OvertimeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const overtimeId = params.id as string;

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: overtime, isLoading } = useQuery<Overtime>({
    queryKey: overtimeKeys.detail(overtimeId),
    queryFn: async () => {
      const response = await overtimeService.get(overtimeId);
      return response.overtime;
    },
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const { mutate: approveOvertime, isPending: isApproving } =
    useApproveOvertime({
      onSuccess: () => {
        setIsApproveModalOpen(false);
        queryClient.invalidateQueries({
          queryKey: overtimeKeys.detail(overtimeId),
        });
      },
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
              { label: 'Horas Extras', href: '/hr/overtime' },
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

  if (!overtime) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Horas Extras', href: '/hr/overtime' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Coffee className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Hora extra não encontrada
            </h2>
            <Button onClick={() => router.push('/hr/overtime')}>
              Voltar para Horas Extras
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const isPending = overtime.approved === null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Horas Extras', href: '/hr/overtime' },
            { label: `Hora Extra - ${formatDate(overtime.date)}` },
          ]}
          buttons={
            isPending
              ? [
                  {
                    id: 'approve',
                    title: 'Aprovar',
                    icon: CheckCircle,
                    onClick: () => setIsApproveModalOpen(true),
                  },
                ]
              : []
          }
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-orange-500 to-orange-600">
              <Coffee className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  Hora Extra - {formatDate(overtime.date)}
                </h1>
                <Badge variant={getApprovalColor(overtime)}>
                  {getApprovalLabel(overtime)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatHours(overtime.hours)} registrada(s)
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {overtime.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>
                    {new Date(overtime.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {overtime.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(overtime.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados da Hora Extra */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados da Hora Extra
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Data"
              value={formatDate(overtime.date)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Horas"
              value={formatHours(overtime.hours)}
              badge={
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatHours(overtime.hours)}
                </Badge>
              }
            />
            <InfoField
              label="Funcionário"
              value={overtime.employeeId}
              icon={<User className="h-4 w-4" />}
              showCopyButton
              copyTooltip="Copiar ID do funcionário"
            />
            <InfoField
              label="Status"
              value={getApprovalLabel(overtime)}
              badge={
                <Badge variant={getApprovalColor(overtime)}>
                  {getApprovalLabel(overtime)}
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Motivo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <FileText className="h-5 w-5" />
            Motivo
          </h3>
          <p className="text-sm sm:text-base leading-relaxed">
            {overtime.reason}
          </p>
        </Card>

        {/* Aprovação (somente se approved !== null) */}
        {!isPending && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <CheckCircle className="h-5 w-5" />
              Aprovação
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Aprovado por"
                value={overtime.approvedBy}
                icon={<User className="h-4 w-4" />}
                showCopyButton
                copyTooltip="Copiar ID do aprovador"
              />
              <InfoField
                label="Data da aprovação"
                value={overtime.approvedAt ? formatDate(overtime.approvedAt) : null}
                icon={<Calendar className="h-4 w-4" />}
              />
            </div>
          </Card>
        )}
      </PageBody>

      {/* Approve Modal */}
      <ApproveModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        overtime={overtime}
        onApprove={(id, data) => approveOvertime({ id, data })}
        isApproving={isApproving}
      />
    </PageLayout>
  );
}
