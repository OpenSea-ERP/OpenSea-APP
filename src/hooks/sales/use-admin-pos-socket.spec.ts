import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdminPosSocket } from './use-admin-pos-socket';

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  connected: false,
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));
vi.mock('@/contexts/tenant-context', () => ({
  useTenant: () => ({ currentTenant: { id: 'tn-1' } }),
}));
vi.mock('@/config/api', () => ({
  apiConfig: { baseURL: 'http://localhost:3333' },
}));

describe('useAdminPosSocket', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem('auth_token', 'fake-jwt');
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSocket.connected = false;
  });

  it('connects to /admin/pos with auth token from localStorage', async () => {
    const { io } = await import('socket.io-client');
    renderHook(() => useAdminPosSocket());

    expect(io).toHaveBeenCalledWith(
      'http://localhost:3333/admin/pos',
      expect.objectContaining({
        auth: { token: 'fake-jwt' },
        transports: ['websocket', 'polling'],
      })
    );
  });

  it('subscribes via on() and unsubscribes on cleanup', () => {
    const handler = vi.fn();
    const { result, unmount } = renderHook(() => useAdminPosSocket());

    act(() => {
      result.current.on('terminal.synced', handler);
    });
    expect(mockSocket.on).toHaveBeenCalledWith('terminal.synced', handler);

    unmount();
    expect(mockSocket.off).toHaveBeenCalledWith('terminal.synced', handler);
  });
});
