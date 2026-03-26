'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { usePermissions } from '@/hooks/use-permissions';
import { QuickEntryModal } from '@/components/finance/quick-entry-modal';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Bot,
  Calendar,
  CheckSquare,
  DollarSign,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MessageSquare,
  Monitor,
  Package,
  Plus,
  QrCode,
  ShoppingBag,
  ShoppingCart,
  UserCheck,
  UserRoundCog,
  Users,
  Zap,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CommandBarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  keywords?: string[];
  permission?: string;
  shortcut?: string;
}

interface CommandBarGroup {
  heading: string;
  items: CommandBarItem[];
}

// ---------------------------------------------------------------------------
// Constants — Recent Pages (localStorage key)
// ---------------------------------------------------------------------------

const RECENT_PAGES_KEY = 'opensea:command-bar:recent-pages';
const MAX_RECENT_PAGES = 5;

interface RecentPage {
  label: string;
  href: string;
  visitedAt: number;
}

function getRecentPages(): RecentPage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_PAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentPage[];
  } catch {
    return [];
  }
}

function addRecentPage(label: string, href: string) {
  if (typeof window === 'undefined') return;
  try {
    const pages = getRecentPages().filter(p => p.href !== href);
    pages.unshift({ label, href, visitedAt: Date.now() });
    localStorage.setItem(
      RECENT_PAGES_KEY,
      JSON.stringify(pages.slice(0, MAX_RECENT_PAGES))
    );
  } catch {
    // silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Navigation Items
// ---------------------------------------------------------------------------

const NAVIGATION_ITEMS: CommandBarItem[] = [
  {
    id: 'nav-stock',
    label: 'Estoque',
    icon: Package,
    href: '/stock',
    keywords: ['products', 'produtos', 'estoque', 'inventory'],
  },
  {
    id: 'nav-finance',
    label: 'Finanças',
    icon: DollarSign,
    href: '/finance',
    keywords: ['finance', 'finanças', 'contas', 'pagamentos', 'financeiro'],
  },
  {
    id: 'nav-hr',
    label: 'RH',
    icon: Users,
    href: '/hr',
    keywords: ['hr', 'rh', 'funcionários', 'employees', 'recursos humanos'],
  },
  {
    id: 'nav-sales',
    label: 'Vendas',
    icon: ShoppingCart,
    href: '/sales',
    keywords: ['sales', 'vendas', 'pedidos', 'orders'],
  },
  {
    id: 'nav-email',
    label: 'Email',
    icon: Mail,
    href: '/email',
    keywords: ['email', 'correio', 'e-mail', 'inbox'],
  },
  {
    id: 'nav-tasks',
    label: 'Tarefas',
    icon: CheckSquare,
    href: '/tasks',
    keywords: ['tasks', 'tarefas', 'kanban', 'projetos'],
  },
  {
    id: 'nav-calendar',
    label: 'Calendário',
    icon: Calendar,
    href: '/calendar',
    keywords: ['calendar', 'calendário', 'eventos', 'agenda'],
  },
  {
    id: 'nav-messaging',
    label: 'Mensagens',
    icon: MessageSquare,
    href: '/messaging',
    keywords: ['messaging', 'mensagens', 'whatsapp', 'telegram', 'chat'],
  },
  {
    id: 'nav-file-manager',
    label: 'Arquivos',
    icon: FolderOpen,
    href: '/file-manager',
    keywords: ['files', 'arquivos', 'storage', 'documentos'],
  },
  {
    id: 'nav-ai',
    label: 'Atlas IA',
    icon: Bot,
    href: '/ai',
    keywords: ['ai', 'ia', 'atlas', 'inteligência', 'assistente'],
  },
];

const PAGE_ITEMS: CommandBarItem[] = [
  {
    id: 'page-products',
    label: 'Produtos',
    icon: Package,
    href: '/stock/products',
    keywords: ['produtos', 'products'],
  },
  {
    id: 'page-orders',
    label: 'Pedidos',
    icon: ShoppingBag,
    href: '/sales/orders',
    keywords: ['pedidos', 'orders'],
  },
  {
    id: 'page-employees',
    label: 'Funcionários',
    icon: UserCheck,
    href: '/hr/employees',
    keywords: ['funcionários', 'employees'],
  },
  {
    id: 'page-payable',
    label: 'Contas a Pagar',
    icon: ArrowDownCircle,
    href: '/finance/overview?type=payable',
    keywords: ['pagar', 'payable', 'despesas'],
  },
  {
    id: 'page-receivable',
    label: 'Contas a Receber',
    icon: ArrowUpCircle,
    href: '/finance/overview?type=receivable',
    keywords: ['receber', 'receivable', 'receitas'],
  },
  {
    id: 'page-fiscal',
    label: 'Documentos Fiscais',
    icon: FileText,
    href: '/finance/fiscal',
    keywords: ['fiscal', 'nfe', 'nota', 'documentos fiscais'],
  },
  {
    id: 'page-marketplace',
    label: 'Marketplace',
    icon: Globe,
    href: '/sales/marketplaces',
    keywords: ['marketplace', 'mercado livre', 'shopee'],
  },
  {
    id: 'page-pos',
    label: 'PDV',
    icon: Monitor,
    href: '/sales/pos',
    keywords: ['pdv', 'pos', 'caixa', 'ponto de venda'],
  },
  {
    id: 'page-pix',
    label: 'Cobranças PIX',
    icon: QrCode,
    href: '/sales/pos/pix',
    keywords: ['pix', 'cobrança', 'qr', 'qrcode'],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * CommandBar (Cmd+K / Ctrl+K)
 * Barra de comando global com navegação rápida, ações e páginas recentes.
 */
export function CommandBar() {
  const [open, setOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Load recent pages when dialog opens
  useEffect(() => {
    if (open) {
      setRecentPages(getRecentPages());
    }
  }, [open]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = useCallback(
    (href: string, label?: string) => {
      setOpen(false);
      if (label) {
        addRecentPage(label, href);
      }
      router.push(href);
    },
    [router]
  );

  // Action items (built here because they reference setQuickEntryOpen)
  const actionItems: CommandBarItem[] = useMemo(
    () => [
      {
        id: 'action-quick-entry',
        label: 'Lançamento Rápido',
        icon: Zap,
        action: () => setQuickEntryOpen(true),
        keywords: [
          'rápido',
          'quick',
          'lançamento',
          'pagar',
          'receber',
          'novo',
          'financeiro',
        ],
        shortcut: '⌘+L',
      },
      {
        id: 'action-new-product',
        label: 'Novo Produto',
        icon: Plus,
        href: '/stock/products?action=create',
        keywords: ['novo produto', 'criar produto', 'new product'],
      },
      {
        id: 'action-new-customer',
        label: 'Novo Cliente',
        icon: Plus,
        href: '/sales/customers?action=create',
        keywords: ['novo cliente', 'criar cliente', 'new customer'],
      },
      {
        id: 'action-new-order',
        label: 'Novo Pedido',
        icon: Plus,
        href: '/sales/orders?action=create',
        keywords: ['novo pedido', 'criar pedido', 'new order'],
      },
      {
        id: 'action-new-entry',
        label: 'Nova Entrada Financeira',
        icon: Plus,
        href: '/finance/overview?action=create',
        keywords: ['nova entrada', 'financeira', 'criar entrada'],
      },
      {
        id: 'action-emit-nfe',
        label: 'Emitir NF-e',
        icon: FileText,
        href: '/finance/fiscal?action=emit-nfe',
        keywords: ['emitir nfe', 'nota fiscal', 'nf-e'],
      },
    ],
    []
  );

  // Build recent pages group from localStorage
  const recentPageItems: CommandBarItem[] = useMemo(() => {
    return recentPages.map((page, idx) => ({
      id: `recent-${idx}`,
      label: page.label,
      icon: Clock,
      href: page.href,
      keywords: [],
    }));
  }, [recentPages]);

  // Build groups
  const groups: CommandBarGroup[] = useMemo(() => {
    const result: CommandBarGroup[] = [
      { heading: 'Navegação Rápida', items: NAVIGATION_ITEMS },
      { heading: 'Ações', items: actionItems },
      { heading: 'Páginas', items: PAGE_ITEMS },
    ];

    if (recentPageItems.length > 0) {
      result.push({ heading: 'Páginas Recentes', items: recentPageItems });
    }

    return result;
  }, [actionItems, recentPageItems]);

  function handleSelect(item: CommandBarItem) {
    if (item.action) {
      item.action();
      setOpen(false);
    } else if (item.href) {
      navigate(item.href, item.label);
    }
  }

  return (
    <>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Barra de Comando"
        description="Busque por módulos, páginas e ações"
        showCloseButton={false}
        className="sm:max-w-[640px]"
      >
        <CommandInput placeholder="Buscar módulos, páginas, ações..." />
        <CommandList className="max-h-[70vh]">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          {groups.map((group, groupIdx) => {
            const visibleItems = group.items.filter(
              item => !item.permission || hasPermission(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.heading}>
                {groupIdx > 0 && <CommandSeparator />}
                <CommandGroup heading={group.heading}>
                  {visibleItems.map(item => (
                    <CommandItem
                      key={item.id}
                      value={`${item.label} ${(item.keywords || []).join(' ')}`}
                      onSelect={() => handleSelect(item)}
                      className="rounded-lg px-3 py-2.5 aria-selected:bg-sky-50 dark:aria-selected:bg-sky-500/10"
                    >
                      <item.icon className="mr-2.5 h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.shortcut && (
                        <CommandShortcut>
                          <Kbd className="text-[10px]">{item.shortcut}</Kbd>
                        </CommandShortcut>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            );
          })}

          {/* Footer with keyboard hints */}
          <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd className="text-[10px]">↑</Kbd>
                <Kbd className="text-[10px]">↓</Kbd>
                <span className="ml-0.5">navegar</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="text-[10px]">↵</Kbd>
                <span className="ml-0.5">selecionar</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="text-[10px]">Esc</Kbd>
                <span className="ml-0.5">fechar</span>
              </span>
            </div>
          </div>
        </CommandList>
      </CommandDialog>

      <QuickEntryModal
        open={quickEntryOpen}
        onOpenChange={setQuickEntryOpen}
      />
    </>
  );
}
