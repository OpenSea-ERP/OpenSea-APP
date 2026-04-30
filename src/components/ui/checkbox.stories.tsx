import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './checkbox';
import { Label } from './label';

function CheckedRender() {
  const [checked, setChecked] = useState<boolean | 'indeterminate'>(true);
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Item selecionado"
    />
  );
}

function CheckboxGroupRender() {
  const [prefs, setPrefs] = useState({
    news: true,
    promo: false,
    updates: true,
  });

  return (
    <fieldset className="w-80 space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">
        Selecione preferências
      </legend>
      <div className="flex items-center gap-3">
        <Checkbox
          id="prefs-news"
          checked={prefs.news}
          onCheckedChange={v => setPrefs(p => ({ ...p, news: v === true }))}
        />
        <Label htmlFor="prefs-news">Receber boletim semanal</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="prefs-promo"
          checked={prefs.promo}
          onCheckedChange={v => setPrefs(p => ({ ...p, promo: v === true }))}
        />
        <Label htmlFor="prefs-promo">Promoções e ofertas</Label>
      </div>
      <div className="flex items-center gap-3">
        <Checkbox
          id="prefs-updates"
          checked={prefs.updates}
          onCheckedChange={v => setPrefs(p => ({ ...p, updates: v === true }))}
        />
        <Label htmlFor="prefs-updates">Atualizações do produto</Label>
      </div>
    </fieldset>
  );
}

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': 'Selecionar item' },
};

export const Checked: Story = {
  render: () => <CheckedRender />,
};

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Item bloqueado' },
};

// Checkbox supports indeterminate via the `checked` prop ('indeterminate' string).
// Radix renders the same indicator; the visual difference vs. checked is subtle in this primitive,
// but the data-state="indeterminate" is correctly reflected on the root.
export const Indeterminate: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox id="checkbox-indeterminate" checked="indeterminate" />
      <Label htmlFor="checkbox-indeterminate">Selecionar todos</Label>
    </div>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox id="checkbox-terms" />
      <Label htmlFor="checkbox-terms">Aceito os termos de uso</Label>
    </div>
  ),
};

export const CheckboxGroup: Story = {
  render: () => <CheckboxGroupRender />,
};
