'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useDeleteEmailAccount,
  useUpdateEmailAccount,
} from '@/hooks/email/use-email';
import type { EmailAccount, UpdateEmailAccountRequest } from '@/types/email';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EmailAccountEditDialogProps {
  account: EmailAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailAccountEditDialog({
  account,
  open,
  onOpenChange,
}: EmailAccountEditDialogProps) {
  // Form state
  const [displayName, setDisplayName] = useState(account.displayName ?? '');
  const [signature, setSignature] = useState(account.signature ?? '');
  const [visibility, setVisibility] = useState(account.visibility);
  const [isDefault, setIsDefault] = useState(account.isDefault);
  const [isActive, setIsActive] = useState(account.isActive);

  // Advanced settings
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [imapHost, setImapHost] = useState(account.imapHost);
  const [imapPort, setImapPort] = useState(account.imapPort);
  const [imapSecure, setImapSecure] = useState(account.imapSecure);
  const [smtpHost, setSmtpHost] = useState(account.smtpHost);
  const [smtpPort, setSmtpPort] = useState(account.smtpPort);
  const [smtpSecure, setSmtpSecure] = useState(account.smtpSecure);
  const [password, setPassword] = useState('');

  const updateMutation = useUpdateEmailAccount();
  const deleteMutation = useDeleteEmailAccount();

  // Reset form when account changes
  useEffect(() => {
    setDisplayName(account.displayName ?? '');
    setSignature(account.signature ?? '');
    setVisibility(account.visibility);
    setIsDefault(account.isDefault);
    setIsActive(account.isActive);
    setImapHost(account.imapHost);
    setImapPort(account.imapPort);
    setImapSecure(account.imapSecure);
    setSmtpHost(account.smtpHost);
    setSmtpPort(account.smtpPort);
    setSmtpSecure(account.smtpSecure);
    setPassword('');
    setAdvancedOpen(false);
  }, [account]);

  function handleSave() {
    const data: UpdateEmailAccountRequest & { id: string } = {
      id: account.id,
      displayName: displayName || undefined,
      signature: signature || undefined,
      visibility,
      isDefault,
      isActive,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      ...(password ? { secret: password } : {}),
    };

    updateMutation.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  }

  function handleDelete() {
    deleteMutation.mutate(account.id, {
      onSuccess: () => onOpenChange(false),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar conta de e-mail</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Email address (read-only) */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Endereço de e-mail</Label>
            <p className="text-sm font-medium">{account.address}</p>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="edit-display-name">Nome de exibição</Label>
            <Input
              id="edit-display-name"
              placeholder="Meu E-mail Corporativo"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label htmlFor="edit-signature">Assinatura</Label>
            <Textarea
              id="edit-signature"
              placeholder="Sua assinatura de e-mail..."
              value={signature}
              onChange={e => setSignature(e.target.value)}
              rows={3}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Visibilidade</Label>
                <p className="text-[11px] text-muted-foreground">
                  {visibility === 'PRIVATE' ? 'Privada' : 'Compartilhada'}
                </p>
              </div>
              <Switch
                checked={visibility === 'SHARED'}
                onCheckedChange={checked =>
                  setVisibility(checked ? 'SHARED' : 'PRIVATE')
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Conta padrão</Label>
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Conta ativa</Label>
                <p className="text-[11px] text-muted-foreground">
                  Contas desativadas não sincronizam nem enviam e-mails.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Advanced Settings */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                Configurações avançadas
                {advancedOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {/* IMAP */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Servidor IMAP
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="imap.exemplo.com"
                      value={imapHost}
                      onChange={e => setImapHost(e.target.value)}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="993"
                    value={imapPort}
                    onChange={e => setImapPort(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-imap-secure"
                    checked={imapSecure}
                    onCheckedChange={setImapSecure}
                  />
                  <Label htmlFor="edit-imap-secure" className="text-xs">
                    SSL/TLS
                  </Label>
                </div>
              </div>

              {/* SMTP */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Servidor SMTP
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="smtp.exemplo.com"
                      value={smtpHost}
                      onChange={e => setSmtpHost(e.target.value)}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="465"
                    value={smtpPort}
                    onChange={e => setSmtpPort(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="edit-smtp-secure"
                    checked={smtpSecure}
                    onCheckedChange={setSmtpSecure}
                  />
                  <Label htmlFor="edit-smtp-secure" className="text-xs">
                    SSL/TLS
                  </Label>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  Nova senha / Senha de aplicativo
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          {/* Delete button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir conta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir conta de e-mail?</AlertDialogTitle>
                <AlertDialogDescription>
                  Todas as mensagens e pastas associadas serão excluídas
                  permanentemente. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
