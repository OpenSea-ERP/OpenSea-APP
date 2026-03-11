/**
 * Manufacturer Detail Page - Identical to Company Detail Page
 */

'use client';

import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
import { InfoField } from '@/components/shared/info-field';
import { MetadataSection } from '@/components/shared/metadata-section';
import { FileManager } from '@/components/storage';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCNPJ } from '@/lib/masks';
import type { Manufacturer } from '@/types/stock';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit,
  Factory,
  FolderOpen,
  MapPinHouse,
  Notebook,
  NotebookText,
  Trash,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { manufacturersApi } from '../src';

export default function ManufacturerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const manufacturerId = params.id as string;

  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: manufacturer, isLoading } = useQuery<Manufacturer>({
    queryKey: ['manufacturers', manufacturerId],
    queryFn: () => manufacturersApi.get(manufacturerId),
    enabled: !!manufacturerId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => manufacturersApi.delete(manufacturerId),
    onSuccess: () => {
      toast.success('Fabricante excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      router.push('/stock/manufacturers');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir fabricante', { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">
          Carregando dados do fabricante...
        </p>
      </div>
    );
  }

  if (!manufacturer) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Fabricante não encontrado.</p>
      </div>
    );
  }

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };
  const handleEdit = (id: string) => {
    router.push(`/stock/manufacturers/${id}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <PageBreadcrumb
          items={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Fabricantes', href: '/stock/manufacturers' },
            {
              label: manufacturer.name,
              href: `/stock/manufacturers/${manufacturerId}`,
            },
          ]}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size={'sm'}
            onClick={() => handleDelete()}
            className="gap-2 self-start sm:self-auto"
          >
            <Trash className="h-4 w-4 text-red-800" />
            Excluir
          </Button>

          <Button
            variant="outline"
            size={'sm'}
            onClick={() => handleEdit(manufacturer.id)}
            className="gap-2 self-start sm:self-auto"
          >
            <Edit className="h-4 w-4  text-sky-500" />
            Editar
          </Button>
        </div>
      </div>

      {/* Manufacturer Info Card */}
      <Card className="p-4 sm:p-6 ">
        <div className="flex gap-4 sm:flex-row items-center sm:gap-6">
          <div className="flex items-center justify-center h-10 w-10 md:h-16 md:w-16 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 shrink-0">
            <Factory className="md:h-8 md:w-8 text-white" />
          </div>
          <div className="flex justify-between flex-1 gap-4 flex-row items-center">
            <div>
              <h1 className="text-lg sm:text-3xl font-bold tracking-tight">
                {manufacturer.name}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {manufacturer.legalName || 'Sem razão social definida'}
              </p>
            </div>
            <div>
              <Badge
                variant={manufacturer.isActive ? 'success' : 'secondary'}
                className="mt-1"
              >
                {manufacturer.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 p-2 h-12 ">
          <TabsTrigger value="general" className="gap-2">
            <Factory className="h-4 w-4 hidden sm:inline" />
            <span>Geral</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <NotebookText className="h-4 w-4 hidden sm:inline" />
            <span>Histórico de Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FolderOpen className="h-4 w-4 hidden sm:inline" />
            <span>Documentos</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="general" className="flex flex-col gap-4">
          <Card className="flex flex-col gap-10 sm:p-6">
            <div>
              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                <NotebookText className="h-6 w-6" />
                Dados do Fabricante
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <InfoField
                  label="Nome"
                  value={manufacturer.name}
                  showCopyButton
                  copyTooltip="Copiar Nome"
                />
                <InfoField
                  label="CNPJ"
                  value={
                    manufacturer.cnpj
                      ? formatCNPJ(manufacturer.cnpj)
                      : undefined
                  }
                  showCopyButton
                  copyTooltip="Copiar CNPJ"
                />
                <InfoField
                  label="Código"
                  value={manufacturer.code}
                  showCopyButton
                  copyTooltip="Copiar Código"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                <Notebook className="h-6 w-6" />
                Contatos
              </h3>
              {!manufacturer.email &&
              !manufacturer.phone &&
              !manufacturer.website ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum contato cadastrado.
                </p>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {manufacturer.email && (
                    <InfoField
                      label="E-mail"
                      value={manufacturer.email}
                      showCopyButton
                      copyTooltip="Copiar E-mail"
                    />
                  )}
                  {manufacturer.phone && (
                    <InfoField
                      label="Telefone"
                      value={manufacturer.phone}
                      showCopyButton
                      copyTooltip="Copiar Telefone"
                    />
                  )}
                  {manufacturer.website && (
                    <InfoField
                      label="Website"
                      value={manufacturer.website}
                      showCopyButton
                      copyTooltip="Copiar Website"
                    />
                  )}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                <MapPinHouse className="h-6 w-6" />
                Endereço
              </h3>
              {!manufacturer.addressLine1 &&
              !manufacturer.city &&
              !manufacturer.state ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum endereço cadastrado.
                </p>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  {manufacturer.addressLine1 && (
                    <InfoField
                      label="Endereço"
                      value={`${manufacturer.addressLine1}${manufacturer.addressLine2 ? `, ${manufacturer.addressLine2}` : ''}`}
                      showCopyButton
                      copyTooltip="Copiar Endereço"
                    />
                  )}
                  {manufacturer.city && (
                    <InfoField
                      label="Cidade - Estado - País"
                      value={[
                        manufacturer.city,
                        manufacturer.state,
                        manufacturer.country,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    />
                  )}
                  {manufacturer.postalCode && (
                    <InfoField
                      label="CEP"
                      value={manufacturer.postalCode}
                      showCopyButton
                      copyTooltip="Copiar CEP"
                    />
                  )}
                </div>
              )}
            </div>
            {manufacturer.notes && (
              <div>
                <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
                  <NotebookText className="h-6 w-6" />
                  Observações
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {manufacturer.notes}
                </p>
              </div>
            )}
          </Card>

          <MetadataSection
            createdAt={manufacturer.createdAt}
            updatedAt={manufacturer.updatedAt}
          />
        </TabsContent>

        {/* Aba Histórico de Pedidos */}
        <TabsContent value="products" className="space-y-6 flex flex-col">
          <Card className="p-4 w-full sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Histórico de Pedidos
              </h3>
            </div>
            <p className="text-muted-foreground text-sm py-4">
              Funcionalidade em desenvolvimento.
            </p>
          </Card>
        </TabsContent>

        {/* Aba Documentos */}
        <TabsContent value="documents" className="space-y-6 flex flex-col">
          <FileManager entityType="manufacturer" entityId={manufacturerId} className="h-[600px]" />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o fabricante &quot;{manufacturer.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
