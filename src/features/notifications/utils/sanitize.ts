import DOMPurify from 'dompurify';

const SAFE_PROTOCOLS = /^(https?:|mailto:|tel:)/i;

export function sanitizeText(value: string | null | undefined): string {
  if (!value) return '';
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

export function sanitizeUrl(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed;
  if (SAFE_PROTOCOLS.test(trimmed)) return trimmed;
  return undefined;
}
