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
} from '@/components/ui/alert-dialog';
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
  useSuggestContacts,
  useSyncEmailAccount,
} from '@/hooks/email/use-email';
import { cn } from '@/lib/utils';
import { emailService } from '@/services/email';
import type { EmailAccount, EmailMessageListItem } from '@/types/email';
import { Color, FontSize } from '@tiptap/extension-text-style';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import PlaceholderExt from '@tiptap/extension-placeholder';
import TextAlignExt from '@tiptap/extension-text-align';
import { TextStyle as TextStyleExt } from '@tiptap/extension-text-style';
import UnderlineExt from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  FileText,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Paperclip,
  PenLine,
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
  // Signature is stored as HTML from TipTap editor — render it directly
  // with a visual separator. No wrapping in <p> to avoid invalid nesting.
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/><div class="email-signature">${signature}</div>`;
}

// TipTap toolbar button (for toggle-style formatting buttons)
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

// Action button for toolbar (non-toggle, preserves user gesture for file inputs)
function ToolbarActionButton({
  onClick,
  tooltip,
  children,
}: {
  onClick: () => void;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground size-7 p-0 bg-transparent transition-[color,box-shadow] [&_svg]:pointer-events-none [&_svg]:shrink-0"
        >
          {children}
        </button>
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

// Contact suggestion type
interface ContactSuggestion {
  email: string;
  name: string | null;
}

// Chip input for email addresses with optional autocomplete
function ChipInput({
  chips,
  onChipsChange,
  placeholder,
  inputRef,
  suggestions = [],
  onInputChange,
}: {
  chips: string[];
  onChipsChange: (chips: string[]) => void;
  placeholder?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  suggestions?: ContactSuggestion[];
  onInputChange?: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const localRef = useRef<HTMLInputElement>(null);
  const ref = inputRef ?? localRef;

  // Filter out already-added chips from suggestions
  const filteredSuggestions = suggestions.filter(s => !chips.includes(s.email));

  function addChip(value: string) {
    const trimmed = value.trim();
    if (trimmed && !chips.includes(trimmed)) {
      onChipsChange([...chips, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
    setHighlightIdx(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx(prev =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        return;
      }
      if (
        (e.key === 'Enter' || e.key === 'Tab') &&
        highlightIdx >= 0 &&
        highlightIdx < filteredSuggestions.length
      ) {
        e.preventDefault();
        addChip(filteredSuggestions[highlightIdx].email);
        return;
      }
    }

    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      if (inputValue.trim()) {
        addChip(inputValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && chips.length > 0) {
      onChipsChange(chips.slice(0, -1));
    } else if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
    }
  }

  function handleBlur() {
    // Delay to allow suggestion click to fire
    setTimeout(() => {
      if (inputValue.trim()) {
        addChip(inputValue);
      }
      setShowSuggestions(false);
    }, 150);
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
    <div className="relative">
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
          onChange={e => {
            const val = e.target.value;
            setInputValue(val);
            setShowSuggestions(val.length >= 2);
            setHighlightIdx(-1);
            onInputChange?.(val);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onPaste={handlePaste}
          role="combobox"
          aria-expanded={showSuggestions && filteredSuggestions.length > 0}
          aria-autocomplete="list"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, idx) => (
            <button
              key={suggestion.email}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex flex-col gap-0.5',
                highlightIdx === idx && 'bg-accent'
              )}
              onMouseDown={e => {
                e.preventDefault();
                addChip(suggestion.email);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
            >
              {suggestion.name && (
                <span className="font-medium text-foreground truncate">
                  {suggestion.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground truncate">
                {suggestion.email}
              </span>
            </button>
          ))}
        </div>
      )}
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
  const [imageUrl, setImageUrl] = useState('');
  const [imagePopoverOpen, setImagePopoverOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [fontSizePopoverOpen, setFontSizePopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [includeSignature, setIncludeSignature] = useState(true);

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
      TextStyleExt,
      Color,
      FontSize,
      ImageExt.configure({ inline: true, allowBase64: true }),
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
    const sigHtml = includeSignature
      ? buildSignatureHtml(account?.signature ?? null)
      : '';

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
  }, [open, mode, accountId, includeSignature]);

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

  // ─── Contact autocomplete ─────────────────────────────────────────────
  const [contactQuery, setContactQuery] = useState('');
  const [debouncedContactQuery, setDebouncedContactQuery] = useState('');

  useEffect(() => {
    if (contactQuery.length < 2) {
      setDebouncedContactQuery('');
      return;
    }
    const timer = setTimeout(() => setDebouncedContactQuery(contactQuery), 300);
    return () => clearTimeout(timer);
  }, [contactQuery]);

  const suggestQuery = useSuggestContacts(debouncedContactQuery);
  const contactSuggestions: ContactSuggestion[] =
    suggestQuery.data?.contacts?.map(c => ({
      email: c.email,
      name: c.name,
    })) ?? [];

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

    console.log('[Compose] Sending email', {
      accountId,
      to: toChips,
      subject,
      hasBody: !!bodyHtml,
      attachments: attachmentFiles.length,
    });

    // Gmail-style: close dialog immediately, send in background
    const sendData = {
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
    };

    sendMutation.mutate(sendData, {
      onSuccess: () => {
        // Fire-and-forget sync — do NOT await or chain errors,
        // otherwise a 401 on sync would log the user out.
        syncMutation.mutate(accountId, {
          onError: () => {},
        });
      },
    });

    // Close immediately — toast feedback comes from the hook
    setAttachmentFiles([]);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    onClose();
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
      {
        onSuccess: () => {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          onClose();
          // Fire-and-forget sync so the draft appears in the folder list
          syncMutation.mutate(accountId, { onError: () => {} });
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
    draftMutation,
    syncMutation,
    onClose,
  ]);

  const isBusy = sendMutation.isPending || draftMutation.isPending;

  const DRAFT_STORAGE_KEY = 'opensea-email-draft';
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<Date | null>(null);

  // Periodic auto-save to localStorage every 30s while editing
  useEffect(() => {
    if (!open || !editor) return;
    const interval = setInterval(() => {
      const hasContent =
        toChips.length > 0 ||
        subject.trim() !== '' ||
        (editor.getHTML() !== '<p></p>' && editor.getText().trim() !== '');
      if (!hasContent) return;
      try {
        localStorage.setItem(
          DRAFT_STORAGE_KEY,
          JSON.stringify({
            accountId,
            to: toChips,
            cc: ccChips.length ? ccChips : undefined,
            bcc: bccChips.length ? bccChips : undefined,
            subject,
            bodyHtml: editor.getHTML(),
          })
        );
        setLastDraftSavedAt(new Date());
      } catch {
        // Storage full — silently ignore
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [open, editor, accountId, toChips, ccChips, bccChips, subject]);

  // Clear draft saved indicator when dialog closes
  useEffect(() => {
    if (!open) setLastDraftSavedAt(null);
  }, [open]);

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

  // ─── Close with draft discard confirmation ──────────────────────────────
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const saveDraftAndClose = useCallback(() => {
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
        toast.success('Rascunho salvo');
        syncMutation.mutate(accountId, { onError: () => {} });
      })
      .catch(() => {
        try {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
          toast.warning('Rascunho salvo localmente (offline)');
        } catch {
          // Storage full
        }
      });
    onClose();
  }, [
    toChips,
    ccChips,
    bccChips,
    subject,
    editor,
    accountId,
    onClose,
    syncMutation,
  ]);

  const discardAndClose = useCallback(() => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    onClose();
  }, [onClose]);

  const handleClose = useCallback(() => {
    if (hasUnsavedContent() && !isBusy) {
      setDiscardConfirmOpen(true);
    } else {
      onClose();
    }
  }, [hasUnsavedContent, isBusy, onClose]);

  const FONT_SIZES = [
    { label: 'Pequeno', value: '12px' },
    { label: 'Normal', value: '14px' },
    { label: 'Médio', value: '16px' },
    { label: 'Grande', value: '20px' },
    { label: 'Muito grande', value: '24px' },
    { label: 'Enorme', value: '32px' },
  ];

  const COLOR_PRESETS = [
    '#000000',
    '#434343',
    '#666666',
    '#999999',
    '#cccccc',
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#0ea5e9',
    '#6366f1',
  ];

  function handleSetColor(color: string) {
    editor?.chain().focus().setColor(color).run();
    setColorPopoverOpen(false);
  }

  function handleSetFontSize(size: string) {
    editor?.chain().focus().setFontSize(size).run();
    setFontSizePopoverOpen(false);
  }

  function handleInsertImageUrl() {
    if (!editor || !imageUrl.trim()) return;
    let url = imageUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    try {
      new URL(url);
    } catch {
      toast.error('URL de imagem inválida.');
      return;
    }
    editor.chain().focus().setImage({ src: url }).run();
    setImageUrl('');
    setImagePopoverOpen(false);
  }

  function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      editor.chain().focus().setImage({ src: base64 }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setImagePopoverOpen(false);
  }

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

  /** Validates and adds files to attachments (shared by input + drag-drop) */
  function addFiles(files: File[]) {
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
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  // G2: Drag & drop handlers for the compose area
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
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
          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileUpload}
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
                      suggestions={contactSuggestions}
                      onInputChange={setContactQuery}
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
                    suggestions={contactSuggestions}
                    onInputChange={setContactQuery}
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
                    suggestions={contactSuggestions}
                    onInputChange={setContactQuery}
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

            {/* Font size */}
            <Popover
              open={fontSizePopoverOpen}
              onOpenChange={setFontSizePopoverOpen}
            >
              <PopoverTrigger asChild>
                <div>
                  <ToolbarButton
                    onClick={() => setFontSizePopoverOpen(true)}
                    tooltip="Tamanho da fonte"
                  >
                    <span className="text-[10px] font-bold leading-none">
                      A
                    </span>
                  </ToolbarButton>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-36 p-1" side="bottom" align="start">
                {FONT_SIZES.map(fs => (
                  <button
                    key={fs.value}
                    type="button"
                    className="w-full text-left px-2.5 py-1.5 text-sm rounded-md hover:bg-muted transition-colors"
                    style={{ fontSize: fs.value }}
                    onClick={() => handleSetFontSize(fs.value)}
                  >
                    {fs.label}
                  </button>
                ))}
                <Separator className="my-1" />
                <button
                  type="button"
                  className="w-full text-left px-2.5 py-1.5 text-xs text-muted-foreground rounded-md hover:bg-muted transition-colors"
                  onClick={() => {
                    editor?.chain().focus().unsetFontSize().run();
                    setFontSizePopoverOpen(false);
                  }}
                >
                  Tamanho padrão
                </button>
              </PopoverContent>
            </Popover>

            {/* Text color */}
            <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
              <PopoverTrigger asChild>
                <div>
                  <ToolbarButton
                    onClick={() => setColorPopoverOpen(true)}
                    tooltip="Cor do texto"
                  >
                    <Palette className="size-3.5" />
                  </ToolbarButton>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-3"
                side="bottom"
                align="start"
              >
                <p className="text-xs font-medium mb-2">Cor do texto</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {COLOR_PRESETS.map(color => (
                    <button
                      key={color}
                      type="button"
                      className="size-6 rounded-md border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handleSetColor(color)}
                      title={color}
                    />
                  ))}
                </div>
                <Separator className="my-2" />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="size-6 cursor-pointer border-0 p-0 bg-transparent"
                    onChange={e => handleSetColor(e.target.value)}
                    title="Cor personalizada"
                  />
                  <span className="text-xs text-muted-foreground">
                    Personalizada
                  </span>
                </div>
                <button
                  type="button"
                  className="w-full mt-2 text-left px-2 py-1 text-xs text-muted-foreground rounded-md hover:bg-muted transition-colors"
                  onClick={() => {
                    editor?.chain().focus().unsetColor().run();
                    setColorPopoverOpen(false);
                  }}
                >
                  Remover cor
                </button>
              </PopoverContent>
            </Popover>

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

            {/* Image popover */}
            <Popover open={imagePopoverOpen} onOpenChange={setImagePopoverOpen}>
              <PopoverTrigger asChild>
                <div>
                  <ToolbarButton
                    onClick={() => setImagePopoverOpen(true)}
                    tooltip="Inserir imagem"
                  >
                    <ImageIcon className="size-3.5" />
                  </ToolbarButton>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="w-72 p-3 space-y-2"
                side="bottom"
                align="start"
              >
                <p className="text-xs font-medium">Inserir imagem</p>
                <Input
                  placeholder="https://exemplo.com/imagem.png"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleInsertImageUrl();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImageIcon className="size-3" />
                    Enviar arquivo
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setImageUrl('');
                        setImagePopoverOpen(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleInsertImageUrl}
                      disabled={!imageUrl.trim()}
                    >
                      Inserir
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Separator orientation="vertical" className="h-5 mx-0.5" />

            <ToolbarActionButton
              onClick={() => fileInputRef.current?.click()}
              tooltip="Anexar arquivo"
            >
              <Paperclip className="size-3.5" />
            </ToolbarActionButton>
          </div>

          {/* TipTap editor body - fills remaining space, with drag-drop zone */}
          <div
            className={cn(
              'flex-1 min-h-0 overflow-y-auto px-6 py-4 relative transition-colors bg-gray-50 dark:bg-white/[0.03]',
              isDragOver && 'bg-blue-50 dark:bg-blue-500/10'
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <EditorContent editor={editor} className="h-full" />
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="border-2 border-dashed border-blue-400 dark:border-blue-500 rounded-xl p-6 bg-blue-50/80 dark:bg-blue-500/15 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Paperclip className="size-5" />
                    <span className="text-sm font-medium">
                      Solte os arquivos para anexar
                    </span>
                  </div>
                </div>
              </div>
            )}
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
              {lastDraftSavedAt && (
                <span className="text-[11px] text-muted-foreground/70 hidden sm:inline">
                  Rascunho salvo às{' '}
                  {lastDraftSavedAt.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              {selectedAccount?.signature && (
                <button
                  type="button"
                  onClick={() => setIncludeSignature(prev => !prev)}
                  className={cn(
                    'text-xs hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                    includeSignature
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                  title={
                    includeSignature
                      ? 'Clique para remover assinatura'
                      : 'Clique para incluir assinatura'
                  }
                >
                  <PenLine className="size-3" />
                  {includeSignature ? 'Assinatura incluída' : 'Sem assinatura'}
                </button>
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
                disabled={toChips.length === 0 || !accountId}
                onClick={handleSend}
              >
                <Send className="size-4" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Draft discard confirmation */}
      <AlertDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem conteúdo não salvo. Deseja salvar como rascunho ou
              descartar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                setDiscardConfirmOpen(false);
                discardAndClose();
              }}
            >
              Descartar
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setDiscardConfirmOpen(false);
                saveDraftAndClose();
              }}
            >
              Salvar rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
