/**
 * OpenSea OS - Contact Detail Page
 * Pagina de detalhes do contato com abas: Informacoes, Negociacoes, Timeline
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
import { useContact } from '@/hooks/sales/use-contacts';
import { usePermissions } from '@/hooks/use-permissions';
import { contactsConfig } from '@/config/entities/contacts.config';
import type { Contact } from '@/types/sales';
import {
  LIFECYCLE_STAGE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  CONTACT_ROLE_LABELS,
} from '@/types/sales';
import {
  Briefcase,
  Building2,
  Calendar,
  Edit,
  Flame,
  Linkedin,
  Instagram,
  Mail,
  MessageCircle,
  Phone,
  Snowflake,
  Sun,
  UserCircle,
  Video,
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
// HELPERS
// ============================================================================

const LIFECYCLE_STAGE_COLORS: Record<string, string> = {
  LEAD: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  MQL: 'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  SQL: 'border-indigo-600/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/8 text-indigo-700 dark:text-indigo-300',
  OPPORTUNITY:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  CUSTOMER:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  EVANGELIST:
    'border-purple-600/25 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/8 text-purple-700 dark:text-purple-300',
  CHURNED:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
};

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] || '?').toUpperCase();
}

function getTemperatureIcon(temp?: string) {
  switch (temp) {
    case 'HOT':
      return { Icon: Flame, color: 'text-rose-500' };
    case 'WARM':
      return { Icon: Sun, color: 'text-amber-500' };
    case 'COLD':
      return { Icon: Snowflake, color: 'text-blue-500' };
    default:
      return null;
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const contactId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: contactData,
    isLoading,
    error,
  } = useContact(contactId);

  const contact = contactData?.contact as Contact | undefined;

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(contactsConfig.permissions.update)
      ? [
          {
            id: 'edit',
            title: 'Editar Contato',
            icon: Edit,
            onClick: () => router.push(`/sales/contacts/${contactId}/edit`),
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
    { label: 'Contatos', href: '/sales/contacts' },
    { label: contact?.fullName || '...' },
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

  if (error || !contact) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Contato nao encontrado"
            message="O contato que voce esta procurando nao existe ou foi removido."
            action={{
              label: 'Voltar para Contatos',
              onClick: () => router.push('/sales/contacts'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const stageLabel =
    LIFECYCLE_STAGE_LABELS[contact.lifecycleStage] || contact.lifecycleStage;
  const stageColor =
    LIFECYCLE_STAGE_COLORS[contact.lifecycleStage] ||
    LIFECYCLE_STAGE_COLORS.LEAD;
  const roleLabel = contact.role
    ? CONTACT_ROLE_LABELS[contact.role]
    : undefined;
  const tempData = getTemperatureIcon(contact.leadTemperature);
  const tempLabel = contact.leadTemperature
    ? LEAD_TEMPERATURE_LABELS[contact.leadTemperature]
    : undefined;

  const createdDate = new Date(contact.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const leadScore = contact.leadScore ?? 0;

  // ============================================================================
  // RENDER
  // ============================================================================

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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-teal-500 to-emerald-600">
              <span className="text-lg font-bold text-white">
                {getInitials(contact.fullName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {contact.jobTitle || 'Contato'}
              </p>
              <h1 className="text-xl font-bold truncate">
                {contact.fullName}
              </h1>
              {roleLabel && (
                <p className="text-sm text-muted-foreground">{roleLabel}</p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              {/* Lifecycle stage badge */}
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${stageColor}`}
              >
                {stageLabel}
              </div>

              {/* Lead score bar */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Lead Score
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-teal-500 to-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, leadScore)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums">
                    {leadScore}
                  </span>
                </div>
              </div>

              {/* Temperature indicator */}
              {tempData && (
                <div className="flex items-center gap-1">
                  <tempData.Icon className={`h-4 w-4 ${tempData.color}`} />
                  <span className="text-xs font-medium">{tempLabel}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            onClick={() => {
              /* placeholder */
            }}
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            Enviar WhatsApp
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            onClick={() => {
              /* placeholder */
            }}
          >
            <Mail className="h-4 w-4 text-blue-600" />
            Enviar E-mail
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            onClick={() => {
              /* placeholder */
            }}
          >
            <Video className="h-4 w-4 text-violet-600" />
            Agendar Reuniao
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="info">Informacoes</TabsTrigger>
            <TabsTrigger value="deals">Negociacoes</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* TAB: Informacoes */}
          <TabsContent value="info" className="space-y-6">
            {/* Dados de Contato */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados de Contato
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informacoes pessoais e de comunicacao
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
                      value={contact.email}
                    />
                    <InfoRow
                      icon={Phone}
                      label="Telefone"
                      value={contact.phone}
                    />
                    <InfoRow
                      icon={MessageCircle}
                      label="WhatsApp"
                      value={contact.whatsapp}
                    />
                    <InfoRow
                      icon={Briefcase}
                      label="Cargo"
                      value={contact.jobTitle}
                    />
                    <InfoRow
                      icon={Building2}
                      label="Departamento"
                      value={contact.department}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Contato desde"
                      value={createdDate}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Redes Sociais - placeholder section */}
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Redes Sociais
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Perfis nas redes sociais
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Linkedin className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      As redes sociais do contato estarao disponiveis em breve.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Negociacoes */}
          <TabsContent value="deals" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-base font-semibold text-muted-foreground">
                    Negociacoes
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    O historico de negociacoes vinculadas a este contato estara
                    disponivel em breve.
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
                    A timeline de atividades e interacoes estara disponivel em
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
