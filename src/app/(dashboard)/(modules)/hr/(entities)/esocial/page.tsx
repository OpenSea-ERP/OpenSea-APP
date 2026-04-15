'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FilePen,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Send,
  Settings,
  Eye,
  CheckCheck,
  Clock,
  AlertTriangle,
  Plus,
  Loader2,
  ListChecks,
  UserSearch,
} from 'lucide-react';

import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { usePermissions } from '@/hooks/use-permissions';
import { esocialService } from '@/services/hr/esocial.service';
import { toast } from 'sonner';
import type { EsocialEventStatus, EsocialEventListItem } from '@/types/esocial';

// ============================
// KPI Card Component
// ============================

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  loading?: boolean;
}

function KpiCard({ title, value, icon: Icon, color, loading }: KpiCardProps) {
  const colorMap: Record<string, string> = {
    violet:
      'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
    slate: 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300',
    emerald:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300',
  };

  const iconColorMap: Record<string, string> = {
    violet: 'text-violet-600 dark:text-violet-400',
    slate: 'text-slate-600 dark:text-slate-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    rose: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
    sky: 'text-sky-600 dark:text-sky-400',
  };

  return (
    <Card className="bg-white dark:bg-slate-800/60 border border-border p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color] || colorMap.violet}`}
        >
          <Icon
            className={`h-5 w-5 ${iconColorMap[color] || iconColorMap.violet}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-6 w-16 mt-0.5" />
          ) : (
            <p className="text-lg font-bold">{value}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

// ============================
// Status Badge
// ============================

function StatusBadge({ status }: { status: EsocialEventStatus }) {
  const config: Record<string, { label: string; variant: string }> = {
    DRAFT: { label: 'Rascunho', variant: 'secondary' },
    REVIEWED: { label: 'Revisado', variant: 'outline' },
    APPROVED: { label: 'Aprovado', variant: 'default' },
    TRANSMITTING: { label: 'Transmitindo', variant: 'outline' },
    ACCEPTED: { label: 'Aceito', variant: 'default' },
    REJECTED: { label: 'Rejeitado', variant: 'destructive' },
    ERROR: { label: 'Erro', variant: 'destructive' },
  };

  const c = config[status] || config.DRAFT;

  return (
    <Badge
      variant={c.variant as 'default' | 'secondary' | 'outline' | 'destructive'}
    >
      {c.label}
    </Badge>
  );
}

// ============================
// Event Row Component
// ============================

interface EventRowProps {
  event: EsocialEventListItem;
  onView: (id: string) => void;
  onApprove?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

function EventRow({
  event,
  onView,
  onApprove,
  selected,
  onSelect,
}: EventRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(event.id)}
          className="h-4 w-4 rounded border-border"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono shrink-0">
            {event.eventType}
          </Badge>
          <span className="text-sm font-medium truncate">
            {event.description}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {event.referenceName && <span>{event.referenceName}</span>}
          <span>{new Date(event.createdAt).toLocaleDateString('pt-BR')}</span>
          {event.deadline && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              {new Date(event.deadline).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={event.status} />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onView(event.id)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        {onApprove && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400"
            onClick={() => onApprove(event.id)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================
// Generate Event Constants
// ============================

const EVENT_TYPES = [
  { value: 'S-1000', label: 'S-1000 - Informações do Empregador' },
  { value: 'S-1005', label: 'S-1005 - Tabela de Estabelecimentos' },
  { value: 'S-1010', label: 'S-1010 - Tabela de Rubricas' },
  { value: 'S-1020', label: 'S-1020 - Tabela de Lotações Tributárias' },
  { value: 'S-1070', label: 'S-1070 - Tabela de Processos' },
  { value: 'S-1200', label: 'S-1200 - Remuneração do Trabalhador' },
  { value: 'S-1210', label: 'S-1210 - Pagamentos de Rendimentos' },
  { value: 'S-1298', label: 'S-1298 - Reabertura de Eventos Periódicos' },
  { value: 'S-1299', label: 'S-1299 - Fechamento de Eventos Periódicos' },
  { value: 'S-2190', label: 'S-2190 - Registro Preliminar de Trabalhador' },
  { value: 'S-2200', label: 'S-2200 - Cadastramento Inicial / Admissão' },
  { value: 'S-2205', label: 'S-2205 - Alteração de Dados Cadastrais' },
  { value: 'S-2206', label: 'S-2206 - Alteração de Contrato de Trabalho' },
  { value: 'S-2210', label: 'S-2210 - Comunicação de Acidente de Trabalho' },
  { value: 'S-2220', label: 'S-2220 - Monitoramento da Saúde do Trabalhador' },
  { value: 'S-2230', label: 'S-2230 - Afastamento Temporário' },
  { value: 'S-2240', label: 'S-2240 - Condições Ambientais do Trabalho' },
  { value: 'S-2298', label: 'S-2298 - Reintegração / Reversão' },
  { value: 'S-2299', label: 'S-2299 - Desligamento' },
  { value: 'S-2300', label: 'S-2300 - Trabalhador Sem Vínculo - Início' },
  { value: 'S-2399', label: 'S-2399 - Trabalhador Sem Vínculo - Término' },
  { value: 'S-3000', label: 'S-3000 - Exclusão de Eventos' },
] as const;

const REFERENCE_TYPES = [
  { value: 'EMPLOYEE', label: 'Funcionário' },
  { value: 'PAYROLL', label: 'Folha de Pagamento' },
  { value: 'ABSENCE', label: 'Afastamento' },
  { value: 'TERMINATION', label: 'Desligamento' },
  { value: 'MEDICAL_EXAM', label: 'Exame Médico' },
  { value: 'TENANT_CONFIG', label: 'Configuração da Empresa' },
  { value: 'RUBRICA', label: 'Rubrica' },
] as const;

// ============================
// Generate Event Modal
// ============================

interface GenerateEventModalProps {
  open: boolean;
  onClose: () => void;
}

function GenerateEventModal({ open, onClose }: GenerateEventModalProps) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [eventType, setEventType] = useState('');
  const [referenceType, setReferenceType] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setEventType('');
    setReferenceType('');
    setReferenceId('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const generateMutation = useMutation({
    mutationFn: () =>
      esocialService.generateEvent({
        eventType,
        referenceType,
        referenceId,
      }),
    onSuccess: () => {
      toast.success('Evento gerado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao gerar evento');
    },
  });

  const referenceLabel = useMemo(() => {
    const ref = REFERENCE_TYPES.find(r => r.value === referenceType);
    return ref?.label || 'Referência';
  }, [referenceType]);

  const steps: WizardStep[] = [
    {
      title: 'Tipo do Evento',
      description: 'Selecione o tipo de evento e a categoria de referência',
      icon: (
        <ListChecks className="h-16 w-16 text-violet-400 dark:text-violet-300" />
      ),
      content: (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="eventType">Tipo do Evento</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger id="eventType">
                <SelectValue placeholder="Selecione o tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map(et => (
                  <SelectItem key={et.value} value={et.value}>
                    {et.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceType">Tipo de Referência</Label>
            <Select value={referenceType} onValueChange={setReferenceType}>
              <SelectTrigger id="referenceType">
                <SelectValue placeholder="Selecione o tipo de referência" />
              </SelectTrigger>
              <SelectContent>
                {REFERENCE_TYPES.map(rt => (
                  <SelectItem key={rt.value} value={rt.value}>
                    {rt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      isValid: eventType !== '' && referenceType !== '',
    },
    {
      title: 'Selecionar Referência',
      description: `Informe o identificador do(a) ${referenceLabel.toLowerCase()}`,
      icon: (
        <UserSearch className="h-16 w-16 text-violet-400 dark:text-violet-300" />
      ),
      content: (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="referenceId">ID do(a) {referenceLabel}</Label>
            <Input
              id="referenceId"
              value={referenceId}
              onChange={e => setReferenceId(e.target.value)}
              placeholder={`Informe o ID do(a) ${referenceLabel.toLowerCase()}`}
            />
            <p className="text-xs text-muted-foreground">
              Insira o identificador único da entidade de referência para gerar
              o evento eSocial.
            </p>
          </div>

          {/* Summary */}
          <Card className="bg-slate-50 dark:bg-slate-800/40 border border-border p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Resumo
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evento:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {eventType}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Referência:</span>
                <span className="font-medium">{referenceLabel}</span>
              </div>
              {referenceId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono text-xs">{referenceId}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      ),
      isValid: referenceId.trim() !== '',
      footer: (
        <div className="flex items-center gap-2 w-full justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(1)}
          >
            &larr; Voltar
          </Button>
          <Button
            type="button"
            disabled={referenceId.trim() === '' || generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                Gerando...
              </>
            ) : (
              'Gerar Evento'
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
      heightClass="h-[460px]"
    />
  );
}

// ============================
// Main Dashboard Page
// ============================

export default function EsocialDashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('pending');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  // Fetch dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ['esocial', 'dashboard'],
    queryFn: () => esocialService.getDashboard(),
  });

  // Fetch events for current tab
  const statusMap: Record<string, string | undefined> = {
    pending: undefined, // DRAFT + REVIEWED
    approved: 'APPROVED',
    transmitted: 'TRANSMITTING',
    rejected: 'REJECTED',
  };

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['esocial', 'events', activeTab],
    queryFn: () =>
      esocialService.listEvents({
        status: statusMap[activeTab],
        perPage: 50,
      }),
  });

  // Filter events for pending tab (DRAFT + REVIEWED)
  const events = useMemo(() => {
    if (!eventsData?.events) return [];
    if (activeTab === 'pending') {
      return eventsData.events.filter(
        e => e.status === 'DRAFT' || e.status === 'REVIEWED'
      );
    }
    return eventsData.events;
  }, [eventsData, activeTab]);

  // Mutations
  const transmitMutation = useMutation({
    mutationFn: () => esocialService.transmitBatch(),
    onSuccess: data => {
      const total = data.reduce((acc, b) => acc + b.eventCount, 0);
      toast.success(`${total} evento(s) enviado(s) para transmissão`);
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => esocialService.bulkApprove(ids),
    onSuccess: data => {
      toast.success(
        `${data.approvedCount} evento(s) aprovado(s)${data.skippedCount > 0 ? `, ${data.skippedCount} ignorado(s)` : ''}`
      );
      setSelectedEvents(new Set());
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleView = useCallback(
    (id: string) => {
      router.push(`/hr/esocial/${id}`);
    },
    [router]
  );

  const handleApprove = useCallback(
    (id: string) => {
      bulkApproveMutation.mutate([id]);
    },
    [bulkApproveMutation]
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBulkApprove = useCallback(() => {
    if (selectedEvents.size === 0) return;
    bulkApproveMutation.mutate(Array.from(selectedEvents));
  }, [selectedEvents, bulkApproveMutation]);

  // KPIs
  const certDaysLeft = dashboard?.certificateExpiry?.daysLeft ?? 0;
  const certColor = !dashboard?.certificateExpiry?.hasCertificate
    ? 'rose'
    : certDaysLeft < 30
      ? 'amber'
      : 'emerald';

  const certValue = !dashboard?.certificateExpiry?.hasCertificate
    ? 'Ausente'
    : `${certDaysLeft} dias`;

  return (
    <div className="space-y-6" data-testid="esocial-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'RH', href: '/hr' },
          { label: 'eSocial', href: '/hr/esocial' },
        ]}
        hasPermission={hasPermission}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => router.push('/hr/settings?tab=esocial')}
            >
              <Settings className="h-4 w-4 mr-1.5" />
              Configurações
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => router.push('/hr/esocial/batches')}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Lotes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setGenerateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Gerar Evento
            </Button>
            <Button
              size="sm"
              className="h-9 px-2.5"
              onClick={() => transmitMutation.mutate()}
              disabled={
                transmitMutation.isPending ||
                (dashboard?.byStatus?.APPROVED ?? 0) === 0
              }
            >
              <Send className="h-4 w-4 mr-1.5" />
              {transmitMutation.isPending
                ? 'Transmitindo...'
                : 'Transmitir Pendentes'}
            </Button>
          </div>
        }
      />

      <Header
        title="eSocial"
        description="Eventos, transmissão e acompanhamento do eSocial"
      />

      {/* Certificate expiry alert */}
      {dashboard?.certificateExpiry &&
        !dashboard.certificateExpiry.hasCertificate && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/8 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Certificado digital não configurado
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Configure um certificado ICP-Brasil para transmitir eventos ao
                eSocial.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 text-amber-700 dark:border-amber-500/30 dark:text-amber-300"
              onClick={() => router.push('/hr/settings?tab=esocial')}
            >
              Configurar
            </Button>
          </div>
        )}

      {dashboard?.certificateExpiry &&
        dashboard.certificateExpiry.hasCertificate &&
        dashboard.certificateExpiry.isExpired && (
          <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/8 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                Certificado digital expirado
              </p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                Faça o upload de um novo certificado para continuar
                transmitindo.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-rose-300 text-rose-700 dark:border-rose-500/30 dark:text-rose-300"
              onClick={() => router.push('/hr/settings?tab=esocial')}
            >
              Renovar
            </Button>
          </div>
        )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Eventos"
          value={dashboard?.totalEvents ?? 0}
          icon={FileText}
          color="violet"
          loading={dashboardLoading}
        />
        <KpiCard
          title="Rascunhos"
          value={dashboard?.byStatus?.DRAFT ?? 0}
          icon={FilePen}
          color="slate"
          loading={dashboardLoading}
        />
        <KpiCard
          title="Aprovados"
          value={dashboard?.byStatus?.APPROVED ?? 0}
          icon={CheckCircle}
          color="emerald"
          loading={dashboardLoading}
        />
        <KpiCard
          title="Rejeitados"
          value={dashboard?.byStatus?.REJECTED ?? 0}
          icon={XCircle}
          color="rose"
          loading={dashboardLoading}
        />
        <KpiCard
          title="Certificado"
          value={certValue}
          icon={ShieldCheck}
          color={certColor}
          loading={dashboardLoading}
        />
      </div>

      {/* Events Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
          <TabsTrigger value="pending" className="text-sm">
            Pendentes
            {dashboard && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {(dashboard.byStatus?.DRAFT ?? 0) +
                  (dashboard.byStatus?.REVIEWED ?? 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="text-sm">
            Aprovados
            {dashboard && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {dashboard.byStatus?.APPROVED ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="transmitted" className="text-sm">
            Transmitidos
            {dashboard && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {(dashboard.byStatus?.TRANSMITTING ?? 0) +
                  (dashboard.byStatus?.ACCEPTED ?? 0)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="text-sm">
            Rejeitados
            {dashboard && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {dashboard.byStatus?.REJECTED ?? 0}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending">
          <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
            {selectedEvents.size > 0 && (
              <div className="flex items-center justify-between bg-violet-50 dark:bg-violet-500/8 px-4 py-2 border-b border-border">
                <span className="text-sm text-violet-700 dark:text-violet-300">
                  {selectedEvents.size} evento(s) selecionado(s)
                </span>
                <Button
                  size="sm"
                  className="h-8"
                  onClick={handleBulkApprove}
                  disabled={bulkApproveMutation.isPending}
                >
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Aprovar Selecionados
                </Button>
              </div>
            )}
            {eventsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum evento pendente</p>
              </div>
            ) : (
              events.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  onView={handleView}
                  onApprove={handleApprove}
                  selected={selectedEvents.has(event.id)}
                  onSelect={toggleSelect}
                />
              ))
            )}
          </Card>
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
            {eventsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Send className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">
                  Nenhum evento aprovado aguardando transmissão
                </p>
              </div>
            ) : (
              events.map(event => (
                <EventRow key={event.id} event={event} onView={handleView} />
              ))
            )}
          </Card>
        </TabsContent>

        {/* Transmitted Tab */}
        <TabsContent value="transmitted">
          <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
            {eventsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum evento transmitido</p>
              </div>
            ) : (
              events.map(event => (
                <EventRow key={event.id} event={event} onView={handleView} />
              ))
            )}
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
            {eventsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <XCircle className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">Nenhum evento rejeitado</p>
              </div>
            ) : (
              events.map(event => (
                <EventRow key={event.id} event={event} onView={handleView} />
              ))
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Event Modal */}
      <GenerateEventModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
      />
    </div>
  );
}
