'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import {
  emailToEntryService,
  financeCategoriesService,
} from '@/services/finance';
import { emailService } from '@/services/email';
import type { UpsertEmailToEntryConfigData } from '@/services/finance/email-to-entry.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Loader2,
  Mail,
  Play,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white dark:bg-slate-800/60 border border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-500/8">
                  <Icon className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// =============================================================================
// TYPES FOR LOCAL PREFERENCES
// =============================================================================

interface ExportPrefs {
  defaultFormat: 'CSV' | 'XLSX' | 'PDF' | 'OFX';
  includeAttachments: boolean;
  detailedHeader: boolean;
}

interface TaxDefault {
  rate: number;
  autoCalc: boolean;
}

interface TaxDefaults {
  irrf: TaxDefault;
  iss: TaxDefault;
  inss: TaxDefault;
  pis: TaxDefault;
  cofins: TaxDefault;
  csll: TaxDefault;
}

interface NotificationPrefs {
  notifyUpcoming: boolean;
  upcomingDays: number;
  notifyPaymentsReceived: boolean;
  anomalyAlerts: boolean;
  dailyEmailSummary: boolean;
}

interface ApprovalPrefs {
  requireApproval: boolean;
  approvalThreshold: number;
  requireDualApproval: boolean;
  dualApprovalThreshold: number;
  notifyApproversEmail: boolean;
}

const DEFAULT_EXPORT_PREFS: ExportPrefs = {
  defaultFormat: 'XLSX',
  includeAttachments: false,
  detailedHeader: true,
};

const DEFAULT_TAX_DEFAULTS: TaxDefaults = {
  irrf: { rate: 1.5, autoCalc: true },
  iss: { rate: 5, autoCalc: true },
  inss: { rate: 11, autoCalc: true },
  pis: { rate: 0.65, autoCalc: true },
  cofins: { rate: 3, autoCalc: true },
  csll: { rate: 1, autoCalc: true },
};

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notifyUpcoming: true,
  upcomingDays: 3,
  notifyPaymentsReceived: true,
  anomalyAlerts: true,
  dailyEmailSummary: false,
};

const DEFAULT_APPROVAL_PREFS: ApprovalPrefs = {
  requireApproval: true,
  approvalThreshold: 5000,
  requireDualApproval: true,
  dualApprovalThreshold: 50000,
  notifyApproversEmail: true,
};

const TAX_LABELS: Record<keyof TaxDefaults, string> = {
  irrf: 'IRRF',
  iss: 'ISS',
  inss: 'INSS',
  pis: 'PIS',
  cofins: 'COFINS',
  csll: 'CSLL',
};

