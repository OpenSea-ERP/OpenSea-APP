'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import type {
  CompanyStakeholder,
  CreateCompanyStakeholderData,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Trash2, Users } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import { companyStakeholdersApi } from '../api';

const StakeholderModal = dynamic(() => import('../modals/stakeholder-modal').then(m => ({ default: m.StakeholderModal })), { ssr: false });

interface StakeholdersEditTabProps {
  companyId: string;
}

export function StakeholdersEditTab({ companyId }: StakeholdersEditTabProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedStakeholder, setSelectedStakeholder] =
    useState<CompanyStakeholder | null>(null);

  const { data: stakeholdersData, isLoading } = useQuery({
    queryKey: ['company-stakeholders', companyId],
    queryFn: async () => {
      try {
        const response = await companyStakeholdersApi.list(companyId, {
          includeInactive: true,
        });
        return response;
      } catch (error) {
        return { stakeholders: [], total: 0 };
      }
    },
    throwOnError: false,
    retry: false,
  });

  const stakeholders =
    stakeholdersData?.stakeholders ??
    (Array.isArray(stakeholdersData) ? stakeholdersData : []);

  const deleteMutation = useMutation({
    mutationFn: (stakeholderId: string) =>
      companyStakeholdersApi.delete(companyId, stakeholderId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-stakeholders', companyId],
        refetchType: 'all',
      });
      toast.success('Sócio removido com sucesso');
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao remover sócio';
      toast.error(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CreateCompanyStakeholderData>) =>
      companyStakeholdersApi.create(
        companyId,
        data as CreateCompanyStakeholderData
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-stakeholders', companyId],
        refetchType: 'all',
      });
      toast.success('Sócio criado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao criar sócio';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCompanyStakeholderData>;
    }) => companyStakeholdersApi.update(companyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-stakeholders', companyId],
        refetchType: 'all',
      });
      toast.success('Sócio atualizado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao atualizar sócio';
      toast.error(message);
    },
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedStakeholder(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stakeholder: CompanyStakeholder) => {
    setModalMode('edit');
    setSelectedStakeholder(stakeholder);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<CreateCompanyStakeholderData>) => {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (selectedStakeholder) {
      await updateMutation.mutateAsync({ id: selectedStakeholder.id, data });
    }
  };

  if (isLoading) {
    return (
      <TabsContent value="stakeholders" className="w-full">
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="stakeholders" className="w-full">
      <Card className="w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white/60" />
            <h3 className="text-lg font-semibold uppercase tracking-wider text-white/60">
              Sócios
            </h3>
          </div>
          <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>

        {!stakeholders || stakeholders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum sócio cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {stakeholders.map((stakeholder: CompanyStakeholder) => (
              <Card key={stakeholder.id} className="p-4 bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Nome</p>
                      <p className="text-sm font-medium">{stakeholder.name}</p>
                    </div>
                    {stakeholder.personDocumentMasked && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Documento
                        </p>
                        <p className="text-sm font-medium">
                          {stakeholder.personDocumentMasked}
                        </p>
                      </div>
                    )}
                    {stakeholder.role && (
                      <div>
                        <p className="text-xs text-muted-foreground">Cargo</p>
                        <p className="text-sm font-medium">
                          {stakeholder.role}
                        </p>
                      </div>
                    )}
                    {stakeholder.isLegalRepresentative && (
                      <div>
                        <Badge variant="default">Representante Legal</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(stakeholder)}
                      aria-label="Editar sócio"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(stakeholder.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Remover sócio"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <StakeholderModal
          isOpen={isModalOpen}
          mode={modalMode}
          stakeholder={selectedStakeholder}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Card>
    </TabsContent>
  );
}
