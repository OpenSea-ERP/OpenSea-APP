/**
 * Behavior tests for `AttachmentPicker`.
 *
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AttachmentPicker } from './attachment-picker';

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastError(...args),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

const mockedQuota = {
  used: 0 as number | null,
  available: 100 as number | null,
  quota: 100 as number | null,
  isNearLimit: false,
  isAtLimit: false,
};

vi.mock('@/hooks/pwa/use-storage-quota', () => ({
  useStorageQuota: () => mockedQuota,
}));

beforeEach(() => {
  toastError.mockReset();
  mockedQuota.isNearLimit = false;
  mockedQuota.isAtLimit = false;
});

afterEach(() => {
  vi.clearAllMocks();
});

function makeFile(name: string, size: number, type = 'image/jpeg'): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('AttachmentPicker', () => {
  it('renders 3 picker buttons + counter', () => {
    render(<AttachmentPicker files={[]} onChange={() => {}} />);
    expect(screen.getByTestId('attachment-picker-camera')).toBeTruthy();
    expect(screen.getByTestId('attachment-picker-gallery')).toBeTruthy();
    expect(screen.getByTestId('attachment-picker-pdf')).toBeTruthy();
    expect(screen.getByText('0/3 arquivos · até 5MB cada')).toBeTruthy();
  });

  it('rejects files larger than maxSizeMB and emits toast.error', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AttachmentPicker files={[]} onChange={onChange} maxSizeMB={5} />
    );
    const oversized = makeFile('big.jpg', 6 * 1024 * 1024);
    const input = container.querySelector(
      'input[capture="environment"]'
    ) as HTMLInputElement;
    Object.defineProperty(input, 'files', {
      value: [oversized],
      configurable: true,
    });
    fireEvent.change(input);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('excede'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('limits new selections to remaining slots (slice when over maxFiles)', () => {
    const existing = [
      makeFile('a.jpg', 100),
      makeFile('b.jpg', 100),
      makeFile('c.jpg', 100),
    ];
    const onChange = vi.fn();
    const { container } = render(
      <AttachmentPicker files={existing} onChange={onChange} maxFiles={3} />
    );
    const fourth = makeFile('d.jpg', 100);
    const galleryInput = container.querySelector(
      'input[multiple]'
    ) as HTMLInputElement;
    Object.defineProperty(galleryInput, 'files', {
      value: [fourth],
      configurable: true,
    });
    fireEvent.change(galleryInput);
    // 4th rejected via remaining<=0 path → toast + onChange not called
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining('Máximo de 3')
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes a file when X button clicked', () => {
    const a = makeFile('a.jpg', 100);
    const b = makeFile('b.jpg', 100);
    const onChange = vi.fn();
    render(<AttachmentPicker files={[a, b]} onChange={onChange} />);
    const removeBtns = screen.getAllByLabelText(/Remover/);
    fireEvent.click(removeBtns[0]!);
    expect(onChange).toHaveBeenCalledWith([b]);
  });

  it('blocks new attachments when isAtLimit', () => {
    mockedQuota.isAtLimit = true;
    const onChange = vi.fn();
    const { container } = render(
      <AttachmentPicker files={[]} onChange={onChange} />
    );
    const newFile = makeFile('a.jpg', 1024);
    const galleryInput = container.querySelector(
      'input[multiple]'
    ) as HTMLInputElement;
    Object.defineProperty(galleryInput, 'files', {
      value: [newFile],
      configurable: true,
    });
    fireEvent.change(galleryInput);
    expect(toastError).toHaveBeenCalledWith(
      expect.stringContaining('Espaço esgotado')
    );
    expect(onChange).not.toHaveBeenCalled();
  });
});
