import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage
        src="https://i.pravatar.cc/80?img=12"
        alt="Foto de Maria Silva"
      />
      <AvatarFallback aria-label="Maria Silva">MS</AvatarFallback>
    </Avatar>
  ),
};

export const InitialsFallback: Story = {
  render: () => (
    <Avatar aria-label="João Souza">
      {/* src vazio força o fallback */}
      <AvatarImage src="" alt="" />
      <AvatarFallback className="bg-blue-500 text-white font-semibold">
        JS
      </AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="size-8">
        <AvatarImage
          src="https://i.pravatar.cc/80?img=15"
          alt="Avatar pequeno"
        />
        <AvatarFallback aria-label="Pequeno">SM</AvatarFallback>
      </Avatar>
      <Avatar className="size-10">
        <AvatarImage src="https://i.pravatar.cc/80?img=16" alt="Avatar médio" />
        <AvatarFallback aria-label="Médio">MD</AvatarFallback>
      </Avatar>
      <Avatar className="size-16">
        <AvatarImage
          src="https://i.pravatar.cc/120?img=17"
          alt="Avatar grande"
        />
        <AvatarFallback aria-label="Grande">LG</AvatarFallback>
      </Avatar>
      <Avatar className="size-24">
        <AvatarImage
          src="https://i.pravatar.cc/200?img=18"
          alt="Avatar extra grande"
        />
        <AvatarFallback aria-label="Extra grande">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex items-center">
      <Avatar className="ring-2 ring-background">
        <AvatarImage
          src="https://i.pravatar.cc/80?img=20"
          alt="Foto de Ana Costa"
        />
        <AvatarFallback aria-label="Ana Costa">AC</AvatarFallback>
      </Avatar>
      <Avatar className="-ml-2 ring-2 ring-background">
        <AvatarImage
          src="https://i.pravatar.cc/80?img=21"
          alt="Foto de Bruno Lima"
        />
        <AvatarFallback aria-label="Bruno Lima">BL</AvatarFallback>
      </Avatar>
      <Avatar className="-ml-2 ring-2 ring-background">
        <AvatarImage
          src="https://i.pravatar.cc/80?img=22"
          alt="Foto de Carla Dias"
        />
        <AvatarFallback aria-label="Carla Dias">CD</AvatarFallback>
      </Avatar>
    </div>
  ),
};
