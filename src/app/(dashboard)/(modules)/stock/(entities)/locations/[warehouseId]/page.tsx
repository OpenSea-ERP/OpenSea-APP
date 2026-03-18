'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Plus, Settings, Warehouse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { use, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useWarehouse,
  useZones,
} from '../src/api';
import { ZoneCard } from '../src/components';
import { PLACEHOLDERS, SUCCESS_MESSAGES } from '../src/constants';
import type { Zone, ZoneFormData } from '@/types/stock';
import { defaultZoneFormData } from '@/types/stock';
import { normalizeCode, validateZoneForm } from '../src/utils';

interface PageProps {
  params: Promise<{ warehouseId: string }>;
}

export default function WarehouseDetailPage({ params }: PageProps) {
  const { warehouseId } = use(params);
  const router = useRouter();

  // Data fetching
  const { data: warehouse, isLoading: isLoadingWarehouse } =
    useWarehouse(warehouseId);
  const {
    data: zones,
    isLoading: isLoadingZones,
    error,
    refetch,
  } = useZones(warehouseId);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [formData, setFormData] = useState<ZoneFormData>(defaultZoneFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Mutations
  const createZone = useCreateZone();
  const updateZone = useUpdateZone();
  const deleteZone = useDeleteZone();

  // Filtrar zonas
  const filteredZones = React.useMemo(() => {
    if (!zones) return [];
    if (!searchQuery.trim()) return zones;

    const query = searchQuery.toLowerCase();
    return zones.filter(
      z =>
        z.code.toLowerCase().includes(query) ||
        z.name.toLowerCase().includes(query) ||
        z.description?.toLowerCase().includes(query)
    );
  }, [zones, searchQuery]);

  // Handlers
  const handleOpenCreate = () => {
    setFormData(defaultZoneFormData);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (zone: Zone) => {
    setSelectedZone(zone);
    setFormData({
      code: zone.code,
      name: zone.name,
      description: zone.description || '',
      isActive: zone.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (zone: Zone) => {
    setSelectedZone(zone);
    setIsDeleteDialogOpen(true);
  };

  const handleConfigureStructure = (zone: Zone) => {
    router.push(`/stock/locations/${warehouseId}/zones/${zone.id}/structure`);
  };

  const handleCreateSubmit = async () => {
    const validation = validateZoneForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      const newZone = await createZone.mutateAsync({
        warehouseId,
        data: {
          code: normalizeCode(formData.code),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        },
      });

      toast.success(SUCCESS_MESSAGES.ZONE_CREATED);
      setIsCreateModalOpen(false);
      setFormData(defaultZoneFormData);

      router.push(
        `/stock/locations/${warehouseId}/zones/${newZone.id}/structure`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar zona');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedZone) return;

    const validation = validateZoneForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      await updateZone.mutateAsync({
        id: selectedZone.id,
        data: {
          code: normalizeCode(formData.code),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isActive: formData.isActive,
        },
      });

      toast.success(SUCCESS_MESSAGES.ZONE_UPDATED);
      setIsEditModalOpen(false);
      setSelectedZone(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao atualizar zona'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedZone) return;

    try {
      await deleteZone.mutateAsync({
        id: selectedZone.id,
        warehouseId,
      });
      toast.success(SUCCESS_MESSAGES.ZONE_DELETED);
      setIsDeleteDialogOpen(false);
      setSelectedZone(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir zona');
    }
  };

  const handleInputChange = (
    field: keyof ZoneFormData,
    value: string | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ============================================================================
  // HEADER BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(
    () => [
      {
        id: 'create-zone',
        title: 'Nova Zona',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default' as const,
      },
    ],
    []
  );

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Localizações', href: '/stock/locations' },
              { label: warehouse?.name || '...' },
            ]}
          />
          <Header title="Erro" />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar zonas"
            message="Ocorreu um erro ao tentar carregar as zonas deste armazém."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
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
            { label: 'Estoque', href: '/stock' },
            { label: 'Localizações', href: '/stock/locations' },
            {
              label: warehouse?.name || '...',
              href: `/stock/locations/${warehouseId}`,
            },
          ]}
          buttons={actionButtons}
        />

        {/* Warehouse Identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Warehouse className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            {isLoadingWarehouse ? (
              <>
                <Skeleton className="h-7 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {warehouse?.name}
                  </h1>
                  <Badge
                    variant={warehouse?.isActive ? 'default' : 'secondary'}
                  >
                    {warehouse?.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {warehouse?.code}
                  {warehouse?.description && ` • ${warehouse.description}`}
                </p>
              </>
            )}
          </div>
        </div>
      </PageHeader>

      <PageBody>
        {/* Search */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar zonas..."
          onSearch={value => setSearchQuery(value)}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {/* Grid de Zonas */}
        {isLoadingZones ? (
          <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
        ) : filteredZones.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            {searchQuery ? (
              <>
                <p className="text-lg font-medium">Nenhuma zona encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Tente buscar por outro termo
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">Nenhuma zona cadastrada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie zonas para organizar este armazém
                </p>
                <Button onClick={handleOpenCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Zona
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredZones.map(zone => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                warehouseId={warehouseId}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onConfigure={handleConfigureStructure}
              />
            ))}
          </div>
        )}

        {/* Modal de Criar */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Zona</DialogTitle>
              <DialogDescription>
                Crie uma nova zona neste armazém. Após criar, você será
                direcionado para configurar a estrutura de corredores,
                prateleiras e nichos.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Código <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder={PLACEHOLDERS.ZONE_CODE}
                    value={formData.code}
                    onChange={e =>
                      handleInputChange('code', e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className={formErrors.code ? 'border-destructive' : ''}
                  />
                  {formErrors.code && (
                    <p className="text-xs text-destructive">
                      {formErrors.code}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={PLACEHOLDERS.ZONE_NAME}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">
                      {formErrors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder={PLACEHOLDERS.ZONE_DESCRIPTION}
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Zonas inativas não aparecem em buscas
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked =>
                    handleInputChange('isActive', checked)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={createZone.isPending}
              >
                <Settings className="mr-2 h-4 w-4" />
                {createZone.isPending ? 'Criando...' : 'Criar e Configurar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Zona</DialogTitle>
              <DialogDescription>
                Atualize as informações da zona {selectedZone?.code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-code">
                    Código <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-code"
                    placeholder={PLACEHOLDERS.ZONE_CODE}
                    value={formData.code}
                    onChange={e =>
                      handleInputChange('code', e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className={formErrors.code ? 'border-destructive' : ''}
                  />
                  {formErrors.code && (
                    <p className="text-xs text-destructive">
                      {formErrors.code}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder={PLACEHOLDERS.ZONE_NAME}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className={formErrors.name ? 'border-destructive' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive">
                      {formErrors.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  placeholder={PLACEHOLDERS.ZONE_DESCRIPTION}
                  value={formData.description}
                  onChange={e =>
                    handleInputChange('description', e.target.value)
                  }
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="edit-isActive">Ativa</Label>
                  <p className="text-xs text-muted-foreground">
                    Zonas inativas não aparecem em buscas
                  </p>
                </div>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={checked =>
                    handleInputChange('isActive', checked)
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateZone.isPending}
              >
                {updateZone.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Zona?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a zona{' '}
                <strong>{selectedZone?.code}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita e irá excluir todos os
                corredores, prateleiras e nichos associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteZone.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageBody>
    </PageLayout>
  );
}
