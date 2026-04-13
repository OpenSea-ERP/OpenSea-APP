/**
 * Defect Types Listing Page
 * Página de listagem de tipos de defeito
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { defectTypesService } from '@/services/production';
import type {
  DefectType,
  DefectSeverity,
  CreateDefectTypeRequest,
} from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bug, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const SEVERITY_LABELS: Record<DefectSeverity, string> = {
  CRITICAL: 'Crítico',
  MAJOR: 'Maior',
  MINOR: 'Menor',
};

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  CRITICAL:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  MAJOR:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  MINOR:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
};

const ALL_SEVERITIES: DefectSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR'];

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar tipo de defeito...',
      singular: 'tipo de defeito',
      plural: 'tipos de defeito',
    },
    gridColumns: 3,
  },
};

export default function DefectTypesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [severityFilter, setSeverityFilter] = useState<
    DefectSeverity | 'ALL'
  >('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<DefectSeverity>('MINOR');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['defect-types'],
    queryFn: async () => {
      const res = await defectTypesService.list();
      return res.defectTypes;
    },
  });

  const allItems = response ?? [];
  const items = useMemo(() => {
    let filtered = allItems;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q),
      );
    }
    if (severityFilter !== 'ALL') {
      filtered = filtered.filter((i) => i.severity === severityFilter);
    }
    return filtered;
  }, [allItems, debouncedSearch, severityFilter]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDefectTypeRequest) =>
      defectTypesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types'] });
      toast.success('Tipo de defeito criado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => defectTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect-types'] });
      toast.success('Tipo de defeito excluído!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewSeverity('MINOR');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Código e Nome são obrigatórios.');
      return;
    }
    await createMutation.mutateAsync({
      code: newCode.trim(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      severity: newSeverity,
    });
    setCreateOpen(false);
  }, [newCode, newName, newDescription, newSeverity, createMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete);
      setDeleteOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteMutation]);

  const contextActions = useMemo(
    () => [
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: (ids: string[]) => {
          setItemToDelete(ids[0]);
          setDeleteOpen(true);
        },
        variant: 'destructive' as const,
        separator: 'before' as const,
      },
    ],
    [],
  );

  const renderGridCard = (item: DefectType, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={`${item.code}${item.description ? ` - ${item.description}` : ''}`}
        icon={Bug}
        iconBgColor="bg-linear-to-br from-rose-500 to-pink-600"
        badges={[
          {
            label: SEVERITY_LABELS[item.severity],
            variant: 'outline' as const,
            color: SEVERITY_COLORS[item.severity],
          },
          {
            label: item.isActive ? 'Ativo' : 'Inativo',
            variant: 'outline' as const,
            color: item.isActive
              ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
          },
        ]}
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: DefectType, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="list"
        title={
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {item.code}
            </span>
          </span>
        }
        metadata={
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${SEVERITY_COLORS[item.severity]}`}
            >
              {SEVERITY_LABELS[item.severity]}
            </span>
          </div>
        }
        icon={Bug}
        iconBgColor="bg-linear-to-br from-rose-500 to-pink-600"
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const initialIds = useMemo(() => items.map((i) => i.id), [items]);

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (hasPermission(PRODUCTION_PERMISSIONS.QUALITY.REGISTER)) {
      buttons.push({
        id: 'create',
        title: 'Novo Tipo de Defeito',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Novo Tipo de Defeito',
      description: 'Defina código, nome e severidade',
      icon: <Bug className="h-12 w-12 text-rose-500" />,
      isValid: !!newCode.trim() && !!newName.trim(),
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="dt-code">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="dt-code"
              data-testid="defect-type-code-input"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex: DEF-01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dt-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="dt-name"
              data-testid="defect-type-name-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do tipo de defeito"
            />
          </div>
          <div className="grid gap-2">
            <Label>Severidade</Label>
            <Select
              value={newSeverity}
              onValueChange={(v) => setNewSeverity(v as DefectSeverity)}
            >
              <SelectTrigger data-testid="defect-type-severity-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dt-desc">Descrição</Label>
            <Textarea
              id="dt-desc"
              data-testid="defect-type-description-input"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição do tipo de defeito"
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end w-full">
          <Button
            data-testid="defect-type-create-submit"
            onClick={handleCreateSubmit}
            disabled={
              !newCode.trim() || !newName.trim() || createMutation.isPending
            }
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar Tipo
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CoreProvider selection={{ namespace: 'defect-types', initialIds }}>
      <PageLayout data-testid="defect-types-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Tipos de Defeito',
                href: '/production/engineering/defect-types',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Tipos de Defeito"
            description="Classificação de defeitos para controle de qualidade"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder={pageConfig.display.labels.searchPlaceholder}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar tipos de defeito"
              message="Ocorreu um erro ao carregar os tipos de defeito."
              action={{ label: 'Tentar Novamente', onClick: () => refetch() }}
            />
          ) : (
            <EntityGrid
              config={pageConfig}
              items={items}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!debouncedSearch}
              showItemCount={false}
              toolbarStart={
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {items.length}{' '}
                    {items.length === 1
                      ? 'tipo de defeito'
                      : 'tipos de defeito'}
                  </p>
                  <Select
                    value={severityFilter}
                    onValueChange={(v) =>
                      setSeverityFilter(v as DefectSeverity | 'ALL')
                    }
                  >
                    <SelectTrigger
                      className="w-[170px] h-9"
                      data-testid="defect-type-severity-filter"
                    >
                      <SelectValue placeholder="Severidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as severidades</SelectItem>
                      {ALL_SEVERITIES.map((sev) => (
                        <SelectItem key={sev} value={sev}>
                          {SEVERITY_LABELS[sev]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          )}

          <StepWizardDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            steps={wizardSteps}
            currentStep={createStep}
            onStepChange={setCreateStep}
            onClose={() => setCreateOpen(false)}
          />

          <VerifyActionPinModal
            isOpen={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setItemToDelete(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description="Digite seu PIN de ação para excluir este tipo de defeito."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
