'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Switch } from '@/components/ui/switch';
import { useQueryClient } from '@tanstack/react-query';
import { emailService } from '@/services/email';
import type { CreateEmailAccountRequest } from '@/types/email';
import {
  CheckCircle2,
  Lightbulb,
  Loader2,
  Mail,
  MailCheck,
  Send,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

// ─── Component ────────────────────────────────────────────────────────────────

interface EmailAccountWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ConnectionTestState =
  | 'idle'
  | 'creating'
  | 'testing'
  | 'syncing'
  | 'success'
  | 'error';

export function EmailAccountWizard({
  open,
  onOpenChange,
}: EmailAccountWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Account data
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: IMAP
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapSecure, setImapSecure] = useState(true);

  // Step 3: SMTP
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(465);
  const [smtpSecure, setSmtpSecure] = useState(true);

  // Step 4: Connection test
  const [testState, setTestState] = useState<ConnectionTestState>('idle');
  const [testError, setTestError] = useState('');
  const createdAccountIdRef = useRef<string | null>(null);

  const queryClient = useQueryClient();

  // Auto-detect provider settings when email changes
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    const provider = detectProvider(value);
    if (provider) {
      setImapHost(provider.imap.host);
      setImapPort(provider.imap.port);
      setImapSecure(provider.imap.secure);
      setSmtpHost(provider.smtp.host);
      setSmtpPort(provider.smtp.port);
      setSmtpSecure(provider.smtp.secure);
    } else {
      // Fallback for custom domains: guess mail.{domain}
      const domain = value.split('@')[1]?.toLowerCase();
      if (domain && domain.includes('.')) {
        const guessedHost = `mail.${domain}`;
        setImapHost(guessedHost);
        setImapPort(993);
        setImapSecure(true);
        setSmtpHost(guessedHost);
        setSmtpPort(465);
        setSmtpSecure(true);
      }
    }
  }, []);

  // Run connection test when entering step 4
  const runConnectionTest = useCallback(async () => {
    setTestError('');

    const accountData: CreateEmailAccountRequest = {
      address: email,
      displayName: displayName || undefined,
      username: email,
      secret: password,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      visibility: 'PRIVATE',
      isDefault: false,
    };

    try {
      // Step 1: Create account (if not already created)
      if (!createdAccountIdRef.current) {
        setTestState('creating');
        const response = await emailService.createAccount(accountData);
        createdAccountIdRef.current = response.account.id;
      }

      // Step 2: Test connection
      setTestState('testing');
      await emailService.testConnection(createdAccountIdRef.current);

      // Step 3: Trigger initial sync
      setTestState('syncing');
      await emailService.triggerSync(createdAccountIdRef.current);

      setTestState('success');
    } catch (err) {
      setTestState('error');
      const message =
        err instanceof Error
          ? err.message
          : 'Erro desconhecido ao testar conexão';
      setTestError(message);
    }
  }, [
    email,
    displayName,
    password,
    imapHost,
    imapPort,
    imapSecure,
    smtpHost,
    smtpPort,
    smtpSecure,
  ]);

  // Auto-trigger test on step 4 entry
  useEffect(() => {
    if (currentStep === 4 && testState === 'idle') {
      runConnectionTest();
    }
  }, [currentStep, testState, runConnectionTest]);

  function handleStepChange(step: number) {
    // If going to step 4, reset test state (unless already created)
    if (step === 4 && currentStep !== 4) {
      if (!createdAccountIdRef.current) {
        setTestState('idle');
      }
    }
    setCurrentStep(step);
  }

  function handleClose() {
    // Reset state
    setCurrentStep(1);
    setEmail('');
    setDisplayName('');
    setPassword('');
    setImapHost('');
    setImapPort(993);
    setImapSecure(true);
    setSmtpHost('');
    setSmtpPort(465);
    setSmtpSecure(true);
    setTestState('idle');
    setTestError('');
    createdAccountIdRef.current = null;
    onOpenChange(false);
  }

  function handleFinish() {
    // Invalidate all email queries so accounts/folders/messages refresh
    queryClient.invalidateQueries({ queryKey: ['email'] });
    handleClose();
  }

  // ─── Step Definitions ───────────────────────────────────────────────────────

  const step1Valid = email.includes('@') && password.length > 0;
  const step2Valid = imapHost.length > 0 && imapPort > 0;
  const step3Valid = smtpHost.length > 0 && smtpPort > 0;

  const steps: WizardStep[] = useMemo(
    () => [
      // Step 1: Account Data
      {
        title: 'Dados da Conta',
        description: 'Informe o endereço de e-mail e senha de aplicativo',
        icon: <Mail className="h-16 w-16 text-primary/60" />,
        isValid: step1Valid,
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-email">Endereço de e-mail *</Label>
              <Input
                id="wizard-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => handleEmailChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-display-name">Nome de exibição</Label>
              <Input
                id="wizard-display-name"
                placeholder="Meu E-mail Corporativo"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-password">
                Senha / Senha de aplicativo *
              </Label>
              <Input
                id="wizard-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
      // Step 2: IMAP
      {
        title: 'Servidor de Recebimento (IMAP)',
        description: 'Configuração do servidor para receber e-mails',
        icon: <MailCheck className="h-16 w-16 text-primary/60" />,
        isValid: step2Valid,
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-imap-host">Servidor IMAP *</Label>
              <Input
                id="wizard-imap-host"
                placeholder="imap.exemplo.com"
                value={imapHost}
                onChange={e => setImapHost(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wizard-imap-port">Porta</Label>
                <Input
                  id="wizard-imap-port"
                  type="number"
                  value={imapPort}
                  onChange={e => setImapPort(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="wizard-imap-secure"
                  checked={imapSecure}
                  onCheckedChange={setImapSecure}
                />
                <Label htmlFor="wizard-imap-secure" className="text-sm">
                  Conexão segura (SSL/TLS)
                </Label>
              </div>
            </div>
            {detectProvider(email) && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                Configurações detectadas automaticamente com base no provedor de
                e-mail.
              </p>
            )}
          </div>
        ),
      },
      // Step 3: SMTP
      {
        title: 'Servidor de Saída (SMTP)',
        description: 'Configuração do servidor para enviar e-mails',
        icon: <Send className="h-16 w-16 text-primary/60" />,
        isValid: step3Valid,
        content: (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-smtp-host">Servidor SMTP *</Label>
              <Input
                id="wizard-smtp-host"
                placeholder="smtp.exemplo.com"
                value={smtpHost}
                onChange={e => setSmtpHost(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wizard-smtp-port">Porta</Label>
                <Input
                  id="wizard-smtp-port"
                  type="number"
                  value={smtpPort}
                  onChange={e => setSmtpPort(Number(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="wizard-smtp-secure"
                  checked={smtpSecure}
                  onCheckedChange={setSmtpSecure}
                />
                <Label htmlFor="wizard-smtp-secure" className="text-sm">
                  Conexão segura (SSL/TLS)
                </Label>
              </div>
            </div>
          </div>
        ),
      },
      // Step 4: Connection Test
      {
        title: 'Teste de Conexão',
        description: 'Verificando conexão com os servidores de e-mail',
        icon: (
          <div className="flex items-center justify-center">
            {testState === 'success' ? (
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            ) : testState === 'error' ? (
              <XCircle className="h-16 w-16 text-red-500" />
            ) : (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
          </div>
        ),
        isValid: false, // Disable default next button
        content: (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {(testState === 'creating' ||
              testState === 'testing' ||
              testState === 'syncing') && (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm font-medium">
                  {testState === 'creating' && 'Criando conta...'}
                  {testState === 'testing' && 'Testando conexão IMAP/SMTP...'}
                  {testState === 'syncing' && 'Sincronizando pastas...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Isso pode levar alguns segundos
                </p>
              </div>
            )}

            {testState === 'success' && (
              <div className="text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Conta configurada com sucesso!
                </p>
                <p className="text-xs text-muted-foreground">
                  A sincronização inicial foi iniciada. Suas mensagens
                  aparecerão em breve.
                </p>
              </div>
            )}

            {testState === 'error' && (
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
            {testState === 'success' ? (
              <Button onClick={handleFinish}>Concluir</Button>
            ) : testState === 'error' ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Delete the failed account if it was created
                    if (createdAccountIdRef.current) {
                      emailService
                        .deleteAccount(createdAccountIdRef.current)
                        .catch(() => {});
                      createdAccountIdRef.current = null;
                    }
                    setTestState('idle');
                    setCurrentStep(1);
                  }}
                >
                  Verificar Configurações
                </Button>
                <Button
                  onClick={() => {
                    setTestState('idle');
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
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      email,
      displayName,
      password,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      step1Valid,
      step2Valid,
      step3Valid,
      testState,
      testError,
    ]
  );

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={currentStep}
      onStepChange={handleStepChange}
      onClose={handleClose}
    />
  );
}
