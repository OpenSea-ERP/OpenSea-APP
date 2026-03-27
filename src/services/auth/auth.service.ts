import { API_ENDPOINTS, authConfig } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  AuthMethodsResponse,
  AuthResponse,
  LoginCredentials,
  LoginWithPinCredentials,
  MagicLinkRequestResponse,
  MessageResponse,
  RegisterData,
  RegisterResponse,
  ResetPasswordRequest,
  SendPasswordResetRequest,
} from '@/types/auth';

export const authService = {
  // POST /v1/auth/login/unified — supports email, CPF, matrícula, username
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const identifier = credentials.identifier || credentials.email;
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN_UNIFIED,
      { identifier, password: credentials.password }
    );

    if (response.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  // POST /v1/auth/login/unified — explicit unified method
  async loginUnified(credentials: { identifier: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN_UNIFIED,
      credentials
    );

    if (response.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  // POST /v1/auth/magic-link/request
  async requestMagicLink(identifier: string): Promise<MagicLinkRequestResponse> {
    return apiClient.post<MagicLinkRequestResponse>(
      API_ENDPOINTS.AUTH.MAGIC_LINK_REQUEST,
      { identifier }
    );
  },

  // POST /v1/auth/magic-link/verify
  async verifyMagicLink(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.MAGIC_LINK_VERIFY,
      { token }
    );

    if (response.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  // GET /v1/auth/methods
  async getAuthMethods(tenantSlug?: string): Promise<AuthMethodsResponse> {
    const params = tenantSlug ? `?tenantSlug=${tenantSlug}` : '';
    return apiClient.get<AuthMethodsResponse>(
      `${API_ENDPOINTS.AUTH.AUTH_METHODS}${params}`
    );
  },

  // POST /v1/auth/login/pin
  async loginWithPin(
    credentials: LoginWithPinCredentials
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN_PIN,
      credentials
    );

    if (response.token) {
      this.setToken(response.token);
      if (response.refreshToken) {
        this.setRefreshToken(response.refreshToken);
      }
    }

    return response;
  },

  // POST /v1/auth/register/password
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data
    );

    return response;
  },

  // POST /v1/auth/send/password
  async sendPasswordReset(
    data: SendPasswordResetRequest
  ): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      API_ENDPOINTS.AUTH.SEND_PASSWORD_RESET,
      data
    );
  },

  // POST /v1/auth/reset/password
  async resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      data
    );
  },

  // PATCH /v1/sessions/refresh
  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // IMPORTANTE: Enviar refresh token no header Authorization, não no body
    const baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333';
    const response = await fetch(
      `${baseURL}${API_ENDPOINTS.SESSIONS.REFRESH}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${refreshToken}`, // ⚠️ USA REFRESH TOKEN NO HEADER!
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    // IMPORTANTE: Substituir AMBOS os tokens pelos novos recebidos
    if (data.token && data.refreshToken) {
      this.setToken(data.token);
      this.setRefreshToken(data.refreshToken);
    }

    return data;
  },

  // Token Management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(authConfig.tokenKey, token);
      window.dispatchEvent(new CustomEvent('auth-token-change'));
    }
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(authConfig.tokenKey);
  },

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(authConfig.refreshTokenKey, token);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(authConfig.refreshTokenKey);
  },

  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(authConfig.tokenKey);
      localStorage.removeItem(authConfig.refreshTokenKey);
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async routineCheck(): Promise<{
    finance: { markedOverdue: number; dueSoonAlerts: number } | null;
    calendarReminders: { processed: number; errors: number } | null;
  }> {
    return apiClient.post('/v1/auth/routine-check');
  },
};
