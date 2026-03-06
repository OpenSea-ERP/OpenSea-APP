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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MdContactMail,
  MdMailLock,
  MdMarkunreadMailbox,
  MdOutgoingMail,
} from 'react-icons/md';
import {
  PiWifiHighBold,
  PiWifiHighLight,
  PiWifiSlashBold,
} from 'react-icons/pi';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface LinkEmailDialogProps {
  teamId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PermissionKey = keyof Omit<LinkTeamEmailData, 'accountId'>;
type TestStatus = 'idle' | 'testing' | 'success' | 'error';

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

const ICON_SIZE = 80;

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
    setTestStatus('testing');
    setTestError(null);

    try {
      let accountId = createdAccountId;
      const formData: CreateEmailAccountRequest = {
        ...form,
        username: form.address,
      };

      if (!accountId) {
        const { account } = await emailService.createAccount(formData);
        accountId = account.id;
        setCreatedAccountId(accountId);
      } else {
        await emailService.updateAccount(accountId, formData);
      }

      if (!linkedRef.current) {
        await teamsService.linkEmailToTeam(teamId, {
          accountId,
          ...permissions,
        });
        linkedRef.current = true;
      }

      await emailService.testConnection(accountId);
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
      description: 'Informe o endereço e as credenciais da conta',
      icon: <MdContactMail size={ICON_SIZE} className="text-white/10" />,
      isValid: form.address.trim() !== '' && form.secret.trim() !== '',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wz-address">Endereço de e-mail *</Label>
            <Input
              id="wz-address"
              type="email"
              placeholder="equipe@empresa.com"
              value={form.address}
              onChange={e => updateField('address', e.target.value)}
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
            <Label htmlFor="wz-secret">Senha / App Password *</Label>
            <Input
              id="wz-secret"
              type="password"
              placeholder="••••••••"
              value={form.secret}
              onChange={e => updateField('secret', e.target.value)}
            />
          </div>
        </div>
      ),
    },

    // Step 2 — IMAP
    {
      title: 'Servidor de Recebimento',
      description: 'Configure o servidor IMAP',
      icon: <MdMarkunreadMailbox size={ICON_SIZE} className="text-white/10" />,
      isValid: form.imapHost.trim() !== '',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="wz-imapHost">Host IMAP *</Label>
              <Input
                id="wz-imapHost"
                placeholder="imap.gmail.com"
                value={form.imapHost}
                onChange={e => updateField('imapHost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wz-imapPort">Porta</Label>
              <Input
                id="wz-imapPort"
                type="number"
                value={form.imapPort}
                onChange={e => updateField('imapPort', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
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
      ),
    },

    // Step 3 — SMTP
    {
      title: 'Servidor de Saída',
      description: 'Configure o servidor SMTP',
      icon: <MdOutgoingMail size={ICON_SIZE} className="text-white/10" />,
      isValid: form.smtpHost.trim() !== '',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="wz-smtpHost">Host SMTP *</Label>
              <Input
                id="wz-smtpHost"
                placeholder="smtp.gmail.com"
                value={form.smtpHost}
                onChange={e => updateField('smtpHost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wz-smtpPort">Porta</Label>
              <Input
                id="wz-smtpPort"
                type="number"
                value={form.smtpPort}
                onChange={e => updateField('smtpPort', Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="wz-smtpSecure"
              checked={form.smtpSecure ?? true}
              onCheckedChange={v => updateField('smtpSecure', v)}
            />
            <Label htmlFor="wz-smtpSecure" className="text-sm">
              Conexão segura (TLS)
            </Label>
          </div>
        </div>
      ),
    },

    // Step 4 — Permissions
    {
      title: 'Permissões',
      description: 'Defina as permissões de acesso por papel',
      icon: <MdMailLock size={ICON_SIZE} className="text-white/10" />,
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
      description:
        testStatus === 'testing'
          ? 'Verificando conectividade...'
          : testStatus === 'success'
            ? 'Conexão estabelecida com sucesso!'
            : testStatus === 'error'
              ? 'Não foi possível estabelecer a conexão'
              : 'Testando conexão...',
      icon:
        testStatus === 'success' ? (
          <PiWifiHighBold size={ICON_SIZE} className="text-green-500" />
        ) : testStatus === 'error' ? (
          <PiWifiSlashBold size={ICON_SIZE} className="text-destructive" />
        ) : (
          <PiWifiHighLight size={ICON_SIZE} className="text-white/10" />
        ),
      content: (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          {testStatus === 'testing' && (
            <>
              <p className="text-sm text-muted-foreground">
                Criando conta e testando conexão...
              </p>
              <div className="w-full max-w-xs h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full w-1/3 rounded-full bg-primary"
                  style={{
                    animation: 'wz-indeterminate 1.5s infinite ease-in-out',
                  }}
                />
              </div>
              <style>{`@keyframes wz-indeterminate{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
            </>
          )}

          {testStatus === 'success' && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Conta criada, vinculada e conexão verificada com sucesso!
            </p>
          )}

          {testStatus === 'error' && (
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive font-medium">
                Falha ao conectar com o servidor de e-mail.
              </p>
              {testError && (
                <p className="text-xs text-muted-foreground max-w-sm">
                  {testError}
                </p>
              )}
            </div>
          )}
        </div>
      ),
      footer:
        testStatus === 'testing' ? (
          <></>
        ) : testStatus === 'success' ? (
          <Button type="button" onClick={handleSuccess}>
            Concluir
          </Button>
        ) : testStatus === 'error' ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep(1);
                setTestStatus('idle');
              }}
            >
              Verificar Configurações
            </Button>
            <Button type="button" onClick={runConnectionTest}>
              Tentar Novamente
            </Button>
          </>
        ) : undefined,
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
