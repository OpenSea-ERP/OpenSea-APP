/**
 * OpenSea OS - Contact Detail Page
 * Página de detalhes do contato com abas: Informações, Negociacoes, Timeline
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateActivityModal } from '@/components/sales/create-activity-modal';
import { useContact } from '@/hooks/sales/use-contacts';
import { useDealsInfinite } from '@/hooks/sales/use-deals';
import { useTimeline } from '@/hooks/sales/use-timeline';
import { useActivitiesInfinite } from '@/hooks/sales/use-activities';
import { usePermissions } from '@/hooks/use-permissions';
import { contactsConfig } from '@/config/entities/contacts.config';
import { cn } from '@/lib/utils';
import type { Contact, TimelineItem, Deal } from '@/types/sales';
import {
  LIFECYCLE_STAGE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  CONTACT_ROLE_LABELS,
  DEAL_STATUS_LABELS,
} from '@/types/sales';
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Edit,
  Flame,
  Handshake,
  Linkedin,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  Snowflake,
  Sun,
  Trophy,
  UserCircle,
  Video,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

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

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return 'Sem valor';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

const DEAL_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  OPEN: {
    bg: 'bg-blue-50 dark:bg-blue-500/8',
    text: 'text-blue-700 dark:text-blue-300',
  },
  WON: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/8',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
  LOST: {
    bg: 'bg-rose-50 dark:bg-rose-500/8',
    text: 'text-rose-700 dark:text-rose-300',
  },
  ARCHIVED: {
    bg: 'bg-slate-100 dark:bg-slate-500/8',
    text: 'text-slate-600 dark:text-slate-400',
  },
};

const TIMELINE_ICONS: Record<string, React.ElementType> = {
  ACTIVITY: Phone,
  DEAL_CREATED: Plus,
  DEAL_STAGE_CHANGED: ChevronRight,
  DEAL_WON: Trophy,
  DEAL_LOST: XCircle,
  NOTE: MessageSquare,
  EMAIL: Mail,
  CONTACT_CREATED: UserCircle,
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const contactId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: contactData, isLoading, error } = useContact(contactId);

  const contact = contactData?.contact as Contact | undefined;

  // Deals linked to this contact's customer
  const { deals, isLoading: dealsLoading } = useDealsInfinite({
    customerId: contact?.customerId || undefined,
  });

  // Timeline for this contact
  const { items: timelineItems, isLoading: timelineLoading } = useTimeline(
    contactId,
    'contact'
  );

  // Activities for this contact
  const { activities, isLoading: activitiesLoading } = useActivitiesInfinite({
    contactId,
  });

  // Activity create modal
  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(contactsConfig.permissions.update &&
    hasPermission(contactsConfig.permissions.update)
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
            title="Contato não encontrado"
            message="O contato que você está procurando não existe ou foi removido."
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
              <h1 className="text-xl font-bold truncate">{contact.fullName}</h1>
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
              const phone = contact.whatsapp || contact.phone;
              if (phone) {
                const cleaned = phone.replace(/\D/g, '');
                window.open(
                  `https://wa.me/${cleaned}`,
                  '_blank',
                  'noopener,noreferrer'
                );
              } else {
                toast.info('Nenhum número de telefone ou WhatsApp cadastrado.');
              }
            }}
          >
            <MessageCircle className="h-4 w-4 text-emerald-600" />
            Enviar WhatsApp
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            onClick={() => {
              if (contact.email) {
                window.open(`mailto:${contact.email}`, '_self');
              } else {
                toast.info('Nenhum e-mail cadastrado para este contato.');
              }
            }}
          >
            <Mail className="h-4 w-4 text-blue-600" />
            Enviar E-mail
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 dark:bg-slate-800/60 dark:hover:bg-slate-800"
            onClick={() => {
              toast.info(
                'O agendamento de reuniões estará disponível em breve.'
              );
            }}
          >
            <Video className="h-4 w-4 text-violet-600" />
            Agendar Reunião
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="deals">Negociacoes</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* TAB: Informações */}
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
                        Informações pessoais e de comunicação
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow icon={Mail} label="E-mail" value={contact.email} />
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
                      <h3 className="text-base font-semibold">Redes Sociais</h3>
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
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Handshake className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Negócios Vinculados
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Negócios do cliente vinculado a este contato
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {dealsLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {!dealsLoading && deals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5">
                      <Handshake className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhum negócio vinculado a este contato.
                    </p>
                  </div>
                )}

                {!dealsLoading && deals.length > 0 && (
                  <div className="space-y-2">
                    {deals.map((deal: Deal) => {
                      const statusStyle =
                        DEAL_STATUS_STYLES[deal.status] ??
                        DEAL_STATUS_STYLES.OPEN;
                      return (
                        <Link
                          key={deal.id}
                          href={`/sales/deals/${deal.id}`}
                          className="block"
                        >
                          <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-white dark:bg-slate-800/60 hover:shadow-md hover:border-violet-200 dark:hover:border-violet-500/30 transition-all cursor-pointer">
                            <div className="p-2 rounded-lg bg-violet-500/10">
                              <DollarSign className="h-4 w-4 text-violet-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium truncate">
                                {deal.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                {deal.pipeline && (
                                  <>
                                    <span>{deal.pipeline.name}</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </>
                                )}
                                {deal.stage && <span>{deal.stage.name}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {deal.value !== undefined &&
                                deal.value !== null && (
                                  <span className="text-sm font-semibold">
                                    {formatCurrency(deal.value)}
                                  </span>
                                )}
                              <Badge
                                variant="secondary"
                                className={cn(
                                  'text-xs',
                                  statusStyle.bg,
                                  statusStyle.text
                                )}
                              >
                                {DEAL_STATUS_LABELS[deal.status]}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Timeline */}
          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-foreground" />
                      <div>
                        <h3 className="text-base font-semibold">Timeline</h3>
                        <p className="text-sm text-muted-foreground">
                          Atividades e eventos do contato
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setActivityModalOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nova Atividade
                    </Button>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {(timelineLoading || activitiesLoading) && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                )}

                {!timelineLoading &&
                  !activitiesLoading &&
                  timelineItems.length === 0 &&
                  activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5">
                        <Clock className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Nenhum evento na timeline ainda.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setActivityModalOpen(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Registrar Atividade
                      </Button>
                    </div>
                  )}

                {!timelineLoading &&
                  !activitiesLoading &&
                  timelineItems.length > 0 && (
                    <div className="space-y-4">
                      {timelineItems.map((item: TimelineItem) => {
                        const Icon = TIMELINE_ICONS[item.type] || Clock;
                        return (
                          <div key={item.id} className="flex gap-3 items-start">
                            <div className="p-1.5 rounded-lg bg-muted/50 shrink-0 mt-0.5">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <span className="text-xs text-muted-foreground mt-1 block">
                                {new Date(item.createdAt).toLocaleDateString(
                                  'pt-BR',
                                  {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>

      {/* Create Activity Modal */}
      <CreateActivityModal
        open={activityModalOpen}
        onOpenChange={setActivityModalOpen}
        contactId={contactId}
        customerId={contact?.customerId}
      />
    </PageLayout>
  );
}
