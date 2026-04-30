import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhotoUploadDialog } from './photo-upload-dialog';

const meta = {
  title: 'Shared/PhotoUploadDialog',
  component: PhotoUploadDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PhotoUploadDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Simulates an upload that resolves after a short delay — the component
// flips its internal `isUploading` flag while the promise is pending.
const noopUpload = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 600);
  });

function DefaultRender() {
  const [open, setOpen] = useState(true);
  return (
    <PhotoUploadDialog
      open={open}
      onOpenChange={setOpen}
      onUpload={noopUpload}
    />
  );
}

function WithExistingPhotoRender() {
  const [open, setOpen] = useState(true);
  return (
    <PhotoUploadDialog
      open={open}
      onOpenChange={setOpen}
      onUpload={noopUpload}
      onRemove={() =>
        new Promise<void>(resolve => {
          setTimeout(resolve, 400);
        })
      }
      hasPhoto
      title="Atualizar foto do colaborador"
    />
  );
}

function LoadingRender() {
  const [open, setOpen] = useState(true);
  return (
    <PhotoUploadDialog
      open={open}
      onOpenChange={setOpen}
      onUpload={() => new Promise<void>(() => {})}
      title="Enviando foto..."
    />
  );
}

function WithErrorRender() {
  const [open, setOpen] = useState(true);
  return (
    <PhotoUploadDialog
      open={open}
      onOpenChange={setOpen}
      onUpload={async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        throw new Error('Falha simulada no upload');
      }}
      title="Falha ao enviar"
    />
  );
}

function TriggeredRender() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Trocar foto de perfil</Button>
      <PhotoUploadDialog
        open={open}
        onOpenChange={setOpen}
        onUpload={noopUpload}
      />
    </div>
  );
}

// Default open state with the empty dropzone visible (no file selected).
// The dialog's own DialogTitle satisfies a11y; a DialogDescription is not
// rendered by the component itself, so we accept the warning at the
// component layer (a11y rule: aria-describedby is optional).
export const Default: Story = {
  render: () => <DefaultRender />,
};

// With a remove action visible (the user already has a photo on file).
export const WithExistingPhoto: Story = {
  render: () => <WithExistingPhotoRender />,
};

// Loading state — `onUpload` never resolves so the button stays in the
// "Enviando..." state. Useful to verify the disabled/spinner copy.
// NOTE: The dialog requires a real File chosen via <input type="file"> to
// reach the cropper view, so we cannot mock the cropper UI without
// simulating user interaction. This story documents the empty-state copy
// while uploading — drive the cropper view manually via the file input.
export const Loading: Story = {
  render: () => <LoadingRender />,
};

// Error state — `onUpload` rejects, so the dialog stays open and resets
// the uploading flag. Toast handling is left to the caller.
export const WithError: Story = {
  render: () => <WithErrorRender />,
};

// Demonstrates the open/close toggle from a parent button — the typical
// integration pattern (profile pages, employee form, etc.).
export const Triggered: Story = {
  render: () => <TriggeredRender />,
};
