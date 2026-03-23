'use client';

import { CentralBadge } from '@/components/central/central-badge';
import { CentralCard } from '@/components/central/central-card';
import { CentralPageHeader } from '@/components/central/central-page-header';
import {
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central/central-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
import {
  useAdminPlans,
  useAdminTenants,
  useChangeTenantPlan,
  useCreateTenant,
  useCreateTenantUser,
} from '@/hooks/admin/use-admin';
import { cn } from '@/lib/utils';
import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Loader2,
  Plus,
  Search,
  UserPlus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Config ────────────────────────────────────────────────────────────────────

const statusVariants: Record<
  string,
  'emerald' | 'orange' | 'rose' | 'default'
> = {
  ACTIVE: 'emerald',
  INACTIVE: 'orange',
  SUSPENDED: 'rose',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  INACTIVE: 'Inativa',
  SUSPENDED: 'Suspensa',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'INACTIVE', label: 'Inativas' },
  { value: 'SUSPENDED', label: 'Suspensas' },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function TenantsListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for wizard
  const [tenantForm, setTenantForm] = useState({
    name: '',
    logoUrl: '',
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    password: '',
  });

  // Mutations
  const createTenant = useCreateTenant();
  const changePlan = useChangeTenantPlan();
  const createUser = useCreateTenantUser();
  const { data: plansData, isLoading: plansLoading } = useAdminPlans();
  const plans = plansData?.plans ?? [];

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  }, []);

  // Reset page on status filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = useAdminTenants(
    page,
    20,
    debouncedSearch || undefined,
    statusFilter || undefined
  );

  const tenants = data?.tenants ?? [];

  const resetWizard = () => {
    setWizardStep(1);
    setTenantForm({ name: '', logoUrl: '' });
    setSelectedPlanId(null);
    setUserForm({ email: '', username: '', password: '' });
    setIsSubmitting(false);
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
    resetWizard();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const tenant = await createTenant.mutateAsync({
        name: tenantForm.name,
        logoUrl: tenantForm.logoUrl || undefined,
      });

      const tenantId = tenant.id;

      if (selectedPlanId) {
        try {
          await changePlan.mutateAsync({
            id: tenantId,
            planId: selectedPlanId,
          });
        } catch {
          toast.error('Empresa criada, mas houve erro ao atribuir o plano');
        }
      }

      if (userForm.email.trim() && userForm.password.trim()) {
        try {
          await createUser.mutateAsync({
            id: tenantId,
            data: {
              email: userForm.email,
              password: userForm.password,
              username: userForm.username || undefined,
              role: 'owner',
            },
          });
        } catch {
          toast.error(
            'Empresa criada, mas houve erro ao criar o usuario proprietario'
          );
        }
      }

      toast.success('Empresa criada com sucesso!');
      handleWizardClose();
      router.push(`/central/tenants/${tenantId}`);
    } catch {
      toast.error('Erro ao criar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = tenantForm.name.trim().length > 0;

  const wizardSteps: WizardStep[] = [
    {
      title: 'Dados Basicos',
      description: 'Informacoes principais da empresa',
      icon: (
        <Building2
          className="h-16 w-16"
          style={{ color: 'var(--central-text-muted)' }}
        />
      ),
      isValid: isStep1Valid,
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nome *</label>
            <Input
              value={tenantForm.name}
              onChange={e =>
                setTenantForm(f => ({ ...f, name: e.target.value }))
              }
              placeholder="Nome da empresa"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              URL do Logo (opcional)
            </label>
            <Input
              value={tenantForm.logoUrl}
              onChange={e =>
                setTenantForm(f => ({ ...f, logoUrl: e.target.value }))
              }
              placeholder="https://exemplo.com/logo.png"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Selecionar Plano',
      description: 'Escolha um plano para a empresa (opcional)',
      icon: (
        <CreditCard
          className="h-16 w-16"
          style={{ color: 'var(--central-text-muted)' }}
        />
      ),
      isValid: true,
      content: (
        <div className="space-y-3">
          {plansLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : plans.filter(p => p.isActive).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum plano ativo disponivel
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {plans
                .filter(p => p.isActive)
                .map(plan => {
                  const isSelected = selectedPlanId === plan.id;
                  return (
                    <CentralCard
                      key={plan.id}
                      hover
                      className={cn(
                        'p-4 cursor-pointer border-2 transition-all',
                        isSelected
                          ? 'border-primary shadow-lg'
                          : 'border-transparent'
                      )}
                      onClick={() =>
                        setSelectedPlanId(isSelected ? null : plan.id)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-sm">{plan.name}</h4>
                          <CentralBadge variant="default" className="mt-1">
                            {plan.tier}
                          </CentralBadge>
                        </div>
                        {isSelected && (
                          <div className="p-1 rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-lg font-bold">
                        R$ {plan.price.toFixed(2)}
                        <span className="text-xs font-normal text-muted-foreground">
                          /mes
                        </span>
                      </p>
                      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                        <p>{plan.maxUsers} usuarios</p>
                        <p>{plan.maxProducts} produtos</p>
                      </div>
                    </CentralCard>
                  );
                })}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Usuario Proprietario',
      description: 'Crie o primeiro usuario da empresa (opcional)',
      icon: (
        <UserPlus
          className="h-16 w-16"
          style={{ color: 'var(--central-text-muted)' }}
        />
      ),
      isValid: true,
      footer: (
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => setWizardStep(2)}
          >
            Voltar
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !isStep1Valid}
            onClick={handleSubmit}
          >
            {isSubmitting && (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            )}
            Criar Empresa
          </Button>
        </>
      ),
      content: (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={userForm.email}
              onChange={e =>
                setUserForm(f => ({ ...f, email: e.target.value }))
              }
              placeholder="proprietario@empresa.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Username (opcional)</label>
            <Input
              value={userForm.username}
              onChange={e =>
                setUserForm(f => ({ ...f, username: e.target.value }))
              }
              placeholder="Gerado automaticamente se vazio"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha</label>
            <PasswordInput
              value={userForm.password}
              onChange={e =>
                setUserForm(f => ({ ...f, password: e.target.value }))
              }
              placeholder="Minimo 6 caracteres"
            />
          </div>
          {userForm.email && !userForm.password && (
            <p className="text-sm text-amber-500">
              Preencha a senha para criar o usuario, ou limpe o email para
              pular.
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Header */}
      <CentralPageHeader
        title="Empresas"
        description="Gerencie todas as empresas do sistema"
        action={
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setWizardOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        }
      />

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--central-text-muted)' }}
            />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={searchInput}
              onChange={e => handleSearchChange(e.target.value)}
              className="pl-10 central-input"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={v => setStatusFilter(v === 'ALL' ? '' : v)}
          >
            <SelectTrigger className="w-[180px] central-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value || 'ALL'} value={opt.value || 'ALL'}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(debouncedSearch || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('');
                setDebouncedSearch('');
                setStatusFilter('');
                setPage(1);
              }}
              className="gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="h-16 rounded-xl animate-pulse"
              style={{ background: 'var(--central-card-bg)' }}
            />
          ))}
        </div>
      ) : (
        <CentralTable>
          <CentralTableHeader>
            <CentralTableRow>
              <CentralTableHead>Empresa</CentralTableHead>
              <CentralTableHead>Slug</CentralTableHead>
              <CentralTableHead>Status</CentralTableHead>
              <CentralTableHead>Criado em</CentralTableHead>
              <CentralTableHead className="w-[80px]">Acoes</CentralTableHead>
            </CentralTableRow>
          </CentralTableHeader>
          <CentralTableBody>
            {tenants.map(tenant => (
              <CentralTableRow key={tenant.id}>
                <CentralTableCell>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                      style={{
                        background: 'var(--central-avatar-bg)',
                        color: 'var(--central-avatar-text)',
                      }}
                    >
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                </CentralTableCell>
                <CentralTableCell>
                  <span
                    className="font-mono text-sm"
                    style={{ color: 'var(--central-text-secondary)' }}
                  >
                    {tenant.slug}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <CentralBadge
                    variant={statusVariants[tenant.status] ?? 'default'}
                  >
                    {statusLabels[tenant.status] ?? tenant.status}
                  </CentralBadge>
                </CentralTableCell>
                <CentralTableCell>
                  <span style={{ color: 'var(--central-text-secondary)' }}>
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </CentralTableCell>
                <CentralTableCell>
                  <Link href={`/central/tenants/${tenant.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </CentralTableCell>
              </CentralTableRow>
            ))}
            {tenants.length === 0 && (
              <CentralTableRow>
                <CentralTableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Building2
                      className="h-12 w-12"
                      style={{ color: 'var(--central-text-muted)' }}
                    />
                    <p style={{ color: 'var(--central-text-muted)' }}>
                      {debouncedSearch || statusFilter
                        ? 'Nenhuma empresa encontrada com os filtros aplicados'
                        : 'Nenhuma empresa encontrada'}
                    </p>
                  </div>
                </CentralTableCell>
              </CentralTableRow>
            )}
          </CentralTableBody>
        </CentralTable>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p
            className="text-sm"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {data.meta.total} empresas no total — Pagina {page} de{' '}
            {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="gap-2"
            >
              Proximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Tenant Wizard */}
      <StepWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        steps={wizardSteps}
        currentStep={wizardStep}
        onStepChange={setWizardStep}
        onClose={handleWizardClose}
      />
    </div>
  );
}
