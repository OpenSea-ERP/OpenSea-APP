'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Calendar,
  DollarSign,
  FileSignature,
  FolderOpen,
  KanbanSquare,
  Mail,
  Package,
  Plus,
  ShoppingCart,
  UserRoundCog,
  Bot,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface CommandBarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  keywords?: string[];
  permission?: string;
}

interface CommandBarGroup {
  heading: string;
  items: CommandBarItem[];
}

/**
 * CommandBar (Cmd+K / Ctrl+K)
 * Barra de comando global com navegacao e acoes rapidas.
 */
export function CommandBar() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { hasPermission } = usePermissions();

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
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  const navigationItems: CommandBarItem[] = [
    {
      id: 'nav-stock',
      label: 'Estoque',
      icon: Package,
      href: '/stock',
      keywords: ['estoque', 'produtos', 'stock', 'inventory'],
    },
    {
      id: 'nav-sales',
      label: 'Vendas',
      icon: ShoppingCart,
      href: '/sales',
      keywords: ['vendas', 'sales', 'pedidos', 'orders'],
    },
    {
      id: 'nav-orders',
      label: 'Pedidos',
      icon: ShoppingCart,
      href: '/sales/orders',
      keywords: ['pedidos', 'orders', 'vendas'],
    },
    {
      id: 'nav-catalogs',
      label: 'Catalogos',
      icon: ShoppingCart,
      href: '/sales/catalogs',
      keywords: ['catalogo', 'catalog'],
    },
    {
      id: 'nav-finance',
      label: 'Financeiro',
      icon: DollarSign,
      href: '/finance',
      keywords: ['financeiro', 'finance', 'contas', 'pagamentos'],
    },
    {
      id: 'nav-hr',
      label: 'Recursos Humanos',
      icon: UserRoundCog,
      href: '/hr',
      keywords: ['rh', 'recursos humanos', 'hr', 'funcionarios', 'employees'],
    },
    {
      id: 'nav-calendar',
      label: 'Calendario',
      icon: Calendar,
      href: '/calendar',
      keywords: ['calendario', 'calendar', 'eventos', 'agenda'],
    },
    {
      id: 'nav-email',
      label: 'E-mail',
      icon: Mail,
      href: '/email',
      keywords: ['email', 'e-mail', 'mensagens', 'inbox'],
    },
    {
      id: 'nav-tasks',
      label: 'Tarefas',
      icon: KanbanSquare,
      href: '/tasks',
      keywords: ['tarefas', 'tasks', 'kanban', 'projetos'],
    },
    {
      id: 'nav-file-manager',
      label: 'Gerenciador de Arquivos',
      icon: FolderOpen,
      href: '/file-manager',
      keywords: ['arquivos', 'files', 'documentos', 'storage'],
    },
    {
      id: 'nav-signature',
      label: 'Assinatura Digital',
      icon: FileSignature,
      href: '/signature',
      keywords: ['assinatura', 'signature', 'certificado'],
    },
    {
      id: 'nav-ai',
      label: 'Assistente IA',
      icon: Bot,
      href: '/ai',
      keywords: ['ia', 'ai', 'assistente', 'inteligencia'],
    },
  ];

  const quickActions: CommandBarItem[] = [
    {
      id: 'action-new-order',
      label: 'Novo Pedido',
      icon: Plus,
      href: '/sales/orders?new=true',
      keywords: ['novo pedido', 'criar pedido', 'new order'],
    },
    {
      id: 'action-new-product',
      label: 'Novo Produto',
      icon: Plus,
      href: '/stock/products?new=true',
      keywords: ['novo produto', 'criar produto', 'new product'],
    },
  ];

  const groups: CommandBarGroup[] = [
    { heading: 'Navegacao', items: navigationItems },
    { heading: 'Acoes Rapidas', items: quickActions },
  ];

  function handleSelect(item: CommandBarItem) {
    if (item.action) {
      item.action();
      setOpen(false);
    } else if (item.href) {
      navigate(item.href);
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Barra de Comando"
      description="Busque por paginas, acoes ou comandos"
      showCloseButton={false}
    >
      <CommandInput placeholder="Buscar ou digitar comando..." />
      <CommandList>
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
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
