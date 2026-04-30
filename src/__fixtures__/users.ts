export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatarUrl?: string;
}

export const mockUser = (overrides: Partial<MockUser> = {}): MockUser => ({
  id: 'user-1',
  name: 'Maria Silva',
  email: 'maria@empresa.com',
  role: 'manager',
  ...overrides,
});
