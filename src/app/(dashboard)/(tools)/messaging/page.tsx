'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useMessagingAccounts,
  useMessagingContacts,
  useMessagingMessages,
  useSendMessagingMessage,
} from '@/hooks/messaging';
import type {
  MessagingChannel,
  MessagingContactDTO,
  MessagingMessageDTO,
  MessagingMessageStatus,
} from '@/types/messaging';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Clock,
  Loader2,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
  SendHorizontal,
  XCircle,
} from 'lucide-react';

// ─── Channel Helpers ─────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<
  MessagingChannel,
  {
    label: string;
    icon: typeof MessageCircle;
    color: string;
    bgLight: string;
    bgDark: string;
    textLight: string;
    textDark: string;
  }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    icon: MessageCircle,
    color: 'text-green-500',
    bgLight: 'bg-green-50',
    bgDark: 'bg-green-500/8',
    textLight: 'text-green-700',
    textDark: 'text-green-300',
  },
  INSTAGRAM: {
    label: 'Instagram',
    icon: Camera,
    color: 'text-pink-500',
    bgLight: 'bg-pink-50',
    bgDark: 'bg-pink-500/8',
    textLight: 'text-pink-700',
    textDark: 'text-pink-300',
  },
  TELEGRAM: {
    label: 'Telegram',
    icon: Send,
    color: 'text-sky-500',
    bgLight: 'bg-sky-50',
    bgDark: 'bg-sky-500/8',
    textLight: 'text-sky-700',
    textDark: 'text-sky-300',
  },
};

function ChannelIcon({
  channel,
  className,
}: {
  channel: MessagingChannel;
  className?: string;
}) {
  const config = CHANNEL_CONFIG[channel];
  const Icon = config.icon;
  return <Icon className={cn('size-4', config.color, className)} />;
}

function ChannelChip({
  channel,
  selected,
  onClick,
}: {
  channel: MessagingChannel;
  selected: boolean;
  onClick: () => void;
}) {
  const config = CHANNEL_CONFIG[channel];
  const Icon = config.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
        selected
          ? `${config.bgLight} ${config.textLight} dark:${config.bgDark} dark:${config.textDark}`
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      )}
    >
      <Icon className="size-3" />
      {config.label}
    </button>
  );
}

// ─── Message Status Icon ─────────────────────────────────────────────────────

function MessageStatusIcon({ status }: { status: MessagingMessageStatus }) {
  switch (status) {
    case 'PENDING':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Clock className="size-3.5 text-slate-400" />
          </TooltipTrigger>
          <TooltipContent>Pendente</TooltipContent>
        </Tooltip>
      );
    case 'SENT':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Check className="size-3.5 text-slate-400" />
          </TooltipTrigger>
          <TooltipContent>Enviada</TooltipContent>
        </Tooltip>
      );
    case 'DELIVERED':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCheck className="size-3.5 text-slate-400" />
          </TooltipTrigger>
          <TooltipContent>Entregue</TooltipContent>
        </Tooltip>
      );
    case 'READ':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <CheckCheck className="size-3.5 text-sky-500" />
          </TooltipTrigger>
          <TooltipContent>Lida</TooltipContent>
        </Tooltip>
      );
    case 'FAILED':
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <XCircle className="size-3.5 text-rose-500" />
          </TooltipTrigger>
          <TooltipContent>Falha no envio</TooltipContent>
        </Tooltip>
      );
  }
}

// ─── Contact List Item ───────────────────────────────────────────────────────

