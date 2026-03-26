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
import type { SafetyProgram, WorkplaceRisk } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  NotebookText,
  Pencil,
  Plus,
  Shield,
  ShieldCheck,
  Trash,
  Trash2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { safetyProgramsService } from '@/services/hr/safety-programs.service';
import {
  safetyProgramsApi,
  safetyProgramKeys,
  formatDate,
  getProgramTypeLabel,
  getProgramStatusLabel,
  getProgramStatusVariant,
  getRiskCategoryLabel,
  getRiskSeverityLabel,
  getRiskSeverityVariant,
  useDeleteSafetyProgram,
  useCreateWorkplaceRisk,
  useUpdateWorkplaceRisk,
  useDeleteWorkplaceRisk,
} from '../src';
import { RiskModal } from '../src/modals/risk-modal';

export default function SafetyProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const programId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [editingRisk, setEditingRisk] = useState<WorkplaceRisk | null>(null);
  const [deleteRiskTarget, setDeleteRiskTarget] =
    useState<WorkplaceRisk | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: program, isLoading } = useQuery<SafetyProgram>({
    queryKey: safetyProgramKeys.detail(programId),
    queryFn: () => safetyProgramsApi.get(programId),
  });

  const { data: risksData, isLoading: risksLoading } = useQuery({
    queryKey: safetyProgramKeys.risks(programId),
    queryFn: async () => {
      const response = await safetyProgramsService.listRisks(programId);
      return response.risks ?? [];
    },
  });

  const risks = risksData ?? [];

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteSafetyProgram({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: safetyProgramKeys.lists() });
      router.push('/hr/safety-programs');
    },
  });

  const createRiskMutation = useCreateWorkplaceRisk(programId, {
    onSuccess: () => {
      setIsRiskModalOpen(false);
      setEditingRisk(null);
    },
  });

  const updateRiskMutation = useUpdateWorkplaceRisk(programId, {
    onSuccess: () => {
      setIsRiskModalOpen(false);
      setEditingRisk(null);
    },
  });

  const deleteRiskMutation = useDeleteWorkplaceRisk(programId, {
    onSuccess: () => {
      setDeleteRiskTarget(null);
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!program) return;
    await deleteMutation.mutateAsync(program.id);
    setIsDeleteModalOpen(false);
  };

  const handleRiskSubmit = useCallback(
    async (data: Parameters<typeof createRiskMutation.mutateAsync>[0]) => {
      if (editingRisk) {
        await updateRiskMutation.mutateAsync({ riskId: editingRisk.id, data });
      } else {
        await createRiskMutation.mutateAsync(data);
      }
    },
    [editingRisk, createRiskMutation, updateRiskMutation]
  );

  const handleDeleteRiskConfirm = async () => {
    if (!deleteRiskTarget) return;
    await deleteRiskMutation.mutateAsync(deleteRiskTarget.id);
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
              { label: 'Programas de Segurança', href: '/hr/safety-programs' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!program) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Programas de Segurança', href: '/hr/safety-programs' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Programa não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/safety-programs')}>
              Voltar para Programas
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
            { label: 'Programas de Segurança', href: '/hr/safety-programs' },
            { label: program.name },
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-emerald-500 to-emerald-600">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {program.name}
                </h1>
                <Badge variant={getProgramStatusVariant(program.status)}>
                  {getProgramStatusLabel(program.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {getProgramTypeLabel(program.type)} · {program.responsibleName}{' '}
                ({program.responsibleRegistration})
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {program.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  <span>{formatDate(program.createdAt)}</span>
                </div>
              )}
              {program.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(program.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Programa */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados do Programa
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Tipo"
              value={getProgramTypeLabel(program.type)}
              icon={<Shield className="h-4 w-4" />}
            />
            <InfoField
              label="Status"
              value={getProgramStatusLabel(program.status)}
              badge={
                <Badge variant={getProgramStatusVariant(program.status)}>
                  {getProgramStatusLabel(program.status)}
                </Badge>
              }
            />
            <InfoField
              label="Vigência Início"
              value={formatDate(program.validFrom)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Vigência Fim"
              value={formatDate(program.validUntil)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Responsável Técnico"
              value={program.responsibleName}
              icon={<User className="h-4 w-4" />}
              showCopyButton
              copyTooltip="Copiar nome"
            />
            <InfoField
              label="Registro Profissional"
              value={program.responsibleRegistration}
              showCopyButton
              copyTooltip="Copiar registro"
            />
            {program.documentUrl && (
              <InfoField label="Documento" value={program.documentUrl} />
            )}
          </div>
        </Card>

        {/* Observações */}
        {program.notes && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Observações
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {program.notes}
            </p>
          </Card>
        )}

        {/* Riscos Ambientais */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2">
              <AlertTriangle className="h-5 w-5" />
              Riscos Ambientais
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingRisk(null);
                setIsRiskModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Adicionar Risco
            </Button>
          </div>

          {risksLoading ? (
            <GridLoading count={3} layout="list" size="sm" />
          ) : risks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum risco ambiental cadastrado para este programa.
            </p>
          ) : (
            <div className="space-y-2">
              {risks.map(risk => (
                <div
                  key={risk.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-white dark:bg-slate-800/60"
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      risk.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{risk.name}</p>
                      <Badge variant={getRiskSeverityVariant(risk.severity)}>
                        {getRiskSeverityLabel(risk.severity)}
                      </Badge>
                      <Badge variant="outline">
                        {getRiskCategoryLabel(risk.category)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[
                        risk.source && `Fonte: ${risk.source}`,
                        risk.affectedArea && `Área: ${risk.affectedArea}`,
                        risk.epiRequired && `EPI: ${risk.epiRequired}`,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Sem detalhes adicionais'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingRisk(risk);
                      setIsRiskModalOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteRiskTarget(risk)}
                    className="text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Criado em"
              value={formatDate(program.createdAt)}
            />
            <InfoField
              label="Atualizado em"
              value={formatDate(program.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Risk Modal */}
      <RiskModal
        isOpen={isRiskModalOpen}
        onClose={() => {
          setIsRiskModalOpen(false);
          setEditingRisk(null);
        }}
        onSubmit={handleRiskSubmit}
        isSubmitting={
          createRiskMutation.isPending || updateRiskMutation.isPending
        }
        risk={editingRisk}
      />

      {/* Delete Program PIN Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Programa de Segurança"
        description="Digite seu PIN de ação para excluir este programa de segurança. Esta ação não pode ser desfeita."
      />

      {/* Delete Risk PIN Modal */}
      <VerifyActionPinModal
        isOpen={!!deleteRiskTarget}
        onClose={() => setDeleteRiskTarget(null)}
        onSuccess={handleDeleteRiskConfirm}
        title="Excluir Risco Ambiental"
        description={`Digite seu PIN de ação para excluir o risco "${deleteRiskTarget?.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
