/**
 * Edit Chart of Account Page
 * Follows pattern: PageLayout > PageActionBar (Delete + Save) > Identity Card > Section Cards
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
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
import { Switch } from '@/components/ui/switch';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useChartOfAccount,
  useChartOfAccounts,
  useDeleteChartOfAccount,
  useUpdateChartOfAccount,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { translateError } from '@/lib/error-messages';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { logger } from '@/lib/logger';
import type {
  ChartOfAccount,
  ChartOfAccountClass,
  ChartOfAccountNature,
  ChartOfAccountType,
} from '@/types/finance';
import {
  AlertTriangle,
  BookOpen,
  FolderTree,
  Info,
  Loader2,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_OPTIONS: { value: ChartOfAccountType; label: string }[] = [
  { value: 'ASSET', label: 'Ativo' },
  { value: 'LIABILITY', label: 'Passivo' },
  { value: 'EQUITY', label: 'Patrimonio Liquido' },
  { value: 'REVENUE', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
];

const CLASS_OPTIONS: { value: ChartOfAccountClass; label: string }[] = [
  { value: 'CURRENT', label: 'Circulante' },
  { value: 'NON_CURRENT', label: 'Nao Circulante' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'OTHER', label: 'Outro' },
];

const NATURE_OPTIONS: { value: ChartOfAccountNature; label: string }[] = [
  { value: 'DEBIT', label: 'Debito' },
  { value: 'CREDIT', label: 'Credito' },
];

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditChartOfAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data, isLoading } = useChartOfAccount(id);
  const updateMutation = useUpdateChartOfAccount();
  const deleteMutation = useDeleteChartOfAccount();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CHART_OF_ACCOUNTS.REMOVE);
  const account = data?.chartOfAccount;

  // Fetch all accounts for parent dropdown
  const { data: allData } = useChartOfAccounts({ perPage: 100 });
  const allAccounts = allData?.chartOfAccounts ?? [];

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: '' as ChartOfAccountType | '',
    accountClass: '' as ChartOfAccountClass | '',
    nature: '' as ChartOfAccountNature | '',
    parentId: 'none',
    isActive: true,
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        accountClass: account.accountClass,
        nature: account.nature,
        parentId: account.parentId ?? 'none',
        isActive: account.isActive,
      });
    }
  }, [account]);

  // Build parent hierarchy (exclude self and descendants)
  const availableParents = useMemo(() => {
    if (!account) return [];

    // Find all descendants of current account
    const descendants = new Set<string>();
    function findDescendants(parentId: string) {
      for (const acc of allAccounts) {
        if (acc.parentId === parentId && !descendants.has(acc.id)) {
          descendants.add(acc.id);
          findDescendants(acc.id);
        }
      }
    }
    findDescendants(id);

    const levelMap = new Map<string, number>();
    function computeLevel(acc: ChartOfAccount): number {
      if (levelMap.has(acc.id)) return levelMap.get(acc.id)!;
      if (!acc.parentId) {
        levelMap.set(acc.id, 0);
        return 0;
      }
      const parent = allAccounts.find(a => a.id === acc.parentId);
      if (!parent) {
        levelMap.set(acc.id, 0);
        return 0;
      }
      const parentLevel = computeLevel(parent);
      levelMap.set(acc.id, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const acc of allAccounts) {
      computeLevel(acc);
    }

    return allAccounts
      .filter(acc => acc.id !== id && !descendants.has(acc.id) && acc.isActive)
      .map(acc => ({
        ...acc,
        level: levelMap.get(acc.id) ?? 0,
      }))
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [account, allAccounts, id]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome e obrigatorio.');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('O codigo e obrigatorio.');
      return;
    }
    if (!formData.type) {
      toast.error('O tipo e obrigatorio.');
      return;
    }
    if (!formData.accountClass) {
      toast.error('A classe e obrigatoria.');
      return;
    }
    if (!formData.nature) {
      toast.error('A natureza e obrigatoria.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.name,
          code: formData.code,
          type: formData.type as ChartOfAccountType,
          accountClass: formData.accountClass as ChartOfAccountClass,
          nature: formData.nature as ChartOfAccountNature,
          parentId:
            formData.parentId !== 'none' ? formData.parentId : undefined,
          isActive: formData.isActive,
        },
      });
      toast.success('Conta contabil atualizada com sucesso!');
      router.push(`/finance/chart-of-accounts/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar conta contabil',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('already exists') ||
        msg.includes('name already') ||
        msg.includes('code already')
      ) {
        const field = msg.includes('code') ? 'code' : 'name';
        setFieldErrors({ [field]: translateError(msg) });
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Conta contabil excluida com sucesso.');
      router.push('/finance/chart-of-accounts');
    } catch (err) {
      logger.error(
        'Erro ao excluir conta contabil',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/chart-of-accounts/${id}`),
      variant: 'ghost',
    },
    ...(canDelete && !account?.isSystem
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar Alteracoes',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Plano de Contas', href: '/finance/chart-of-accounts' },
    ...(account
      ? [
          {
            label: `${account.code} - ${account.name}`,
            href: `/finance/chart-of-accounts/${id}`,
          },
          { label: 'Editar' },
        ]
      : [{ label: 'Editar' }]),
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

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

  if (!account) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Conta contabil nao encontrada"
            message="A conta contabil solicitada nao foi encontrada."
            action={{
              label: 'Voltar para Plano de Contas',
              onClick: () => router.push('/finance/chart-of-accounts'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando conta contabil
              </p>
              <h1 className="text-xl font-bold truncate">{account.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Codigo</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {account.code}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* System Account Warning */}
        {account.isSystem && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/8 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Esta e uma conta de sistema. Alguns campos podem ter restricoes.
            </p>
          </div>
        )}

        {/* Section 1: Identificacao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Identificacao"
                subtitle="Codigo e nome da conta contabil"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="code">
                      Codigo <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={e => {
                          setFormData({ ...formData, code: e.target.value });
                          if (fieldErrors.code)
                            setFieldErrors(prev => ({ ...prev, code: '' }));
                        }}
                        placeholder="Ex.: 1.1.1.01"
                        className="font-mono"
                        aria-invalid={!!fieldErrors.code}
                      />
                      {fieldErrors.code && (
                        <FormErrorIcon message={fieldErrors.code} />
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => {
                          setFormData({ ...formData, name: e.target.value });
                          if (fieldErrors.name)
                            setFieldErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Nome da conta contabil"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <FormErrorIcon message={fieldErrors.name} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Classificacao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FolderTree}
                title="Classificacao"
                subtitle="Tipo, classe, natureza e hierarquia da conta"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.type}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          type: v as ChartOfAccountType,
                        })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="accountClass">
                      Classe <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.accountClass}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          accountClass: v as ChartOfAccountClass,
                        })
                      }
                    >
                      <SelectTrigger id="accountClass">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLASS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="nature">
                      Natureza <span className="text-rose-500">*</span>
                    </Label>
                    <Select
                      value={formData.nature}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          nature: v as ChartOfAccountNature,
                        })
                      }
                    >
                      <SelectTrigger id="nature">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {NATURE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="parentId">Conta Pai (opcional)</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={v =>
                      setFormData({ ...formData, parentId: v })
                    }
                  >
                    <SelectTrigger id="parentId">
                      <SelectValue placeholder="Nenhuma (raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                      {availableParents.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {'─'.repeat(acc.level)} {acc.code} - {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Configuracoes */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings}
                title="Configuracoes"
                subtitle="Status da conta contabil"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Conta Ativa</Label>
                    <p className="text-sm text-muted-foreground">
                      Contas inativas nao aparecem nas selecoes de lancamentos.
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Conta Contabil"
        description={`Digite seu PIN de acao para excluir a conta "${account.code} - ${account.name}". Esta acao nao pode ser desfeita.`}
      />
    </PageLayout>
  );
}
