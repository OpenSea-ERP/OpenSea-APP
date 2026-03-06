'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { emailService } from '@/services/email';
import { teamsService } from '@/services/core/teams.service';
import type { CreateEmailAccountRequest, LinkTeamEmailData } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Lightbulb,
  Loader2,
  Mail,
  MailCheck,
  Send,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Known Provider Auto-Detection ────────────────────────────────────────────

interface ProviderSettings {
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
}

const KNOWN_PROVIDERS: Record<string, ProviderSettings> = {
  'gmail.com': {
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
  },
  'outlook.com': {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: true },
  },
  'hotmail.com': {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: true },
  },
  'live.com': {
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: true },
  },
  'yahoo.com': {
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  },
  'yahoo.com.br': {
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
  },
  'icloud.com': {
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: true },
  },
  'uol.com.br': {
    imap: { host: 'imap.uol.com.br', port: 993, secure: true },
    smtp: { host: 'smtps.uol.com.br', port: 587, secure: true },
  },
  'bol.com.br': {
    imap: { host: 'imap.bol.com.br', port: 993, secure: true },
    smtp: { host: 'smtps.bol.com.br', port: 587, secure: true },
  },
  'terra.com.br': {
    imap: { host: 'imap.terra.com.br', port: 993, secure: true },
    smtp: { host: 'smtp.terra.com.br', port: 587, secure: true },
  },
};

function detectProvider(email: string): ProviderSettings | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  return KNOWN_PROVIDERS[domain] ?? null;
}

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface LinkEmailDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PermissionKey = keyof Omit<LinkTeamEmailData, 'accountId'>;
type TestStatus = 'idle' | 'creating' | 'testing' | 'syncing' | 'success' | 'error';

const DEFAULT_PERMISSIONS: Omit<LinkTeamEmailData, 'accountId'> = {
  ownerCanRead: true,
  ownerCanSend: true,
  ownerCanManage: true,
  adminCanRead: true,
  adminCanSend: true,
  adminCanManage: false,
  memberCanRead: true,
  memberCanSend: false,
  memberCanManage: false,
};

const INITIAL_FORM: CreateEmailAccountRequest = {
  address: '',
  displayName: '',
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  smtpHost: '',
  smtpPort: 465,
  smtpSecure: true,
  username: '',
  secret: '',
};

const ROLES = [
  { key: 'owner', label: 'Proprietário' },
  { key: 'admin', label: 'Administrador' },
  { key: 'member', label: 'Membro' },
] as const;

