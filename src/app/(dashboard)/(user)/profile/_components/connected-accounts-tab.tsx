'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StepWizardDialog } from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { translateError } from '@/lib/error-messages';
import { cn } from '@/lib/utils';
import {
  authLinksService,
  type AuthLinkDTO,
} from '@/services/auth/auth-links.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Apple,
  BadgeCheck,
  Check,
  CreditCard,
  Github,
  Globe,
  Link2,
  LinkIcon,
  Loader2,
  Mail,
  Monitor,
  MoreHorizontal,
  Plus,
  Power,
  PowerOff,
  Unlink,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// PROVIDER CONFIG
// =============================================================================

const PROVIDER_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  EMAIL: { label: 'Email', icon: Mail, color: 'blue' },
  CPF: { label: 'CPF', icon: CreditCard, color: 'emerald' },
  ENROLLMENT: { label: 'Matrícula', icon: BadgeCheck, color: 'violet' },
  GOOGLE: { label: 'Google', icon: Globe, color: 'sky' },
  MICROSOFT: { label: 'Microsoft', icon: Monitor, color: 'blue' },
  APPLE: { label: 'Apple', icon: Apple, color: 'slate' },
  GITHUB: { label: 'GitHub', icon: Github, color: 'slate' },
};

const LINKABLE_PROVIDERS = ['EMAIL', 'CPF', 'ENROLLMENT'] as const;

function getProviderConfig(provider: string) {
  return (
    PROVIDER_CONFIG[provider] ?? {
      label: provider,
      icon: Link2,
      color: 'slate',
    }
  );
}

// =============================================================================
// MAIN TAB
// =============================================================================

export function ConnectedAccountsTab() {
  const queryClient = useQueryClient();
  const [linkWizardOpen, setLinkWizardOpen] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<AuthLinkDTO | null>(null);

  // Fetch auth links
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['my-auth-links'],
    queryFn: async () => {
      const response = await authLinksService.listMine();
      return response.authLinks;
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'ACTIVE' | 'INACTIVE';
    }) => {
      return authLinksService.toggleStatus(id, status);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-auth-links'] });
      toast.success(
        variables.status === 'ACTIVE'
          ? 'Método de login ativado'
          : 'Método de login desativado'
      );
    },
    onError: (error: Error) => {
      toast.error(translateError(error.message));
    },
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: async (id: string) => {
      return authLinksService.unlink(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-auth-links'] });
      toast.success('Método de login desvinculado com sucesso');
      setUnlinkTarget(null);
    },
    onError: (error: Error) => {
      toast.error(translateError(error.message));
    },
  });

  const handleToggleStatus = (link: AuthLinkDTO) => {
    const newStatus = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatusMutation.mutate({ id: link.id, status: newStatus });
  };

  const handleUnlinkConfirm = () => {
    if (unlinkTarget) {
      unlinkMutation.mutate(unlinkTarget.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <LinkIcon className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contas Conectadas
              </h3>
              <p className="text-sm text-gray-500 dark:text-white/50">
                Gerencie os métodos de login vinculados à sua conta
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLinkWizardOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Vincular Método
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Auth Links List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-white/10"
              >
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <p className="text-sm text-rose-600 dark:text-rose-400">
              Erro ao carregar métodos de login:{' '}
              {translateError(
                error instanceof Error ? error.message : 'Erro desconhecido'
              )}
            </p>
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-3">
            {data.map(link => (
              <AuthLinkItem
                key={link.id}
                link={link}
                onToggleStatus={() => handleToggleStatus(link)}
                onUnlink={() => setUnlinkTarget(link)}
                isToggling={toggleStatusMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-white/50">
            <LinkIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum método de login vinculado</p>
            <p className="text-xs mt-1">
              Clique em &quot;Vincular Método&quot; para adicionar
            </p>
          </div>
        )}
      </Card>

      {/* Link Wizard Modal */}
      <LinkAuthMethodWizard
        open={linkWizardOpen}
        onClose={() => setLinkWizardOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['my-auth-links'] });
          setLinkWizardOpen(false);
        }}
      />

      {/* Unlink PIN confirmation */}
      <VerifyActionPinModal
        isOpen={!!unlinkTarget}
        onClose={() => setUnlinkTarget(null)}
        onSuccess={handleUnlinkConfirm}
        title="Confirmar Desvinculação"
        description={`Digite seu PIN de ação para desvincular o método de login "${unlinkTarget ? getProviderConfig(unlinkTarget.provider).label : ''}".`}
      />
    </div>
  );
}

// =============================================================================
// AUTH LINK ITEM
// =============================================================================

interface AuthLinkItemProps {
  link: AuthLinkDTO;
  onToggleStatus: () => void;
  onUnlink: () => void;
  isToggling: boolean;
}

