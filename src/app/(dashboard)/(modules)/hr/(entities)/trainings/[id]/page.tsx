/**
 * OpenSea OS - Training Program Detail Page
 * Página de detalhes do programa de treinamento
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { trainingService } from '@/services/hr/training.service';
import type {
  TrainingProgram,
  TrainingEnrollment,
  TrainingCategory,
} from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Calendar,
  Clock,
  Edit,
  GraduationCap,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  TRAINING_CATEGORY_COLORS,
  TRAINING_CATEGORY_LABELS,
  TRAINING_FORMAT_LABELS,
  TRAINING_STATUS_LABELS,
} from '../src';

export default function TrainingProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const programId = params.id as string;

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const canModify = hasPermission('hr.training.modify');
  const canDelete = hasPermission('hr.training.remove');

  const {
    data: program,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['training-programs', programId],
    queryFn: async () => {
      const { trainingProgram } = await trainingService.getProgram(programId);
      return trainingProgram;
    },
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['training-enrollments', programId],
    queryFn: () =>
      trainingService.listEnrollments({ trainingProgramId: programId }),
    enabled: !!program,
  });

  const deleteMutation = useMutation({
    mutationFn: () => trainingService.deleteProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-programs'] });
      toast.success('Programa de treinamento excluído com sucesso');
      router.push('/hr/trainings');
    },
    onError: () => {
      toast.error('Erro ao excluir programa de treinamento');
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Treinamentos', href: '/hr/trainings' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !program) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Treinamentos', href: '/hr/trainings' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Programa não encontrado"
            message="O programa de treinamento solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/trainings'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const categoryLabel =
    TRAINING_CATEGORY_LABELS[program.category] ?? program.category;
  const formatLabel = TRAINING_FORMAT_LABELS[program.format] ?? program.format;
  const colors =
    TRAINING_CATEGORY_COLORS[program.category as TrainingCategory] ??
    TRAINING_CATEGORY_COLORS.TECHNICAL;
  const enrollments = enrollmentsData?.enrollments ?? [];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Treinamentos', href: '/hr/trainings' },
            { label: program.name },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setIsDeleteOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            ...(canModify
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () =>
                      router.push(`/hr/trainings/${programId}/edit`),
                    variant: 'default' as const,
                  },
                ]
              : []),
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${colors.gradient} text-white`}
            >
              <GraduationCap className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{program.name}</h1>
              {program.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {program.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={`${colors.bg} ${colors.text} border-0`}
                >
                  {categoryLabel}
                </Badge>
                <Badge variant="outline">{formatLabel}</Badge>
                {program.isMandatory && (
                  <Badge
                    variant="outline"
                    className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-0"
                  >
                    Obrigatório
                  </Badge>
                )}
                <Badge variant={program.isActive ? 'default' : 'secondary'}>
                  {program.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Duração</span>
            </div>
            <p className="text-lg font-semibold">{program.durationHours}h</p>
          </Card>

          <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs">Inscritos</span>
            </div>
            <p className="text-lg font-semibold">{enrollments.length}</p>
          </Card>

          <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs">Instrutor</span>
            </div>
            <p className="text-sm font-medium truncate">
              {program.instructor ?? 'Não definido'}
            </p>
          </Card>

          <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Validade</span>
            </div>
            <p className="text-sm font-medium">
              {program.validityMonths
                ? `${program.validityMonths} meses`
                : 'Sem validade'}
            </p>
          </Card>
        </div>

        {/* Enrollments */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Inscrições ({enrollments.length})
          </h2>

          {enrollments.length === 0 ? (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum funcionário inscrito neste programa
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment: TrainingEnrollment) => (
                <Card
                  key={enrollment.id}
                  className="bg-white dark:bg-slate-800/60 border border-border p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Funcionário: {enrollment.employeeId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Inscrito em{' '}
                      {new Date(enrollment.enrolledAt).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {enrollment.score !== null && (
                      <span className="text-sm font-medium">
                        Nota: {enrollment.score}
                      </span>
                    )}
                    <Badge
                      variant={
                        enrollment.status === 'COMPLETED'
                          ? 'default'
                          : enrollment.status === 'CANCELLED'
                            ? 'secondary'
                            : 'outline'
                      }
                    >
                      {TRAINING_STATUS_LABELS[enrollment.status] ??
                        enrollment.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={() => deleteMutation.mutate()}
          title="Excluir Programa de Treinamento"
          description={`Digite seu PIN de ação para excluir "${program.name}". Esta ação não pode ser desfeita.`}
        />
      </PageBody>
    </PageLayout>
  );
}
