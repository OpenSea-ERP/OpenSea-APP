'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import { formatCEP } from '@/helpers/formatters';
import type {
  CompanyAddress,
  CreateCompanyAddressData,
  UpdateCompanyAddressData,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import { companyAddressesApi } from '../api';

const AddressModal = dynamic(() => import('../modals/address-modal').then(m => ({ default: m.AddressModal })), { ssr: false });

interface AddressesEditTabProps {
  companyId: string;
}

export function AddressesEditTab({ companyId }: AddressesEditTabProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAddress, setSelectedAddress] = useState<CompanyAddress | null>(
    null
  );

  const { data: addressesData, isLoading } = useQuery({
    queryKey: ['company-addresses', companyId],
    queryFn: () => companyAddressesApi.list(companyId),
  });

  const addresses = addressesData?.addresses;

  const createMutation = useMutation({
    mutationFn: (data: CreateCompanyAddressData) =>
      companyAddressesApi.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-addresses', companyId],
        refetchType: 'all',
      });
      toast.success('Endereço criado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao criar endereço';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCompanyAddressData;
    }) => companyAddressesApi.update(companyId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-addresses', companyId],
        refetchType: 'all',
      });
      toast.success('Endereço atualizado com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao atualizar endereço';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (addressId: string) =>
      companyAddressesApi.delete(companyId, addressId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-addresses', companyId],
        refetchType: 'all',
      });
      toast.success('Endereço removido com sucesso');
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao remover endereço';
      toast.error(message);
    },
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (address: CompanyAddress) => {
    setModalMode('edit');
    setSelectedAddress(address);
    setIsModalOpen(true);
  };

  const handleSubmit = async (
    data: Partial<CreateCompanyAddressData | UpdateCompanyAddressData>
  ) => {
    if (modalMode === 'create') {
      await createMutation.mutateAsync(data as CreateCompanyAddressData);
    } else if (selectedAddress) {
      await updateMutation.mutateAsync({
        id: selectedAddress.id,
        data: data as UpdateCompanyAddressData,
      });
    }
  };

  if (isLoading) {
    return (
      <TabsContent value="addresses" className="w-full">
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
    <TabsContent value="addresses" className="w-full">
      <Card className="w-full p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-white/60" />
            <h3 className="text-lg font-semibold uppercase tracking-wider text-white/60">
              Endereços
            </h3>
          </div>
          <Button size="sm" className="gap-2" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </Button>
        </div>

        {!addresses || addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum endereço cadastrado
          </p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address: CompanyAddress) => (
              <Card key={address.id} className="p-4 bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Logradouro
                      </p>
                      <p className="text-sm font-medium">{address.street}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Número</p>
                      <p className="text-sm font-medium">{address.number}</p>
                    </div>
                    {address.complement && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Complemento
                        </p>
                        <p className="text-sm font-medium">
                          {address.complement}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">Bairro</p>
                      <p className="text-sm font-medium">{address.district}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Cidade</p>
                      <p className="text-sm font-medium">{address.city}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Estado</p>
                      <p className="text-sm font-medium">{address.state}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CEP</p>
                      <p className="text-sm font-medium">
                        {formatCEP(address.zip)}
                      </p>
                    </div>
                    {address.isPrimary && (
                      <div>
                        <Badge variant="default">Principal</Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(address)}
                      aria-label="Editar endereço"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(address.id)}
                      disabled={deleteMutation.isPending}
                      aria-label="Remover endereço"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <AddressModal
          isOpen={isModalOpen}
          mode={modalMode}
          address={selectedAddress}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Card>
    </TabsContent>
  );
}
