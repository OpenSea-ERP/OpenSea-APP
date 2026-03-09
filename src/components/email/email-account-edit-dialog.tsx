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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  useDeleteEmailAccount,
  useTestEmailConnection,
  useUpdateEmailAccount,
} from '@/hooks/email/use-email';
import type { EmailAccount, UpdateEmailAccountRequest } from '@/types/email';
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
  CheckCircle2,
  ChevronRight,
  Globe,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Settings2,
  Signature,
  Trash2,
  UnderlineIcon,
  XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type SectionId = 'general' | 'signature' | 'connection';

interface SectionItem {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SECTIONS: SectionItem[] = [
  {
    id: 'general',
    label: 'Geral',
    icon: <Settings2 className="w-4 h-4" />,
    description: 'Nome, visibilidade, padrão',
  },
  {
    id: 'signature',
    label: 'Assinatura',
    icon: <Signature className="w-4 h-4" />,
    description: 'Assinatura do e-mail',
  },
  {
    id: 'connection',
    label: 'Conexão',
    icon: <Globe className="w-4 h-4" />,
    description: 'Servidores e autenticação',
  },
];

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
  const [activeSection, setActiveSection] = useState<SectionId>('general');

  // Form state — General
  const [displayName, setDisplayName] = useState(account.displayName ?? '');
  const [visibility, setVisibility] = useState(account.visibility);
  const [isDefault, setIsDefault] = useState(account.isDefault);
  const [isActive, setIsActive] = useState(account.isActive);

  // Form state — Connection
  const [imapHost, setImapHost] = useState(account.imapHost);
  const [imapPort, setImapPort] = useState(account.imapPort);
  const [imapSecure, setImapSecure] = useState(account.imapSecure);
  const [smtpHost, setSmtpHost] = useState(account.smtpHost);
  const [smtpPort, setSmtpPort] = useState(account.smtpPort);
  const [smtpSecure, setSmtpSecure] = useState(account.smtpSecure);
  const [tlsVerify, setTlsVerify] = useState(account.tlsVerify);
  const [password, setPassword] = useState('');

  // Connection test state
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const updateMutation = useUpdateEmailAccount();
  const deleteMutation = useDeleteEmailAccount();
  const testConnectionMutation = useTestEmailConnection();

  // Signature editor — memoize extensions and editorProps to avoid
  // recreating the TipTap editor instance on every render
  const extensions = useMemo(
    () => [
      StarterKit,
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
      TextAlignExt.configure({ types: ['heading', 'paragraph'] }),
      PlaceholderExt.configure({
        placeholder: 'Escreva sua assinatura aqui...',
      }),
    ],
    [],
  );

