// User Types
export interface Profile {
  id: string;
  userId: string;
  name: string;
  surname: string;
  birthday?: Date;
  location: string;
  bio: string;
  avatarUrl: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date | null;
  lastLoginAt: Date | null;
  deletedAt?: Date | null;
  forcePasswordReset?: boolean;
  forcePasswordResetReason?: string | null;
  forcePasswordResetRequestedAt?: Date | null;
  hasAccessPin?: boolean;
  hasActionPin?: boolean;
  forceAccessPinSetup?: boolean;
  forceActionPinSetup?: boolean;
  isSuperAdmin: boolean;
  profile?: Profile | null;
}

// Auth Requests
export interface LoginCredentials {
  email: string;
  identifier?: string;
  password: string;
}

export interface MagicLinkRequestResponse {
  message: string;
}

export interface AuthMethodsResponse {
  methods: string[];
  magicLinkEnabled: boolean;
  defaultMethod: string | null;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  profile?: {
    name?: string;
    surname?: string;
    birthday?: Date;
    location?: string;
    bio?: string;
    avatarUrl?: string;
  };
}

export interface SendPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Force Password Reset
export interface ForcePasswordResetRequest {
  reason?: string;
  sendEmail?: boolean;
}

export interface PasswordResetRequiredResponse {
  message: string;
  code: string; // 'PASSWORD_RESET_REQUIRED'
  resetToken: string;
  reason?: string;
  requestedAt?: Date;
}

export interface ForcePasswordResetResponse {
  user: User & {
    forcePasswordReset?: boolean;
    forcePasswordResetReason?: string | null;
    forcePasswordResetRequestedAt?: Date | null;
  };
  message: string;
}

// PIN Types
export interface LoginWithPinCredentials {
  userId: string;
  accessPin: string;
}

export interface SetAccessPinRequest {
  currentPassword?: string;
  newAccessPin: string;
}

export interface SetActionPinRequest {
  currentPassword?: string;
  newActionPin: string;
}

export interface VerifyActionPinRequest {
  actionPin: string;
}

export interface VerifyActionPinResponse {
  valid: boolean;
}

// Auth Responses
export interface AuthTenantSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  role: string;
  joinedAt: string;
}

export interface AuthResponse {
  user: User;
  sessionId: string;
  token: string;
  refreshToken: string;
  /** Auto-selected tenant (when user has exactly 1 tenant). Token is already tenant-scoped. */
  tenant: AuthTenantSummary | null;
  /** All available tenants for this user */
  tenants: AuthTenantSummary[];
}

export interface RegisterResponse {
  user: User;
}

export interface MessageResponse {
  message: string;
}

export interface BlockedResponse {
  message: string;
  blockedUntil: Date;
}

// Me (Profile) Types
export interface UpdateProfileRequest {
  name?: string;
  surname?: string;
  birthday?: Date;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdatePasswordRequest {
  /** Nova senha (backend não requer senha antiga atualmente) */
  password: string;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface UserResponse {
  user: User;
}

// Users Admin Types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserEmailRequest {
  email: string;
}

export interface UpdateUserUsernameRequest {
  username: string;
}

export interface UpdateUserPasswordRequest {
  newPassword: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  surname?: string;
  birthday?: Date;
  location?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UsersResponse {
  users: User[];
}

// Auth State
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  module: string;
  entityId: string;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
  userName?: string | null;
  description: string;
  createdAt: Date;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditLogsQuery {
  action?: string;
  entity?: string;
  module?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Permission Types
export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
}

export interface PermissionsResponse {
  permissions: Permission[];
}

export interface GroupsResponse {
  groups: PermissionGroup[];
}
