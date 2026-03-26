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
import type { MedicalExam } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  NotebookText,
  Stethoscope,
  Trash,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  medicalExamsApi,
  medicalExamKeys,
  formatDate,
  getExamTypeLabel,
  getExamResultLabel,
  getExamResultVariant,
  useDeleteMedicalExam,
} from '../src';

export default function MedicalExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const examId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: exam, isLoading } = useQuery<MedicalExam>({
    queryKey: medicalExamKeys.detail(examId),
    queryFn: () => medicalExamsApi.get(examId),
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteMedicalExam({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      router.push('/hr/medical-exams');
    },
  });

  const { getName } = useEmployeeMap(exam ? [exam.employeeId] : []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!exam) return;
    await deleteMutation.mutateAsync(exam.id);
    setIsDeleteModalOpen(false);
  };

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
              { label: 'Exames Médicos', href: '/hr/medical-exams' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!exam) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Exames Médicos', href: '/hr/medical-exams' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Stethoscope className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Exame médico não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/medical-exams')}>
              Voltar para Exames Médicos
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
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Exames Médicos', href: '/hr/medical-exams' },
            { label: getExamTypeLabel(exam.type) },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: () => setIsDeleteModalOpen(true),
              variant: 'outline',
              disabled: deleteMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-teal-500 to-teal-600">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {getExamTypeLabel(exam.type)}
                </h1>
                <Badge variant={getExamResultVariant(exam.result)}>
                  {getExamResultLabel(exam.result)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getName(exam.employeeId)} · {exam.doctorName} ({exam.doctorCrm})
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {exam.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-teal-500" />
                  <span>{formatDate(exam.createdAt)}</span>
                </div>
              )}
              {exam.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(exam.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Exame */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados do Exame
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Funcionário"
              value={getName(exam.employeeId)}
              icon={<User className="h-4 w-4" />}
              showCopyButton
              copyTooltip="Copiar nome"
            />
            <InfoField
              label="Tipo de Exame"
              value={getExamTypeLabel(exam.type)}
            />
            <InfoField
              label="Data do Exame"
              value={formatDate(exam.examDate)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Data de Validade"
              value={
                exam.expirationDate
                  ? formatDate(exam.expirationDate)
                  : 'Não informada'
              }
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Médico"
              value={exam.doctorName}
              icon={<Stethoscope className="h-4 w-4" />}
              showCopyButton
              copyTooltip="Copiar nome do médico"
            />
            <InfoField
              label="CRM"
              value={exam.doctorCrm}
              showCopyButton
              copyTooltip="Copiar CRM"
            />
            <InfoField
              label="Resultado"
              value={getExamResultLabel(exam.result)}
              badge={
                <Badge variant={getExamResultVariant(exam.result)}>
                  {getExamResultLabel(exam.result)}
                </Badge>
              }
            />
            {exam.documentUrl && (
              <InfoField
                label="Documento"
                value={
                  <a
                    href={exam.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver documento
                  </a>
                }
              />
            )}
          </div>
        </Card>

        {/* Observações */}
        {exam.observations && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Observações
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {exam.observations}
            </p>
          </Card>
        )}

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField label="Criado em" value={formatDate(exam.createdAt)} />
            <InfoField
              label="Atualizado em"
              value={formatDate(exam.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirm Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Exame Médico"
        description="Digite seu PIN de ação para excluir este exame médico. Esta ação não pode ser desfeita."
      />
    </PageLayout>
  );
}