const ACTIONS = [
  { key: 'Read', label: 'Leitura' },
  { key: 'Send', label: 'Envio' },
  { key: 'Manage', label: 'Gerenciamento' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LinkEmailDialog({
  teamId,
  open,
  onOpenChange,
}: LinkEmailDialogProps) {
  const queryClient = useQueryClient();

  // Step navigation
  const [step, setStep] = useState(1);

  // Form data (steps 1-3) — email is both address and username
  const [form, setForm] = useState<CreateEmailAccountRequest>(INITIAL_FORM);

  // Permissions (step 4)
  const [permissions, setPermissions] =
    useState<Omit<LinkTeamEmailData, 'accountId'>>(DEFAULT_PERMISSIONS);

  // Step 5 state
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const linkedRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────

  const updateField = <K extends keyof CreateEmailAccountRequest>(
    key: K,
    value: CreateEmailAccountRequest[K]
  ) => setForm(prev => ({ ...prev, [key]: value }));

  const handleEmailChange = useCallback((value: string) => {
    setForm(prev => ({ ...prev, address: value }));
    const provider = detectProvider(value);
    if (provider) {
      setForm(prev => ({
        ...prev,
        address: value,
        imapHost: provider.imap.host,
        imapPort: provider.imap.port,
        imapSecure: provider.imap.secure,
        smtpHost: provider.smtp.host,
        smtpPort: provider.smtp.port,
        smtpSecure: provider.smtp.secure,
      }));
    } else {
      const domain = value.split('@')[1]?.toLowerCase();
      if (domain && domain.includes('.')) {
        setForm(prev => ({
          ...prev,
          address: value,
          imapHost: `mail.${domain}`,
          imapPort: 993,
          imapSecure: true,
          smtpHost: `mail.${domain}`,
          smtpPort: 465,
          smtpSecure: true,
        }));
      }
    }
  }, []);

  const togglePermission = (key: PermissionKey) =>
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  const handleClose = useCallback(() => {
    setStep(1);
    setForm(INITIAL_FORM);
    setPermissions(DEFAULT_PERMISSIONS);
    setTestStatus('idle');
    setCreatedAccountId(null);
    setTestError(null);
    linkedRef.current = false;
    onOpenChange(false);
  }, [onOpenChange]);

  // ── Connection test flow ─────────────────────────────────────────────

  const runConnectionTest = useCallback(async () => {
    setTestError(null);

    try {
      let accountId = createdAccountId;
      const formData: CreateEmailAccountRequest = {
        ...form,
        username: form.address,
      };

      // Step 1: Create or update account
      setTestStatus('creating');
      if (!accountId) {
        const { account } = await emailService.createAccount(formData);
        accountId = account.id;
        setCreatedAccountId(accountId);
      } else {
        await emailService.updateAccount(accountId, formData);
      }

      // Link to team
      if (!linkedRef.current) {
        await teamsService.linkEmailToTeam(teamId, {
          accountId,
          ...permissions,
        });
        linkedRef.current = true;
      }

      // Step 2: Test connection
      setTestStatus('testing');
      await emailService.testConnection(accountId);

      // Step 3: Trigger sync
      setTestStatus('syncing');
      await emailService.triggerSync(accountId);

      setTestStatus('success');
    } catch (err) {
      setTestStatus('error');
      setTestError(
        err instanceof Error ? err.message : 'Erro ao conectar ao servidor'
      );
    }
  }, [createdAccountId, form, permissions, teamId]);

  // Auto-trigger when entering step 5
  useEffect(() => {
    if (step === 5 && testStatus === 'idle') {
      runConnectionTest();
    }
  }, [step, testStatus, runConnectionTest]);

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    queryClient.invalidateQueries({ queryKey: ['teams', teamId, 'emails'] });
    toast.success('Conta de e-mail criada e vinculada com sucesso');
    handleClose();
  }, [queryClient, teamId, handleClose]);

  // ── Step definitions ─────────────────────────────────────────────────

  const steps: WizardStep[] = [
    // Step 1 — Account data
    {
      title: 'Dados da Conta',
      description: 'Informe o endereço de e-mail e senha de aplicativo',
      icon: <Mail className="h-16 w-16 text-primary/60" />,
      isValid: form.address.includes('@') && form.secret.length > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wz-address">Endereço de e-mail *</Label>
            <Input
              id="wz-address"
              type="email"
              placeholder="equipe@empresa.com"
              value={form.address}
              onChange={e => handleEmailChange(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wz-displayName">Nome de exibição</Label>
            <Input
              id="wz-displayName"
              placeholder="Equipe Comercial"
              value={form.displayName ?? ''}
              onChange={e => updateField('displayName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wz-secret">
              Senha / Senha de aplicativo *
            </Label>
            <Input
              id="wz-secret"
              type="password"
              placeholder="••••••••"
              value={form.secret}
              onChange={e => updateField('secret', e.target.value)}
            />
            <div className="mt-1.5 flex items-start gap-2.5 rounded-lg bg-gray-50 dark:bg-gray-950/30 border border-gray-200/60 dark:border-gray-800/40 px-3 py-2.5">
              <Lightbulb className="size-4 shrink-0 text-gray-500 mt-0.5" />
              <p className="text-xs text-gray-800 dark:text-gray-200/90">
                Para{' '}
                <span className="font-semibold" style={{ color: '#EA4335' }}>
                  Gmail
                </span>{' '}
                e{' '}
                <span className="font-semibold" style={{ color: '#0078D4' }}>
                  Outlook
                </span>
                , utilize uma{' '}
                <span className="font-semibold dark:text-white">
                  senha de aplicativo
                </span>{' '}
                gerada nas configurações de segurança da sua conta.
              </p>
            </div>
          </div>
        </div>
      ),
    },

    // Step 2 — IMAP
    {
      title: 'Servidor de Recebimento (IMAP)',
      description: 'Configuração do servidor para receber e-mails',
      icon: <MailCheck className="h-16 w-16 text-primary/60" />,
      isValid: form.imapHost.trim() !== '' && form.imapPort > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wz-imapHost">Servidor IMAP *</Label>
            <Input
              id="wz-imapHost"
              placeholder="imap.exemplo.com"
              value={form.imapHost}
              onChange={e => updateField('imapHost', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wz-imapPort">Porta</Label>
              <Input
                id="wz-imapPort"
                type="number"
                value={form.imapPort}
                onChange={e => updateField('imapPort', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="wz-imapSecure"
                checked={form.imapSecure ?? true}
                onCheckedChange={v => updateField('imapSecure', v)}
              />
              <Label htmlFor="wz-imapSecure" className="text-sm">
                Conexão segura (SSL/TLS)
              </Label>
            </div>
          </div>
          {detectProvider(form.address) && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              Configurações detectadas automaticamente com base no provedor de
              e-mail.
            </p>
          )}
        </div>
      ),
    },

    // Step 3 — SMTP
    {
      title: 'Servidor de Saída (SMTP)',
      description: 'Configuração do servidor para enviar e-mails',
      icon: <Send className="h-16 w-16 text-primary/60" />,
      isValid: form.smtpHost.trim() !== '' && form.smtpPort > 0,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wz-smtpHost">Servidor SMTP *</Label>
            <Input
              id="wz-smtpHost"
              placeholder="smtp.exemplo.com"
              value={form.smtpHost}
              onChange={e => updateField('smtpHost', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wz-smtpPort">Porta</Label>
              <Input
                id="wz-smtpPort"
                type="number"
                value={form.smtpPort}
                onChange={e => updateField('smtpPort', Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                id="wz-smtpSecure"
                checked={form.smtpSecure ?? true}
                onCheckedChange={v => updateField('smtpSecure', v)}
              />
              <Label htmlFor="wz-smtpSecure" className="text-sm">
                Conexão segura (SSL/TLS)
              </Label>
            </div>
          </div>
        </div>
      ),
    },

    // Step 4 — Permissions
    {
      title: 'Permissões',
      description: 'Defina as permissões de acesso por papel',
      icon: <ShieldCheck className="h-16 w-16 text-primary/60" />,
      content: (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium">Papel</th>
                {ACTIONS.map(a => (
                  <th key={a.key} className="text-center py-2 px-3 font-medium">
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map(role => (
                <tr key={role.key} className="border-b last:border-b-0">
                  <td className="py-2.5 px-3 font-medium">{role.label}</td>
                  {ACTIONS.map(action => {
                    const key = `${role.key}Can${action.key}` as PermissionKey;
                    return (
                      <td key={action.key} className="text-center py-2.5 px-3">
                        <Switch
                          checked={permissions[key] ?? false}
                          onCheckedChange={() => togglePermission(key)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },

    // Step 5 — Connection test
    {
      title: 'Teste de Conexão',
      description: 'Verificando conexão com os servidores de e-mail',
      icon: (
        <div className="flex items-center justify-center">
          {testStatus === 'success' ? (
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          ) : testStatus === 'error' ? (
            <XCircle className="h-16 w-16 text-red-500" />
          ) : (
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
          )}
        </div>
      ),
      isValid: false,
      content: (
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {(testStatus === 'creating' ||
            testStatus === 'testing' ||
            testStatus === 'syncing') && (
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm font-medium">
                {testStatus === 'creating' && 'Criando conta e vinculando à equipe...'}
                {testStatus === 'testing' && 'Testando conexão IMAP/SMTP...'}
                {testStatus === 'syncing' && 'Sincronizando pastas...'}
              </p>
              <p className="text-xs text-muted-foreground">
                Isso pode levar alguns segundos
              </p>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Conta criada, vinculada e conexão verificada com sucesso!
              </p>
              <p className="text-xs text-muted-foreground">
                A sincronização inicial foi iniciada. As mensagens aparecerão em
                breve.
              </p>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="text-center space-y-3">
              <XCircle className="h-10 w-10 text-red-500 mx-auto" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Falha na conexão
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {testError ||
                  'Verifique as credenciais e configurações do servidor.'}
              </p>
            </div>
          )}
        </div>
      ),
      footer: (
        <div className="flex items-center gap-2">
          {testStatus === 'success' ? (
            <Button onClick={handleSuccess}>Concluir</Button>
          ) : testStatus === 'error' ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setTestStatus('idle');
                }}
              >
                Verificar Configurações
              </Button>
              <Button
                onClick={() => {
                  setTestStatus('idle');
                  runConnectionTest();
                }}
              >
                Tentar Novamente
              </Button>
            </>
          ) : (
            <Button variant="outline" disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processando...
            </Button>
          )}
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onClose={handleClose}
    />
  );
}
