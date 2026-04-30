import type { Meta, StoryObj } from '@storybook/react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TenantSwitcher } from './tenant-switcher';

/**
 * `TenantSwitcher` é o dropdown da navbar para alternar entre tenants
 * (multi-empresa).
 *
 * **Constraint de Storybook:** o componente real depende de
 * `useTenant()` (de `@/contexts/tenant-context`) — sem o `TenantProvider`
 * montado, o hook lança erro. Montar o provider real exige autenticação +
 * chamadas API (`apiClient.get('/v1/me/tenants')`), o que não rodamos no
 * Storybook.
 *
 * Por isso:
 * - **Default-real:** renderiza o componente real. Como `currentTenant` é
 *   `null` por padrão, o componente devolve `null` (early return). A story
 *   apenas documenta o caminho — útil pra validar que o componente é
 *   defensivo.
 * - **Default / Multiple / Loading / NoTenants:** réplicas visuais com o
 *   mesmo markup (mesmos componentes UI: `DropdownMenu`, `Button`, ícones)
 *   para storiar os estados visuais sem provider.
 */
const meta = {
  title: 'Layout/TenantSwitcher',
  component: TenantSwitcher,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Dropdown de troca de tenants (multi-empresa). Componente real precisa de `TenantProvider` + auth — Storybook usa réplicas visuais.',
      },
    },
  },
} satisfies Meta<typeof TenantSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

interface MockTenant {
  id: string;
  name: string;
}

interface PreviewProps {
  tenants: MockTenant[];
  currentId: string | null;
  loading?: boolean;
}

/** Synthetic visual replica — same markup as TenantSwitcher, no provider. */
function TenantSwitcherPreview({ tenants, currentId, loading }: PreviewProps) {
  const currentTenant = tenants.find(t => t.id === currentId) ?? null;

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 max-w-[200px]"
        disabled
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="h-3 w-24 rounded bg-muted animate-pulse" />
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
      </Button>
    );
  }

  if (!currentTenant) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 max-w-[200px]"
        disabled
      >
        <Building2 className="h-4 w-4 shrink-0 opacity-50" />
        <span className="truncate text-muted-foreground">
          Nenhuma empresa selecionada
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 max-w-[200px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{currentTenant.name}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Trocar empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map(tenant => (
          <DropdownMenuItem key={tenant.id} className="gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate flex-1">{tenant.name}</span>
            {tenant.id === currentTenant.id && (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>Ver todas as empresas</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const singleTenant: MockTenant[] = [{ id: 't-1', name: 'Empresa Demo' }];

const multipleTenants: MockTenant[] = [
  { id: 't-1', name: 'Empresa Demo' },
  { id: 't-2', name: 'Filial Centro' },
  { id: 't-3', name: 'Filial Norte' },
];

export const Default: Story = {
  name: 'Default (tenant atual)',
  render: () => (
    <TenantSwitcherPreview tenants={singleTenant} currentId="t-1" />
  ),
};

export const Multiple: Story = {
  name: 'Multiple (3 tenants — abra o dropdown)',
  render: () => (
    <TenantSwitcherPreview tenants={multipleTenants} currentId="t-1" />
  ),
};

export const Loading: Story = {
  render: () => <TenantSwitcherPreview tenants={[]} currentId={null} loading />,
};

export const NoTenants: Story = {
  name: 'NoTenants (nenhuma empresa)',
  render: () => <TenantSwitcherPreview tenants={[]} currentId={null} />,
};
