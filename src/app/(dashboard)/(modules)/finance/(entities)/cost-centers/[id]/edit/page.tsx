/**
 * Edit Cost Center Page
 * Follows category edit page pattern: PageLayout > PageActionBar (Delete/Save) > Identity Card > Form
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import PermissionCodes from '@/config/rbac/permission-codes';
import {
  useCostCenter,
  useDeleteCostCenter,
  useUpdateCostCenter,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { Building2, Save, Trash, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function EditCostCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useCostCenter(id);
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();
  const costCenter = data?.costCenter;
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PermissionCodes.FINANCE.COST_CENTERS.REMOVE);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    monthlyBudget: '',
    annualBudget: '',
    isActive: true,
  });

  useEffect(() => {
    if (costCenter) {
      setFormData({
        name: costCenter.name,
        code: costCenter.code,
        description: costCenter.description || '',
        monthlyBudget:
          costCenter.monthlyBudget != null
            ? String(costCenter.monthlyBudget)
            : '',
        annualBudget:
          costCenter.annualBudget != null
            ? String(costCenter.annualBudget)
            : '',
        isActive: costCenter.isActive,
      });
    }
  }, [costCenter]);

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    toast.success('Centro de custo excluído com sucesso.');
    router.push('/finance/cost-centers');
  };

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Centros de Custo', href: '/finance/cost-centers' },
    ...(costCenter
      ? [
          {
            label: costCenter.name,
            href: `/finance/cost-centers/${id}`,
          },
          { label: 'Editar' },
        ]
      : [{ label: 'Editar' }]),
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!costCenter) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Centro de custo não encontrado
            </h2>
            <Button onClick={() => router.push('/finance/cost-centers')}>
              Voltar para Centros de Custo
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.name,
          code: formData.code,
          isActive: formData.isActive,
          description: formData.description || undefined,
          monthlyBudget: formData.monthlyBudget
            ? parseFloat(formData.monthlyBudget)
            : undefined,
          annualBudget: formData.annualBudget
            ? parseFloat(formData.annualBudget)
            : undefined,
        },
      });
      toast.success('Centro de custo atualizado com sucesso!');
      router.push(`/finance/cost-centers/${id}`);
    } catch {
      toast.error('Erro ao atualizar centro de custo.');
    }
  };

  const actionButtons = [
    ...(canDelete
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash,
            onClick: () => setDeleteModalOpen(true),
            variant: 'outline' as const,
            className: 'text-rose-600 hover:text-rose-700',
          },
        ]
      : []),
    {
      id: 'cancel',
      title: 'Cancelar',
      icon: X,
      onClick: () => router.push(`/finance/cost-centers/${id}`),
      variant: 'outline' as const,
    },
    {
      id: 'save',
      title: 'Salvar',
      icon: Save,
      onClick: () => {
        if (formRef.current) {
          formRef.current.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true })
          );
        }
      },
      disabled: updateMutation.isPending,
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-pink-600 shrink-0">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {costCenter.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Código: {costCenter.code}
              </p>
            </div>
            <Badge variant="secondary">Editando</Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Nome + Código */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome do centro de custo"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">
                  Código <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  required
                  value={formData.code}
                  onChange={e =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Código do centro de custo"
                />
              </div>
            </div>

            {/* Row 2: Status + Orçamento Mensal + Orçamento Anual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={v =>
                    setFormData({ ...formData, isActive: v === 'active' })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="monthlyBudget">Orçamento Mensal</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyBudget}
                  onChange={e =>
                    setFormData({ ...formData, monthlyBudget: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="annualBudget">Orçamento Anual</Label>
                <Input
                  id="annualBudget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.annualBudget}
                  onChange={e =>
                    setFormData({ ...formData, annualBudget: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>
            </div>

            {/* Row 3: Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional do centro de custo"
                rows={3}
              />
            </div>
          </form>
        </Card>
      </PageBody>

      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Centro de Custo"
        description={`Digite seu PIN de ação para excluir "${costCenter.name}".`}
      />
    </PageLayout>
  );
}
