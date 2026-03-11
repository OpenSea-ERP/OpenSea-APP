/**
 * OpenSea OS - Locations Page
 * Pagina de gerenciamento de localizacoes (armazens, zonas, nichos)
 * usando o sistema padronizado de layout OpenSea OS
 */

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Tag, Warehouse } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useUpdateWarehouse,
  useWarehouses,
  WarehouseCard,
  PLACEHOLDERS,
  SUCCESS_MESSAGES,
  defaultWarehouseFormData,
  normalizeCode,
  validateWarehouseForm,
} from './src';
import type { WarehouseFormData, Warehouse as WarehouseType } from './src';

export default function LocationsPage() {
  const router = useRouter();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: warehouses, isLoading, error, refetch } = useWarehouses();

  // ============================================================================
  // STATE
  // ============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] =
    useState<WarehouseType | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>(
    defaultWarehouseFormData
  );
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createWarehouse = useCreateWarehouse();
  const updateWarehouse = useUpdateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredWarehouses = useMemo(() => {
    if (!warehouses) return [];
    if (!searchQuery.trim()) return warehouses;

    const normalizedQuery = searchQuery.toLowerCase();
    return warehouses.filter(
      warehouse =>
        warehouse.code.toLowerCase().includes(normalizedQuery) ||
        warehouse.name.toLowerCase().includes(normalizedQuery) ||
        warehouse.description?.toLowerCase().includes(normalizedQuery)
    );
  }, [warehouses, searchQuery]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleOpenCreate = useCallback(() => {
    setFormData(defaultWarehouseFormData);
    setFormErrors({});
    setIsCreateModalOpen(true);
  }, []);

  const handleOpenEdit = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setFormData({
      code: warehouse.code,
      name: warehouse.name,
      description: warehouse.description || '',
      address: warehouse.address || '',
      isActive: warehouse.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async () => {
    const validation = validateWarehouseForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      await createWarehouse.mutateAsync({
        code: normalizeCode(formData.code),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        address: formData.address.trim() || undefined,
        isActive: formData.isActive,
      });

      toast.success(SUCCESS_MESSAGES.WAREHOUSE_CREATED);
      setIsCreateModalOpen(false);
      setFormData(defaultWarehouseFormData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar armazém');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedWarehouse) return;

    const validation = validateWarehouseForm(formData);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      await updateWarehouse.mutateAsync({
        id: selectedWarehouse.id,
        data: {
          code: normalizeCode(formData.code),
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          address: formData.address.trim() || undefined,
          isActive: formData.isActive,
        },
      });

      toast.success(SUCCESS_MESSAGES.WAREHOUSE_UPDATED);
      setIsEditModalOpen(false);
      setSelectedWarehouse(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao atualizar armazém'
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWarehouse) return;

    try {
      await deleteWarehouse.mutateAsync(selectedWarehouse.id);
      toast.success(SUCCESS_MESSAGES.WAREHOUSE_DELETED);
      setIsDeleteDialogOpen(false);
      setSelectedWarehouse(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao excluir armazém'
      );
    }
  };

  const handleInputChange = (
    field: keyof WarehouseFormData,
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
  // RENDER FUNCTIONS
  // ============================================================================

  const renderWarehouseGrid = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredWarehouses.map(warehouse => (
        <WarehouseCard
          key={warehouse.id}
          warehouse={warehouse}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed">
      <Warehouse className="h-12 w-12 text-muted-foreground/50 mb-4" />
      {searchQuery ? (
        <>
          <p className="text-lg font-medium">Nenhum armazém encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tente buscar por outro termo
          </p>
        </>
      ) : (
        <>
          <p className="text-lg font-medium">Nenhum armazém cadastrado</p>
          <p className="text-sm text-muted-foreground mb-4">
            Comece criando seu primeiro armazém
          </p>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Armazém
          </Button>
        </>
      )}
    </div>
  );

  const renderWarehouseFormFields = (idPrefix: string) => (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-code`}>
            Código <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-code`}
            placeholder={PLACEHOLDERS.WAREHOUSE_CODE}
            value={formData.code}
            onChange={e =>
              handleInputChange('code', e.target.value.toUpperCase())
            }
            maxLength={5}
            className={formErrors.code ? 'border-destructive' : ''}
          />
          {formErrors.code && (
            <p className="text-xs text-destructive">{formErrors.code}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-name`}>
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-name`}
            placeholder={PLACEHOLDERS.WAREHOUSE_NAME}
            value={formData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className={formErrors.name ? 'border-destructive' : ''}
          />
          {formErrors.name && (
            <p className="text-xs text-destructive">{formErrors.name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Descrição</Label>
        <Textarea
          id={`${idPrefix}-description`}
          placeholder={PLACEHOLDERS.WAREHOUSE_DESCRIPTION}
          value={formData.description}
          onChange={e => handleInputChange('description', e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-address`}>Endereço</Label>
        <Input
          id={`${idPrefix}-address`}
          placeholder={PLACEHOLDERS.WAREHOUSE_ADDRESS}
          value={formData.address}
          onChange={e => handleInputChange('address', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor={`${idPrefix}-isActive`}>Ativo</Label>
          <p className="text-xs text-muted-foreground">
            Armazéns inativos não aparecem em buscas
          </p>
        </div>
        <Switch
          id={`${idPrefix}-isActive`}
          checked={formData.isActive}
          onCheckedChange={checked => handleInputChange('isActive', checked)}
        />
      </div>
    </div>
  );

  // ============================================================================
  // HEADER BUTTONS CONFIGURATION
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(
    () => [
      {
        id: 'labels-link',
        title: 'Etiquetas',
        icon: Tag,
        onClick: () => router.push('/stock/locations/labels'),
        variant: 'outline',
      },
      {
        id: 'create-warehouse',
        title: 'Novo Armazém',
        icon: Plus,
        onClick: handleOpenCreate,
        variant: 'default',
      },
    ],
    [handleOpenCreate, router]
  );

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
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Localizações"
          description="Gerencie armazéns, zonas, corredores, prateleiras e nichos"
        />
      </PageHeader>

      <PageBody>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          placeholder="Buscar armazéns..."
          onSearch={value => setSearchQuery(value)}
          onClear={() => setSearchQuery('')}
          showClear={true}
          size="md"
        />

        {/* Grid */}
        {isLoading ? (
          <GridLoading count={8} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar armazéns"
            message="Ocorreu um erro ao tentar carregar os armazéns. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
        ) : filteredWarehouses.length === 0 ? (
          renderEmptyState()
        ) : (
          renderWarehouseGrid()
        )}

        {/* Create Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Armazém</DialogTitle>
              <DialogDescription>
                Crie um novo armazém para organizar suas localizações
              </DialogDescription>
            </DialogHeader>

            {renderWarehouseFormFields('create')}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={createWarehouse.isPending}
              >
                {createWarehouse.isPending ? 'Criando...' : 'Criar Armazém'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Armazém</DialogTitle>
              <DialogDescription>
                Atualize as informações do armazém {selectedWarehouse?.code}
              </DialogDescription>
            </DialogHeader>

            {renderWarehouseFormFields('edit')}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={updateWarehouse.isPending}
              >
                {updateWarehouse.isPending
                  ? 'Salvando...'
                  : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Armazém?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o armazém{' '}
                <strong>{selectedWarehouse?.code}</strong>?
                <br />
                <br />
                Esta ação não pode ser desfeita e irá excluir todas as zonas,
                corredores, prateleiras e nichos associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteWarehouse.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageBody>
    </PageLayout>
  );
}
