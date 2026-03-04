'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSaveDraft, useSendMessage, useSyncEmailAccount } from '@/hooks/email/use-email';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
import { useAuth } from '@/contexts/auth-context';
import LinkExt from '@tiptap/extension-link';
import PlaceholderExt from '@tiptap/extension-placeholder';
import TextAlignExt from '@tiptap/extension-text-align';
import UnderlineExt from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileText,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Paperclip,
  Send,
  UnderlineIcon,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function parseAddresses(value: string): string[] {
  return value
    .split(/[;,]/)
    .map(s => s.trim())
    .filter(Boolean);
}

function buildSignatureHtml(signature: string | null): string {
  if (!signature) return '';
  return `<hr/><p>${signature.replace(/\n/g, '<br/>')}</p>`;
}

// ── TipTap toolbar button ────────────────────────────────────────────────────
function ToolbarButton({
  onClick,
  active,
  tooltip,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          pressed={active}
          onPressedChange={onClick}
          size="sm"
          className="size-7 p-0"
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

interface ComposeMode {
  type: 'new' | 'reply' | 'replyAll' | 'forward';
  message?: EmailMessageListItem;
  replyAllTo?: string[];
  replyAllCc?: string[];
  /** RFC Message-ID of the original message (e.g. <abc123@gmail.com>), used for In-Reply-To / References headers */
  rfcMessageId?: string | null;
}

interface EmailComposeDialogProps {
  open: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  defaultAccountId?: string;
  mode?: ComposeMode;
}

export function EmailComposeDialog({
  open,
  onClose,
  accounts,
  defaultAccountId,
  mode = { type: 'new' },
}: EmailComposeDialogProps) {
  const { user } = useAuth();
  const [accountId, setAccountId] = useState(
    defaultAccountId ?? accounts[0]?.id ?? ''
  );
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(a => a.id === accountId);

  // Current user's email addresses (all account addresses) for filtering self in replyAll
  const myAddresses = new Set(
    accounts.map(a => a.address.toLowerCase())
  );
  // Also add the user's profile email
  if (user?.email) myAddresses.add(user.email.toLowerCase());

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
      TextAlignExt.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderExt.configure({ placeholder: 'Escreva sua mensagem aqui...' }),
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[160px] focus:outline-none py-1 text-sm leading-relaxed',
      },
    },
  });

  // Pre-fill on mode change
  useEffect(() => {
    if (!open || !editor) return;
    const account = accounts.find(a => a.id === accountId);
    const sigHtml = buildSignatureHtml(account?.signature ?? null);

    if (mode.type === 'reply' && mode.message) {
      setTo(mode.message.fromAddress);
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Re:')
          ? mode.message.subject
          : `Re: ${mode.message.subject}`
      );
      const quotedHeader = `<p><br/></p><blockquote><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p></blockquote>`;
      editor.commands.setContent(`<p></p>${sigHtml}${quotedHeader}`);
    } else if (mode.type === 'replyAll' && mode.message) {
      // Filter out current user's addresses from to and cc
      const allTo = [mode.message.fromAddress, ...(mode.replyAllTo ?? [])]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .filter(addr => !myAddresses.has(addr.toLowerCase()));
      const ccAddresses = (mode.replyAllCc ?? [])
        .filter(addr => !myAddresses.has(addr.toLowerCase()));

      setTo(allTo.join(', '));
      if (ccAddresses.length) {
        setCc(ccAddresses.join(', '));
        setShowCc(true);
      } else {
        setCc('');
        setShowCc(false);
      }
      setBcc('');
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Re:')
          ? mode.message.subject
          : `Re: ${mode.message.subject}`
      );
      const quotedHeader = `<p><br/></p><blockquote><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p></blockquote>`;
      editor.commands.setContent(`<p></p>${sigHtml}${quotedHeader}`);
    } else if (mode.type === 'forward' && mode.message) {
      setTo('');
      setCc('');
      setBcc('');
      setShowCc(false);
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Fwd:')
          ? mode.message.subject
          : `Fwd: ${mode.message.subject}`
      );
      const fwdDate = new Date(mode.message.receivedAt).toLocaleString('pt-BR');
      editor.commands.setContent(
        `<p></p>${sigHtml}<hr/><p><strong>---------- Mensagem encaminhada ----------</strong><br/>De: ${mode.message.fromName ? `${mode.message.fromName} &lt;${mode.message.fromAddress}&gt;` : mode.message.fromAddress}<br/>Data: ${fwdDate}<br/>Assunto: ${mode.message.subject}</p>`
      );
    } else {
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setShowCc(false);
      setShowBcc(false);
      editor.commands.setContent(`<p></p>${sigHtml}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, accountId]);

  useEffect(() => {
    if (defaultAccountId) setAccountId(defaultAccountId);
  }, [defaultAccountId]);

  // Auto-focus "Para:" field when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => toInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Reset attachments when dialog closes
  useEffect(() => {
    if (!open) setAttachmentFiles([]);
  }, [open]);

  // ─── Mutations via hooks ─────────────────────────────────────────────────

  const sendMutation = useSendMessage();
  const draftMutation = useSaveDraft();
  const syncMutation = useSyncEmailAccount();

  const handleSend = useCallback(() => {
    const bodyHtml = editor?.getHTML() ?? '';
    if (!to.trim()) {
      toast.error('Preencha o campo "Para"');
      return;
    }

    sendMutation.mutate(
      {
        accountId,
        to: parseAddresses(to),
        cc: cc ? parseAddresses(cc) : undefined,
        bcc: bcc ? parseAddresses(bcc) : undefined,
        subject,
        bodyHtml,
        // Pass reply/forward headers when applicable (must use RFC Message-ID, not DB UUID)
        ...(mode.type === 'reply' || mode.type === 'replyAll'
          ? {
              inReplyTo: mode.rfcMessageId ?? undefined,
              references: mode.rfcMessageId ? [mode.rfcMessageId] : undefined,
            }
          : {}),
        ...(mode.type === 'forward' && mode.rfcMessageId
          ? { references: [mode.rfcMessageId] }
          : {}),
        attachments: attachmentFiles.length ? attachmentFiles : undefined,
      },
      {
        onSuccess: () => {
          setAttachmentFiles([]);
          onClose();
          // Trigger sync for the sending account to refresh Sent folder
          syncMutation.mutate(accountId);
        },
      }
    );
  }, [
    editor, to, cc, bcc, subject, accountId, attachmentFiles,
    mode, sendMutation, syncMutation, onClose,
  ]);

  const handleSaveDraft = useCallback(() => {
    draftMutation.mutate(
      {
        accountId,
        to: parseAddresses(to),
        cc: cc ? parseAddresses(cc) : undefined,
        bcc: bcc ? parseAddresses(bcc) : undefined,
        subject,
        bodyHtml: editor?.getHTML() ?? '',
      },
      { onSuccess: () => onClose() }
    );
  }, [editor, to, cc, bcc, subject, accountId, draftMutation, onClose]);

  const isBusy = sendMutation.isPending || draftMutation.isPending;

  // Auto-save draft on close if content exists
  const handleClose = useCallback(() => {
    const hasContent =
      to.trim() ||
      cc.trim() ||
      bcc.trim() ||
      subject.trim() ||
      (editor && editor.getHTML() !== '<p></p>' && editor.getText().trim());

    if (hasContent && accountId && !isBusy) {
      emailService
        .saveDraft({
          accountId,
          to: parseAddresses(to),
          cc: cc ? parseAddresses(cc) : undefined,
          bcc: bcc ? parseAddresses(bcc) : undefined,
          subject,
          bodyHtml: editor?.getHTML() ?? '',
        })
        .then(() => toast.success('Rascunho salvo automaticamente'))
        .catch(() => {});
    }
    onClose();
  }, [to, cc, bcc, subject, editor, accountId, isBusy, onClose]);

  function handleSetLink() {
    if (!editor) return;
    const url = window.prompt('URL do link:');
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setAttachmentFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}:${f.size}`));
      const unique = files.filter(f => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...unique];
    });
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  function removeAttachment(idx: number) {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const title =
    mode.type === 'reply'
      ? 'Responder'
      : mode.type === 'replyAll'
        ? 'Responder a todos'
        : mode.type === 'forward'
          ? 'Encaminhar'
          : 'Novo e-mail';

  return (
    <TooltipProvider delayDuration={200}>
      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="sm:max-w-[680px] p-0 gap-0">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-base">{title}</DialogTitle>
          </DialogHeader>

          <Separator />

          <div className="px-5 py-4 space-y-3">
            {/* From */}
            <div className="flex items-center gap-3">
              <Label className="w-12 text-right text-sm text-muted-foreground shrink-0">
                De
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Selecionar conta..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-sm">
                      {acc.displayName
                        ? `${acc.displayName} <${acc.address}>`
                        : acc.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To */}
            <div className="flex items-center gap-3">
              <Label className="w-12 text-right text-sm text-muted-foreground shrink-0">
                Para
              </Label>
              <div className="flex-1 flex items-center gap-1">
                <Input
                  ref={toInputRef}
                  className="h-8 text-sm flex-1"
                  placeholder="destinatario@email.com"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                />
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  onClick={() => setShowCc(s => !s)}
                >
                  Cc
                </button>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
                  onClick={() => setShowBcc(s => !s)}
                >
                  Bcc
                </button>
              </div>
            </div>

            {/* CC */}
            {showCc && (
              <div className="flex items-center gap-3">
                <Label className="w-12 text-right text-sm text-muted-foreground shrink-0">
                  Cc
                </Label>
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="cc@email.com"
                  value={cc}
                  onChange={e => setCc(e.target.value)}
                />
              </div>
            )}

            {/* BCC */}
            {showBcc && (
              <div className="flex items-center gap-3">
                <Label className="w-12 text-right text-sm text-muted-foreground shrink-0">
                  Bcc
                </Label>
                <Input
                  className="h-8 text-sm flex-1"
                  placeholder="cco@email.com"
                  value={bcc}
                  onChange={e => setBcc(e.target.value)}
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-3">
              <Label className="w-12 text-right text-sm text-muted-foreground shrink-0">
                Assunto
              </Label>
              <Input
                className="h-8 text-sm flex-1"
                placeholder="Assunto do e-mail"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* TipTap toolbar */}
          <div className="flex items-center gap-0.5 px-5 py-1.5 border-b bg-muted/30 flex-wrap">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              active={editor?.isActive('bold')}
              tooltip="Negrito (Ctrl+B)"
            >
              <Bold className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              active={editor?.isActive('italic')}
              tooltip="It\u00e1lico (Ctrl+I)"
            >
              <Italic className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              active={editor?.isActive('underline')}
              tooltip="Sublinhado (Ctrl+U)"
            >
              <UnderlineIcon className="size-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              tooltip="Alinhar \u00e0 esquerda"
            >
              <AlignLeft className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().setTextAlign('center').run()
              }
              active={editor?.isActive({ textAlign: 'center' })}
              tooltip="Centralizar"
            >
              <AlignCenter className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor?.chain().focus().setTextAlign('right').run()
              }
              active={editor?.isActive({ textAlign: 'right' })}
              tooltip="Alinhar \u00e0 direita"
            >
              <AlignRight className="size-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              active={editor?.isActive('bulletList')}
              tooltip="Lista com marcadores"
            >
              <List className="size-3.5" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              active={editor?.isActive('orderedList')}
              tooltip="Lista numerada"
            >
              <ListOrdered className="size-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarButton
              onClick={handleSetLink}
              active={editor?.isActive('link')}
              tooltip="Inserir link"
            >
              <Link2 className="size-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-5 mx-1" />

            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              tooltip="Anexar arquivo"
            >
              <Paperclip className="size-3.5" />
            </ToolbarButton>

            {selectedAccount?.signature && (
              <>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <span className="text-[10px] text-muted-foreground ml-1">
                  Assinatura:{' '}
                  {selectedAccount.displayName ?? selectedAccount.address}
                </span>
              </>
            )}
          </div>

          {/* TipTap editor body */}
          <div className="px-5 py-2 min-h-[180px] max-h-80 overflow-y-auto">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {/* Attachment chips */}
          {attachmentFiles.length > 0 && (
            <div className="px-5 pb-2 flex flex-wrap gap-1.5">
              {attachmentFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-1.5 bg-muted rounded-md px-2 py-1 text-xs max-w-[200px]"
                >
                  <FileText className="size-3 shrink-0 text-muted-foreground" />
                  <span className="truncate" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    ({formatBytes(file.size)})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label={`Remover ${file.name}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              disabled={isBusy || !accountId}
              onClick={handleSaveDraft}
            >
              {draftMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              Salvar rascunho
            </Button>

            <Button
              size="sm"
              className="gap-2"
              disabled={isBusy || !to || !accountId}
              onClick={handleSend}
            >
              {sendMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
