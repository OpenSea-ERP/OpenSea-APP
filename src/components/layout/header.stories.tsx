import type { Meta, StoryObj } from '@storybook/react';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Header } from './header';

/**
 * `Header` é o cabeçalho reutilizável de páginas. Renderiza título +
 * descrição opcional + array tipado de botões com tooltips, ícones,
 * estados de loading e variantes shadcn (default, outline, ghost,
 * destructive, etc.). Totalmente prop-driven — não depende de contexto.
 */
const meta = {
  title: 'Layout/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cabeçalho de páginas com título, descrição e botões configuráveis. API totalmente prop-driven via `HeaderProps`/`HeaderButton`. Botões suportam ícones (Lucide), tooltips, loading async e variantes shadcn.',
      },
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-screen p-6">{children}</div>
);

export const Default: Story = {
  render: () =>
    wrap(<Header title="Produtos" description="Catálogo da empresa" />),
};

export const WithButtons: Story = {
  render: () =>
    wrap(
      <Header
        title="Produtos"
        description="Gerencie o catálogo completo da empresa"
        buttons={[
          {
            id: 'create',
            title: 'Novo Produto',
            icon: Plus,
            onClick: () => undefined,
            variant: 'default',
            tooltip: 'Cadastrar novo produto',
          },
          {
            id: 'import',
            title: 'Importar',
            icon: Upload,
            onClick: () => undefined,
            variant: 'outline',
          },
          {
            id: 'export',
            title: 'Exportar',
            icon: Download,
            onClick: () => undefined,
            variant: 'outline',
          },
          {
            id: 'edit',
            title: 'Editar',
            icon: Pencil,
            onClick: () => undefined,
            variant: 'ghost',
          },
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => undefined,
            variant: 'destructive',
          },
        ]}
      />
    ),
};

export const WithoutSearch: Story = {
  name: 'Without Buttons',
  render: () =>
    wrap(
      <Header
        title="Visão Geral"
        description="Sem botões — útil quando o cabeçalho serve apenas de título da seção."
      />
    ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () =>
    wrap(
      <Header
        title="Produtos"
        description="Em mobile o texto dos botões some e só os ícones permanecem."
        buttons={[
          {
            id: 'create',
            title: 'Novo',
            icon: Plus,
            onClick: () => undefined,
            variant: 'default',
          },
          {
            id: 'import',
            title: 'Importar',
            icon: Upload,
            onClick: () => undefined,
            variant: 'outline',
          },
        ]}
      />
    ),
};
