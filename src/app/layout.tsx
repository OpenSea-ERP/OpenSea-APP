import { ErrorBoundary } from '@/components/shared/error-boundary';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import { TenantProvider } from '@/contexts/tenant-context';
import { QueryProvider } from '@/providers/query-provider';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenSea App',
  description:
    'Modern Next.js application with authentication and API integration',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {/* Script para remover atributos de extensões antes da hidratação */}
        <Script
          id="remove-extension-attributes"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove atributos comuns de extensões do body
                const removeExtensionAttributes = () => {
                  const body = document.body;
                  if (body) {
                    // Lista de atributos conhecidos de extensões
                    const extensionAttrs = [
                      'cz-shortcut-listen',
                      'data-new-gr-c-s-check-loaded',
                      'data-gr-ext-installed',
                      'spellcheck',
                    ];
                    extensionAttrs.forEach(attr => {
                      if (body.hasAttribute(attr)) {
                        body.removeAttribute(attr);
                      }
                    });
                  }
                };
                
                // Executa assim que possível
                if (document.body) {
                  removeExtensionAttributes();
                } else {
                  document.addEventListener('DOMContentLoaded', removeExtensionAttributes);
                }
              })();
            `,
          }}
        />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <AuthProvider>
                <TenantProvider>{children}</TenantProvider>
              </AuthProvider>
            </QueryProvider>
            <Toaster position="top-right" richColors />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
