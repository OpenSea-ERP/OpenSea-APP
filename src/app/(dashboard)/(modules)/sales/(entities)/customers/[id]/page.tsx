/**
 * OpenSea OS - Customer Detail Page
 * Página de detalhes do cliente com abas: Informações, Contatos, Negociações, Timeline
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
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomer } from '@/hooks/sales/use-customers';
import { usePermissions } from '@/hooks/use-permissions';
import { customersConfig } from '@/config/entities/customers.config';
import type { Customer } from '@/types/sales';
import {
  Building2,
  Calendar,
  Edit,
  Globe,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const customerId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: customerData, isLoading, error } = useCustomer(customerId);

  const customer = customerData?.customer as Customer | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(customersConfig.permissions!.update &&
    hasPermission(customersConfig.permissions!.update)
      ? [
          {
            id: 'edit',
            title: 'Editar Cliente',
            icon: Edit,
            onClick: () => router.push(`/sales/customers/${customerId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Clientes', href: '/sales/customers' },
    { label: customer?.name || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

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
            message="O cliente que você está procurando não existe ou foi removido."
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

  const isCompany = customer.type === 'BUSINESS';
  const typeLabel = isCompany ? 'Pessoa Jurídica' : 'Pessoa Física';
  const fullAddress = [
    customer.address,
    customer.city,
    customer.state,
    customer.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const createdDate = new Date(customer.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="customer-detail">
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
              <p className="text-sm text-muted-foreground">{typeLabel}</p>
              <h1 className="text-xl font-bold truncate">{customer.name}</h1>
              {customer.document && (
                <p className="text-sm text-muted-foreground">
                  {customer.document}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  customer.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {customer.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="contacts">Contatos</TabsTrigger>
            <TabsTrigger value="deals">Negociações</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* TAB: Informações */}
          <TabsContent value="info" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados do Cliente
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações de identificação e contato
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={Mail}
                      label="E-mail"
                      value={customer.email}
                    />
                    <InfoRow
                      icon={Phone}
                      label="Telefone"
                      value={customer.phone}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Endereco"
                      value={fullAddress || undefined}
                    />
                    <InfoRow
                      icon={Globe}
                      label="Pais"
                      value={customer.country}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Cliente desde"
                      value={createdDate}
                    />
                  </div>

                  {customer.notes && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Observações
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Contatos */}
          <TabsContent value="contacts" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Contatos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A gestao de contatos vinculados ao cliente estara disponivel
                    em breve.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Negociações */}
          <TabsContent value="deals" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Negociações
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O histórico de negociações e oportunidades estara disponivel
                    em breve.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Timeline */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Timeline
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    A timeline de atividades e interações estara disponivel em
                    breve.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
