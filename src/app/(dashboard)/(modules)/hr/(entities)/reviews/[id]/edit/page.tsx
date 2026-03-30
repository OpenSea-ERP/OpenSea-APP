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
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { reviewsService } from '@/services/hr/reviews.service';
import type {
  ReviewCycle,
  ReviewCycleType,
  ReviewCycleStatus,
  UpdateReviewCycleData,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ClipboardCheck,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  REVIEW_CYCLE_TYPE_LABELS,
  REVIEW_CYCLE_TYPE_OPTIONS,
  REVIEW_CYCLE_TYPE_COLORS,
  REVIEW_CYCLE_STATUS_LABELS,
  REVIEW_CYCLE_STATUS_COLORS,
} from '../src';

export default function ReviewCycleEditPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const cycleId = params.id as string;

  const canDelete = hasPermission('hr.reviews.remove');

  // ============================================================================
  // DATA
  // ============================================================================

  const {
    data: cycleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['review-cycles', cycleId],
    queryFn: async () => {
      const response = await reviewsService.getCycle(cycleId);
      return response.reviewCycle;
    },
    enabled: !!cycleId,
  });

  const cycle = cycleData as ReviewCycle | undefined;

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ReviewCycleType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (cycle) {
      setName(cycle.name);
      setDescription(cycle.description ?? '');
      setType(cycle.type);
      setStartDate(cycle.startDate ? cycle.startDate.slice(0, 10) : '');
      setEndDate(cycle.endDate ? cycle.endDate.slice(0, 10) : '');
    }
  }, [cycle]);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useMutation({
    mutationFn: (data: UpdateReviewCycleData) =>
      reviewsService.updateCycle(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles', cycleId] });
      queryClient.invalidateQueries({ queryKey: ['review-cycles', 'infinite'] });
      toast.success('Ciclo de avaliação atualizado com sucesso');
      router.push(`/hr/reviews/${cycleId}`);
    },
    onError: () => {
      toast.error('Erro ao atualizar ciclo de avaliação');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => reviewsService.deleteCycle(cycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-cycles'] });
      toast.success('Ciclo de avaliação excluído com sucesso');
      router.push('/hr/reviews');
    },
    onError: () => {
      toast.error('Erro ao excluir ciclo de avaliação');
    },
  });

  const handleSave = useCallback(async () => {
    const payload: UpdateReviewCycleData = {
      name: name.trim(),
      description: description.trim() || undefined,
      type,
      startDate,
      endDate,
    };

    await updateMutation.mutateAsync(payload);
  }, [name, description, type, startDate, endDate, updateMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync();
    setIsDeleteOpen(false);
  }, [deleteMutation]);

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Avaliações', href: '/hr/reviews' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="list" size="lg" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !cycle) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Avaliações', href: '/hr/reviews' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Ciclo de avaliação não encontrado"
            message="O ciclo de avaliação solicitado não foi encontrado."
            action={{
              label: 'Voltar',
              onClick: () => router.push('/hr/reviews'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  const typeColors = REVIEW_CYCLE_TYPE_COLORS[cycle.type];
  const statusColors = REVIEW_CYCLE_STATUS_COLORS[cycle.status];
  const isClosed = cycle.status === 'CLOSED';

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Avaliações', href: '/hr/reviews' },
            { label: cycle.name, href: `/hr/reviews/${cycleId}` },
            { label: 'Editar' },
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
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default' as const,
              disabled: updateMutation.isPending,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-xl bg-gradient-to-br ${typeColors?.gradient ?? 'from-slate-500 to-slate-600'} flex items-center justify-center shrink-0`}
            >
              <ClipboardCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold">{cycle.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={`text-xs ${typeColors?.bg ?? ''} ${typeColors?.text ?? ''} border-0`}
                >
                  {REVIEW_CYCLE_TYPE_LABELS[cycle.type] ?? cycle.type}
                </Badge>
                <Badge
                  variant="secondary"
                  className={`text-xs ${statusColors?.bg ?? ''} ${statusColors?.text ?? ''} border-0`}
                >
                  {REVIEW_CYCLE_STATUS_LABELS[cycle.status] ?? cycle.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>
                  Cadastrado em{' '}
                  {new Date(cycle.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="space-y-6 p-5">
            {/* Informacoes Basicas */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Informações Básicas
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do ciclo de avaliação"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-type">Tipo *</Label>
                  <Select
                    value={type}
                    onValueChange={(val) => setType(val as ReviewCycleType)}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_CYCLE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-description">Descrição</Label>
                  <Textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do ciclo de avaliação..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t" />

            {/* Periodo */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Período
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-start-date">Data de Início *</Label>
                    <Input
                      id="edit-start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isClosed}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-end-date">Data de Término *</Label>
                    <Input
                      id="edit-end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isClosed}
                    />
                  </div>
                </div>

                {isClosed && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Este ciclo está fechado. As datas não podem ser alteradas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Delete Modal */}
        <VerifyActionPinModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Excluir Ciclo de Avaliação"
          description="Digite seu PIN de ação para excluir este ciclo de avaliação. Todas as avaliações associadas também serão removidas. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
