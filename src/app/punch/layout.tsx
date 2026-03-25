'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useEffect } from 'react';

export default function PunchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inject PWA meta tags for punch page
  useEffect(() => {
    const head = document.head;

    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest-punch.json';
    head.appendChild(manifestLink);

    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#7c3aed';
    head.appendChild(themeColor);

    const mobileCapable = document.createElement('meta');
    mobileCapable.name = 'apple-mobile-web-app-capable';
    mobileCapable.content = 'yes';
    head.appendChild(mobileCapable);

    const statusBar = document.createElement('meta');
    statusBar.name = 'apple-mobile-web-app-status-bar-style';
    statusBar.content = 'black-translucent';
    head.appendChild(statusBar);

    const appTitle = document.createElement('meta');
    appTitle.name = 'apple-mobile-web-app-title';
    appTitle.content = 'OpenSea Ponto';
    head.appendChild(appTitle);

    return () => {
      head.removeChild(manifestLink);
      head.removeChild(themeColor);
      head.removeChild(mobileCapable);
      head.removeChild(statusBar);
      head.removeChild(appTitle);
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </div>
    </ProtectedRoute>
  );
}
