'use client';

import {
  CentralBadge,
  CentralCard,
  CentralTable,
  CentralTableBody,
  CentralTableCell,
  CentralTableHead,
  CentralTableHeader,
  CentralTableRow,
} from '@/components/central';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminTenantDetails,
  useAdminTenantUsers,
  useChangeTenantStatus,
  useCreateTenantUser,
  useDeleteTenant,
  useRemoveTenantUser,
  useSetUserSecurityKey,
  useTenantConsumption,
  useTenantIntegrations,
  useTenantOverview,
  useTenantSubscription,
  useUpdateTenant,
} from '@/hooks/admin/use-admin';
import type { CentralBadgeVariant } from '@/components/central';
import type {
  TenantConsumption,
  TenantIntegrationStatus,
  TenantSubscription,
} from '@/types/admin/subscription.types';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bot,
  Cable,
  Calendar,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  KeyRound,
  Mail,
  Palette,
  Package,
  Pencil,
  Plus,
  Save,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusOptions = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
const roleOptions = ['member', 'owner'];

const statusVariantMap: Record<string, CentralBadgeVariant> = {
  ACTIVE: 'emerald',
  INACTIVE: 'orange',
  SUSPENDED: 'rose',
};

const integrationStatusMap: Record<string, CentralBadgeVariant> = {
  CONNECTED: 'emerald',
  DISCONNECTED: 'rose',
  ERROR: 'rose',
  NOT_CONFIGURED: 'default',
};

