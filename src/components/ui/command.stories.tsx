import type { Meta, StoryObj } from '@storybook/react';
import {
  BarChart3,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  User,
  Users,
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './command';

const meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-[400px] rounded-lg border shadow-md">
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup>
          <CommandItem>
            <Search />
            <span>Buscar produtos</span>
          </CommandItem>
          <CommandItem>
            <Plus />
            <span>Criar nova venda</span>
          </CommandItem>
          <CommandItem>
            <BarChart3 />
            <span>Ver relatórios</span>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Command className="w-[400px] rounded-lg border shadow-md">
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Estoque">
          <CommandItem>
            <Package />
            <span>Cadastrar produto</span>
          </CommandItem>
          <CommandItem>
            <Search />
            <span>Buscar produtos</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Vendas">
          <CommandItem>
            <ShoppingCart />
            <span>Nova venda</span>
          </CommandItem>
          <CommandItem>
            <CreditCard />
            <span>Consultar pedidos</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Conta">
          <CommandItem>
            <User />
            <span>Perfil</span>
          </CommandItem>
          <CommandItem>
            <Settings />
            <span>Configurações</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Estado vazio: nenhum item corresponde ao filtro digitado pelo usuário.',
      },
    },
  },
  render: () => (
    <Command className="w-[400px] rounded-lg border shadow-md">
      <CommandInput placeholder="Buscar..." defaultValue="xyzabc123" />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup>
          <CommandItem>
            <Search />
            <span>Buscar produtos</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <Command className="w-[420px] rounded-lg border shadow-md">
      <CommandInput placeholder="Digite um comando ou busque..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Sugestões">
          <CommandItem>
            <Search />
            <span>Buscar</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Plus />
            <span>Novo registro</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Calendar />
            <span>Calendário</span>
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Configurações">
          <CommandItem>
            <User />
            <span>Perfil</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Mail />
            <span>E-mail</span>
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Users />
            <span>Equipe</span>
            <CommandShortcut>⌘T</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <FileText />
            <span>Documentos</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};
