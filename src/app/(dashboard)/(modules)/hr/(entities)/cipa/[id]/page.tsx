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
import type { CipaMandate, CipaMember } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  FileText,
  NotebookText,
  Plus,
  Shield,
  ShieldCheck,
  Trash,
  Trash2,
  Users,
  Vote,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { cipaService } from '@/services/hr/cipa.service';
import {
  cipaApi,
  cipaKeys,
  formatDate,
  getMandateStatusLabel,
  getMandateStatusVariant,
  getMemberRoleLabel,
  getMemberTypeLabel,
  getMemberRoleBadgeClasses,
  useDeleteCipaMandate,
  useAddCipaMember,
  useRemoveCipaMember,
} from '../src';
import { AddMemberModal } from '../src/modals/add-member-modal';

export default function CipaMandateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const mandateId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<CipaMember | null>(null);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: mandate, isLoading } = useQuery<CipaMandate>({
    queryKey: cipaKeys.mandateDetail(mandateId),
    queryFn: () => cipaApi.getMandate(mandateId),
  });

  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: cipaKeys.members(mandateId),
    queryFn: async () => {
      const response = await cipaService.listMembers(mandateId);
      return response.members ?? [];
    },
  });

  const members = membersData ?? [];

  // Employee name resolution
  const employeeIds = useMemo(
    () => members.map(m => m.employeeId),
    [members]
  );
  const { getName } = useEmployeeMap(employeeIds);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useDeleteCipaMandate({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.mandates() });
      router.push('/hr/cipa');
    },
  });

  const addMemberMutation = useAddCipaMember(mandateId, {
    onSuccess: () => {
      setIsMemberModalOpen(false);
    },
  });

  const removeMemberMutation = useRemoveCipaMember(mandateId, {
    onSuccess: () => {
      setDeleteMemberTarget(null);
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = async () => {
    if (!mandate) return;
    await deleteMutation.mutateAsync(mandate.id);
    setIsDeleteModalOpen(false);
  };

  const handleAddMember = useCallback(
    async (data: Parameters<typeof addMemberMutation.mutateAsync>[0]) => {
      await addMemberMutation.mutateAsync(data);
    },
    [addMemberMutation]
  );

  const handleRemoveMemberConfirm = async () => {
    if (!deleteMemberTarget) return;
    await removeMemberMutation.mutateAsync(deleteMemberTarget.id);
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
              { label: 'CIPA', href: '/hr/cipa' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!mandate) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'CIPA', href: '/hr/cipa' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Mandato não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/cipa')}>
              Voltar para CIPA
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
            { label: 'CIPA', href: '/hr/cipa' },
            { label: mandate.name },
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-amber-500 to-amber-600">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {mandate.name}
                </h1>
                <Badge variant={getMandateStatusVariant(mandate.status)}>
                  {getMandateStatusLabel(mandate.status)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatDate(mandate.startDate)} — {formatDate(mandate.endDate)}
                {mandate.electionDate && ` · Eleição: ${formatDate(mandate.electionDate)}`}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {mandate.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(mandate.createdAt)}</span>
                </div>
              )}
              {mandate.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>{formatDate(mandate.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Mandato */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados do Mandato
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Status"
              value={getMandateStatusLabel(mandate.status)}
              badge={
                <Badge variant={getMandateStatusVariant(mandate.status)}>
                  {getMandateStatusLabel(mandate.status)}
                </Badge>
              }
            />
            <InfoField
              label="Período"
              value={`${formatDate(mandate.startDate)} — ${formatDate(mandate.endDate)}`}
              icon={<Calendar className="h-4 w-4" />}
            />
            {mandate.electionDate && (
              <InfoField
                label="Data da Eleição"
                value={formatDate(mandate.electionDate)}
                icon={<Vote className="h-4 w-4" />}
              />
            )}
          </div>
        </Card>

        {/* Observações */}
        {mandate.notes && (
          <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Observações
            </h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {mandate.notes}
            </p>
          </Card>
        )}

        {/* Membros */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2">
              <Users className="h-5 w-5" />
              Membros da CIPA
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMemberModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          </div>

          {membersLoading ? (
            <GridLoading count={3} layout="list" size="sm" />
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum membro cadastrado neste mandato.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map(member => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-white dark:bg-slate-800/60"
                >
                  {/* Stability indicator */}
                  {member.isStable && (
                    <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" title="Estabilidade provisória" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {getName(member.employeeId)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getMemberRoleBadgeClasses(member.role)}`}
                      >
                        {getMemberRoleLabel(member.role)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getMemberTypeLabel(member.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {member.isStable && member.stableUntil
                        ? `Estabilidade até ${formatDate(member.stableUntil)}`
                        : member.isStable
                          ? 'Possui estabilidade provisória'
                          : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setDeleteMemberTarget(member)}
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
            <InfoField label="Criado em" value={formatDate(mandate.createdAt)} />
            <InfoField
              label="Atualizado em"
              value={formatDate(mandate.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSubmit={handleAddMember}
        isSubmitting={addMemberMutation.isPending}
      />

      {/* Delete Mandate PIN Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Mandato da CIPA"
        description="Digite seu PIN de ação para excluir este mandato. Esta ação não pode ser desfeita."
      />

      {/* Remove Member PIN Modal */}
      <VerifyActionPinModal
        isOpen={!!deleteMemberTarget}
        onClose={() => setDeleteMemberTarget(null)}
        onSuccess={handleRemoveMemberConfirm}
        title="Remover Membro da CIPA"
        description={`Digite seu PIN de ação para remover este membro da CIPA. Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
