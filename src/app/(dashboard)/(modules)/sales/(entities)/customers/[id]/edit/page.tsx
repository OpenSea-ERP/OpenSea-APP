/**
 * OpenSea OS - Edit Customer Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
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
import { Textarea } from '@/components/ui/textarea';
import {
  useCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/hooks/sales/use-customers';
import { usePermissions } from '@/hooks/use-permissions';
import { customersConfig } from '@/config/entities/customers.config';
import { logger } from '@/lib/logger';
import type { Customer } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  NotebookText,
  Save,
  Trash2,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const customerId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: customerData,
    isLoading: isLoadingCustomer,
    error,
  } = useCustomer(customerId);

  const customer = customerData?.customer as Customer | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [document, setDocument] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setType(customer.type || 'INDIVIDUAL');
      setDocument(customer.document || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
      setCity(customer.city || '');
      setState(customer.state || '');
      setZipCode(customer.zipCode || '');
      setCountry(customer.country || '');
      setNotes(customer.notes || '');
      setIsActive(customer.isActive ?? true);
    }
  }, [customer]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome e obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        customerId,
        data: {
          name: name.trim(),
          document: document.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zipCode: zipCode.trim() || undefined,
          country: country.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      toast.success('Cliente atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['customers', customerId],
      });
      router.push(`/sales/customers/${customerId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar cliente',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar cliente', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(customerId);
      toast.success('Cliente excluído com sucesso!');
      router.push('/sales/customers');
    } catch (err) {
      logger.error(
        'Erro ao deletar cliente',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar cliente', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(customersConfig.permissions!.delete)
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
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Clientes', href: '/sales/customers' },
    {
      label: customer?.name || '...',
      href: `/sales/customers/${customerId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingCustomer) {
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

  if (error || !customer) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Cliente não encontrado"
            message="O cliente solicitado não foi encontrado."
            action={{
              label: 'Voltar para Clientes',
              onClick: () => router.push('/sales/customers'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const isCompany = type === 'BUSINESS';

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="customer-edit">
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
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg ${
                isCompany
                  ? 'bg-linear-to-br from-violet-500 to-purple-600'
                  : 'bg-linear-to-br from-blue-500 to-indigo-600'
              }`}
            >
              {isCompany ? (
                <Building2 className="h-7 w-7 text-white" />
              ) : (
                <User className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando cliente</p>
              <h1 className="text-xl font-bold truncate">{customer.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados do Cliente */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados do Cliente"
                subtitle="Informações básicas de identificação"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome completo ou razao social"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v =>
                        setType(v as 'INDIVIDUAL' | 'BUSINESS')
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INDIVIDUAL">
                          Pessoa Física
                        </SelectItem>
                        <SelectItem value="BUSINESS">
                          Pessoa Jurídica
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="document">
                      {isCompany ? 'CNPJ' : 'CPF'}
                    </Label>
                    <Input
                      id="document"
                      value={document}
                      onChange={e => setDocument(e.target.value)}
                      placeholder={
                        isCompany ? '00.000.000/0000-00' : '000.000.000-00'
                      }
                    />
                  </div>
                </div>

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Contato */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Mail}
                title="Contato"
                subtitle="Informações de contato do cliente"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="cliente@email.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Endereco */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={MapPin}
                title="Endereco"
                subtitle="Localização do cliente"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="address">Endereco</Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="UF"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="country">Pais</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder="Brasil"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Observações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas internas sobre o cliente"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Notas internas sobre o cliente..."
                    rows={4}
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
        title="Excluir Cliente"
        description={`Digite seu PIN de ação para excluir o cliente "${customer.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
