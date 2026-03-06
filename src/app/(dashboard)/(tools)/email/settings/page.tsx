'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { EMAIL_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { emailService } from '@/services/email';
import type {
  CreateEmailAccountRequest,
  EmailAccount,
  EmailAccountVisibility,
  ShareEmailAccountRequest,
  UpdateEmailAccountRequest,
} from '@/types/email';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Lock,
  Mail,
  Plus,
  RefreshCcw,
  Share2,
  Star,
  Trash2,
  UserPlus,
  Wifi,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const initialForm: CreateEmailAccountRequest = {
  address: '',
  displayName: '',
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: true,
  username: '',
  secret: '',
  isDefault: false,
  signature: '',
  visibility: 'PRIVATE',
};

function getInitials(name: string | null, address: string): string {
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return address.substring(0, 2).toUpperCase();
}

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canList = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.LIST);
  const canCreate = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.CREATE);
  const canUpdate = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.UPDATE);
  const canDelete = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.DELETE);
  const canRead = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.READ);
  const canSync = hasPermission(EMAIL_PERMISSIONS.SYNC.EXECUTE);
  const canShare = hasPermission(EMAIL_PERMISSIONS.ACCOUNTS.SHARE);

  const [form, setForm] = useState<CreateEmailAccountRequest>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(
    null
  );
  const [editForms, setEditForms] = useState<
    Record<string, UpdateEmailAccountRequest>
  >({});
  const [shareDialogAccountId, setShareDialogAccountId] = useState<
    string | null
  >(null);
  const [shareUserId, setShareUserId] = useState('');
  const [sharePerms, setSharePerms] = useState<
    Omit<ShareEmailAccountRequest, 'userId'>
  >({ canRead: true, canSend: false, canManage: false });

  function getEditForm(account: EmailAccount): UpdateEmailAccountRequest {
    return (
      editForms[account.id] ?? {
        displayName: account.displayName ?? '',
        signature: account.signature ?? '',
        visibility: account.visibility,
      }
    );
  }

  const accountsQuery = useQuery({
    queryKey: ['email', 'accounts'],
    queryFn: () => emailService.listAccounts(),
    enabled: canList,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateEmailAccountRequest) =>
      emailService.createAccount(data),
    onSuccess: async () => {
      toast.success('Conta criada com sucesso');
      setForm(initialForm);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: () => toast.error('Erro ao criar conta de e-mail'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string } & UpdateEmailAccountRequest) => {
      const { id, ...data } = payload;
      return emailService.updateAccount(id, data);
    },
    onSuccess: async () => {
      toast.success('Conta atualizada');
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: () => toast.error('Erro ao atualizar conta'),
  });

  const shareMutation = useMutation({
    mutationFn: (payload: { accountId: string } & ShareEmailAccountRequest) => {
      const { accountId, ...data } = payload;
      return emailService.shareAccount(accountId, data);
    },
    onSuccess: async () => {
      toast.success('Conta compartilhada com sucesso');
      setShareUserId('');
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: () => toast.error('Erro ao compartilhar conta'),
  });

  const unshareMutation = useMutation({
    mutationFn: (payload: { accountId: string; userId: string }) =>
      emailService.unshareAccount(payload.accountId, payload.userId),
    onSuccess: async () => {
      toast.success('Acesso revogado');
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: () => toast.error('Erro ao revogar acesso'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailService.deleteAccount(id),
    onSuccess: async () => {
      toast.success('Conta removida');
      await queryClient.invalidateQueries({ queryKey: ['email', 'accounts'] });
    },
    onError: () => toast.error('Erro ao remover conta'),
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => emailService.testConnection(id),
    onSuccess: () => toast.success('Conexão validada com sucesso'),
    onError: () => toast.error('Falha no teste de conexão'),
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => emailService.triggerSync(id),
    onError: () => toast.error('Erro ao disparar sincronização'),
  });

  const accounts = accountsQuery.data?.data ?? [];

  return (
    <>
      <div className="container max-w-3xl py-6 px-4 space-y-6">
        {/* Action Bar */}
        <PageActionBar
          breadcrumbItems={[
            { label: 'E-mail', href: '/email' },
            { label: 'Configurações' },
          ]}
          buttons={
            canCreate
              ? [
                  {
                    id: 'nova-conta',
                    title: showForm ? 'Cancelar' : 'Nova conta',
                    icon: Plus,
                    onClick: () => setShowForm(s => !s),
                    variant: showForm
                      ? ('outline' as const)
                      : ('default' as const),
                  },
                ]
              : []
          }
        />

        {/* Add account form */}
        {showForm && canCreate && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nova conta de e-mail</CardTitle>
              <CardDescription>
                Configure as credenciais IMAP e SMTP para a nova conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">Endereço de e-mail *</Label>
                  <Input
                    placeholder="voce@empresa.com"
                    value={form.address}
                    onChange={e =>
                      setForm(f => ({ ...f, address: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Nome de exibição</Label>
                  <Input
                    placeholder="João Silva"
                    value={form.displayName || ''}
                    onChange={e =>
                      setForm(f => ({ ...f, displayName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm">IMAP Host *</Label>
                  <Input
                    placeholder="imap.empresa.com"
                    value={form.imapHost}
                    onChange={e =>
                      setForm(f => ({ ...f, imapHost: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">IMAP Porta</Label>
                  <Input
                    type="number"
                    value={form.imapPort}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        imapPort: Number(e.target.value) || 993,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">SMTP Host *</Label>
                  <Input
                    placeholder="smtp.empresa.com"
                    value={form.smtpHost}
                    onChange={e =>
                      setForm(f => ({ ...f, smtpHost: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">SMTP Porta</Label>
                  <Input
                    type="number"
                    value={form.smtpPort}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        smtpPort: Number(e.target.value) || 587,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Usuário *</Label>
                  <Input
                    placeholder="voce@empresa.com"
                    value={form.username}
                    onChange={e =>
                      setForm(f => ({ ...f, username: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Senha / App Password *</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.secret}
                    onChange={e =>
                      setForm(f => ({ ...f, secret: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="imap-secure"
                    checked={Boolean(form.imapSecure)}
                    onCheckedChange={checked =>
                      setForm(f => ({ ...f, imapSecure: checked }))
                    }
                  />
                  <Label
                    htmlFor="imap-secure"
                    className="text-sm cursor-pointer"
                  >
                    IMAP seguro (SSL/TLS)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="smtp-secure"
                    checked={Boolean(form.smtpSecure)}
                    onCheckedChange={checked =>
                      setForm(f => ({ ...f, smtpSecure: checked }))
                    }
                  />
                  <Label
                    htmlFor="smtp-secure"
                    className="text-sm cursor-pointer"
                  >
                    SMTP seguro (TLS)
                  </Label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="visibility"
                    checked={form.visibility === 'SHARED'}
                    onCheckedChange={checked =>
                      setForm(f => ({
                        ...f,
                        visibility: checked ? 'SHARED' : 'PRIVATE',
                      }))
                    }
                  />
                  <Label
                    htmlFor="visibility"
                    className="text-sm cursor-pointer flex items-center gap-1.5"
                  >
                    {form.visibility === 'SHARED' ? (
                      <Globe className="size-3.5 text-muted-foreground" />
                    ) : (
                      <Lock className="size-3.5 text-muted-foreground" />
                    )}
                    {form.visibility === 'SHARED'
                      ? 'Compartilhada (visível para a equipe)'
                      : 'Privada (somente você)'}
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Assinatura</Label>
                <Textarea
                  placeholder="Sua assinatura de e-mail (opcional)"
                  value={form.signature || ''}
                  onChange={e =>
                    setForm(f => ({ ...f, signature: e.target.value }))
                  }
                  className="min-h-20 text-sm resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => createMutation.mutate(form)}
                  disabled={
                    createMutation.isPending ||
                    !form.address ||
                    !form.imapHost ||
                    !form.smtpHost ||
                    !form.username ||
                    !form.secret
                  }
                >
                  {createMutation.isPending && (
                    <Loader2 className="size-3.5 animate-spin mr-2" />
                  )}
                  Salvar conta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account list */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Contas configuradas ({accounts.length})
          </h2>

          {accountsQuery.isLoading && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardContent className="pt-4 flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!accountsQuery.isLoading && accounts.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <Mail className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Nenhuma conta configurada
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Adicione uma conta para começar a usar o e-mail.
                  </p>
                </div>
                {canCreate && (
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="size-3.5" />
                    Adicionar primeira conta
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {accounts.map(account => (
            <Card key={account.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(account.displayName, account.address)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">
                        {account.displayName || account.address}
                      </span>
                      {account.displayName && (
                        <span className="text-xs text-muted-foreground">
                          {account.address}
                        </span>
                      )}
                      <Badge
                        variant={account.isActive ? 'default' : 'secondary'}
                        className="text-[10px] h-4 px-1.5"
                      >
                        {account.isActive ? 'Ativa' : 'Inativa'}
                      </Badge>
                      {account.isDefault && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5"
                        >
                          Padrão
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 gap-1"
                      >
                        {account.visibility === 'SHARED' ? (
                          <Globe className="size-2.5" />
                        ) : (
                          <Lock className="size-2.5" />
                        )}
                        {account.visibility === 'SHARED'
                          ? 'Compartilhada'
                          : 'Privada'}
                      </Badge>
                    </div>

                    <div className="mt-0.5 text-xs text-muted-foreground space-x-2">
                      <span>
                        IMAP: {account.imapHost}:{account.imapPort}
                      </span>
                      <span>•</span>
                      <span>
                        SMTP: {account.smtpHost}:{account.smtpPort}
                      </span>
                    </div>

                    {account.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Último sync:{' '}
                        {formatDistanceToNow(new Date(account.lastSyncAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex flex-wrap items-center gap-2">
                  {canUpdate && (
                    <div className="flex items-center gap-2 mr-2">
                      <Switch
                        checked={account.isActive}
                        onCheckedChange={checked =>
                          updateMutation.mutate({
                            id: account.id,
                            isActive: checked,
                          })
                        }
                      />
                      <span className="text-xs text-muted-foreground">
                        Ativa
                      </span>
                    </div>
                  )}

                  {canUpdate && !account.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() =>
                        updateMutation.mutate({
                          id: account.id,
                          isDefault: true,
                        })
                      }
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Star className="size-3" />
                      )}
                      Definir como padrão
                    </Button>
                  )}

                  {canRead && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => testMutation.mutate(account.id)}
                      disabled={testMutation.isPending}
                    >
                      {testMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Wifi className="size-3" />
                      )}
                      Testar conexão
                    </Button>
                  )}

                  {canSync && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => syncMutation.mutate(account.id)}
                      disabled={syncMutation.isPending}
                    >
                      {syncMutation.isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <RefreshCcw className="size-3" />
                      )}
                      Sincronizar
                    </Button>
                  )}

                  {(canDelete || canUpdate || canShare) && (
                    <div className="ml-auto flex items-center gap-1.5">
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(account.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                          Excluir
                        </Button>
                      )}
                      {(canUpdate || canShare) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 h-7 text-xs"
                          onClick={() =>
                            setExpandedAccountId(id =>
                              id === account.id ? null : account.id
                            )
                          }
                        >
                          {expandedAccountId === account.id ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                          {expandedAccountId === account.id
                            ? 'Fechar'
                            : 'Configurações'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded edit section */}
                {expandedAccountId === account.id && (
                  <div className="mt-3 space-y-4 border-t pt-4">
                    {canUpdate && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-sm">Nome de exibição</Label>
                            <Input
                              placeholder="João Silva"
                              value={getEditForm(account).displayName ?? ''}
                              onChange={e =>
                                setEditForms(f => ({
                                  ...f,
                                  [account.id]: {
                                    ...getEditForm(account),
                                    displayName: e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-sm">Visibilidade</Label>
                            <div className="flex items-center gap-2 h-9">
                              <Switch
                                checked={
                                  (getEditForm(account).visibility as
                                    | EmailAccountVisibility
                                    | undefined) === 'SHARED'
                                    ? true
                                    : getEditForm(account).visibility ===
                                        undefined
                                      ? account.visibility === 'SHARED'
                                      : false
                                }
                                onCheckedChange={checked =>
                                  setEditForms(f => ({
                                    ...f,
                                    [account.id]: {
                                      ...getEditForm(account),
                                      visibility: checked
                                        ? 'SHARED'
                                        : 'PRIVATE',
                                    },
                                  }))
                                }
                              />
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {(getEditForm(account).visibility ??
                                  account.visibility) === 'SHARED' ? (
                                  <>
                                    <Globe className="size-3" /> Compartilhada
                                  </>
                                ) : (
                                  <>
                                    <Lock className="size-3" /> Privada
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-sm">Assinatura</Label>
                          <Textarea
                            placeholder="Sua assinatura de e-mail (opcional)"
                            value={
                              getEditForm(account).signature ??
                              account.signature ??
                              ''
                            }
                            onChange={e =>
                              setEditForms(f => ({
                                ...f,
                                [account.id]: {
                                  ...getEditForm(account),
                                  signature: e.target.value,
                                },
                              }))
                            }
                            className="min-h-20 text-sm resize-none"
                          />
                        </div>

                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              id: account.id,
                              ...getEditForm(account),
                            })
                          }
                        >
                          {updateMutation.isPending && (
                            <Loader2 className="size-3 animate-spin" />
                          )}
                          Salvar alterações
                        </Button>
                        <Separator />
                      </>
                    )}

                    {canShare && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-1.5">
                            <Share2 className="size-3.5 text-muted-foreground" />
                            Compartilhamento
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 h-7 text-xs"
                            onClick={() => setShareDialogAccountId(account.id)}
                          >
                            <UserPlus className="size-3" />
                            Adicionar acesso
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {account.visibility === 'PRIVATE'
                            ? 'Esta conta é privada. Altere a visibilidade para "Compartilhada" para dar acesso a outros usuários.'
                            : 'Esta conta está compartilhada. Adicione usuários para que possam acessá-la.'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de compartilhamento */}
      <Dialog
        open={!!shareDialogAccountId}
        onOpenChange={v => !v && setShareDialogAccountId(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Share2 className="size-4" />
              Compartilhar conta
            </DialogTitle>
            <DialogDescription>
              Adicione o ID de um usuário e defina suas permissões de acesso.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">ID do usuário</Label>
              <Input
                placeholder="uuid do usuário"
                value={shareUserId}
                onChange={e => setShareUserId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Permissões</Label>
              <div className="space-y-2">
                {(
                  [
                    { key: 'canRead', label: 'Pode ler mensagens' },
                    { key: 'canSend', label: 'Pode enviar e-mails' },
                    { key: 'canManage', label: 'Pode gerenciar a conta' },
                  ] as const
                ).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Switch
                      checked={sharePerms[key]}
                      onCheckedChange={checked =>
                        setSharePerms(p => ({ ...p, [key]: checked }))
                      }
                    />
                    <Label className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShareDialogAccountId(null)}
              >
                <X className="size-3.5 mr-1" />
                Cancelar
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!shareUserId.trim() || shareMutation.isPending}
                onClick={() => {
                  if (!shareDialogAccountId || !shareUserId.trim()) return;
                  shareMutation.mutate({
                    accountId: shareDialogAccountId,
                    userId: shareUserId.trim(),
                    ...sharePerms,
                  });
                  setShareDialogAccountId(null);
                }}
              >
                {shareMutation.isPending && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                <UserPlus className="size-3.5" />
                Conceder acesso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
