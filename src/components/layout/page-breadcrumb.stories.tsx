import type { Meta, StoryObj } from '@storybook/react';
import { PageBreadcrumb } from './page-breadcrumb';

/**
 * `PageBreadcrumb` renderiza o caminho de navegação. Insere automaticamente
 * o item "Início" (`/`) como raiz e aplica `toTitleCase` aos labels (preservando
 * acrônimos em CAIXA-ALTA e mantendo preposições em minúsculo).
 *
 * No mobile (via `useIsMobile`), renderiza um botão compacto que abre um
 * Drawer com o path completo. Os separadores ChevronRight herdam
 * `aria-hidden="true"` da primitiva `BreadcrumbSeparator`.
 */
const meta = {
  title: 'Layout/PageBreadcrumb',
  component: PageBreadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Breadcrumb canônico. Insere automaticamente "Início" como raiz, aplica title case PT-BR (preserva acrônimos, minúscula preposições). Mobile abre Drawer. Separadores são `aria-hidden`.',
      },
    },
  },
} satisfies Meta<typeof PageBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[120px] p-6">{children}</div>
);

export const Default: Story = {
  render: () =>
    wrap(
      <PageBreadcrumb
        items={[
          { label: 'Estoque', href: '/stock' },
          { label: 'Produtos', href: '/stock/products' },
          { label: 'Editar' },
        ]}
      />
    ),
};

export const SingleLevel: Story = {
  render: () => wrap(<PageBreadcrumb items={[{ label: 'Dashboard' }]} />),
};

export const WithIcons: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'API surprise: `BreadcrumbItemData` aceita apenas `label` + `href` (sem slot de ícone). Para visualizar ícones inline, embuta-os no próprio label entre parenteses ou via emoji/símbolo unicode — não é uma feature suportada do componente.',
      },
    },
  },
  render: () =>
    wrap(
      <PageBreadcrumb
        items={[
          { label: 'RH', href: '/hr' },
          { label: 'Funcionários', href: '/hr/employees' },
          { label: 'João da Silva' },
        ]}
      />
    ),
};

export const TruncatedLong: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Path longo: o componente desktop usa `flex-wrap` da `BreadcrumbList` (quebra de linha). No mobile, o Drawer mostra todo o path em lista vertical com indentação progressiva.',
      },
    },
  },
  render: () =>
    wrap(
      <PageBreadcrumb
        items={[
          { label: 'Administração', href: '/admin' },
          { label: 'Configurações', href: '/admin/settings' },
          { label: 'Integrações', href: '/admin/settings/integrations' },
          {
            label: 'Servidores SMTP',
            href: '/admin/settings/integrations/smtp',
          },
          {
            label: 'Configurar conta principal de envio',
          },
        ]}
      />
    ),
};
