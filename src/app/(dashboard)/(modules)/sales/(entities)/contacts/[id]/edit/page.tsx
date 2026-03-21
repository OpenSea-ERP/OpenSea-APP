/**
 * OpenSea OS - Edit Contact Page
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

import {
  useContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/sales/use-contacts';
import { usePermissions } from '@/hooks/use-permissions';
import { contactsConfig } from '@/config/entities/contacts.config';
import { logger } from '@/lib/logger';
import type {
  Contact,
  ContactRole,
  LeadTemperature,
  LifecycleStage,
} from '@/types/sales';
import {
  LIFECYCLE_STAGE_LABELS,
  LEAD_TEMPERATURE_LABELS,
  CONTACT_ROLE_LABELS,
} from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Flame,
  Globe,
  Linkedin,
  Instagram,
  Loader2,
  Mail,
  NotebookText,
  Phone,
  Save,
  Snowflake,
  Sun,
  Trash2,
  UserCircle,
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
// HELPERS
// =============================================================================

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

// =============================================================================
// PAGE
// =============================================================================

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const contactId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: contactData,
    isLoading: isLoadingContact,
    error,
  } = useContact(contactId);

  const contact = contactData?.contact as Contact | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const updateMutation = useUpdateContact();
  const deleteMutation = useDeleteContact();

  // ============================================================================
  // STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Personal data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Professional
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<ContactRole | ''>('');

  // Qualification
  const [lifecycleStage, setLifecycleStage] =
    useState<LifecycleStage>('LEAD');
  const [leadScore, setLeadScore] = useState(0);
  const [leadTemperature, setLeadTemperature] = useState<
    LeadTemperature | ''
  >('');

  // Social
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setEmail(contact.email || '');
      setPhone(contact.phone || '');
      setWhatsapp(contact.whatsapp || '');
      setJobTitle(contact.jobTitle || '');
      setDepartment(contact.department || '');
      setRole(contact.role || '');
      setLifecycleStage(contact.lifecycleStage || 'LEAD');
      setLeadScore(contact.leadScore ?? 0);
      setLeadTemperature(contact.leadTemperature || '');
      // Social fields would come from extended contact data
      setLinkedinUrl('');
      setInstagramUrl('');
    }
  }, [contact]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      toast.error('Nome e obrigatorio');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        contactId,
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
          department: department.trim() || undefined,
          role: (role as ContactRole) || undefined,
          lifecycleStage,
          leadScore,
          leadTemperature:
            (leadTemperature as LeadTemperature) || undefined,
        },
      });

      toast.success('Contato atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['contacts', contactId],
      });
      router.push(`/sales/contacts/${contactId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar contato',
        err instanceof Error ? err : undefined
      );
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar contato', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(contactId);
      toast.success('Contato excluido com sucesso!');
      router.push('/sales/contacts');
    } catch (err) {
      logger.error(
        'Erro ao deletar contato',
        err instanceof Error ? err : undefined
      );
      const message =
        err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar contato', { description: message });
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(contactsConfig.permissions.delete)
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
      disabled: isSaving || !firstName.trim(),
    },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Contatos', href: '/sales/contacts' },
    {
      label: contact?.fullName || '...',
      href: `/sales/contacts/${contactId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingContact) {
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
            message="O contato solicitado nao foi encontrado."
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

  const stageColor =
    LIFECYCLE_STAGE_COLORS[lifecycleStage] || LIFECYCLE_STAGE_COLORS.LEAD;
  const stageLabel =
    LIFECYCLE_STAGE_LABELS[lifecycleStage] || lifecycleStage;

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
                Editando contato
              </p>
              <h1 className="text-xl font-bold truncate">
                {contact.fullName}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${stageColor}`}
              >
                {stageLabel}
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados Pessoais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados Pessoais"
                subtitle="Informacoes basicas de identificacao"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Nome"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Sobrenome"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="contato@email.com"
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

                  <div className="grid gap-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Profissional */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Briefcase}
                title="Profissional"
                subtitle="Informacoes profissionais do contato"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="jobTitle">Cargo</Label>
                    <Input
                      id="jobTitle"
                      value={jobTitle}
                      onChange={e => setJobTitle(e.target.value)}
                      placeholder="Ex: Diretor Comercial"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="department">Departamento</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                      placeholder="Ex: Comercial"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Papel</Label>
                    <Select
                      value={role}
                      onValueChange={v => setRole(v as ContactRole)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o papel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTACT_ROLE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Qualificacao */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Flame}
                title="Qualificacao"
                subtitle="Classificacao e pontuacao do lead"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="lifecycleStage">
                      Estagio do Ciclo de Vida
                    </Label>
                    <Select
                      value={lifecycleStage}
                      onValueChange={v =>
                        setLifecycleStage(v as LifecycleStage)
                      }
                    >
                      <SelectTrigger id="lifecycleStage">
                        <SelectValue placeholder="Selecione o estagio..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIFECYCLE_STAGE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="leadTemperature">Temperatura</Label>
                    <Select
                      value={leadTemperature}
                      onValueChange={v =>
                        setLeadTemperature(v as LeadTemperature)
                      }
                    >
                      <SelectTrigger id="leadTemperature">
                        <SelectValue placeholder="Selecione a temperatura..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_TEMPERATURE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Lead Score Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Lead Score</Label>
                    <span className="text-sm font-bold tabular-nums text-teal-600 dark:text-teal-400">
                      {leadScore}
                    </span>
                  </div>
                  <input
                    type="range"
                    value={leadScore}
                    onChange={e => setLeadScore(Number(e.target.value))}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-teal-600"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Redes Sociais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Globe}
                title="Redes Sociais"
                subtitle="Perfis nas redes sociais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="linkedinUrl">
                      <span className="flex items-center gap-1.5">
                        <Linkedin className="h-3.5 w-3.5" />
                        LinkedIn
                      </span>
                    </Label>
                    <Input
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={e => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/usuario"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="instagramUrl">
                      <span className="flex items-center gap-1.5">
                        <Instagram className="h-3.5 w-3.5" />
                        Instagram
                      </span>
                    </Label>
                    <Input
                      id="instagramUrl"
                      value={instagramUrl}
                      onChange={e => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/usuario"
                    />
                  </div>
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
        title="Excluir Contato"
        description={`Digite seu PIN de acao para excluir o contato "${contact.fullName}". Esta acao nao pode ser desfeita.`}
      />
    </PageLayout>
  );
}
