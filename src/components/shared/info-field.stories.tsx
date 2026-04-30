import type { Meta, StoryObj } from '@storybook/react';
import { Mail, Phone, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InfoField } from './info-field';

const meta = {
  title: 'Shared/InfoField',
  component: InfoField,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Exibe um par label + valor com suporte opcional a ícone, badge, botão de copiar e action customizada. Exibe `emptyText` quando o valor é nulo/vazio. **Gap:** não há variante `mono` nativa para valores tipo identificador — a story `WithMonoValue` aplica via wrapper externo.',
      },
    },
  },
} satisfies Meta<typeof InfoField>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div className="w-[420px]">{children}</div>
);

export const Default: Story = {
  render: () => (
    <Wrap>
      <InfoField label="Nome completo" value="Ana Carolina Souza" />
    </Wrap>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Wrap>
      <InfoField
        label="E-mail"
        value="ana.souza@empresa.com.br"
        icon={<Mail className="w-3.5 h-3.5" />}
        showCopyButton
        copyTooltip="Copiar e-mail"
      />
    </Wrap>
  ),
};

export const WithMonoValue: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '**Gap de API:** sem variante `mono`. Compomos via `className` + badge; ideal seria expor `valueClassName` ou `mono?: boolean`.',
      },
    },
  },
  render: () => (
    <Wrap>
      <InfoField
        label="Identificador"
        value="tnt_abc123def456"
        icon={<Tag className="w-3.5 h-3.5" />}
        badge={
          <Badge variant="secondary" className="text-[10px]">
            ID
          </Badge>
        }
        showCopyButton
        copyTooltip="Copiar ID"
        className="font-mono"
      />
    </Wrap>
  ),
};

export const Empty: Story = {
  render: () => (
    <Wrap>
      <InfoField
        label="Telefone"
        value={null}
        icon={<Phone className="w-3.5 h-3.5" />}
        emptyText="Não informado"
      />
    </Wrap>
  ),
};
