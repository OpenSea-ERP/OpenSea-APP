'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useAuth } from '@/contexts/auth-context';
import {
  useSaveDraft,
  useSendMessage,
  useSyncEmailAccount,
} from '@/hooks/email/use-email';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
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

// TipTap toolbar button
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

// Email chip component
function EmailChip({
  email,
  onRemove,
}: {
  email: string;
  onRemove: () => void;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium max-w-[200px]"
      title={email}
    >
      <span className="truncate">{email}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        aria-label={`Remover ${email}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

// Chip input for email addresses
function ChipInput({
  chips,
  onChipsChange,
  placeholder,
  inputRef,
}: {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const [inputValue, setInputValue] = useState('');
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;

  function addChip(value: string) {
    const trimmed = value.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChipsChange([...chips, trimmed]);
    }
    setInputValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim()) {
        addChip(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && chips.length > 0) {
      onChipsChange(chips.slice(0, -1));
    }
  }

  function handleBlur() {
    if (inputValue.trim()) {
      addChip(inputValue);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const addresses = pasted.split(/[;,\s]+/).filter(s => s.trim());
    const newChips = [...chips];
    for (const addr of addresses) {
      const trimmed = addr.trim();
      if (trimmed && !newChips.includes(trimmed)) {
        newChips.push(trimmed);
      }
    }
    onChipsChange(newChips);
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-(--input-radius) border border-[rgb(var(--color-border))] bg-(--input-bg) px-2 py-1 min-h-[32px] cursor-text transition-all duration-(--transition-normal) focus-within:border-[rgb(var(--color-border-focus))] focus-within:ring-[3px] focus-within:ring-[rgb(var(--color-ring)/0.5)]"
      onClick={() => ref.current?.focus()}
    >
      {chips.map((chip, idx) => (
        <EmailChip
          key={`${chip}-${idx}`}
          email={chip}
          onRemove={() => onChipsChange(chips.filter((_, i) => i !== idx))}
        />
      ))}
      <input
        ref={ref}
        className="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground py-0.5"
        placeholder={chips.length === 0 ? placeholder : ''}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onPaste={handlePaste}
      />
    </div>
  );
}

interface ComposeMode {
  type: 'new' | 'reply' | 'replyAll' | 'forward';
  message?: EmailMessageListItem;
  replyAllTo?: string[];
  replyAllCc?: string[];
  /** RFC Message-ID of the original message (e.g. <abc123@gmail.com>), used for In-Reply-To / References headers */
  rfcMessageId?: string | null;
  /** Sanitized HTML body of the original message for quoting in reply/forward */
  quotedBody?: string | null;
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
  const [toChips, setToChips] = useState<string[]>([]);
  const [ccChips, setCcChips] = useState<string[]>([]);
  const [bccChips, setBccChips] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = accounts.find(a => a.id === accountId);

  // Current user's email addresses (all account addresses) for filtering self in replyAll
  const myAddresses = new Set(accounts.map(a => a.address.toLowerCase()));
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
          'prose prose-sm dark:prose-invert max-w-none min-h-[200px] focus:outline-none py-1 text-sm leading-relaxed',
      },
    },
  });

  // Pre-fill on mode change
  useEffect(() => {
    if (!open || !editor) return;
    const account = accounts.find(a => a.id === accountId);
    const sigHtml = buildSignatureHtml(account?.signature ?? null);

    if (mode.type === 'reply' && mode.message) {
      setToChips([mode.message.fromAddress]);
      setCcChips([]);
      setBccChips([]);
      setShowCc(false);
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Re:')
          ? mode.message.subject
          : `Re: ${mode.message.subject}`
      );
      const quotedBody = mode.quotedBody
        ? `<blockquote>${mode.quotedBody}</blockquote>`
        : '';
      const quotedHeader = `<p><br/></p><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p>`;
      editor.commands.setContent(
        `<p></p>${sigHtml}${quotedHeader}${quotedBody}`
      );
    } else if (mode.type === 'replyAll' && mode.message) {
      const allTo = [mode.message.fromAddress, ...(mode.replyAllTo ?? [])]
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .filter(addr => !myAddresses.has(addr.toLowerCase()));
      const ccAddresses = (mode.replyAllCc ?? []).filter(
        addr => !myAddresses.has(addr.toLowerCase())
      );

      setToChips(allTo);
      if (ccAddresses.length) {
        setCcChips(ccAddresses);
        setShowCc(true);
      } else {
        setCcChips([]);
        setShowCc(false);
      }
      setBccChips([]);
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Re:')
          ? mode.message.subject
          : `Re: ${mode.message.subject}`
      );
      const quotedBodyAll = mode.quotedBody
        ? `<blockquote>${mode.quotedBody}</blockquote>`
        : '';
      const quotedHeaderAll = `<p><br/></p><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p>`;
      editor.commands.setContent(
        `<p></p>${sigHtml}${quotedHeaderAll}${quotedBodyAll}`
      );
    } else if (mode.type === 'forward' && mode.message) {
      setToChips([]);
      setCcChips([]);
      setBccChips([]);
      setShowCc(false);
      setShowBcc(false);
      setSubject(
        mode.message.subject.startsWith('Fwd:')
          ? mode.message.subject
          : `Fwd: ${mode.message.subject}`
      );
      const fwdDate = new Date(mode.message.receivedAt).toLocaleString('pt-BR');
      const fwdBody = mode.quotedBody ?? '';
      editor.commands.setContent(
        `<p></p>${sigHtml}<hr/><p><strong>---------- Mensagem encaminhada ----------</strong><br/>De: ${mode.message.fromName ? `${mode.message.fromName} &lt;${mode.message.fromAddress}&gt;` : mode.message.fromAddress}<br/>Data: ${fwdDate}<br/>Assunto: ${mode.message.subject}</p>${fwdBody}`
      );
    } else {
      setToChips([]);
      setCcChips([]);
      setBccChips([]);
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

  // Mutations via hooks
  const sendMutation = useSendMessage();
  const draftMutation = useSaveDraft();
  const syncMutation = useSyncEmailAccount();

  const handleSend = useCallback(() => {
    const bodyHtml = editor?.getHTML() ?? '';
    if (toChips.length === 0) {
      toast.error('Preencha o campo "Para"');
      return;
    }

    console.log('[Compose] Sending email', { accountId, to: toChips, subject, hasBody: !!bodyHtml, attachments: attachmentFiles.length });

    sendMutation.mutate(
      {
        accountId,
        to: toChips,
        cc: ccChips.length ? ccChips : undefined,
        bcc: bccChips.length ? bccChips : undefined,
        subject,
        bodyHtml,
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
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          onClose();
          // Fire-and-forget sync — do NOT await or chain errors,
          // otherwise a 401 on sync would log the user out.
          syncMutation.mutate(accountId, {
            onError: () => {},
          });
        },
      }
    );
  }, [
    editor,
    toChips,
    ccChips,
    bccChips,
    subject,
    accountId,
    attachmentFiles,
    mode,
    sendMutation,
    syncMutation,
    onClose,
  ]);

  const handleSaveDraft = useCallback(() => {
    draftMutation.mutate(
      {
        accountId,
        to: toChips,
        cc: ccChips.length ? ccChips : undefined,
        bcc: bccChips.length ? bccChips : undefined,
        subject,
        bodyHtml: editor?.getHTML() ?? '',
      },
      { onSuccess: () => onClose() }
    );
  }, [
    editor,
    toChips,
    ccChips,
    bccChips,
    subject,
    accountId,
    draftMutation,
    onClose,
  ]);

  const isBusy = sendMutation.isPending || draftMutation.isPending;

  const DRAFT_STORAGE_KEY = 'opensea-email-draft';

  // Detect unsaved content for beforeunload warning
  const hasUnsavedContent = useCallback(() => {
    return (
      toChips.length > 0 ||
      ccChips.length > 0 ||
      bccChips.length > 0 ||
      subject.trim() !== '' ||
      (editor &&
        editor.getHTML() !== '<p></p>' &&
        editor.getText().trim() !== '')
    );
  }, [toChips, ccChips, bccChips, subject, editor]);

  // Warn on page unload if compose has unsaved content
  useEffect(() => {
    if (!open) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedContent()) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [open, hasUnsavedContent]);

  // Restore draft from localStorage on open (fallback recovery)
  useEffect(() => {
    if (!open || !editor) return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved && mode.type === 'new') {
        const draft = JSON.parse(saved) as {
          to?: string[];
          cc?: string[];
          bcc?: string[];
          subject?: string;
          bodyHtml?: string;
          accountId?: string;
        };
        if (draft.to?.length || draft.subject || draft.bodyHtml) {
          setToChips(draft.to ?? []);
          setCcChips(draft.cc ?? []);
          setBccChips(draft.bcc ?? []);
          setSubject(draft.subject ?? '');
          if (draft.bodyHtml) editor.commands.setContent(draft.bodyHtml);
          if (draft.accountId) setAccountId(draft.accountId);
          toast.info('Rascunho local restaurado');
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editor]);

  // Auto-save draft on close if content exists
  const handleClose = useCallback(() => {
    const hasContent = hasUnsavedContent();

    if (hasContent && accountId && !isBusy) {
      const draftData = {
        accountId,
        to: toChips,
        cc: ccChips.length ? ccChips : undefined,
        bcc: bccChips.length ? bccChips : undefined,
        subject,
        bodyHtml: editor?.getHTML() ?? '',
      };

      emailService
        .saveDraft(draftData)
        .then(() => {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          toast.success('Rascunho salvo automaticamente');
        })
        .catch(() => {
          // API failed — persist to localStorage as fallback
          try {
            localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
            toast.warning('Rascunho salvo localmente (offline)');
          } catch {
            // Storage full — silently ignore
          }
        });
    }
    onClose();
  }, [
    toChips,
    ccChips,
    bccChips,
    subject,
    editor,
    accountId,
    isBusy,
    onClose,
    hasUnsavedContent,
  ]);

  function handleInsertLink() {
    if (!editor || !linkUrl.trim()) return;
    let url = linkUrl.trim();
    // Auto-prefix protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    try {
      new URL(url);
    } catch {
      toast.error('URL inválida. Verifique o endereço.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkUrl('');
    setLinkPopoverOpen(false);
  }

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB per file
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB total
  const BLOCKED_EXTENSIONS = new Set([
    '.exe',
    '.bat',
    '.cmd',
    '.scr',
    '.pif',
    '.msi',
    '.js',
    '.vbs',
    '.wsf',
  ]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const rejected: string[] = [];
    const accepted: File[] = [];
    const currentTotal = attachmentFiles.reduce((s, f) => s + f.size, 0);
    let runningTotal = currentTotal;

    for (const file of files) {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (BLOCKED_EXTENSIONS.has(ext)) {
        rejected.push(`${file.name}: tipo de arquivo não permitido`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(`${file.name}: excede 25 MB`);
        continue;
      }
      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        rejected.push(`${file.name}: limite total de 50 MB excedido`);
        continue;
      }
      runningTotal += file.size;
      accepted.push(file);
    }

    if (rejected.length > 0) {
      toast.error(rejected.join('\n'));
    }

    if (accepted.length > 0) {
      setAttachmentFiles(prev => {
        const existing = new Set(prev.map(f => `${f.name}:${f.size}`));
        const unique = accepted.filter(
          f => !existing.has(`${f.name}:${f.size}`)
        );
        return [...prev, ...unique];
      });
    }
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
        <DialogContent
          className="sm:max-w-3xl p-0 gap-0 max-h-[90vh] min-h-[400px] flex flex-col sm:rounded-2xl"
          data-testid="email-compose-dialog"
        >
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="px-6 py-3 space-y-2.5 shrink-0">
            {/* From */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="w-10 text-right text-xs text-muted-foreground shrink-0">
                  De
                </span>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder="Selecionar conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem
                        key={acc.id}
                        value={acc.id}
                        className="text-sm"
                      >
                        {acc.displayName
                          ? `${acc.displayName} <${acc.address}>`
                          : acc.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* To */}
            <div className="flex items-start gap-3">
              <span className="w-10 text-right text-xs text-muted-foreground shrink-0 pt-1.5">
                Para
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <div className="flex-1">
                    <ChipInput
                      chips={toChips}
                      onChipsChange={setToChips}
                      placeholder="destinatário@email.com"
                      inputRef={toInputRef}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      className={`text-xs px-1.5 py-0.5 rounded transition-colors ${showCc ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setShowCc(s => !s)}
                    >
                      Cc
                    </button>
                    <button
                      type="button"
                      className={`text-xs px-1.5 py-0.5 rounded transition-colors ${showBcc ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => setShowBcc(s => !s)}
                    >
                      Cco
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CC */}
            {showCc && (
              <div className="flex items-start gap-3">
                <span className="w-10 text-right text-xs text-muted-foreground shrink-0 pt-1.5">
                  Cc
                </span>
                <div className="flex-1">
                  <ChipInput
                    chips={ccChips}
                    onChipsChange={setCcChips}
                    placeholder="cc@email.com"
                  />
                </div>
              </div>
            )}

            {/* BCC */}
            {showBcc && (
              <div className="flex items-start gap-3">
                <span className="w-10 text-right text-xs text-muted-foreground shrink-0 pt-1.5">
                  Cco
                </span>
                <div className="flex-1">
                  <ChipInput
                    chips={bccChips}
                    onChipsChange={setBccChips}
                    placeholder="cco@email.com"
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-3">
              <span className="w-10 text-right text-xs text-muted-foreground shrink-0">
                Assunto
              </span>
              <Input
                className="h-8 text-sm flex-1"
                placeholder="Assunto do e-mail"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
          </div>

          <Separator className="shrink-0" />

          {/* Formatting toolbar */}
          <div className="flex items-center gap-0.5 flex-wrap px-6 py-2.5 shrink-0 border-b bg-muted/30">
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
              tooltip="Itálico (Ctrl+I)"
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

            <Separator orientation="vertical" className="h-5 mx-0.5" />

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

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            <ToolbarButton
              onClick={() => editor?.chain().focus().setTextAlign('left').run()}
              active={editor?.isActive({ textAlign: 'left' })}
              tooltip="Alinhar à esquerda"
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
              tooltip="Alinhar à direita"
            >
              <AlignRight className="size-3.5" />
            </ToolbarButton>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            {/* Link popover */}
            <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
              <PopoverTrigger asChild>
                <div>
                  <ToolbarButton
                    onClick={() => setLinkPopoverOpen(true)}
                    active={editor?.isActive('link')}
                    tooltip="Inserir link"
                  >
                    <Link2 className="size-3.5" />
                  </ToolbarButton>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 space-y-2"
                side="bottom"
                align="start"
              >
                <p className="text-xs font-medium">Inserir link</p>
                <Input
                  placeholder="https://"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInsertLink();
                    }
                  }}
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setLinkUrl('');
                      setLinkPopoverOpen(false);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleInsertLink}
                    disabled={!linkUrl.trim()}
                  >
                    Inserir
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              tooltip="Anexar arquivo"
            >
              <Paperclip className="size-3.5" />
            </ToolbarButton>
          </div>

          {/* TipTap editor body - fills remaining space */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {/* Attachment chips */}
          {attachmentFiles.length > 0 && (
            <div className="px-6 pb-2 flex flex-wrap gap-2 shrink-0">
              {attachmentFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-1.5 bg-muted rounded-xl px-3 py-1.5 text-xs max-w-[240px]"
                >
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium" title={file.name}>
                    {file.name}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {formatBytes(file.size)}
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

          <Separator className="shrink-0" />

          {/* Footer: actions */}
          <div className="flex items-center justify-between px-6 py-3 shrink-0">
            <div className="flex items-center gap-2">
              {selectedAccount?.signature && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Assinatura:{' '}
                  {selectedAccount.displayName ?? selectedAccount.address}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs rounded-xl"
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
                size="default"
                className="gap-2 rounded-xl px-5"
                disabled={isBusy || toChips.length === 0 || !accountId}
                onClick={handleSend}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
