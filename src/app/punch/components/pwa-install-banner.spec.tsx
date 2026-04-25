/**
 * Behavior tests for `PWAInstallBanner`.
 *
 * Renders only on mobile UA + NOT in standalone mode + dismiss flag absent.
 * Clicking "Instalar" routes to either the iOS A2HS modal (Safari) or the
 * deferred `beforeinstallprompt` flow (Chrome/Edge). Dismiss persists in
 * `localStorage` so the banner does not nag the user across visits.
 *
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PWAInstallBanner } from './pwa-install-banner';

const installMock = vi.fn();
let mockedStandalone = false;
let mockedInstallable = false;

vi.mock('@/hooks/pwa/use-pwa-install', () => ({
  usePwaInstall: () => ({
    isInstallable: mockedInstallable,
    install: installMock,
  }),
}));

vi.mock('@/hooks/pwa/use-pwa-standalone-detect', () => ({
  usePwaStandaloneDetect: () => ({ isStandalone: mockedStandalone }),
}));

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1';

const DESKTOP_LINUX_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, 'userAgent', {
    value: ua,
    configurable: true,
  });
}

beforeEach(() => {
  installMock.mockReset();
  installMock.mockResolvedValue('accepted');
  mockedStandalone = false;
  mockedInstallable = true;
  localStorage.clear();
  setUserAgent(ANDROID_UA);
});

afterEach(() => {
  setUserAgent(DESKTOP_LINUX_UA);
});

describe('PWAInstallBanner', () => {
  it('renders on mobile UA without standalone and without dismissed flag', () => {
    setUserAgent(ANDROID_UA);
    render(<PWAInstallBanner />);
    expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument();
    expect(screen.getByText(/Instale o app de ponto/i)).toBeInTheDocument();
  });

  it('does NOT render when running as standalone PWA', () => {
    mockedStandalone = true;
    setUserAgent(ANDROID_UA);
    const { container } = render(<PWAInstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does NOT render when dismiss flag is set in localStorage', () => {
    localStorage.setItem('punch-pwa-install-dismissed', '1');
    setUserAgent(ANDROID_UA);
    const { container } = render(<PWAInstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does NOT render on desktop (non-mobile UA)', () => {
    setUserAgent(DESKTOP_LINUX_UA);
    const { container } = render(<PWAInstallBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('clicking dismiss persists flag and removes banner', () => {
    setUserAgent(ANDROID_UA);
    render(<PWAInstallBanner />);
    const dismissBtn = screen.getByRole('button', { name: /dispensar/i });
    fireEvent.click(dismissBtn);
    expect(localStorage.getItem('punch-pwa-install-dismissed')).toBe('1');
    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
  });

  it('clicking Instalar on iOS opens the A2HS modal', () => {
    setUserAgent(IPHONE_UA);
    render(<PWAInstallBanner />);
    const installBtn = screen.getByRole('button', { name: /instalar/i });
    fireEvent.click(installBtn);
    expect(screen.getByTestId('ios-a2hs-modal')).toBeInTheDocument();
    expect(installMock).not.toHaveBeenCalled();
  });

  it('clicking Instalar on Android invokes the deferred prompt install()', () => {
    setUserAgent(ANDROID_UA);
    mockedInstallable = true;
    render(<PWAInstallBanner />);
    const installBtn = screen.getByRole('button', { name: /instalar/i });
    fireEvent.click(installBtn);
    expect(installMock).toHaveBeenCalledTimes(1);
  });
});