function AuthLinkItem({
  link,
  onToggleStatus,
  onUnlink,
  isToggling,
}: AuthLinkItemProps) {
  const config = getProviderConfig(link.provider);
  const Icon = config.icon;
  const isActive = link.status === 'ACTIVE';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg transition-colors',
        isActive
          ? 'bg-linear-to-r from-blue-50 to-white dark:from-violet-500/10 dark:to-transparent border border-gray-200 dark:border-white/10'
          : 'bg-linear-to-r from-gray-100 to-white dark:from-gray-500/10 dark:to-transparent border border-gray-200/50 dark:border-white/5'
      )}
    >
      {/* Provider Icon */}
      <div
        className={cn(
          'p-2.5 rounded-lg',
          isActive
            ? `bg-${config.color}-500/10 text-${config.color}-500`
            : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 dark:text-white truncate">
            {config.label}
          </p>
          <Badge
            variant={isActive ? 'success' : 'secondary'}
            className="text-xs"
          >
            {isActive ? (
              <>
                <Check className="w-3 h-3 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <X className="w-3 h-3 mr-1" />
                Inativo
              </>
            )}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-white/50">
          <span className="font-mono">{link.identifier}</span>
          {link.lastUsedAt && (
            <span>
              Último uso{' '}
              {formatDistanceToNow(new Date(link.lastUsedAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          )}
          <span>
            Vinculado{' '}
            {formatDistanceToNow(new Date(link.linkedAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>
      </div>

      {/* Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={onToggleStatus}
            disabled={isToggling}
          >
            {isActive ? (
              <>
                <PowerOff className="w-4 h-4 mr-2" />
                Desativar
              </>
            ) : (
              <>
                <Power className="w-4 h-4 mr-2" />
                Ativar
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onUnlink}
            className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
          >
            <Unlink className="w-4 h-4 mr-2" />
            Desvincular
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// =============================================================================
// LINK AUTH METHOD WIZARD
// =============================================================================

interface LinkAuthMethodWizardProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function LinkAuthMethodWizard({
  open,
  onClose,
  onSuccess,
}: LinkAuthMethodWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [provider, setProvider] = useState<string>('');
  const [identifier, setIdentifier] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const linkMutation = useMutation({
    mutationFn: async () => {
      return authLinksService.link({ provider, identifier, currentPassword });
    },
    onSuccess: () => {
      toast.success('Método de login vinculado com sucesso!');
      resetAndClose();
      onSuccess();
    },
    onError: (error: Error) => {
      toast.error(translateError(error.message));
    },
  });

  const resetAndClose = () => {
    setCurrentStep(1);
    setProvider('');
    setIdentifier('');
    setCurrentPassword('');
    onClose();
  };

  const getIdentifierLabel = () => {
    switch (provider) {
      case 'EMAIL':
        return 'Endereço de Email';
      case 'CPF':
        return 'Número do CPF';
      case 'ENROLLMENT':
        return 'Número da Matrícula';
      default:
        return 'Identificador';
    }
  };

  const getIdentifierPlaceholder = () => {
    switch (provider) {
      case 'EMAIL':
        return 'exemplo@email.com';
      case 'CPF':
        return '000.000.000-00';
      case 'ENROLLMENT':
        return 'MAT-00000';
      default:
        return '';
    }
  };

  const steps = [
    {
      title: 'Selecionar Método',
      description: 'Escolha o tipo de login que deseja vincular',
      icon: (
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-violet-500/10">
            <LinkIcon className="w-12 h-12 text-violet-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Passo 1 de 3
          </p>
        </div>
      ),
      isValid: !!provider,
      content: (
        <div className="space-y-3 py-2">
          <Label className="text-sm font-medium">Tipo de Método</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o método de login" />
            </SelectTrigger>
            <SelectContent>
              {LINKABLE_PROVIDERS.map(p => {
                const cfg = getProviderConfig(p);
                const ProviderIcon = cfg.icon;
                return (
                  <SelectItem key={p} value={p}>
                    <div className="flex items-center gap-2">
                      <ProviderIcon className="w-4 h-4" />
                      {cfg.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Você pode vincular múltiplos métodos de login para acessar sua conta
            de diferentes formas.
          </p>
        </div>
      ),
    },
    {
      title: 'Informar Identificador',
      description: provider
        ? `Digite o ${getIdentifierLabel().toLowerCase()}`
        : 'Informe seus dados',
      icon: (
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-blue-500/10">
            {provider ? (
              (() => {
                const ProviderIcon = getProviderConfig(provider).icon;
                return (
                  <ProviderIcon className="w-12 h-12 text-blue-500" />
                );
              })()
            ) : (
              <Mail className="w-12 h-12 text-blue-500" />
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Passo 2 de 3
          </p>
        </div>
      ),
      isValid: !!identifier.trim(),
      onBack: () => setCurrentStep(1),
      content: (
        <div className="space-y-3 py-2">
          <Label htmlFor="link-identifier">{getIdentifierLabel()}</Label>
          <Input
            id="link-identifier"
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            placeholder={getIdentifierPlaceholder()}
          />
        </div>
      ),
    },
    {
      title: 'Confirmar Senha',
      description: 'Digite sua senha atual para confirmar a vinculação',
      icon: (
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-2xl bg-emerald-500/10">
            <BadgeCheck className="w-12 h-12 text-emerald-500" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            Passo 3 de 3
          </p>
        </div>
      ),
      isValid: !!currentPassword,
      onBack: () => setCurrentStep(2),
      footer: (
        <div className="flex items-center gap-2 w-full justify-end">
          <Button type="button" variant="outline" onClick={resetAndClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => linkMutation.mutate()}
            disabled={!currentPassword || linkMutation.isPending}
          >
            {linkMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <LinkIcon className="w-4 h-4 mr-2" />
            )}
            Vincular
          </Button>
        </div>
      ),
      content: (
        <div className="space-y-3 py-2">
          <Label htmlFor="link-password">Senha Atual</Label>
          <PasswordInput
            id="link-password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Digite sua senha para confirmar"
          />
          <p className="text-xs text-muted-foreground">
            Sua senha é necessária para confirmar a vinculação de um novo método
            de login.
          </p>
        </div>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={val => {
        if (!val) resetAndClose();
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={resetAndClose}
      heightClass="h-[420px]"
    />
  );
}
