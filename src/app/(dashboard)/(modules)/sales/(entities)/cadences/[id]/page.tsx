/**
 * OpenSea OS - Cadence Detail Page
 * Detalhes da cadência com timeline de etapas e inscrições
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cadencesConfig } from '@/config/entities/cadences.config';
import { useCadence, useDeleteCadence } from '@/hooks/sales/use-cadences';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import type { CadenceStepType } from '@/types/sales';
import {
  CADENCE_ENROLLMENT_STATUS_LABELS,
  CADENCE_STEP_TYPE_LABELS,
} from '@/types/sales';
import {
  Activity,
  Clock,
  Edit,
  Linkedin,
  Mail,
  MessageSquare,
  Phone,
  Route,
  SquareCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ─── Step Type Icons ──────────────────────────────────────────

const STEP_TYPE_ICONS: Record<CadenceStepType, React.ElementType> = {
  EMAIL: Mail,
  CALL: Phone,
  TASK: SquareCheck,
  LINKEDIN: Linkedin,
  WHATSAPP: MessageSquare,
  WAIT: Clock,
};

const STEP_TYPE_COLORS: Record<CadenceStepType, string> = {
  EMAIL: 'bg-sky-500',
  CALL: 'bg-emerald-500',
  TASK: 'bg-violet-500',
  LINKEDIN: 'bg-blue-600',
  WHATSAPP: 'bg-green-500',
  WAIT: 'bg-gray-400',
};

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  PAUSED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  COMPLETED:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  BOUNCED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

// ─── Page ─────────────────────────────────────────────────────

export default function CadenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const cadenceId = params.id as string;

  const { data, isLoading, error, refetch } = useCadence(cadenceId);
  const deleteMutation = useDeleteCadence();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const cadence = data?.cadence;
  const canDelete = cadencesConfig.permissions.delete
    ? hasPermission(cadencesConfig.permissions.delete)
    : false;
  const canEdit = cadencesConfig.permissions.update
    ? hasPermission(cadencesConfig.permissions.update)
    : false;

  const handleDelete = useCallback(async () => {
    await deleteMutation.mutateAsync(cadenceId);
    setDeleteModalOpen(false);
    toast.success('Cadência excluída com sucesso!');
    router.push('/sales/cadences');
  }, [cadenceId, deleteMutation, router]);

  // ─── Loading / Error ──────────────────────────────────────

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Cadências', href: '/sales/cadences' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="grid" size="md" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !cadence) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Cadências', href: '/sales/cadences' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar cadência"
            message="Não foi possível carregar os dados da cadência."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <PageLayout data-testid="cadence-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Cadências', href: '/sales/cadences' },
            { label: cadence.name },
          ]}
          buttons={[
            ...(canDelete
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
            ...(canEdit
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () =>
                      router.push(`/sales/cadences/${cadenceId}/edit`),
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
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-cyan-500 to-teal-600 flex items-center justify-center shrink-0">
              <Route className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {cadence.name}
              </h1>
              {cadence.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {cadence.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    cadence.isActive
                      ? 'border-emerald-600/25 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                      : 'border-gray-300 bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                  )}
                >
                  {cadence.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Criada em{' '}
                  {new Date(cadence.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Activity className="h-4 w-4 text-cyan-500" />
              <div>
                <p className="text-sm font-medium">{cadence.totalSteps}</p>
                <p className="text-xs text-muted-foreground">Etapas</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-sm font-medium">
                  {cadence.totalEnrollments}
                </p>
                <p className="text-xs text-muted-foreground">Total Inscritos</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Users className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-sm font-medium">
                  {cadence.activeEnrollments}
                </p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="steps" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="steps">Etapas</TabsTrigger>
            <TabsTrigger value="enrollments">Inscrições</TabsTrigger>
          </TabsList>

          <TabsContent value="steps">
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              {!cadence.steps || cadence.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma etapa configurada nesta cadência.
                </p>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-border" />

                  <div className="space-y-4">
                    {cadence.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step, index) => {
                        const Icon = STEP_TYPE_ICONS[step.type];
                        return (
                          <div
                            key={step.id}
                            className="relative flex items-start gap-4 pl-0"
                          >
                            {/* Timeline dot */}
                            <div
                              className={cn(
                                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10',
                                STEP_TYPE_COLORS[step.type]
                              )}
                            >
                              <Icon className="h-5 w-5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  Etapa {step.order}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {CADENCE_STEP_TYPE_LABELS[step.type]}
                                </Badge>
                              </div>

                              {step.delayDays > 0 && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  Aguardar {step.delayDays} dia
                                  {step.delayDays !== 1 ? 's' : ''}
                                </div>
                              )}

                              {step.subject && (
                                <p className="text-sm mt-1">
                                  <span className="text-muted-foreground">
                                    Assunto:{' '}
                                  </span>
                                  {step.subject}
                                </p>
                              )}

                              {step.notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {step.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              {!cadence.enrollments || cadence.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma inscrição nesta cadência.
                </p>
              ) : (
                <div className="space-y-3">
                  {cadence.enrollments.map(enrollment => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {enrollment.contactName || 'Contato'}
                        </p>
                        {enrollment.contactEmail && (
                          <p className="text-xs text-muted-foreground truncate">
                            {enrollment.contactEmail}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Etapa {enrollment.currentStepOrder}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                            ENROLLMENT_STATUS_COLORS[enrollment.status] ||
                              'border-gray-300 bg-gray-100 text-gray-600'
                          )}
                        >
                          {CADENCE_ENROLLMENT_STATUS_LABELS[enrollment.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDelete}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta cadência. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
