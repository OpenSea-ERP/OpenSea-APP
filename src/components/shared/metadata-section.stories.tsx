import type { Meta, StoryObj } from '@storybook/react';
import { MetadataSection } from './metadata-section';

const meta = {
  title: 'Shared/MetadataSection',
  component: MetadataSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Card que exibe metadados de criação/atualização. Renderiza nada quando ambas datas são vazias. Quando `createdAt === updatedAt`, esconde a linha "Atualizada em".',
      },
    },
  },
} satisfies Meta<typeof MetadataSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="w-[640px]">{children}</div>
);

export const Default: Story = {
  render: () =>
    wrap(
      <MetadataSection
        createdAt="2026-01-15T10:30:00Z"
        updatedAt="2026-04-22T14:20:00Z"
      />
    ),
};

export const OnlyCreated: Story = {
  render: () => wrap(<MetadataSection createdAt="2026-02-01T09:00:00Z" />),
};

export const SameDates: Story = {
  render: () =>
    wrap(
      <MetadataSection
        createdAt="2026-03-10T15:45:00Z"
        updatedAt="2026-03-10T15:45:00Z"
      />
    ),
};

export const CustomTitle: Story = {
  render: () =>
    wrap(
      <MetadataSection
        title="Informações de auditoria"
        createdAt="2026-01-15T10:30:00Z"
        updatedAt="2026-04-22T14:20:00Z"
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrap(
      <MetadataSection
        createdAt="2026-01-15T10:30:00Z"
        updatedAt="2026-04-22T14:20:00Z"
      />
    ),
};
