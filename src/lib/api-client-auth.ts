/**
 * OpenSea OS - API Client Auth
 * Gerenciamento de tokens e autenticação
 */

import { API_ENDPOINTS, apiConfig, authConfig } from '@/config/api';
import { logger } from '@/lib/logger';
import type { RefreshResponse } from './api-client.types';

// =============================================================================
// TOKEN MANAGER
// =============================================================================

export class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private baseURL: string;

  // Token cache para evitar acessos repetidos ao localStorage
  private tokenCache: string | null = null;
  private tokenCacheTimestamp = 0;
  private readonly CACHE_TTL = 1000; // 1 segundo

  get isRefreshing(): boolean {
    return this.refreshPromise !== null;
  }

  constructor(baseURL = apiConfig.baseURL) {
    this.baseURL = baseURL;
    // Schedule refresh for existing token (e.g., page reload)
    if (typeof window !== 'undefined') {
      this.scheduleProactiveRefresh();
    }
  }

  // =============================================================================
  // TOKEN GETTERS/SETTERS
  // =============================================================================

  getToken(): string | null {
    if (typeof window === 'undefined') return null;

    // Verificar cache antes de acessar localStorage
    const now = Date.now();
    if (
      this.tokenCache !== null &&
      now - this.tokenCacheTimestamp < this.CACHE_TTL
    ) {
      return this.tokenCache;
    }

    // Cache expirado ou vazio, ler do localStorage
    this.tokenCache = localStorage.getItem(authConfig.tokenKey);
    this.tokenCacheTimestamp = now;

    return this.tokenCache;
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(authConfig.refreshTokenKey);
  }

  setTokens(token: string | null, refreshToken?: string | null): void {
    if (typeof window === 'undefined') return;

    // Invalidar cache ao atualizar tokens
    this.tokenCache = token;
    this.tokenCacheTimestamp = token ? Date.now() : 0;

    if (token) {
      localStorage.setItem(authConfig.tokenKey, token);
    } else {
      localStorage.removeItem(authConfig.tokenKey);
    }

    if (typeof refreshToken !== 'undefined') {
      if (refreshToken) {
        localStorage.setItem(authConfig.refreshTokenKey, refreshToken);
      } else {
        localStorage.removeItem(authConfig.refreshTokenKey);
      }
    }

    // Dispara evento customizado para notificar o AuthContext
    window.dispatchEvent(new CustomEvent('auth-token-change'));

    // Schedule proactive refresh before new token expires
    if (token) {
      this.scheduleProactiveRefresh();
    }
  }

  clearTokens(): void {
    // CRITICAL: Null the refresh promise FIRST to prevent in-flight refresh
    // from re-populating tokens after they're cleared
    this.refreshPromise = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.setTokens(null, null);
  }

  /**
   * Decode JWT payload without signature verification to read `exp`.
   * Schedules a refresh 5 minutes before expiration.
   */
  scheduleProactiveRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const token = this.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp as number;
      if (!exp) return;

      const now = Math.floor(Date.now() / 1000);
      // Refresh 5 minutes before expiration (access token is 30min)
      const refreshIn = (exp - now - 300) * 1000;

      if (refreshIn <= 0) {
        // Token already near expiration, refresh now
        this.refreshAccessToken().catch(() => {});
        return;
      }

      this.refreshTimer = setTimeout(() => {
        this.refreshTimer = null;
        this.refreshAccessToken().catch(() => {});
      }, refreshIn);
    } catch {
      // Invalid token format, skip proactive refresh
    }
  }

  // =============================================================================
  // TOKEN REFRESH
  // =============================================================================

  async refreshAccessToken(): Promise<string> {
    // Sistema de lock: se já existe uma tentativa de refresh em andamento, reutiliza ela
    // Isso evita múltiplas chamadas simultâneas ao endpoint (rate limit: 10/min)
    if (this.refreshPromise) {
      logger.debug('[API] Refresh já em andamento, aguardando...');
      return this.refreshPromise;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      const error = new Error('No refresh token available');
      this.handleRefreshFailure();
      throw error;
    }

    // IMPORTANTE: Refresh token é SINGLE-USE
    // - Token antigo é revogado após uso bem-sucedido
    // - Backend retorna novo access token E novo refresh token
    // - Sempre salvar ambos os tokens retornados

    // Cria a promise de refresh e armazena para evitar chamadas simultâneas
    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      // Limpa o lock após conclusão (sucesso ou erro)
      this.refreshPromise = null;
    }
  }

  private async performRefresh(refreshToken: string): Promise<string> {
    logger.debug('[API] Iniciando refresh do token...');
    logger.debug('[API] URL do refresh', {
      url: `${this.baseURL}${API_ENDPOINTS.SESSIONS.REFRESH}`,
    });

    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.SESSIONS.REFRESH}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${refreshToken}`,
          },
          // Backend não requer body, apenas Authorization header
          mode: 'cors',
          credentials: 'include',
        }
      ).catch(networkError => {
        // Captura erros de rede antes do response
        logger.error(
          '[API] Erro de rede no refresh',
          networkError instanceof Error
            ? networkError
            : new Error(String(networkError))
        );
        throw new Error(
          `Falha de conexão com o servidor. Verifique se o backend está rodando em ${this.baseURL}`
        );
      });

      if (!response.ok) {
        let errorMessage = 'Failed to refresh token';
        let errorDetails = '';

        try {
          const errorData = await response.json();
          if (typeof errorData?.message === 'string') {
            errorMessage = errorData.message;
            errorDetails = errorData.message;
          }
        } catch (_) {
          // ignore JSON parse errors, keep default message
        }

        // Log detalhado baseado no tipo de erro do backend
        if (response.status === 401) {
          if (errorDetails.includes('required')) {
            logger.error(
              '[API] Refresh falhou: Token não encontrado no header'
            );
          } else if (errorDetails.includes('Invalid')) {
            logger.error('[API] Refresh falhou: Refresh token inválido');
          } else if (errorDetails.includes('expired')) {
            logger.error('[API] Refresh falhou: Refresh token expirado');
          } else if (errorDetails.includes('revoked')) {
            logger.error('[API] Refresh falhou: Refresh token revogado');
          } else {
            logger.error('[API] Refresh falhou (401)', undefined, {
              errorMessage,
            });
          }
        } else if (response.status === 429) {
          logger.error('[API] Rate limit excedido - aguarde 1 minuto');
        } else {
          logger.error('[API] Refresh falhou', undefined, { errorMessage });
        }

        // Erro de autenticação, não de rede - redireciona para login
        this.handleRefreshFailure(false);
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as RefreshResponse;

      if (data.token) {
        logger.debug('[API] Refresh bem-sucedido, tokens atualizados');

        // CRÍTICO: Backend usa single-use tokens
        // Sempre salva o novo refresh token retornado
        if (!data.refreshToken) {
          logger.warn(
            '[API] Novo refresh token não retornado! Token antigo foi revogado.'
          );
        }

        if (data.tenant?.id && typeof window !== 'undefined') {
          localStorage.setItem('selected_tenant_id', data.tenant.id);
          window.dispatchEvent(
            new CustomEvent('tenant-refreshed', { detail: data.tenant })
          );
        }

        this.setTokens(data.token, data.refreshToken ?? null);
        return data.token;
      }

      logger.error('[API] Refresh retornou sem token');
      // Resposta inesperada do backend, não de rede - redireciona para login
      this.handleRefreshFailure(false);
      throw new Error('Failed to refresh token');
    } catch (error) {
      // Se já chamou handleRefreshFailure antes de throw, não chama novamente
      // Verifica pelo tipo de erro se é de rede
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('Falha de conexão') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError'));

      // Se for erro de rede que veio do .catch interno, já foi tratado acima
      // Só chama handleRefreshFailure se for um erro não esperado
      if (isNetworkError) {
        this.handleRefreshFailure(true);
      }
      // Se não for erro de rede, o handleRefreshFailure já foi chamado antes do throw
      throw error;
    }
  }

  handleRefreshFailure(_isNetworkError = false): void {
    // Quando o erro é de rede (servidor temporariamente indisponível), verificar
    // se o access token atual ainda é válido. Se sim, NÃO destruir a sessão —
    // apenas reagendar o refresh para daqui a 60s. O usuário continua autenticado.
    if (_isNetworkError) {
      const token = this.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const exp = payload.exp as number;
          const now = Math.floor(Date.now() / 1000);
          if (exp && exp > now) {
            logger.warn(
              '[API] Erro de rede no refresh mas access token ainda válido — mantendo sessão e reagendando refresh em 60s'
            );
            if (this.refreshTimer) {
              clearTimeout(this.refreshTimer);
              this.refreshTimer = null;
            }
            this.refreshTimer = setTimeout(() => {
              this.refreshTimer = null;
              this.refreshAccessToken().catch(() => {});
            }, 60_000);
            return;
          }
        } catch {
          // Token inválido ou não-decodificável — prossegue com o logout normal
        }
      }
    }

    logger.debug('[API] Limpando tokens após falha de refresh...');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('selected_tenant_id');
    }
    this.clearTokens();
    // Auth-context handles redirect via token change detection
  }
}
