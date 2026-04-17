/**
 * Public signing service — consumed by the public signing portal.
 *
 * All endpoints in this service are PUBLIC (no JWT). The fetch client must not
 * add an Authorization header — access is granted via the per-signer token
 * embedded in the URL.
 */

import { API_ENDPOINTS, apiConfig } from '@/config/api';
import type {
  SignatureLevel,
  SignerRole,
  SignerStatus,
} from '@/types/signature';

export interface SigningPageResponse {
  signing: {
    envelopeTitle: string;
    envelopeDescription: string | null;
    documentFileId: string;
    signerName: string;
    signerEmail: string;
    signerRole: SignerRole;
    signerStatus: SignerStatus;
    signatureLevel: SignatureLevel;
    otpVerified?: boolean;
  };
}

export interface SignDocumentPayload {
  signatureData?: string;
  geoLatitude?: number;
  geoLongitude?: number;
}

export interface RejectDocumentPayload {
  reason?: string;
}

export interface VerifyByCodeResponse {
  status: string;
  envelopeTitle: string;
  documentHash: string;
  completedAt: string | null;
  signers: Array<{
    name: string;
    role: SignerRole;
    status: SignerStatus;
    signedAt: string | null;
  }>;
  isValid: boolean;
  verificationCode?: string;
}

export interface RequestOtpResponse {
  otpExpiresAt: string;
}

export interface VerifyOtpResponse {
  verified: true;
}

interface PublicRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

async function publicRequest<T>(
  endpoint: string,
  options: PublicRequestOptions = {}
): Promise<T> {
  const { method = 'GET', body } = options;
  const url = new URL(endpoint, apiConfig.baseURL);

  const response = await fetch(url.toString(), {
    method,
    headers:
      body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'omit',
    mode: 'cors',
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const signingService = {
  async getSigningPage(token: string): Promise<SigningPageResponse> {
    return publicRequest<SigningPageResponse>(
      API_ENDPOINTS.SIGNATURE.SIGNING.GET(token)
    );
  },

  async requestOtp(token: string): Promise<RequestOtpResponse> {
    return publicRequest<RequestOtpResponse>(
      API_ENDPOINTS.SIGNATURE.SIGNING.OTP_REQUEST(token),
      { method: 'POST', body: {} }
    );
  },

  async verifyOtp(token: string, otpCode: string): Promise<VerifyOtpResponse> {
    return publicRequest<VerifyOtpResponse>(
      API_ENDPOINTS.SIGNATURE.SIGNING.OTP_VERIFY(token),
      { method: 'POST', body: { otpCode } }
    );
  },

  async signDocument(
    token: string,
    payload: SignDocumentPayload
  ): Promise<void> {
    await publicRequest<void>(API_ENDPOINTS.SIGNATURE.SIGNING.SIGN(token), {
      method: 'POST',
      body: payload,
    });
  },

  async rejectDocument(
    token: string,
    payload: RejectDocumentPayload
  ): Promise<void> {
    await publicRequest<void>(API_ENDPOINTS.SIGNATURE.SIGNING.REJECT(token), {
      method: 'POST',
      body: payload,
    });
  },

  async verifyByCode(code: string): Promise<VerifyByCodeResponse> {
    return publicRequest<VerifyByCodeResponse>(
      API_ENDPOINTS.SIGNATURE.VERIFY.GET(code)
    );
  },

  /**
   * Build the absolute URL for the public signed-PDF download. Consumers
   * should open this URL in a new tab (or via `<a download>`). It is not
   * fetched via XHR because the PDF may be large and browsers handle binary
   * downloads more reliably via direct navigation.
   */
  buildSignedPdfUrl(token: string): string {
    return new URL(
      API_ENDPOINTS.SIGNATURE.SIGNING.SIGNED_PDF(token),
      apiConfig.baseURL
    ).toString();
  },

  /**
   * Issue a HEAD-equivalent check to see whether the signed PDF is already
   * available for the given signer. Used to poll the backend while the
   * certificate/signing job finishes. Returns true on 200, false on 404, and
   * rethrows any other error.
   */
  async isSignedPdfReady(token: string): Promise<boolean> {
    const url = new URL(
      API_ENDPOINTS.SIGNATURE.SIGNING.SIGNED_PDF(token),
      apiConfig.baseURL
    );
    const response = await fetch(url.toString(), {
      method: 'GET',
      credentials: 'omit',
      mode: 'cors',
      // Range request with 0 bytes — cheap way to test availability without
      // pulling the full PDF. If the server ignores the range, the browser
      // will still abort once this function returns, so cost stays bounded.
      headers: { Range: 'bytes=0-0' },
    });
    if (response.status === 404) return false;
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status}`);
    }
    return true;
  },

  /**
   * Fetch the signed document as a base64 JSON payload — IDM-immune because
   * IDM only intercepts GET binary responses, not POST JSON bodies.
   * Mirrors the storage preview IDM-protection pattern.
   */
  async fetchDocumentPreviewBase64(
    documentFileId: string,
    authToken: string | null
  ): Promise<{ data: string; mimeType: string }> {
    const url = new URL('/v1/storage/preview', apiConfig.baseURL);
    const response = await fetch(url.toString(), {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ fileId: documentFileId }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as { data: string; mimeType: string };
  },
};
