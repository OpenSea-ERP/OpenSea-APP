/**
 * OpenSea OS - API Client
 * Cliente HTTP principal para comunicação com o backend
 */

import { apiConfig } from '@/config/api';
import { logger } from '@/lib/logger';
import { TokenManager } from './api-client-auth';
import {
  createApiError,
  extractErrorMessage,
  handleNetworkError,
  logErrorResponse,
  parseErrorResponse,
} from './api-client-error';
import type { RequestOptions } from './api-client.types';

// =============================================================================
// API CLIENT
// =============================================================================

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private tokenManager: TokenManager;

  constructor(baseURL = apiConfig.baseURL, timeout = apiConfig.timeout) {
    this.baseURL = baseURL;
    this.timeout = timeout;
    this.tokenManager = new TokenManager(baseURL);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers = {}, ...restOptions } = options;

    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    }

    const token = this.tokenManager.getToken();
    const hasBody = restOptions.body !== undefined;
    const isFormData = restOptions.body instanceof FormData;
    const defaultHeaders: HeadersInit = {
      ...(hasBody && !isFormData && apiConfig.headers),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    };

    const controller = new AbortController();
    const requestTimeout =
      ((restOptions as Record<string, unknown>).timeout as
        | number
        | undefined) ?? this.timeout;
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const response = await fetch(url.toString(), {
        ...restOptions,
        headers: defaultHeaders,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      // Handle 401 - Token expirado
      if (response.status === 401 && !options.skipRefresh) {
        logger.debug('[API] Recebido 401, tentando refresh...');

        // Primeiro tenta o refresh
        let newToken: string;
        try {
          newToken = await this.tokenManager.refreshAccessToken();
        } catch (refreshError) {
          logger.error(
            '[API] Falha no refresh, usuário será deslogado',
            refreshError instanceof Error
              ? refreshError
              : new Error(String(refreshError))
          );
          throw refreshError;
        }

        logger.debug('[API] Refresh bem-sucedido, repetindo request...');

        // Repete a requisição com novo token
        const retryHeaders = {
          ...defaultHeaders,
          Authorization: `Bearer ${newToken}`,
        };

        try {
          const retryResponse = await fetch(url.toString(), {
            ...restOptions,
            headers: retryHeaders,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            if (retryResponse.status === 401 || retryResponse.status === 403) {
              // Auth still failing after refresh — session is truly invalid
              this.tokenManager.handleRefreshFailure(false);
            }

            const retryError = await retryResponse
              .json()
              .catch(() => ({ message: 'An error occurred' }));
            throw new Error(
              retryError.message ||
                `HTTP error! status: ${retryResponse.status}`
            );
          }

          if (retryResponse.status === 204) {
            return undefined as T;
          }

          logger.debug('[API] Request repetido com sucesso');
          return (await retryResponse.json()) as T;
        } catch (retryError) {
          logger.error(
            '[API] Erro ao repetir request após refresh',
            retryError instanceof Error
              ? retryError
              : new Error(String(retryError))
          );
          // Não limpamos tokens aqui; problema provavelmente é de rede/CORS
          throw retryError;
        }
      }

      // Handle outros erros HTTP
      if (!response.ok) {
        const errorData = await parseErrorResponse(response);
        const errorMessage = extractErrorMessage(errorData);

        logErrorResponse(response, errorData);

        throw createApiError(
          errorMessage,
          response.status,
          errorData as Record<string, unknown>,
          errorData.code
        );
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error) {
        const networkError = handleNetworkError(
          error,
          url.toString(),
          this.baseURL,
          restOptions.method || 'GET'
        );

        if (networkError !== error) {
          throw networkError;
        }
      }

      throw error instanceof Error
        ? error
        : new Error('An unexpected error occurred');
    }
  }

  getTokenManager(): TokenManager {
    return this.tokenManager;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Download a binary file as Blob. Similar to `get()` but returns a Blob
   * instead of parsing the response as JSON. Handles auth token + 401 refresh.
   */
  async getBlob(
    endpoint: string,
    options?: RequestOptions
  ): Promise<{ blob: Blob; filename: string; contentType: string }> {
    const { params, headers = {} } = options ?? {};

    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.keys(params).forEach(key => {
        url.searchParams.append(key, params[key]);
      });
    }

    const token = this.tokenManager.getToken();
    const requestHeaders: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Download failed' }));
        throw new Error(
          (errorData as Record<string, string>).message ||
            `HTTP ${response.status}`
        );
      }

      const blob = await response.blob();

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') ?? '';
      let filename = 'download';
      const utf8Match = disposition.match(/filename\*=UTF-8''(.+)/);
      if (utf8Match) {
        filename = decodeURIComponent(utf8Match[1]);
      } else {
        const basicMatch = disposition.match(/filename="?([^";\n]+)"?/);
        if (basicMatch) {
          filename = basicMatch[1];
        }
      }

      const contentType =
        response.headers.get('Content-Type') ?? 'application/octet-stream';

      return { blob, filename, contentType };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error instanceof Error
        ? error
        : new Error('An unexpected error occurred during download');
    }
  }
}

export const apiClient = new ApiClient();
