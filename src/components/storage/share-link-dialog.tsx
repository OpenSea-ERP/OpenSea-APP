'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateShareLink, useShareLinks, useRevokeShareLink } from '@/hooks/storage';
import type { StorageFile, StorageShareLink } from '@/types/storage';
import {
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  Trash2,
  Calendar,
  Hash,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { formatFileSize } from './utils';

interface ShareLinkDialogProps {
  file: StorageFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareLinkDialog({
  file,
  open,
  onOpenChange,
}: ShareLinkDialogProps) {
  const fileId = file?.id ?? '';
  const { data: links, isLoading } = useShareLinks(open ? fileId : null);
  const createMutation = useCreateShareLink(fileId);
  const revokeMutation = useRevokeShareLink(fileId);

  // Form state
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [useExpiry, setUseExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [useMaxDownloads, setUseMaxDownloads] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState('');

  const resetForm = useCallback(() => {
    setUsePassword(false);
    setPassword('');
    setUseExpiry(false);
    setExpiresAt('');
    setUseMaxDownloads(false);
    setMaxDownloads('');
  }, []);

  const handleCreate = async () => {
    try {
      const link = await createMutation.mutateAsync({
        ...(usePassword && password ? { password } : {}),
        ...(useExpiry && expiresAt
          ? { expiresAt: new Date(expiresAt).toISOString() }
          : {}),
        ...(useMaxDownloads && maxDownloads
          ? { maxDownloads: Number(maxDownloads) }
          : {}),
      });
      resetForm();
      const shareUrl = `${window.location.origin}/shared/${link.token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link criado e copiado para a área de transferência');
    } catch {
      toast.error('Falha ao criar link de compartilhamento');
    }
  };

  const handleCopy = async (token: string) => {
    const shareUrl = `${window.location.origin}/shared/${token}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copiado para a área de transferência');
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeMutation.mutateAsync(linkId);
      toast.success('Link revogado com sucesso');
    } catch {
      toast.error('Falha ao revogar link');
    }
  };

  const activeLinks = links?.filter(l => l.isActive) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Compartilhar arquivo
          </DialogTitle>
          {file && (
            <DialogDescription>
              {file.name} ({formatFileSize(file.size)})
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Create new link */}
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Novo link</h4>

            <div className="flex items-center gap-2">
              <Checkbox
                id="use-password"
                checked={usePassword}
                onCheckedChange={c => setUsePassword(!!c)}
              />
              <Label htmlFor="use-password" className="text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Proteger com senha
              </Label>
            </div>
            {usePassword && (
              <Input
                type="password"
                placeholder="Digite a senha..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-9"
              />
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="use-expiry"
                checked={useExpiry}
                onCheckedChange={c => setUseExpiry(!!c)}
              />
              <Label htmlFor="use-expiry" className="text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Data de expiração
              </Label>
            </div>
            {useExpiry && (
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="h-9"
              />
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="use-max-downloads"
                checked={useMaxDownloads}
                onCheckedChange={c => setUseMaxDownloads(!!c)}
              />
              <Label htmlFor="use-max-downloads" className="text-sm flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                Limite de downloads
              </Label>
            </div>
            {useMaxDownloads && (
              <Input
                type="number"
                min={1}
                placeholder="Ex: 10"
                value={maxDownloads}
                onChange={e => setMaxDownloads(e.target.value)}
                className="h-9"
              />
            )}
          </div>

          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Criar link de compartilhamento
          </Button>
        </div>

        {/* Active links */}
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeLinks.length > 0 ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Links ativos ({activeLinks.length})
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activeLinks.map(link => (
                <ShareLinkItem
                  key={link.id}
                  link={link}
                  onCopy={handleCopy}
                  onRevoke={handleRevoke}
                  isRevoking={revokeMutation.isPending}
                />
              ))}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareLinkItem({
  link,
  onCopy,
  onRevoke,
  isRevoking,
}: {
  link: StorageShareLink;
  onCopy: (token: string) => void;
  onRevoke: (linkId: string) => void;
  isRevoking: boolean;
}) {
  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
  const isLimitReached =
    link.maxDownloads !== null && link.downloadCount >= link.maxDownloads;

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-white/5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {link.maxDownloads !== null && (
            <span>
              {link.downloadCount}/{link.maxDownloads} downloads
            </span>
          )}
          {link.maxDownloads === null && (
            <span>{link.downloadCount} downloads</span>
          )}
          {link.expiresAt && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className={isExpired ? 'text-red-500' : ''}>
                {isExpired
                  ? 'Expirado'
                  : `Expira em ${new Date(link.expiresAt).toLocaleDateString('pt-BR')}`}
              </span>
            </>
          )}
          {isLimitReached && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-red-500">Limite atingido</span>
            </>
          )}
        </div>
      </div>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => onCopy(link.token)}
        title="Copiar link"
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() =>
          window.open(`/shared/${link.token}`, '_blank')
        }
        title="Abrir em nova aba"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => onRevoke(link.id)}
        disabled={isRevoking}
        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        title="Revogar link"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
