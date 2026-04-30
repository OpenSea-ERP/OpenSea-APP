import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from './label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from './input-otp';

// Project InputOTP wraps `input-otp`'s OTPInput and exposes Group/Slot/
// Separator subcomponents. It does NOT have a built-in disabled or error
// styling — composition uses `disabled` (forwarded to the underlying input)
// plus aria-invalid + a per-slot border override.

const meta = {
  title: 'UI/InputOTP',
  component: InputOTP,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState('');
  return (
    <div className="space-y-2">
      <Label htmlFor="otp-default" id="otp-default-label">
        Código de verificação
      </Label>
      <InputOTP
        id="otp-default"
        maxLength={6}
        value={value}
        onChange={setValue}
        aria-labelledby="otp-default-label"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <p className="text-xs text-muted-foreground">
        Enviamos um código por e-mail.
      </p>
    </div>
  );
}

export const Default: Story = {
  render: () => <DefaultRender />,
};

function Length4Render() {
  const [value, setValue] = useState('');
  return (
    <div className="space-y-2">
      <Label id="otp-pin-label" htmlFor="otp-pin">
        PIN de ação
      </Label>
      <InputOTP
        id="otp-pin"
        maxLength={4}
        value={value}
        onChange={setValue}
        aria-labelledby="otp-pin-label"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} masked />
          <InputOTPSlot index={1} masked />
          <InputOTPSlot index={2} masked />
          <InputOTPSlot index={3} masked />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export const Length4: Story = {
  render: () => <Length4Render />,
};

function DisabledRender() {
  return (
    <div className="space-y-2">
      <Label id="otp-disabled-label" htmlFor="otp-disabled">
        Código (aguardando reenvio)
      </Label>
      <InputOTP
        id="otp-disabled"
        maxLength={6}
        disabled
        value="123"
        onChange={() => {}}
        aria-labelledby="otp-disabled-label"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledRender />,
};

function WithErrorRender() {
  const [value, setValue] = useState('421');
  return (
    <div className="space-y-2">
      <Label
        id="otp-error-label"
        htmlFor="otp-error"
        className="text-destructive"
      >
        Código de verificação
      </Label>
      <InputOTP
        id="otp-error"
        maxLength={6}
        value={value}
        onChange={setValue}
        aria-invalid
        aria-describedby="otp-error-msg"
        aria-labelledby="otp-error-label"
      >
        <InputOTPGroup>
          <InputOTPSlot
            index={0}
            className="border-destructive aria-invalid:border-destructive"
          />
          <InputOTPSlot
            index={1}
            className="border-destructive aria-invalid:border-destructive"
          />
          <InputOTPSlot
            index={2}
            className="border-destructive aria-invalid:border-destructive"
          />
          <InputOTPSlot
            index={3}
            className="border-destructive aria-invalid:border-destructive"
          />
          <InputOTPSlot
            index={4}
            className="border-destructive aria-invalid:border-destructive"
          />
          <InputOTPSlot
            index={5}
            className="border-destructive aria-invalid:border-destructive"
          />
        </InputOTPGroup>
      </InputOTP>
      <p id="otp-error-msg" className="text-sm text-destructive">
        Código inválido ou expirado. Solicite um novo.
      </p>
    </div>
  );
}

export const WithError: Story = {
  render: () => <WithErrorRender />,
};

function FilledRender() {
  const [value, setValue] = useState('839271');
  return (
    <div className="space-y-2">
      <Label id="otp-filled-label" htmlFor="otp-filled">
        Código preenchido
      </Label>
      <InputOTP
        id="otp-filled"
        maxLength={6}
        value={value}
        onChange={setValue}
        aria-labelledby="otp-filled-label"
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export const Filled: Story = {
  render: () => <FilledRender />,
};
