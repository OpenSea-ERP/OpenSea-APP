import type { Meta, StoryObj } from '@storybook/react';
import { UserAvatar } from './user-avatar';

const meta = {
  title: 'Shared/UserAvatar',
  component: UserAvatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Maria',
    surname: 'Silva',
    email: 'maria.silva@empresa.com',
    avatarUrl: 'https://i.pravatar.cc/200?img=47',
    size: 'md',
  },
};

export const InitialsOnly: Story = {
  args: {
    name: 'João',
    surname: 'Souza',
    email: 'joao.souza@empresa.com',
    avatarUrl: null,
    size: 'md',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UserAvatar name="Ana" surname="Costa" size="sm" />
      <UserAvatar name="Bruno" surname="Lima" size="md" />
      <UserAvatar name="Carla" surname="Dias" size="lg" />
      <UserAvatar name="Diego" surname="Reis" size="xl" />
    </div>
  ),
};

export const WithPhotoSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UserAvatar
        name="Ana"
        surname="Costa"
        avatarUrl="https://i.pravatar.cc/80?img=30"
        size="sm"
      />
      <UserAvatar
        name="Bruno"
        surname="Lima"
        avatarUrl="https://i.pravatar.cc/120?img=31"
        size="md"
      />
      <UserAvatar
        name="Carla"
        surname="Dias"
        avatarUrl="https://i.pravatar.cc/200?img=32"
        size="lg"
      />
      <UserAvatar
        name="Diego"
        surname="Reis"
        avatarUrl="https://i.pravatar.cc/300?img=33"
        size="xl"
      />
    </div>
  ),
};

export const ColorHashSpread: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <UserAvatar name="Alice" surname="Almeida" />
      <UserAvatar name="Bernardo" surname="Bastos" />
      <UserAvatar name="Camila" surname="Cruz" />
      <UserAvatar name="Daniel" surname="Duarte" />
      <UserAvatar name="Eduarda" surname="Esteves" />
      <UserAvatar name="Felipe" surname="Ferreira" />
      <UserAvatar name="Gabriela" surname="Gomes" />
      <UserAvatar name="Henrique" surname="Henriques" />
    </div>
  ),
};

export const EmailOnly: Story = {
  args: {
    email: 'usuario@empresa.com',
    size: 'md',
  },
};

export const MissingUser: Story = {
  args: {
    size: 'md',
  },
};
