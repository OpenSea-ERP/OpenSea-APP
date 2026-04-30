import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from './label';
import { Textarea } from './textarea';

// Project Textarea is a thin wrapper over <textarea>; it exposes only native
// attributes (no built-in error/counter/auto-resize props). All composed
// states (label, counter, error) are user-side composition — same pattern
// used by pages like the orders observation field.

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Textarea
      placeholder="Digite uma observação..."
      className="w-96"
      aria-label="Observações"
    />
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <Label htmlFor="observacoes">Observações</Label>
      <Textarea
        id="observacoes"
        placeholder="Notas sobre o pedido, instruções de entrega, etc."
      />
    </div>
  ),
};

// Composed counter: project doesn't ship a built-in counter, so pages keep
// state and render `${len}/${max}` below the field. WCAG: aria-describedby
// links the live region to the textarea.
function WithCharCountRender() {
  const max = 280;
  const [text, setText] = useState(
    'Cliente solicitou entrega no período da tarde, após as 14h.'
  );
  return (
    <div className="w-96 space-y-2">
      <Label htmlFor="comentario">Comentário</Label>
      <Textarea
        id="comentario"
        value={text}
        onChange={e => setText(e.target.value.slice(0, max))}
        maxLength={max}
        aria-describedby="comentario-counter"
        placeholder="Conte-nos mais..."
      />
      <p
        id="comentario-counter"
        className="text-xs text-muted-foreground text-right tabular-nums"
        aria-live="polite"
      >
        {text.length}/{max}
      </p>
    </div>
  );
}

export const WithCharCount: Story = {
  render: () => <WithCharCountRender />,
};

export const Disabled: Story = {
  render: () => (
    <Textarea
      disabled
      defaultValue="Campo bloqueado para edição."
      className="w-96"
      aria-label="Observações bloqueadas"
    />
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <Label htmlFor="motivo" className="text-destructive">
        Motivo do cancelamento
      </Label>
      <Textarea
        id="motivo"
        aria-invalid
        aria-describedby="motivo-error"
        defaultValue=""
        placeholder="Descreva o motivo (mínimo 10 caracteres)"
        className="border-destructive focus:border-destructive"
      />
      <p id="motivo-error" className="text-sm text-destructive">
        Informe um motivo com pelo menos 10 caracteres.
      </p>
    </div>
  ),
};

// Auto-resize is not part of the component API. Pages that need it use
// the `field-sizing-content` CSS class plus a no-resize override. We
// document that via composition here.
export const AutoResize: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <Label htmlFor="auto">Descrição (cresce conforme digita)</Label>
      <Textarea
        id="auto"
        placeholder="Digite várias linhas para ver o campo crescer."
        className="resize-none [field-sizing:content] min-h-[60px]"
        rows={2}
      />
    </div>
  ),
};
