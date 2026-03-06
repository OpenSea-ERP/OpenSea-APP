'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

interface EmailHtmlBodyProps {
  /** HTML já pré-processado (sem <style>, <link>, tags estruturais) */
  html: string;
  /** Muda junto com a mensagem para forçar re-render do Shadow DOM */
  messageId: string;
}

function buildShadowCss(isDark: boolean): string {
  const textColor = isDark ? '#d1d5db' : '#1e293b';
  const mutedColor = isDark ? '#9ca3af' : '#475569';
  const linkColor = isDark ? '#60a5fa' : '#2563eb';

  return `
    :host {
      display: block;
      word-break: break-word;
      overflow-wrap: break-word;
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: ${textColor};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      /* Remove todos os fundos definidos em blocos <style> internos */
      background-color: transparent !important;
      background-image: none !important;
    }
    /* Imagens mantêm seu fundo natural */
    img {
      background-color: initial !important;
      background-image: initial !important;
      max-width: 100% !important;
      height: auto !important;
    }
    video, canvas, svg { max-width: 100% !important; height: auto !important; }
    table { max-width: 100% !important; border-collapse: collapse; }
    pre { white-space: pre-wrap; word-break: break-word; }
    blockquote {
      border-left: 3px solid ${mutedColor};
      margin-left: 0.5rem;
      padding-left: 0.75rem;
      color: ${mutedColor};
    }
    a { color: ${linkColor}; }
    hr { border-color: ${mutedColor}; opacity: 0.3; }
  `;
}

/**
 * Remove cores inline (background-color, background-image, color) de todos
 * os elementos do Shadow DOM para que as cores do tema sejam aplicadas
 * sem problemas de contraste.
 */
function stripInlineColorsFromShadow(shadow: ShadowRoot): void {
  // Inline style="color: ...; background-color: ..."
  shadow.querySelectorAll<HTMLElement>('[style]').forEach(node => {
    node.style.removeProperty('background-color');
    node.style.removeProperty('background');
    node.style.removeProperty('background-image');
    node.style.removeProperty('color');
  });

  // Atributo legado bgcolor (tabelas, td, body)
  shadow.querySelectorAll('[bgcolor]').forEach(node => {
    node.removeAttribute('bgcolor');
  });

  // Tag legada <font color="...">
  shadow.querySelectorAll<HTMLElement>('font[color]').forEach(node => {
    node.removeAttribute('color');
  });
}

/**
 * Renderiza HTML de e-mail em um Shadow DOM para impedir vazamento de CSS
 * para o layout global da página, sem os problemas de barra de rolagem dupla
 * que ocorrem com iframe.
 *
 * Fundos (background) são completamente removidos e as cores do texto
 * se adaptam automaticamente ao tema light/dark do sistema.
 */
export function EmailHtmlBody({ html, messageId }: EmailHtmlBodyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const shadow = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${buildShadowCss(isDark)}</style>${html}`;

    // Remove fundos e cores inline para que o tema controle o contraste
    stripInlineColorsFromShadow(shadow);
  }, [html, messageId, isDark]);

  return <div ref={ref} className="w-full" />;
}