  const editorProps = useMemo(
    () => ({
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[180px] focus:outline-none py-3 px-4 text-sm leading-relaxed',
      },
    }),
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    editorProps,
    content: account.signature ?? '',
  });

  // Reset form when account changes
  useEffect(() => {
    setDisplayName(account.displayName ?? '');
    setVisibility(account.visibility);
    setIsDefault(account.isDefault);
    setIsActive(account.isActive);
    setImapHost(account.imapHost);
    setImapPort(account.imapPort);
    setImapSecure(account.imapSecure);
    setSmtpHost(account.smtpHost);
    setSmtpPort(account.smtpPort);
    setSmtpSecure(account.smtpSecure);
    setTlsVerify(account.tlsVerify);
    setPassword('');
    setActiveSection('general');
    setTestResult(null);
    editor?.commands.setContent(account.signature ?? '');
  }, [account, editor]);

  function handleSave() {
    const signatureHtml = editor?.getHTML() ?? '';

    const data: UpdateEmailAccountRequest & { id: string } = {
      id: account.id,
      displayName: displayName || undefined,
      signature:
        signatureHtml && signatureHtml !== '<p></p>'
          ? signatureHtml
          : undefined,
      visibility,
      isDefault,
      isActive,
      imapHost,
      imapPort,
      imapSecure,
      smtpHost,
      smtpPort,
      smtpSecure,
      tlsVerify,
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

  function handleTestConnection() {
    setTestResult(null);
    testConnectionMutation.mutate(
      { accountId: account.id },
      {
        onSuccess: () => {
          setTestResult({
            success: true,
            message: 'Conexão bem-sucedida com IMAP e SMTP.',
          });
        },
        onError: (error) => {
          setTestResult({
            success: false,
            message:
              error instanceof Error
                ? error.message
                : 'Falha ao testar conexão.',
          });
        },
      }
    );
  }

  const isPending = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 sm:rounded-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="text-base">
            Configurar conta de e-mail
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{account.address}</p>
        </DialogHeader>

        {/* Body: sidebar nav + content */}
        <div className="flex min-h-[420px]">
          {/* Sidebar navigation */}
          <nav className="w-48 shrink-0 border-r p-2 space-y-1 overflow-auto">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg transition-all duration-200',
                  'text-left group',
                  activeSection === section.id
                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5'
                )}
              >
                {/* Icon container */}
                <div
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    activeSection === section.id
                      ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50 group-hover:bg-gray-200 dark:group-hover:bg-white/15'
                  )}
                >
                  {section.icon}
                </div>

                {/* Label + Description */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-xs',
                      activeSection === section.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    )}
                  >
                    {section.label}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-white/40 truncate">
                    {section.description}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronRight
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-transform',
                    activeSection === section.id
                      ? 'text-blue-500 translate-x-0'
                      : 'text-gray-400 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  )}
                />
              </button>
            ))}
          </nav>

          {/* Content area */}
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-5">
              {/* ─── GERAL ──────────────────────────────────────── */}
              {activeSection === 'general' && (
                <>
                  {/* Display name */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-display-name">Nome de exibição</Label>
                    <Input
                      id="edit-display-name"
                      placeholder="Meu E-mail Corporativo"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome exibido como remetente nos e-mails enviados.
                    </p>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Visibilidade</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {visibility === 'PRIVATE'
                            ? 'Apenas você pode ver esta conta.'
                            : 'Outros membros do time podem ver esta conta.'}
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
                      <div>
                        <Label>Conta padrão</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Usar esta conta ao compor novos e-mails.
                        </p>
                      </div>
                      <Switch
                        checked={isDefault}
                        onCheckedChange={setIsDefault}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Conta ativa</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Contas desativadas não sincronizam nem enviam.
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={setIsActive}
                      />
                    </div>
                  </div>

                  {/* Delete zone */}
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Excluir conta
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Remove a conta e todas as mensagens permanentemente.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Excluir conta de e-mail?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Todas as mensagens e pastas de{' '}
                              <strong>{account.address}</strong> serão excluídas
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
                    </div>
                  </div>
                </>
              )}

              {/* ─── ASSINATURA ──────────────────────────────────── */}
              {activeSection === 'signature' && (
                <>
                  <div>
                    <Label>Assinatura de e-mail</Label>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                      Adicionada automaticamente ao final dos e-mails enviados.
                    </p>
                  </div>

                  {/* Toolbar */}
                  {editor && (
                    <div className="rounded-xl border overflow-hidden">
                      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30 flex-wrap">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('bold') && 'bg-accent'
                          )}
                          onClick={() =>
                            editor.chain().focus().toggleBold().run()
                          }
                          title="Negrito"
                        >
                          <Bold className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('italic') && 'bg-accent'
                          )}
                          onClick={() =>
                            editor.chain().focus().toggleItalic().run()
                          }
                          title="Itálico"
                        >
                          <Italic className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('underline') && 'bg-accent'
                          )}
                          onClick={() =>
                            editor.chain().focus().toggleUnderline().run()
                          }
                          title="Sublinhado"
                        >
                          <UnderlineIcon className="size-4" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('bulletList') && 'bg-accent'
                          )}
                          onClick={() =>
                            editor.chain().focus().toggleBulletList().run()
                          }
                          title="Lista"
                        >
                          <List className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('orderedList') && 'bg-accent'
                          )}
                          onClick={() =>
                            editor.chain().focus().toggleOrderedList().run()
                          }
                          title="Lista numerada"
                        >
                          <ListOrdered className="size-4" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive({ textAlign: 'left' }) &&
                              'bg-accent'
                          )}
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .setTextAlign('left')
                              .run()
                          }
                          title="Alinhar à esquerda"
                        >
                          <AlignLeft className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive({ textAlign: 'center' }) &&
                              'bg-accent'
                          )}
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .setTextAlign('center')
                              .run()
                          }
                          title="Centralizar"
                        >
                          <AlignCenter className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive({ textAlign: 'right' }) &&
                              'bg-accent'
                          )}
                          onClick={() =>
                            editor
                              .chain()
                              .focus()
                              .setTextAlign('right')
                              .run()
                          }
                          title="Alinhar à direita"
                        >
                          <AlignRight className="size-4" />
                        </Button>

                        <div className="w-px h-5 bg-border mx-1" />

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            'size-8 rounded-lg',
                            editor.isActive('link') && 'bg-accent'
                          )}
                          onClick={() => {
                            const url = window.prompt('URL do link:');
                            if (url) {
                              editor
                                .chain()
                                .focus()
                                .setLink({ href: url })
                                .run();
                            }
                          }}
                          title="Inserir link"
                        >
                          <Link2 className="size-4" />
                        </Button>
                      </div>

                      {/* Editor */}
                      <EditorContent editor={editor} />
                    </div>
                  )}
                </>
              )}

              {/* ─── CONEXÃO ──────────────────────────────────── */}
              {activeSection === 'connection' && (
                <>
                  {/* IMAP */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Servidor IMAP (Recebimento)
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="edit-imap-host" className="text-xs">
                          Host
                        </Label>
                        <Input
                          id="edit-imap-host"
                          placeholder="imap.exemplo.com"
                          value={imapHost}
                          onChange={e => setImapHost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-imap-port" className="text-xs">
                          Porta
                        </Label>
                        <Input
                          id="edit-imap-port"
                          type="number"
                          placeholder="993"
                          value={imapPort}
                          onChange={e => setImapPort(Number(e.target.value))}
                        />
                      </div>
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
                  <div className="space-y-3 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Servidor SMTP (Envio)
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="edit-smtp-host" className="text-xs">
                          Host
                        </Label>
                        <Input
                          id="edit-smtp-host"
                          placeholder="smtp.exemplo.com"
                          value={smtpHost}
                          onChange={e => setSmtpHost(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-smtp-port" className="text-xs">
                          Porta
                        </Label>
                        <Input
                          id="edit-smtp-port"
                          type="number"
                          placeholder="465"
                          value={smtpPort}
                          onChange={e => setSmtpPort(Number(e.target.value))}
                        />
                      </div>
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
                  <div className="space-y-2 pt-2">
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

                  {/* TLS Certificate Verification */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium">Verificar certificado TLS</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Valida o certificado do servidor. Desative para hosts com certificados auto-assinados.
                      </p>
                    </div>
                    <Switch
                      id="edit-tls-verify"
                      checked={tlsVerify}
                      onCheckedChange={setTlsVerify}
                    />
                  </div>

                  {/* Test Connection */}
                  <div className="pt-4 mt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Testar conexão</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Verifica se IMAP e SMTP estão acessíveis.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleTestConnection}
                        disabled={testConnectionMutation.isPending}
                      >
                        {testConnectionMutation.isPending && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        {testConnectionMutation.isPending
                          ? 'Testando...'
                          : 'Testar'}
                      </Button>
                    </div>

                    {/* Test result */}
                    {testResult && (
                      <div
                        className={cn(
                          'mt-3 flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs',
                          testResult.success
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        )}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="size-4 shrink-0 mt-0.5" />
                        )}
                        <p>{testResult.message}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              {isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
