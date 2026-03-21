export interface CentralUser {
  id: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'SUPPORT' | 'FINANCE' | 'VIEWER';
  isActive: boolean;
  invitedBy: string | null;
  createdAt: string;
  user?: {
    email: string;
    username: string;
    profile?: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
}
