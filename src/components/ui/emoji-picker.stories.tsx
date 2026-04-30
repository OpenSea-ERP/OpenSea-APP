import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Button } from './button';
import { EmojiPicker } from './emoji-picker';

function EmojiPickerRender({
  legend,
  triggerLabel,
  ...props
}: ComponentProps<typeof EmojiPicker> & {
  legend: string;
  triggerLabel?: string;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState('👏');

  return (
    <fieldset className="w-80 space-y-3">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex items-center gap-3" aria-label="Seletor de reação">
        <EmojiPicker onSelect={setSelectedEmoji} {...props} />
        <div aria-live="polite" className="text-sm text-muted-foreground">
          Última reação:{' '}
          <span className="text-xl text-foreground">{selectedEmoji}</span>
        </div>
      </div>
      {triggerLabel ? (
        <p className="text-sm text-muted-foreground">{triggerLabel}</p>
      ) : null}
    </fieldset>
  );
}

const meta = {
  title: 'UI/EmojiPicker',
  component: EmojiPicker,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    onSelect: {
      control: false,
      name: 'Ao selecionar emoji',
    },
    disabled: {
      control: 'boolean',
      name: 'Desabilitado',
    },
    trigger: {
      control: false,
      name: 'Gatilho customizado',
    },
    side: {
      control: 'select',
      options: ['top', 'right', 'bottom', 'left'],
      name: 'Lado',
    },
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      name: 'Alinhamento',
    },
    testIdPrefix: {
      control: 'text',
      name: 'Prefixo de teste',
    },
  },
} satisfies Meta<typeof EmojiPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: 'Padrão',
  render: () => <EmojiPickerRender legend="Reações rápidas" />,
};

export const Disabled: Story = {
  name: 'Desabilitado',
  render: () => <EmojiPickerRender legend="Reações indisponíveis" disabled />,
};

export const CustomTrigger: Story = {
  name: 'Gatilho customizado',
  render: () => (
    <EmojiPickerRender
      legend="Reagir em comentário"
      trigger={
        <Button type="button" variant="outline" aria-label="Escolher reação">
          Escolher reação
        </Button>
      }
      side="bottom"
      align="center"
      triggerLabel="Exemplo com gatilho substituído via prop `trigger`."
    />
  ),
};