export default function FinanceSettingsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(FINANCE_PERMISSIONS.ENTRIES.ADMIN);

  // ============================================================================
  // QUERIES
  // ============================================================================

  const configQuery = useQuery({
    queryKey: ['finance', 'email-to-entry', 'config'],
    queryFn: async () => {
      const response = await emailToEntryService.getConfig();
      return response.config;
    },
    enabled: canAdmin,
  });

  const accountsQuery = useQuery({
    queryKey: ['email', 'accounts'],
    queryFn: async () => {
      const response = await emailService.listAccounts();
      return response.data;
    },
    enabled: canAdmin,
  });

  const categoriesQuery = useQuery({
    queryKey: ['finance', 'categories', 'all'],
    queryFn: async () => {
      const response = await financeCategoriesService.list({ isActive: true });
      return response.categories;
    },
    enabled: canAdmin,
  });

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [form, setForm] = useState<UpsertEmailToEntryConfigData>({
    emailAccountId: '',
    monitoredFolder: 'INBOX/Financeiro',
    isActive: true,
    autoCreate: false,
    defaultType: 'PAYABLE',
    defaultCategoryId: null,
  });

  // Local preferences state
  const [exportPrefs, setExportPrefs] =
    useState<ExportPrefs>(DEFAULT_EXPORT_PREFS);
  const [taxDefaults, setTaxDefaults] =
    useState<TaxDefaults>(DEFAULT_TAX_DEFAULTS);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(
    DEFAULT_NOTIFICATION_PREFS
  );
  const [approvalPrefs, setApprovalPrefs] = useState<ApprovalPrefs>(
    DEFAULT_APPROVAL_PREFS
  );

  // Load config into form when data arrives
  useEffect(() => {
    if (configQuery.data) {
      setForm({
        emailAccountId: configQuery.data.emailAccountId,
        monitoredFolder: configQuery.data.monitoredFolder,
        isActive: configQuery.data.isActive,
        autoCreate: configQuery.data.autoCreate,
        defaultType: configQuery.data.defaultType as 'PAYABLE' | 'RECEIVABLE',
        defaultCategoryId: configQuery.data.defaultCategoryId,
      });
    }
  }, [configQuery.data]);

  // Load localStorage preferences on mount
  useEffect(() => {
    try {
      const savedExport = localStorage.getItem('finance-export-prefs');
      if (savedExport) setExportPrefs(JSON.parse(savedExport));

      const savedTax = localStorage.getItem('finance-tax-defaults');
      if (savedTax) setTaxDefaults(JSON.parse(savedTax));

      const savedNotif = localStorage.getItem('finance-notification-prefs');
      if (savedNotif) setNotifPrefs(JSON.parse(savedNotif));

      const savedApproval = localStorage.getItem('finance-approval-prefs');
      if (savedApproval) setApprovalPrefs(JSON.parse(savedApproval));
    } catch {
      // Ignore parse errors — use defaults
    }
  }, []);

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const saveMutation = useMutation({
    mutationFn: (data: UpsertEmailToEntryConfigData) =>
      emailToEntryService.upsertConfig(data),
  });

  const processMutation = useMutation({
    mutationFn: () => emailToEntryService.processEmails(),
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const saveLocalPreferences = useCallback(() => {
    localStorage.setItem('finance-export-prefs', JSON.stringify(exportPrefs));
    localStorage.setItem('finance-tax-defaults', JSON.stringify(taxDefaults));
    localStorage.setItem(
      'finance-notification-prefs',
      JSON.stringify(notifPrefs)
    );
    localStorage.setItem(
      'finance-approval-prefs',
      JSON.stringify(approvalPrefs)
    );
  }, [exportPrefs, taxDefaults, notifPrefs, approvalPrefs]);

  const handleSave = async () => {
    // Always save local preferences
    saveLocalPreferences();

    // Save email-to-entry config only if an account is selected
    if (form.emailAccountId) {
      try {
        await saveMutation.mutateAsync(form);
        toast.success('Configuração salva com sucesso');
        await queryClient.invalidateQueries({
          queryKey: ['finance', 'email-to-entry', 'config'],
        });
      } catch {
        toast.error('Erro ao salvar configuração');
      }
    } else {
      toast.success('Preferências salvas com sucesso');
    }
  };

  const parseCurrencyInput = (raw: string): number => {
    const cleaned = raw.replace(/[^\d,]/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const accounts = Array.isArray(accountsQuery.data) ? accountsQuery.data : [];
  const categories = Array.isArray(categoriesQuery.data)
    ? categoriesQuery.data
    : [];
  const config = configQuery.data;
  const isLoading = configQuery.isLoading || accountsQuery.isLoading;

  if (!canAdmin) {
    return (
      <div className="container max-w-3xl py-6 px-4 space-y-6">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Configurações' },
          ]}
        />
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Sem permissão para acessar as configurações financeiras.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-6 px-4 space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Configurações' },
        ]}
        buttons={[
          {
            id: 'save',
            title: 'Salvar',
            icon: Save,
            variant: 'default',
            onClick: handleSave,
            disabled: saveMutation.isPending,
          },
        ]}
      />

      {/* Email-to-Entry Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-500/10">
              <Mail className="size-4.5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <CardTitle className="text-base">Email Financeiro</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Importe automaticamente lançamentos a partir de e-mails com
                boletos e notas fiscais em anexo.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          ) : (
            <>
              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Monitoramento ativo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Quando ativo, os e-mails da pasta configurada serão
                    processados.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={checked =>
                    setForm(f => ({ ...f, isActive: checked }))
                  }
                />
              </div>

              <Separator />

              {/* Email Account */}
              <div className="space-y-1.5">
                <Label className="text-sm">Conta de E-mail</Label>
                <Select
                  value={form.emailAccountId}
                  onValueChange={value =>
                    setForm(f => ({ ...f, emailAccountId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma conta de e-mail" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        <span className="flex items-center gap-2">
                          <Mail className="size-3.5 text-muted-foreground" />
                          {account.displayName
                            ? `${account.displayName} (${account.address})`
                            : account.address}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma conta de e-mail configurada. Configure uma em{' '}
                    <a
                      href="/email/settings"
                      className="text-sky-500 hover:underline"
                    >
                      E-mail &gt; Configurações
                    </a>
                    .
                  </p>
                )}
              </div>

              {/* Monitored Folder */}
              <div className="space-y-1.5">
                <Label className="text-sm">Pasta monitorada</Label>
                <Input
                  placeholder="INBOX/Financeiro"
                  value={form.monitoredFolder}
                  onChange={e =>
                    setForm(f => ({ ...f, monitoredFolder: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Nome da pasta IMAP a ser monitorada. Apenas e-mails não lidos
                  com anexos PDF/imagem serão processados.
                </p>
              </div>

              <Separator />

              {/* Auto-create toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    Criar automaticamente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {form.autoCreate
                      ? 'Lançamentos serão criados automaticamente após extração.'
                      : 'Lançamentos serão criados como rascunho para revisão manual.'}
                  </p>
                </div>
                <Switch
                  checked={form.autoCreate}
                  onCheckedChange={checked =>
                    setForm(f => ({ ...f, autoCreate: checked }))
                  }
                />
              </div>

              {/* Default Type */}
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo padrão</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setForm(f => ({ ...f, defaultType: 'PAYABLE' }))
                    }
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      form.defaultType === 'PAYABLE'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    A Pagar
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setForm(f => ({ ...f, defaultType: 'RECEIVABLE' }))
                    }
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      form.defaultType === 'RECEIVABLE'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    A Receber
                  </button>
                </div>
              </div>

              {/* Default Category */}
              <div className="space-y-1.5">
                <Label className="text-sm">Categoria padrão</Label>
                <Select
                  value={form.defaultCategoryId ?? ''}
                  onValueChange={value =>
                    setForm(f => ({
                      ...f,
                      defaultCategoryId: value || null,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Categoria aplicada aos lançamentos criados automaticamente.
                </p>
              </div>

              <Separator />

              {/* Stats & Process */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {config && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 px-1.5 gap-1"
                      >
                        <CheckCircle2 className="size-2.5 text-emerald-500" />
                        {config.processedCount} processado(s)
                      </Badge>
                      {config.lastProcessedAt && (
                        <span>
                          Último:{' '}
                          {format(
                            new Date(config.lastProcessedAt),
                            "dd/MM/yyyy 'às' HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9 px-2.5"
                  onClick={async () => {
                    try {
                      const result = await processMutation.mutateAsync();
                      if (result.created > 0) {
                        toast.success(
                          `${result.created} lançamento(s) criado(s) de ${result.processed} e-mail(s) processado(s)`
                        );
                      } else if (result.processed === 0) {
                        toast.info('Nenhum e-mail pendente encontrado');
                      } else {
                        toast.info(
                          `${result.processed} e-mail(s) processado(s), nenhum lançamento criado`
                        );
                      }
                      await queryClient.invalidateQueries({
                        queryKey: ['finance', 'email-to-entry', 'config'],
                      });
                    } catch {
                      toast.error('Erro ao processar e-mails');
                    }
                  }}
                  disabled={
                    processMutation.isPending ||
                    !form.emailAccountId ||
                    !form.isActive
                  }
                >
                  {processMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  Processar Agora
                </Button>
              </div>

              {/* Process Results */}
              {processMutation.data && processMutation.data.processed > 0 && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm font-medium">
                    Resultado do processamento
                  </p>
                  <div className="flex gap-3 text-xs">
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300"
                    >
                      {processMutation.data.created} criado(s)
                    </Badge>
                    <Badge
                      variant="outline"
                      className="bg-sky-50 text-sky-700 dark:bg-sky-500/8 dark:text-sky-300"
                    >
                      {processMutation.data.skipped} ignorado(s)
                    </Badge>
                    {processMutation.data.failed > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300"
                      >
                        {processMutation.data.failed} erro(s)
                      </Badge>
                    )}
                  </div>
                  {processMutation.data.entries.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {processMutation.data.entries.slice(0, 10).map((e, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] h-4 px-1 ${
                              e.status === 'created' || e.status === 'draft'
                                ? 'text-emerald-600'
                                : e.status === 'failed'
                                  ? 'text-rose-600'
                                  : 'text-muted-foreground'
                            }`}
                          >
                            {e.status === 'created'
                              ? 'Criado'
                              : e.status === 'draft'
                                ? 'Rascunho'
                                : e.status === 'failed'
                                  ? 'Erro'
                                  : 'Ignorado'}
                          </Badge>
                          <span className="truncate flex-1">{e.subject}</span>
                          {e.error && (
                            <span className="text-rose-500 text-[10px]">
                              {e.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* Preferências de Exportação */}
      {/* ================================================================== */}
      <CollapsibleSection
        icon={Download}
        title="Preferências de Exportação"
        subtitle="Configure formatos e opções padrão para exportação de dados"
        defaultOpen={false}
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm">Formato Padrão de Exportação</Label>
            <Select
              value={exportPrefs.defaultFormat}
              onValueChange={value =>
                setExportPrefs(p => ({
                  ...p,
                  defaultFormat: value as ExportPrefs['defaultFormat'],
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="XLSX">XLSX (Excel)</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="OFX">
                  OFX (Open Financial Exchange)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Incluir anexos na exportação
              </Label>
              <p className="text-xs text-muted-foreground">
                Arquivos anexados aos lançamentos serão incluídos no pacote de
                exportação.
              </p>
            </div>
            <Switch
              checked={exportPrefs.includeAttachments}
              onCheckedChange={checked =>
                setExportPrefs(p => ({ ...p, includeAttachments: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Exportar com cabeçalho detalhado
              </Label>
              <p className="text-xs text-muted-foreground">
                Inclui informações da empresa, período e filtros aplicados no
                cabeçalho do relatório.
              </p>
            </div>
            <Switch
              checked={exportPrefs.detailedHeader}
              onCheckedChange={checked =>
                setExportPrefs(p => ({ ...p, detailedHeader: checked }))
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* Retenções de Impostos */}
      {/* ================================================================== */}
      <CollapsibleSection
        icon={Calculator}
        title="Retenções de Impostos"
        subtitle="Configure as alíquotas padrão de retenção para lançamentos"
        defaultOpen={false}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(Object.keys(TAX_LABELS) as Array<keyof TaxDefaults>).map(key => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {TAX_LABELS[key]}
                    </Label>
                    <Switch
                      checked={taxDefaults[key].autoCalc}
                      onCheckedChange={checked =>
                        setTaxDefaults(prev => ({
                          ...prev,
                          [key]: { ...prev[key], autoCalc: checked },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxDefaults[key].rate}
                      onChange={e =>
                        setTaxDefaults(prev => ({
                          ...prev,
                          [key]: {
                            ...prev[key],
                            rate: parseFloat(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-24 h-8 text-sm"
                      disabled={!taxDefaults[key].autoCalc}
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Ative o cálculo automático para aplicar a retenção ao criar novos
            lançamentos. As alíquotas podem ser ajustadas individualmente em
            cada lançamento.
          </p>
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* Notificações Financeiras */}
      {/* ================================================================== */}
      <CollapsibleSection
        icon={Bell}
        title="Notificações Financeiras"
        subtitle="Configure alertas e notificações do módulo financeiro"
        defaultOpen={false}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Notificar vencimentos próximos
              </Label>
              <p className="text-xs text-muted-foreground">
                Receba alertas sobre lançamentos com vencimento se aproximando.
              </p>
            </div>
            <Switch
              checked={notifPrefs.notifyUpcoming}
              onCheckedChange={checked =>
                setNotifPrefs(p => ({ ...p, notifyUpcoming: checked }))
              }
            />
          </div>

          {notifPrefs.notifyUpcoming && (
            <div className="ml-4 pl-4 border-l-2 border-violet-200 dark:border-violet-500/20 space-y-1.5">
              <Label className="text-sm">Dias de antecedência</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={notifPrefs.upcomingDays}
                  onChange={e =>
                    setNotifPrefs(p => ({
                      ...p,
                      upcomingDays: parseInt(e.target.value) || 3,
                    }))
                  }
                  className="w-20 h-8 text-sm"
                />
                <span className="text-xs text-muted-foreground">
                  dia(s) antes do vencimento
                </span>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Notificar pagamentos recebidos
              </Label>
              <p className="text-xs text-muted-foreground">
                Receba uma notificação quando um pagamento for registrado como
                recebido.
              </p>
            </div>
            <Switch
              checked={notifPrefs.notifyPaymentsReceived}
              onCheckedChange={checked =>
                setNotifPrefs(p => ({
                  ...p,
                  notifyPaymentsReceived: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Alertas de anomalias
              </Label>
              <p className="text-xs text-muted-foreground">
                Detecte automaticamente lançamentos com valores fora do padrão
                ou duplicidades.
              </p>
            </div>
            <Switch
              checked={notifPrefs.anomalyAlerts}
              onCheckedChange={checked =>
                setNotifPrefs(p => ({ ...p, anomalyAlerts: checked }))
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Resumo diário por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Envie um resumo diário com vencimentos, recebimentos e
                pendências por e-mail.
              </p>
            </div>
            <Switch
              checked={notifPrefs.dailyEmailSummary}
              onCheckedChange={checked =>
                setNotifPrefs(p => ({ ...p, dailyEmailSummary: checked }))
              }
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* ================================================================== */}
      {/* Fluxo de Aprovação */}
      {/* ================================================================== */}
      <CollapsibleSection
        icon={ShieldCheck}
        title="Fluxo de Aprovação"
        subtitle="Configurações globais para o fluxo de aprovação de lançamentos"
        defaultOpen={false}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Exigir aprovação para lançamentos acima de:
              </Label>
              <p className="text-xs text-muted-foreground">
                Lançamentos com valor superior precisarão de aprovação antes de
                serem confirmados.
              </p>
            </div>
            <Switch
              checked={approvalPrefs.requireApproval}
              onCheckedChange={checked =>
                setApprovalPrefs(p => ({ ...p, requireApproval: checked }))
              }
            />
          </div>

          {approvalPrefs.requireApproval && (
            <div className="ml-4 pl-4 border-l-2 border-violet-200 dark:border-violet-500/20 space-y-1.5">
              <Label className="text-sm">Valor mínimo para aprovação</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={approvalPrefs.approvalThreshold.toLocaleString(
                    'pt-BR',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                  onChange={e =>
                    setApprovalPrefs(p => ({
                      ...p,
                      approvalThreshold: parseCurrencyInput(e.target.value),
                    }))
                  }
                  className="w-36 h-8 text-sm"
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Aprovação dupla para valores acima de:
              </Label>
              <p className="text-xs text-muted-foreground">
                Exige dois aprovadores distintos para lançamentos de alto valor.
              </p>
            </div>
            <Switch
              checked={approvalPrefs.requireDualApproval}
              onCheckedChange={checked =>
                setApprovalPrefs(p => ({
                  ...p,
                  requireDualApproval: checked,
                }))
              }
            />
          </div>

          {approvalPrefs.requireDualApproval && (
            <div className="ml-4 pl-4 border-l-2 border-violet-200 dark:border-violet-500/20 space-y-1.5">
              <Label className="text-sm">
                Valor mínimo para aprovação dupla
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input
                  type="text"
                  value={approvalPrefs.dualApprovalThreshold.toLocaleString(
                    'pt-BR',
                    { minimumFractionDigits: 2 }
                  )}
                  onChange={e =>
                    setApprovalPrefs(p => ({
                      ...p,
                      dualApprovalThreshold: parseCurrencyInput(e.target.value),
                    }))
                  }
                  className="w-36 h-8 text-sm"
                />
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Notificar aprovadores por e-mail
              </Label>
              <p className="text-xs text-muted-foreground">
                Envie um e-mail aos aprovadores quando houver lançamentos
                pendentes de aprovação.
              </p>
            </div>
            <Switch
              checked={approvalPrefs.notifyApproversEmail}
              onCheckedChange={checked =>
                setApprovalPrefs(p => ({
                  ...p,
                  notifyApproversEmail: checked,
                }))
              }
            />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-sky-50 dark:bg-sky-500/8 p-3 mt-2">
            <Info className="size-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <p className="text-xs text-sky-700 dark:text-sky-300">
              Regras detalhadas de aprovação podem ser configuradas em{' '}
              <strong>Regras de Aprovação</strong>.
            </p>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}