function ContactListItem({
  contact,
  isSelected,
  onClick,
}: {
  contact: MessagingContactDTO;
  isSelected: boolean;
  onClick: () => void;
}) {
  const initials = (contact.name ?? contact.externalId)
    .slice(0, 2)
    .toUpperCase();

  const timeAgo = contact.lastMessageAt
    ? formatDistanceToNow(new Date(contact.lastMessageAt), {
        addSuffix: true,
        locale: ptBR,
      })
    : '';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50',
        isSelected && 'bg-slate-100 dark:bg-slate-800'
      )}
    >
      {/* Avatar with channel overlay */}
      <div className="relative shrink-0">
        <Avatar className="size-10">
          {contact.avatarUrl && <AvatarImage src={contact.avatarUrl} />}
          <AvatarFallback className="text-xs font-medium bg-slate-200 dark:bg-slate-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white dark:bg-slate-900 p-0.5">
          <ChannelIcon channel={contact.channel} className="size-3" />
        </div>
      </div>

      {/* Name + preview */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">
            {contact.name ?? contact.externalId}
          </span>
          {timeAgo && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {timeAgo}
            </span>
          )}
        </div>
        {contact.lastMessagePreview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {contact.lastMessagePreview}
          </p>
        )}
      </div>

      {/* Unread badge */}
      {contact.unreadCount > 0 && (
        <Badge
          variant="default"
          className="size-5 flex items-center justify-center p-0 text-[10px] rounded-full shrink-0"
        >
          {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
        </Badge>
      )}
    </button>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: MessagingMessageDTO }) {
  const isOutbound = message.direction === 'OUTBOUND';
  const timestamp = message.sentAt ?? message.createdAt;

  return (
    <div
      className={cn(
        'flex flex-col max-w-[75%] gap-1',
        isOutbound ? 'ml-auto items-end' : 'mr-auto items-start'
      )}
    >
      <div
        className={cn(
          'rounded-2xl px-4 py-2.5 text-sm',
          isOutbound
            ? 'bg-sky-500/10 dark:bg-sky-500/20 rounded-br-md'
            : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'
        )}
      >
        {/* Media preview */}
        {message.mediaUrl && message.type === 'IMAGE' && (
          <img
            src={message.mediaUrl}
            alt="Imagem"
            className="rounded-lg max-w-full max-h-64 mb-2"
          />
        )}
        {message.mediaUrl && message.type === 'DOCUMENT' && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 dark:text-sky-400 underline block mb-1"
          >
            {message.fileName ?? 'Documento'}
          </a>
        )}

        {/* Text content */}
        {message.text && (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        )}

        {/* Error message */}
        {message.status === 'FAILED' && message.errorMessage && (
          <p className="text-[11px] text-rose-500 mt-1">
            {message.errorMessage}
          </p>
        )}
      </div>

      {/* Timestamp + status */}
      <div className="flex items-center gap-1 px-1">
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(timestamp), 'HH:mm', { locale: ptBR })}
        </span>
        {isOutbound && <MessageStatusIcon status={message.status} />}
      </div>
    </div>
  );
}

// ─── Day Separator ───────────────────────────────────────────────────────────

function DaySeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] text-muted-foreground font-medium">
        {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyConversationState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <MessageSquare className="size-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
        Selecione uma conversa
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">
        Escolha um contato na lista ao lado para visualizar e responder
        mensagens.
      </p>
    </div>
  );
}

// ─── Chat Thread ─────────────────────────────────────────────────────────────

