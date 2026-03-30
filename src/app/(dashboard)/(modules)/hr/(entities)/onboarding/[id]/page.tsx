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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { onboardingService } from '@/services/hr/onboarding.service';
import { portalService } from '@/services/hr/portal.service';
import type { OnboardingChecklist } from '@/types/hr/onboarding.types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardList, Clock, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { onboardingKeys } from '../src/api/keys';
import { useDeleteOnboarding } from '../src/api/mutations';

export default function OnboardingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.ONBOARDING.DELETE);

  const checklistId = params.id as string;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [completingItemId, setCompletingItemId] = useState<string | null>(null);

  const {
    data: checklist,
    isLoading,
    error,
  } = useQuery({
    queryKey: onboardingKeys.detail(checklistId),
    queryFn: async (): Promise<OnboardingChecklist> => {
      const response = await onboardingService.getChecklist(checklistId);
      return response.checklist;
    },
    staleTime: 30_000,
  });

  const deleteOnboarding = useDeleteOnboarding({
    onSuccess: () => {
      setDeleteModalOpen(false);
      router.push('/hr/onboarding');
    },
  });

  const handleCompleteItem = useCallback(
    async (itemId: string) => {
      setCompletingItemId(itemId);
      try {
        await portalService.completeOnboardingItem(itemId);
        queryClient.invalidateQueries({
          queryKey: onboardingKeys.detail(checklistId),
        });
        queryClient.invalidateQueries({ queryKey: onboardingKeys.lists() });
        toast.success('Item concluído!');
      } catch {
        toast.error('Erro ao concluir item. Tente novamente.');
      } finally {
        setCompletingItemId(null);
      }
    },
    [checklistId, queryClient]
  );

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Onboarding', href: '/hr/onboarding' },
              { label: 'Carregando...' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !checklist) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Onboarding', href: '/hr/onboarding' },
              { label: 'Erro' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridError type="server" title="Erro ao carregar" message={error?.message} />
        </PageBody>
      </PageLayout>
    );
  }

  const completedCount = checklist.items.filter(item => item.completed).length;
  const totalCount = checklist.items.length;

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Onboarding', href: '/hr/onboarding' },
            { label: checklist.title },
          ]}
          hasPermission={hasPermission}
          buttons={
            canDelete
              ? [
                  {
                    label: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : undefined
          }
        />
      </PageHeader>

      <PageBody>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Identity Card */}
          <Card className="bg-white/5 p-5 border border-border">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <ClipboardList className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold">{checklist.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Criado em{' '}
                  {new Date(checklist.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <Badge
                variant={checklist.progress === 100 ? 'default' : 'secondary'}
                className={
                  checklist.progress === 100
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300 border-0'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300 border-0'
                }
              >
                {checklist.progress === 100 ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Concluído
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 mr-1" />
                    Em Progresso
                  </>
                )}
              </Badge>
            </div>
          </Card>

          {/* Progress Section */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Progresso</h2>
              <span className="text-sm font-medium text-muted-foreground">
                {completedCount} de {totalCount} itens
              </span>
            </div>
            <Progress value={checklist.progress} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-right">
              {checklist.progress}% concluído
            </p>
          </Card>

          {/* Checklist Items */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h2 className="text-sm font-semibold mb-4">Itens do Checklist</h2>
            <div className="space-y-2">
              {checklist.items.map(item => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    item.completed
                      ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800/40 border-border hover:border-blue-200 dark:hover:border-blue-500/30'
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    disabled={item.completed || completingItemId === item.id}
                    onCheckedChange={() => {
                      if (!item.completed) {
                        handleCompleteItem(item.id);
                      }
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        item.completed
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {item.completedAt && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        Concluído em{' '}
                        {new Date(item.completedAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  {completingItemId === item.id && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageBody>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={() => deleteOnboarding.mutate(checklistId)}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir o checklist "${checklist.title}".`}
      />
    </PageLayout>
  );
}
