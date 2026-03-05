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
import {
  useSaveDraft,
  useSendMessage,
  useSyncEmailAccount,
} from '@/hooks/email/use-email';
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
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium max-w-[200px]">
      <span className="truncate">{email}</span>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
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
      className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1 min-h-[32px] cursor-text"
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
      const quotedHeader = `<p><br/></p><blockquote><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p></blockquote>`;
      editor.commands.setContent(`<p></p>${sigHtml}${quotedHeader}`);
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
      const quotedHeader = `<p><br/></p><blockquote><p>Em ${new Date(mode.message.receivedAt).toLocaleString('pt-BR')}, ${mode.message.fromName || mode.message.fromAddress} escreveu:</p></blockquote>`;
      editor.commands.setContent(`<p></p>${sigHtml}${quotedHeader}`);
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
      editor.commands.setContent(
        `<p></p>${sigHtml}<hr/><p><strong>---------- Mensagem encaminhada ----------</strong><br/>De: ${mode.message.fromName ? `${mode.message.fromName} &lt;${mode.message.fromAddress}&gt;` : mode.message.fromAddress}<br/>Data: ${fwdDate}<br/>Assunto: ${mode.message.subject}</p>`
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
          onClose();
          syncMutation.mutate(accountId);
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

  // Auto-save draft on close if content exists
  const handleClose = useCallback(() => {
    const hasContent =
      toChips.length > 0 ||
      ccChips.length > 0 ||
      bccChips.length > 0 ||
      subject.trim() ||
      (editor && editor.getHTML() !== '<p></p>' && editor.getText().trim());

    if (hasContent && accountId && !isBusy) {
      emailService
        .saveDraft({
          accountId,
          to: toChips,
          cc: ccChips.length ? ccChips : undefined,
          bcc: bccChips.length ? bccChips : undefined,
          subject,
          bodyHtml: editor?.getHTML() ?? '',
        })
        .then(() => toast.success('Rascunho salvo automaticamente'))
        .catch(() => {});
    }
    onClose();
  }, [toChips, ccChips, bccChips, subject, editor, accountId, isBusy, onClose]);

  function handleInsertLink() {
    if (!editor || !linkUrl.trim()) return;
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.trim() })
      .run();
    setLinkUrl('');
    setLinkPopoverOpen(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setAttachmentFiles(prev => {
      const existing = new Set(prev.map(f => `${f.name}:${f.size}`));
      const unique = files.filter(f => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...unique];
    });
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
          className="sm:max-w-3xl p-0 gap-0 min-h-[600px] flex flex-col"
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
          <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
            <DialogTitle className="text-base font-semibold">
              {title}
            </DialogTitle>
          </DialogHeader>

          <Separator className="shrink-0" />

          <div className="px-5 py-3 space-y-2 shrink-0">
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
                      placeholder="destinatario@email.com"
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
              <span className="w-10" />
              <Input
                className="h-8 text-sm flex-1 border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
                placeholder="Assunto"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            </div>
          </div>

          <Separator className="shrink-0" />

          {/* TipTap editor body - fills remaining space */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
            <EditorContent editor={editor} className="h-full" />
          </div>

          {/* Attachment chips */}
          {attachmentFiles.length > 0 && (
            <div className="px-5 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {attachmentFiles.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center gap-1.5 bg-muted rounded-lg px-2.5 py-1.5 text-xs max-w-[220px]"
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

          {/* Footer: toolbar left, actions right */}
          <div className="flex items-center justify-between px-5 py-2.5 shrink-0">
            {/* Left: formatting toolbar + attachment */}
            <div className="flex items-center gap-0.5 flex-wrap">
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

              <Separator orientation="vertical" className="h-5 mx-0.5" />

              <ToolbarButton
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                active={editor?.isActive('bulletList')}
                tooltip="Lista com marcadores"
              >
                <List className="size-3.5" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor?.chain().focus().toggleOrderedList().run()
                }
                active={editor?.isActive('orderedList')}
                tooltip="Lista numerada"
              >
                <ListOrdered className="size-3.5" />
              </ToolbarButton>

              <Separator orientation="vertical" className="h-5 mx-0.5" />

              <ToolbarButton
                onClick={() =>
                  editor?.chain().focus().setTextAlign('left').run()
                }
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
                  side="top"
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

              {selectedAccount?.signature && (
                <span className="text-[10px] text-muted-foreground ml-2 hidden sm:inline">
                  Assinatura:{' '}
                  {selectedAccount.displayName ?? selectedAccount.address}
                </span>
              )}
            </div>

            {/* Right: discard + send */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-xs"
                disabled={isBusy || !accountId}
                onClick={handleSaveDraft}
              >
                {draftMutation.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileText className="size-3.5" />
                )}
                Descartar
              </Button>

              <Button
                size="sm"
                className="gap-2"
                disabled={isBusy || toChips.length === 0 || !accountId}
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
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
