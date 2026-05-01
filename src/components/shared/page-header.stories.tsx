import type { Meta, StoryObj } from '@storybook/react';
import { Download, Package, Plus, Upload, Users } from 'lucide-react';
import { expect } from 'vitest';
import { page } from '@vitest/browser/context';
import { Button } from '@/components/ui/button';
import { PageHeader } from './page-header';

const meta = {
  title: 'Shared/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'PageHeader canônico (`components/shared/page-header.tsx`) usado em páginas de detalhe/edit. Recebe `icon` + `gradient` (ex: "from-blue-500 to-indigo-600"). Botão "voltar" usa Next router.',
      },
    },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode, testId?: string) => (
  <div
    {...(testId ? { 'data-testid': testId } : {})}
    className="bg-background min-h-[200px]"
  >
    {children}
  </div>
);

export const Default: Story = {
  tags: ['visual'],
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Catálogo completo de produtos da empresa."
        icon={<Package />}
        gradient="from-blue-500 to-indigo-600"
        showBackButton={false}
      />,
      'page-header-default'
    ),
  play: async () => {
    await expect
      .element(page.getByTestId('page-header-default'))
      .toMatchScreenshot('page-header-default');
  },
};

export const WithBackButton: Story = {
  render: () =>
    wrap(
      <PageHeader
        title="Editar produto"
        description="Camiseta Algodão Premium • SKU CAM-001"
        icon={<Package />}
        gradient="from-blue-500 to-indigo-600"
      />
    ),
};

export const WithActions: Story = {
  render: () =>
    wrap(
      <PageHeader
        title="Funcionários"
        description="48 colaboradores ativos · 3 em férias"
        icon={<Users />}
        gradient="from-emerald-500 to-teal-600"
        showBackButton={false}
        actions={
          <>
            <Button size="sm" variant="outline">
              <Upload className="size-4" /> Importar
            </Button>
            <Button size="sm" variant="outline">
              <Download className="size-4" /> Exportar
            </Button>
            <Button size="sm">
              <Plus className="size-4" /> Novo colaborador
            </Button>
          </>
        }
      />
    ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Catálogo completo."
        icon={<Package />}
        gradient="from-blue-500 to-indigo-600"
        showBackButton={false}
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrap(
      <PageHeader
        title="Produtos"
        description="Catálogo em modo escuro."
        icon={<Package />}
        gradient="from-blue-500 to-indigo-600"
        showBackButton={false}
      />
    ),
};
