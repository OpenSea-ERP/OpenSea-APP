import type { Meta, StoryObj } from '@storybook/react';
import { Card } from '@/components/ui/card';
import { PageBody, PageHeader, PageLayout } from './page-layout';

/**
 * `PageLayout` é o wrapper base de uma página. Compõe-se com `PageHeader`
 * (cabeçalho) e `PageBody` (conteúdo). Não tem padding/background próprios —
 * espera que a página container aplique-os via `className`.
 */
const meta = {
  title: 'Layout/PageLayout',
  component: PageLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Wrapper base de página. Compõe `PageHeader` + `PageBody`. Espaçamento controlado via prop `spacing` (default `gap-6`). Sem padding/background próprios — aplique via `className` na página.',
      },
    },
  },
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-screen p-6">{children}</div>
);

const SampleHeader = () => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">Produtos</h1>
      <p className="text-sm text-muted-foreground">
        Catálogo completo da empresa
      </p>
    </div>
  </div>
);

const SampleBody = () => (
  <>
    <Card className="p-6">
      <h2 className="font-semibold mb-2">Seção 1</h2>
      <p className="text-sm text-muted-foreground">
        Conteúdo da primeira seção da página.
      </p>
    </Card>
    <Card className="p-6">
      <h2 className="font-semibold mb-2">Seção 2</h2>
      <p className="text-sm text-muted-foreground">
        Conteúdo da segunda seção da página.
      </p>
    </Card>
  </>
);

export const Default: Story = {
  render: () =>
    wrap(
      <PageLayout>
        <PageHeader>
          <SampleHeader />
        </PageHeader>
        <PageBody>
          <SampleBody />
        </PageBody>
      </PageLayout>
    ),
};

export const WithoutHeader: Story = {
  render: () =>
    wrap(
      <PageLayout>
        <PageBody>
          <SampleBody />
        </PageBody>
      </PageLayout>
    ),
};

export const Fullscreen: Story = {
  render: () => (
    <div className="bg-background min-h-screen">
      <PageLayout className="px-8 py-6" spacing="gap-8">
        <PageHeader>
          <SampleHeader />
        </PageHeader>
        <PageBody>
          <Card className="p-12 min-h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">
              Conteúdo em modo fullscreen, sem padding lateral extra.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () =>
    wrap(
      <PageLayout spacing="gap-4">
        <PageHeader>
          <SampleHeader />
        </PageHeader>
        <PageBody>
          <SampleBody />
        </PageBody>
      </PageLayout>
    ),
};
