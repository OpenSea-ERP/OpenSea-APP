import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './loading-spinner';

const meta = {
  title: 'Shared/LoadingSpinner',
  component: LoadingSpinner,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Spinner circular minimalista (8x8 por padrão, borda azul). Aceita `className` para customizar tamanho/cor via Tailwind.',
      },
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: {
    className: 'h-4 w-4 border',
  },
};

export const Large: Story = {
  args: {
    className: 'h-16 w-16 border-4',
  },
};

export const CustomColor: Story = {
  args: {
    className: 'border-emerald-500',
  },
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  args: {
    className: 'border-cyan-400',
  },
};
