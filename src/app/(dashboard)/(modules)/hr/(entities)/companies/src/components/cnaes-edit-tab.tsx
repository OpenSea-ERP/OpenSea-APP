'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import { formatCNAE } from '@/helpers/formatters';
import type { CompanyCnae, CreateCompanyCnaeData } from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, FileCheck, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import { companyCnaesApi } from '../api';

const CnaeModal = dynamic(() => import('../modals/cnae-modal').then(m => ({ default: m.CnaeModal })), { ssr: false });

interface CnaesEditTabProps {
  companyId: string;
}

export function CnaesEditTab({ companyId }: CnaesEditTabProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCnae, setSelectedCnae] = useState<CompanyCnae | null>(null);

  const { data: cnaesData, isLoading } = useQuery({
    queryKey: ['company-cnaes', companyId],
    queryFn: () => companyCnaesApi.list(companyId),
  });

  const cnaes = cnaesData?.cnaes;

  const deleteMutation = useMutation({
    mutationFn: (cnaeId: string) => companyCnaesApi.delete(companyId, cnaeId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-cnaes', companyId],
        refetchType: 'all',
      });
      toast.success('CNAE removido com sucesso');
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao remover CNAE';
      toast.error(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CreateCompanyCnaeData>) =>
      companyCnaesApi.create(companyId, data as CreateCompanyCnaeData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-cnaes', companyId],
        refetchType: 'all',
      });
      toast.success('CNAE criado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao criar CNAE';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateCompanyCnaeData>;
    }) => companyCnaesApi.update(companyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-cnaes', companyId],
        refetchType: 'all',
      });
      toast.success('CNAE atualizado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao atualizar CNAE';
      toast.error(message);
    },
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCnae(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cnae: CompanyCnae) => {
    setModalMode('edit');
    setSelectedCnae(cnae);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: Partial<CreateCompanyCnaeData>) => {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(data);
    } else if (selectedCnae) {
      await updateMutation.mutateAsync({ id: selectedCnae.id, data });
    }
  };

  if (isLoading) {
    return (
      <TabsContent value="cnaes" className="w-full">
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        </Card>
      </TabsContent>
    );
  }

  const primaryCnae = cnaes?.find((cnae: CompanyCnae) => cnae.isPrimary);
  const secondaryCnaes = cnaes
    ?.filter((cnae: CompanyCnae) => !cnae.isPrimary)
    .sort((a: CompanyCnae, b: CompanyCnae) => a.code.localeCompare(b.code));

  return (
    <TabsContent value="cnaes" className="w-full">
      <Card className="w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-white/60" />
            <h3 className="text-lg font-semibold uppercase tracking-wider text-white/60">
              CNAEs
            </h3>
          </div>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Primary CNAE */}
          {primaryCnae && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/80 uppercase tracking-wider">
                CNAE Principal
              </h4>
              <Card className="p-4 bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Código</p>
                      <p className="text-sm font-medium">
                        {formatCNAE(primaryCnae.code)}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-muted-foreground">Descrição</p>
                      <p className="text-sm font-medium">
                        {primaryCnae.description}
                      </p>
                    </div>
                    <div>
                      <Badge variant="default">Principal</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(primaryCnae)}
                      aria-label="Editar CNAE"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(primaryCnae.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Remover CNAE"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Secondary CNAEs */}
          {secondaryCnaes && secondaryCnaes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-white/60 uppercase tracking-wider">
                CNAEs Secundários
              </h4>
              <div className="space-y-3">
                {secondaryCnaes.map((cnae: CompanyCnae) => (
                  <Card key={cnae.id} className="p-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Código
                          </p>
                          <p className="text-sm font-medium">
                            {formatCNAE(cnae.code)}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Descrição
                          </p>
                          <p className="text-sm font-medium">
                            {cnae.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(cnae)}
                          aria-label="Editar CNAE"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(cnae.id)}
                          disabled={deleteMutation.isPending}
                          aria-label="Remover CNAE"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!primaryCnae && (!secondaryCnaes || secondaryCnaes.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum CNAE cadastrado
            </p>
          )}
        </div>

        <CnaeModal
          isOpen={isModalOpen}
          mode={modalMode}
          cnae={selectedCnae}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Card>
    </TabsContent>
  );
}