function ChatThread({
  contact,
  messages,
  isLoading,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  onSend,
  isSending,
  onBack,
}: {
  contact: MessagingContactDTO;
  messages: MessagingMessageDTO[];
  isLoading: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  isFetchingNextPage: boolean;
  onSend: (text: string) => void;
  isSending: boolean;
  onBack?: () => void;
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Infinite scroll up — load older messages
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInputText('');
  }, [inputText, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Group messages by day
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MessagingMessageDTO[] }[] = [];
    let currentDate = '';

    for (const msg of messages) {
      const msgDate = (msg.sentAt ?? msg.createdAt).split('T')[0];
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }

    return groups;
  }, [messages]);

  const channelConfig = CHANNEL_CONFIG[contact.channel];
  const ContactChannelIcon = channelConfig.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Contact header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden shrink-0 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Voltar para contatos"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <Avatar className="size-9">
          {contact.avatarUrl && <AvatarImage src={contact.avatarUrl} />}
          <AvatarFallback className="text-xs font-medium bg-slate-200 dark:bg-slate-700">
            {(contact.name ?? contact.externalId).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold truncate">
              {contact.name ?? contact.externalId}
            </span>
            <ContactChannelIcon
              className={cn('size-3.5', channelConfig.color)}
            />
          </div>
          {contact.username && (
            <p className="text-xs text-muted-foreground">@{contact.username}</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
        <div className="px-4 py-3 space-y-1">
          {/* Sentinel for loading older messages */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="size-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma mensagem nesta conversa ainda.
              </p>
            </div>
          ) : (
            groupedMessages.map(group => (
              <div key={group.date}>
                <DaySeparator date={group.date} />
                <div className="space-y-2">
                  {group.messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t px-4 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[40px] max-h-[120px]"
            style={{ overflow: 'auto' }}
          />
          <Button
            size="icon"
            className="size-10 rounded-xl shrink-0"
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MessagingPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<MessagingChannel | null>(
    null
  );

  // On mobile, track whether we're viewing the contact list or the chat
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // When a contact is selected on mobile, show the chat
  const handleSelectContact = useCallback((contactId: string) => {
    setSelectedContactId(contactId);
    setMobileShowChat(true);
  }, []);

  // Back to contact list on mobile
  const handleMobileBack = useCallback(() => {
    setMobileShowChat(false);
  }, []);

  // Data hooks
  const { data: accountsData } = useMessagingAccounts();
  const accounts = accountsData?.accounts;

  const {
    data: contactsData,
    isLoading: contactsLoading,
    hasNextPage: contactsHasNextPage,
    fetchNextPage: contactsFetchNextPage,
    isFetchingNextPage: contactsIsFetchingNextPage,
  } = useMessagingContacts({
    channel: channelFilter ?? undefined,
    search: searchQuery || undefined,
  });

  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage: messagesHasNextPage,
    fetchNextPage: messagesFetchNextPage,
    isFetchingNextPage: messagesIsFetchingNextPage,
  } = useMessagingMessages(selectedContactId);

  const sendMutation = useSendMessagingMessage();

  // Flatten paginated contacts
  const contacts = useMemo(
    () => contactsData?.pages.flatMap(p => p.contacts) ?? [],
    [contactsData]
  );

  // Flatten paginated messages (reversed so newest at bottom)
  const messages = useMemo(() => {
    const allMessages = messagesData?.pages.flatMap(p => p.messages) ?? [];
    return [...allMessages].reverse();
  }, [messagesData]);

  // Selected contact object
  const selectedContact = useMemo(
    () => contacts.find(c => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );

  // Contact list sentinel for infinite scroll
  const contactSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!contactSentinelRef.current || !contactsHasNextPage) return;

    const observer = new IntersectionObserver(
      entries => {
        if (
          entries[0]?.isIntersecting &&
          contactsHasNextPage &&
          !contactsIsFetchingNextPage
        ) {
          contactsFetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(contactSentinelRef.current);
    return () => observer.disconnect();
  }, [contactsHasNextPage, contactsIsFetchingNextPage, contactsFetchNextPage]);

  // Handle send
  const handleSend = useCallback(
    (text: string) => {
      if (!selectedContact) return;
      sendMutation.mutate({
        accountId: selectedContact.accountId,
        contactId: selectedContact.id,
        text,
      });
    },
    [selectedContact, sendMutation]
  );

  // Toggle channel filter
  const handleChannelToggle = useCallback((channel: MessagingChannel) => {
    setChannelFilter(prev => (prev === channel ? null : channel));
  }, []);

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6 h-[calc(100vh-10rem)]">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Mensagens', href: '/messaging' }]}
        buttons={[
          {
            id: 'accounts',
            title: 'Gerenciar Contas',
            icon: MessageCircle,
            variant: 'outline' as const,
            onClick: () => {
              window.location.href = '/messaging/accounts';
            },
          },
        ]}
      />

      {/* Hero Banner */}
      <Card className="relative overflow-hidden p-6 md:p-8 bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none shrink-0 hidden md:block">
        <div className="absolute top-0 right-0 w-56 h-56 bg-green-500/15 dark:bg-green-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-500/15 dark:bg-sky-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-green-500 to-emerald-600">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Mensagens
              </h1>
              <p className="text-sm text-slate-500 dark:text-white/60">
                Gerencie conversas de WhatsApp, Instagram e Telegram em um único
                lugar
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main panel */}
      {!hasAccounts ? (
        <Card className="bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <MessageSquare className="size-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              Nenhuma conta conectada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Conecte uma conta de WhatsApp, Instagram ou Telegram para começar
              a receber e enviar mensagens.
            </p>
            <Button
              className="mt-4"
              onClick={() => {
                window.location.href = '/messaging/accounts';
              }}
            >
              Conectar Conta
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="bg-white dark:bg-white/5 border-gray-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex flex-1 min-h-0">
            {/* ═══ Left Panel: Contact List ═══ */}
            <div
              className={cn(
                'w-full md:w-[350px] shrink-0 md:border-r flex flex-col min-h-0',
                mobileShowChat ? 'hidden md:flex' : 'flex'
              )}
            >
              {/* Search */}
              <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar contatos..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Channel filter chips */}
                <div className="flex items-center gap-1.5">
                  {(
                    ['WHATSAPP', 'INSTAGRAM', 'TELEGRAM'] as MessagingChannel[]
                  ).map(ch => (
                    <ChannelChip
                      key={ch}
                      channel={ch}
                      selected={channelFilter === ch}
                      onClick={() => handleChannelToggle(ch)}
                    />
                  ))}
                </div>
              </div>

              {/* Contact list */}
              <ScrollArea className="flex-1 min-h-0">
                {contactsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                    <MessageCircle className="size-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum contato encontrado.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {contacts.map(contact => (
                      <ContactListItem
                        key={contact.id}
                        contact={contact}
                        isSelected={contact.id === selectedContactId}
                        onClick={() => handleSelectContact(contact.id)}
                      />
                    ))}

                    {/* Infinite scroll sentinel */}
                    <div ref={contactSentinelRef} className="h-1" />

                    {contactsIsFetchingNextPage && (
                      <div className="flex justify-center py-3">
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* ═══ Right Panel: Chat Thread ═══ */}
            <div
              className={cn(
                'flex-1 min-w-0 flex flex-col',
                mobileShowChat ? 'flex' : 'hidden md:flex'
              )}
            >
              {selectedContact ? (
                <ChatThread
                  contact={selectedContact}
                  messages={messages}
                  isLoading={messagesLoading}
                  hasNextPage={messagesHasNextPage ?? false}
                  fetchNextPage={messagesFetchNextPage}
                  isFetchingNextPage={messagesIsFetchingNextPage}
                  onSend={handleSend}
                  isSending={sendMutation.isPending}
                  onBack={handleMobileBack}
                />
              ) : (
                <EmptyConversationState />
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