const integrationStatusLabel: Record<string, string> = {
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro',
  NOT_CONFIGURED: 'Não configurado',
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // Core data
  const { data, isLoading } = useAdminTenantDetails(id);
  const { data: usersData, isLoading: usersLoading } = useAdminTenantUsers(id);
  const { data: overview, isLoading: overviewLoading } = useTenantOverview(id);
  const { data: subscriptions, isLoading: subscriptionsLoading } =
    useTenantSubscription(id);
  const { data: consumption, isLoading: consumptionLoading } =
    useTenantConsumption(id);
  const { data: integrations, isLoading: integrationsLoading } =
    useTenantIntegrations(id);

  // Mutations
  const changeStatus = useChangeTenantStatus();
  const updateTenant = useUpdateTenant();
  const deleteTenant = useDeleteTenant();
  const createTenantUser = useCreateTenantUser();
  const removeTenantUser = useRemoveTenantUser();
  const setSecurityKey = useSetUserSecurityKey();

  // Local state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    logoUrl: '',
    primaryColor: '',
  });
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    username: '',
    role: 'member',
  });
  const [securityKeyState, setSecurityKeyState] = useState<{
    userId: string;
    userName: string;
  } | null>(null);
  const [securityKeyInput, setSecurityKeyInput] = useState('');

  useEffect(() => {
    if (data?.tenant) {
      setForm({
        name: data.tenant.name,
        slug: data.tenant.slug,
        logoUrl: data.tenant.logoUrl ?? '',
        primaryColor: '',
      });
    }
  }, [data]);

  // ========== Handlers ==========

  const handleSave = async () => {
    try {
      await updateTenant.mutateAsync({
        id,
        data: {
          name: form.name,
          slug: form.slug,
          logoUrl: form.logoUrl || null,
        },
      });
      toast.success('Informações atualizadas com sucesso');
    } catch {
      toast.error('Erro ao atualizar informações');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja desativar esta empresa?')) return;
    try {
      await deleteTenant.mutateAsync(id);
      toast.success('Empresa desativada com sucesso');
      router.push('/central/tenants');
    } catch {
      toast.error('Erro ao desativar empresa');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await changeStatus.mutateAsync({ id, status: newStatus });
      toast.success('Status atualizado com sucesso');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCreateUser = async () => {
    try {
      await createTenantUser.mutateAsync({
        id,
        data: {
          email: userForm.email,
          password: userForm.password,
          username: userForm.username || undefined,
          role: userForm.role,
        },
      });
      toast.success('Usuário criado com sucesso');
      setCreateUserOpen(false);
      setUserForm({ email: '', password: '', username: '', role: 'member' });
    } catch {
      toast.error('Erro ao criar usuário');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;
    try {
      await removeTenantUser.mutateAsync({ tenantId: id, userId });
      toast.success('Usuário removido com sucesso');
    } catch {
      toast.error('Erro ao remover usuário');
    }
  };

  const handleSetSecurityKey = async () => {
    if (!securityKeyState) return;
    const key = securityKeyInput.trim() || null;
    try {
      await setSecurityKey.mutateAsync({
        tenantId: id,
        userId: securityKeyState.userId,
        securityKey: key,
      });
      toast.success(
        key
          ? 'Chave de segurança definida com sucesso'
          : 'Chave de segurança removida com sucesso'
      );
      setSecurityKeyState(null);
      setSecurityKeyInput('');
    } catch {
      toast.error('Erro ao definir chave de segurança');
    }
  };

  // ========== Loading ==========

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!data?.tenant) {
    return (
      <CentralCard className="p-12 text-center">
        <AlertCircle
          className="h-16 w-16 mx-auto mb-4"
          style={{ color: 'var(--central-text-muted)' }}
        />
        <p className="text-lg" style={{ color: 'var(--central-text-muted)' }}>
          Empresa não encontrada
        </p>
      </CentralCard>
    );
  }

  const { tenant } = data;
  const users = usersData?.users ?? [];
  const statusVariant = statusVariantMap[tenant.status] || 'default';
  const formattedDate = new Date(tenant.createdAt).toLocaleDateString('pt-BR');
  const totalMRR = overview?.totalMRR ?? 0;

  return (
    <div className="space-y-0 pb-8">
      {/* ====== Header ====== */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/central/tenants">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 -ml-2 mr-1 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1
                style={{ color: 'var(--central-text-primary)' }}
                className="text-xl font-bold"
              >
                {tenant.name}
              </h1>
              <CentralBadge variant={statusVariant}>
                {tenant.status}
              </CentralBadge>
            </div>
            <p
              style={{ color: 'var(--central-text-muted)' }}
              className="text-xs mt-1 ml-10"
            >
              MRR: R$ {totalMRR.toFixed(2)} · Desde {formattedDate}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const settingsTab = document.querySelector(
                  '[data-value="settings"]'
                ) as HTMLButtonElement | null;
                settingsTab?.click();
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* ====== Tabs ====== */}
      <Tabs defaultValue="overview" className="px-6">
        <TabsList
          className="gap-1 h-11 w-full border mb-6"
          style={{
            background: 'var(--central-card-bg)',
            borderColor: 'var(--central-separator)',
          }}
        >
          <TabsTrigger
            value="overview"
            data-value="overview"
            className="gap-1.5 text-sm"
          >
            <Activity className="h-3.5 w-3.5" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            data-value="subscription"
            className="gap-1.5 text-sm"
          >
            <Package className="h-3.5 w-3.5" />
            Assinatura
          </TabsTrigger>
          <TabsTrigger
            value="users"
            data-value="users"
            className="gap-1.5 text-sm"
          >
            <Users className="h-3.5 w-3.5" />
            Usuários
            <span
              className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: 'var(--central-separator)',
                color: 'var(--central-text-primary)',
              }}
            >
              {users.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            data-value="settings"
            className="gap-1.5 text-sm"
          >
            <Settings className="h-3.5 w-3.5" />
            Configurações
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            data-value="integrations"
            className="gap-1.5 text-sm"
          >
            <Cable className="h-3.5 w-3.5" />
            Integrações
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            data-value="logs"
            className="gap-1.5 text-sm"
          >
            <ScrollText className="h-3.5 w-3.5" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* ====== Tab 1: Visão Geral ====== */}
        <TabsContent value="overview" className="space-y-6">
          {overviewLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Usuários"
                  value={String(overview?.activeUsers ?? users.length)}
                  color="sky"
                />
                <StatCard
                  icon={<ShoppingCart className="h-5 w-5" />}
                  label="Pedidos"
                  value="--"
                  color="violet"
                />
                <StatCard
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Receita (MRR)"
                  value={`R$ ${totalMRR.toFixed(2)}`}
                  color="emerald"
                />
                <StatCard
                  icon={<ClipboardList className="h-5 w-5" />}
                  label="Tickets Recentes"
                  value={String(overview?.recentTicketCount ?? 0)}
                  color="orange"
                />
              </div>

              {/* Integration Health Row */}
              <CentralCard className="p-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  Saúde das Integrações
                </h3>
                <div className="flex items-center gap-4 flex-wrap">
                  {overview?.integrations &&
                  overview.integrations.length > 0 ? (
                    overview.integrations.map(
                      (integ: TenantIntegrationStatus) => (
                        <IntegrationDot key={integ.id} integration={integ} />
                      )
                    )
                  ) : (
                    <p
                      className="text-sm"
                      style={{ color: 'var(--central-text-muted)' }}
                    >
                      Nenhuma integração configurada
                    </p>
                  )}
                </div>
              </CentralCard>

              {/* Recent Activity */}
              <CentralCard className="p-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  Atividade Recente
                </h3>
                <div
                  className="flex items-center justify-center py-8"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  <Activity className="h-5 w-5 mr-2 opacity-50" />
                  <span className="text-sm">
                    Atividades recentes estarão disponíveis em breve
                  </span>
                </div>
              </CentralCard>
            </>
          )}
        </TabsContent>

        {/* ====== Tab 2: Assinatura ====== */}
        <TabsContent value="subscription" className="space-y-6">
          {subscriptionsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <>
              {/* Subscribed Skills */}
              <CentralCard className="p-5">
                <h3
                  className="text-sm font-semibold mb-4"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  Skills Assinadas
                </h3>
                {subscriptions && subscriptions.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptions.map((sub: TenantSubscription) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg"
                        style={{ background: 'var(--central-card-bg)' }}
                      >
                        <div className="flex items-center gap-2">
                          <Package
                            className="h-4 w-4"
                            style={{ color: 'var(--central-text-muted)' }}
                          />
                          <span
                            className="text-sm font-medium font-mono"
                            style={{ color: 'var(--central-text-primary)' }}
                          >
                            {sub.skillCode}
                          </span>
                          <CentralBadge
                            variant={
                              sub.status === 'ACTIVE' ? 'emerald' : 'orange'
                            }
                          >
                            {sub.status}
                          </CentralBadge>
                        </div>
                        <span
                          className="text-sm"
                          style={{ color: 'var(--central-text-muted)' }}
                        >
                          {sub.customPrice != null
                            ? `R$ ${sub.customPrice.toFixed(2)}/mês`
                            : `Qtd: ${sub.quantity}`}
                          {sub.discountPercent
                            ? ` (-${sub.discountPercent}%)`
                            : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm py-4 text-center"
                    style={{ color: 'var(--central-text-muted)' }}
                  >
                    Nenhuma skill assinada
                  </p>
                )}
              </CentralCard>

              {/* Consumption Bars */}
              <CentralCard className="p-5">
                <h3
                  className="text-sm font-semibold mb-4"
                  style={{ color: 'var(--central-text-primary)' }}
                >
                  Consumo
                </h3>
                {consumptionLoading ? (
                  <Skeleton className="h-20" />
                ) : consumption && consumption.length > 0 ? (
                  <div className="space-y-4">
                    {consumption.map((item: TenantConsumption) => (
                      <ConsumptionBar key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm py-4 text-center"
                    style={{ color: 'var(--central-text-muted)' }}
                  >
                    Sem dados de consumo disponíveis
                  </p>
                )}
              </CentralCard>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar skill
                </Button>
                <Button variant="outline" size="sm">
                  <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                  Aplicar desconto
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ====== Tab 3: Usuários ====== */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar usuário
                </Button>
              </DialogTrigger>
              <DialogContent
                className="border shadow-2xl"
                style={{
                  background: 'var(--central-card-bg)',
                  borderColor: 'var(--central-separator)',
                }}
              >
                <DialogHeader>
                  <DialogTitle
                    className="text-xl font-bold"
                    style={{ color: 'var(--central-text-primary)' }}
                  >
                    Adicionar Novo Usuário
                  </DialogTitle>
                  <DialogDescription
                    style={{ color: 'var(--central-text-muted)' }}
                  >
                    Crie um novo usuário e associe a esta empresa.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label
                      htmlFor="user-email"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      Email
                    </Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userForm.email}
                      onChange={e =>
                        setUserForm(f => ({ ...f, email: e.target.value }))
                      }
                      placeholder="usuario@exemplo.com"
                      className="mt-2"
                      style={{
                        background: 'var(--central-card-bg)',
                        color: 'var(--central-text-primary)',
                        borderColor: 'var(--central-separator)',
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="user-username"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      Username (opcional)
                    </Label>
                    <Input
                      id="user-username"
                      value={userForm.username}
                      onChange={e =>
                        setUserForm(f => ({ ...f, username: e.target.value }))
                      }
                      placeholder="Gerado automaticamente se vazio"
                      className="mt-2"
                      style={{
                        background: 'var(--central-card-bg)',
                        color: 'var(--central-text-primary)',
                        borderColor: 'var(--central-separator)',
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="user-password"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      Senha
                    </Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userForm.password}
                      onChange={e =>
                        setUserForm(f => ({ ...f, password: e.target.value }))
                      }
                      placeholder="Mínimo 6 caracteres"
                      className="mt-2"
                      style={{
                        background: 'var(--central-card-bg)',
                        color: 'var(--central-text-primary)',
                        borderColor: 'var(--central-separator)',
                      }}
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="user-role"
                      style={{ color: 'var(--central-text-secondary)' }}
                    >
                      Papel
                    </Label>
                    <Select
                      value={userForm.role}
                      onValueChange={v => setUserForm(f => ({ ...f, role: v }))}
                    >
                      <SelectTrigger
                        className="mt-2"
                        style={{
                          background: 'var(--central-card-bg)',
                          color: 'var(--central-text-primary)',
                          borderColor: 'var(--central-separator)',
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map(r => (
                          <SelectItem key={r} value={r}>
                            {r === 'owner' ? 'Proprietário' : 'Membro'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateUser}
                    disabled={
                      createTenantUser.isPending ||
                      !userForm.email.trim() ||
                      !userForm.password.trim()
                    }
                    className="gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {usersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : users.length > 0 ? (
            <div className="grid gap-3">
              {users.map(u => (
                <CentralCard
                  key={u.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="p-2.5 rounded-lg"
                      style={{ background: 'var(--central-separator)' }}
                    >
                      {u.role === 'owner' ? (
                        <Shield className="h-4 w-4 text-amber-500" />
                      ) : (
                        <Users
                          className="h-4 w-4"
                          style={{ color: 'var(--central-text-muted)' }}
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className="font-semibold text-sm"
                        style={{ color: 'var(--central-text-primary)' }}
                      >
                        {u.user?.username ?? u.userId}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail
                          className="h-3 w-3"
                          style={{ color: 'var(--central-text-muted)' }}
                        />
                        <p
                          className="text-xs"
                          style={{ color: 'var(--central-text-muted)' }}
                        >
                          {u.user?.email}
                        </p>
                      </div>
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: 'var(--central-text-muted)' }}
                      >
                        Membro desde{' '}
                        {new Date(u.joinedAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CentralBadge
                      variant={u.role === 'owner' ? 'emerald' : 'sky'}
                    >
                      {u.role === 'owner' ? 'Proprietário' : 'Membro'}
                    </CentralBadge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSecurityKeyState({
                          userId: u.userId,
                          userName:
                            u.user?.username ?? u.user?.email ?? u.userId,
                        })
                      }
                      title="Chave de segurança"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    {u.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(u.userId)}
                        disabled={removeTenantUser.isPending}
                        className="text-rose-500 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CentralCard>
              ))}
            </div>
          ) : (
            <CentralCard className="p-12 text-center">
              <Users
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <p
                className="text-sm"
                style={{ color: 'var(--central-text-muted)' }}
              >
                Nenhum usuário nesta empresa
              </p>
            </CentralCard>
          )}
        </TabsContent>

        {/* ====== Tab 4: Configurações ====== */}
        <TabsContent value="settings" className="space-y-6">
          {/* IA Config */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Configuração de IA
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Nome do Assistente
                </Label>
                <Input
                  value="Assistente OpenSea"
                  readOnly
                  className="mt-1.5 opacity-60"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Personalidade
                </Label>
                <Input
                  value="Profissional"
                  readOnly
                  className="mt-1.5 opacity-60"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Modos Habilitados
                </Label>
                <Input
                  value="Texto, Voz"
                  readOnly
                  className="mt-1.5 opacity-60"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
            </div>
            <p
              className="text-xs mt-3"
              style={{ color: 'var(--central-text-muted)' }}
            >
              Edição disponível na Fase 3
            </p>
          </CentralCard>

          {/* Branding */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Branding
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  URL do Logo
                </Label>
                <Input
                  value={form.logoUrl}
                  onChange={e =>
                    setForm(f => ({ ...f, logoUrl: e.target.value }))
                  }
                  placeholder="https://exemplo.com/logo.png"
                  className="mt-1.5"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Cor Primária
                </Label>
                <Input
                  value={form.primaryColor}
                  onChange={e =>
                    setForm(f => ({ ...f, primaryColor: e.target.value }))
                  }
                  placeholder="#3B82F6"
                  className="mt-1.5"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
            </div>
          </CentralCard>

          {/* Geral */}
          <CentralCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings
                className="h-4 w-4"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--central-text-primary)' }}
              >
                Geral
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Nome
                </Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1.5"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Slug
                </Label>
                <Input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="mt-1.5"
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div>
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Status
                </Label>
                <Select
                  value={tenant.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger
                    className="mt-1.5"
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateTenant.isPending || !form.name.trim()}
                className="gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                Salvar alterações
              </Button>
            </div>
          </CentralCard>
        </TabsContent>

        {/* ====== Tab 5: Integrações ====== */}
        <TabsContent value="integrations" className="space-y-6">
          {integrationsLoading ? (
            <Skeleton className="h-48" />
          ) : integrations && integrations.length > 0 ? (
            <CentralTable>
              <CentralTableHeader>
                <tr>
                  <CentralTableHead>Canal</CentralTableHead>
                  <CentralTableHead>Status</CentralTableHead>
                  <CentralTableHead>Último check</CentralTableHead>
                  <CentralTableHead>Mensagem de erro</CentralTableHead>
                </tr>
              </CentralTableHeader>
              <CentralTableBody>
                {integrations.map((integ: TenantIntegrationStatus) => (
                  <CentralTableRow key={integ.id}>
                    <CentralTableCell className="font-medium">
                      {integ.integrationType}
                    </CentralTableCell>
                    <CentralTableCell>
                      <CentralBadge
                        variant={
                          integrationStatusMap[integ.status] || 'default'
                        }
                      >
                        {integrationStatusLabel[integ.status] || integ.status}
                      </CentralBadge>
                    </CentralTableCell>
                    <CentralTableCell>
                      {integ.lastCheckAt
                        ? new Date(integ.lastCheckAt).toLocaleString('pt-BR')
                        : '--'}
                    </CentralTableCell>
                    <CentralTableCell>
                      {integ.errorMessage ? (
                        <span className="text-rose-500 text-xs">
                          {integ.errorMessage}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--central-text-muted)' }}>
                          --
                        </span>
                      )}
                    </CentralTableCell>
                  </CentralTableRow>
                ))}
              </CentralTableBody>
            </CentralTable>
          ) : (
            <CentralCard className="p-12 text-center">
              <Cable
                className="h-12 w-12 mx-auto mb-3"
                style={{ color: 'var(--central-text-muted)' }}
              />
              <p
                className="text-sm"
                style={{ color: 'var(--central-text-muted)' }}
              >
                Nenhuma integração configurada
              </p>
            </CentralCard>
          )}
        </TabsContent>

        {/* ====== Tab 6: Logs ====== */}
        <TabsContent value="logs" className="space-y-6">
          <CentralCard className="p-5">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Filtros
            </h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Data Início
                </Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  disabled
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="flex-1">
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Data Fim
                </Label>
                <Input
                  type="date"
                  className="mt-1.5"
                  disabled
                  style={{
                    background: 'var(--central-card-bg)',
                    color: 'var(--central-text-primary)',
                    borderColor: 'var(--central-separator)',
                  }}
                />
              </div>
              <div className="flex-1">
                <Label
                  className="text-xs"
                  style={{ color: 'var(--central-text-muted)' }}
                >
                  Tipo
                </Label>
                <Select disabled>
                  <SelectTrigger
                    className="mt-1.5"
                    style={{
                      background: 'var(--central-card-bg)',
                      color: 'var(--central-text-primary)',
                      borderColor: 'var(--central-separator)',
                    }}
                  >
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CentralCard>

          <CentralCard className="p-12 text-center">
            <ScrollText
              className="h-12 w-12 mx-auto mb-3"
              style={{ color: 'var(--central-text-muted)' }}
            />
            <p
              className="text-sm"
              style={{ color: 'var(--central-text-muted)' }}
            >
              Logs de auditoria estarão disponíveis em breve
            </p>
          </CentralCard>
        </TabsContent>
      </Tabs>

      {/* ====== Security Key Dialog ====== */}
      <Dialog
        open={!!securityKeyState}
        onOpenChange={open => {
          if (!open) {
            setSecurityKeyState(null);
            setSecurityKeyInput('');
          }
        }}
      >
        <DialogContent
          className="border shadow-2xl"
          style={{
            background: 'var(--central-card-bg)',
            borderColor: 'var(--central-separator)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-xl font-bold"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Chave de Segurança
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--central-text-muted)' }}>
              Defina a chave de segurança para{' '}
              <strong>{securityKeyState?.userName}</strong>. O usuário poderá
              digitar esta chave na barra de pesquisa do gerenciador de arquivos
              para revelar itens ocultos. Deixe em branco para remover.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label
              htmlFor="security-key"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              Chave de segurança
            </Label>
            <Input
              id="security-key"
              type="password"
              value={securityKeyInput}
              onChange={e => setSecurityKeyInput(e.target.value)}
              placeholder="Deixe em branco para remover"
              className="mt-2"
              style={{
                background: 'var(--central-card-bg)',
                color: 'var(--central-text-primary)',
                borderColor: 'var(--central-separator)',
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setSecurityKeyState(null);
                setSecurityKeyInput('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSetSecurityKey}
              disabled={setSecurityKey.isPending}
              className="gap-1.5"
            >
              <KeyRound className="h-4 w-4" />
              {securityKeyInput.trim() ? 'Definir chave' : 'Remover chave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== Sub-components ==========

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'sky' | 'violet' | 'emerald' | 'orange';
}) {
  const iconColorMap = {
    sky: 'text-sky-500',
    violet: 'text-violet-500',
    emerald: 'text-emerald-500',
    orange: 'text-orange-500',
  };
  const bgColorMap = {
    sky: 'bg-sky-500/10',
    violet: 'bg-violet-500/10',
    emerald: 'bg-emerald-500/10',
    orange: 'bg-orange-500/10',
  };

  return (
    <CentralCard className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium"
            style={{ color: 'var(--central-text-muted)' }}
          >
            {label}
          </p>
          <p
            className="text-2xl font-bold mt-1"
            style={{ color: 'var(--central-text-primary)' }}
          >
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${bgColorMap[color]}`}>
          <span className={iconColorMap[color]}>{icon}</span>
        </div>
      </div>
    </CentralCard>
  );
}

function ConsumptionBar({ item }: { item: TenantConsumption }) {
  const limit = item.limit ?? item.included;
  const percent =
    limit > 0 ? Math.min(100, Math.round((item.used / limit) * 100)) : 0;

  const barColor =
    percent >= 90
      ? 'bg-rose-500'
      : percent >= 70
        ? 'bg-orange-500'
        : 'bg-emerald-500';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--central-text-primary)' }}
        >
          {item.metric}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--central-text-muted)' }}
        >
          {item.used}/{limit} ({percent}%)
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--central-separator)' }}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function IntegrationDot({
  integration,
}: {
  integration: TenantIntegrationStatus;
}) {
  const statusIcon =
    integration.status === 'CONNECTED' ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    ) : integration.status === 'ERROR' ? (
      <XCircle className="h-4 w-4 text-rose-500" />
    ) : integration.status === 'DISCONNECTED' ? (
      <XCircle className="h-4 w-4 text-rose-400" />
    ) : (
      <AlertCircle className="h-4 w-4 text-orange-400" />
    );

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
      style={{
        background: 'var(--central-card-bg)',
        border: '1px solid var(--central-separator)',
        color: 'var(--central-text-primary)',
      }}
    >
      {statusIcon}
      <span className="font-medium">{integration.integrationType}</span>
    </div>
  );
}
