'use client';

import { AuthBackground } from '@/components/ui/auth-background';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
// Tenant auto-selection is now handled by the backend during login
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import {
  getSavedAccounts,
  removeAccount,
  saveAccount,
  type SavedAccount,
} from '@/lib/saved-accounts';
import { authService } from '@/services/auth/auth.service';
import { storageFilesService } from '@/services/storage/files.service';
import { Lock, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function FastLoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SavedAccount | null>(
    null
  );
  const [password, setPassword] = useState('');
  const [accessPin, setAccessPin] = useState('');
  const [usePinLogin, setUsePinLogin] = useState(true);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const accounts = getSavedAccounts();
    setSavedAccounts(accounts);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('session') === 'expired') {
        setSessionExpired(true);
        window.history.replaceState({}, '', '/fast-login');
      }
    }

    if (accounts.length === 0) {
      router.replace('/login');
    }
  }, [router]);

  const handleSelectAccount = (account: SavedAccount) => {
    setSelectedAccount(account);
    setPassword('');
    setAccessPin('');
    setUsePinLogin(true);
    setError('');
  };

  const handleBack = () => {
    setSelectedAccount(null);
    setPassword('');
    setAccessPin('');
    setUsePinLogin(true);
    setError('');
  };

  const handleRemoveAccount = (e: React.MouseEvent, identifier: string) => {
    e.stopPropagation();
    removeAccount(identifier);
    const updated = getSavedAccounts();
    setSavedAccounts(updated);

    if (selectedAccount?.identifier === identifier) {
      setSelectedAccount(null);
    }

    if (updated.length === 0) {
      router.replace('/login');
    }
  };

  const handlePostLogin = async (
    response: import('@/types/auth').AuthResponse
  ) => {
    const user = response.user;
    if (user.forceAccessPinSetup || user.forceActionPinSetup) {
      router.push('/setup-pins');
      return;
    }

    if (user.isSuperAdmin) {
      router.push('/central');
      return;
    }

    // Se o backend auto-selecionou o tenant, vai direto
    if (response.tenant) {
      router.push('/');
      return;
    }

    // Se tem 0 ou 2+ tenants, vai para a página de seleção
    router.push('/select-tenant');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;

    if (usePinLogin) {
      if (accessPin.length !== 6) return;
    } else {
      if (!password) return;
    }

    setError('');

    try {
      if (usePinLogin) {
        const response = await authService.loginWithPin({
          userId: selectedAccount.id,
          accessPin,
        });

        const u = response.user;
        saveAccount({
          id: u.id,
          identifier: selectedAccount.identifier,
          displayName: u.profile?.name
            ? `${u.profile.name}${u.profile.surname ? ` ${u.profile.surname}` : ''}`
            : u.username,
          avatarUrl: u.profile?.avatarUrl,
        });

        await handlePostLogin(response);
      } else {
        const result = await login({
          email: selectedAccount.identifier,
          password,
        });
        if (!result.redirected) {
          if (result.isSuperAdmin) {
            router.push('/central');
            return;
          }

          // Backend auto-selecionou tenant
          if (result.autoSelectedTenant) {
            router.push('/');
            return;
          }

          router.push('/select-tenant');
        }
      }
    } catch (err: unknown) {
      setAccessPin('');
      setError(translateError(err));
      logger.error('Erro no login', err instanceof Error ? err : undefined);
    }
  };

  const resolveAvatarUrl = (
    url: string | null | undefined
  ): string | undefined => {
    if (!url) return undefined;
    const match = url.match(/\/v1\/storage\/files\/([^/]+)\/serve/);
    if (match) {
      return storageFilesService.getServeUrl(match[1]);
    }
    return url;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isMounted || savedAccounts.length === 0) {
    return (
      <AuthBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Carregando...</div>
        </div>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <ThemeToggle />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Session expired banner */}
        {sessionExpired && (
          <div className="mb-8 px-6 py-3 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              Sua sessão expirou. Por favor, faça login novamente.
            </p>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-8 px-6 py-3 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-rose-600 dark:text-rose-400 text-center">
              {error}
            </p>
          </div>
        )}

        {/* ── Profile Selection (Netflix-style) ── */}
        {!selectedAccount && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-10 tracking-tight">
              Bem-vindo de volta
            </h1>

            {/* Profile avatars row */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-12">
              {savedAccounts.map(account => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => handleSelectAccount(account)}
                  className="group relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl bg-transparent hover:bg-blue-500/10 dark:hover:bg-blue-400/10 transition-all duration-300 cursor-pointer"
                >
                  {/* Remove button */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e =>
                      handleRemoveAccount(
                        e as React.MouseEvent,
                        account.identifier
                      )
                    }
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRemoveAccount(
                          e as unknown as React.MouseEvent,
                          account.identifier
                        );
                      }
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-10"
                    title="Remover conta"
                    aria-label="Remover conta"
                  >
                    <X className="w-4 h-4" />
                  </span>

                  {/* Large avatar */}
                  <Avatar className="h-24 w-24 sm:h-28 sm:w-28 ring-3 ring-transparent group-hover:ring-blue-500/50 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/20">
                    <AvatarImage src={resolveAvatarUrl(account.avatarUrl)} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl sm:text-3xl font-bold">
                      {getInitials(account.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name */}
                  <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 max-w-[120px] truncate">
                    {account.displayName}
                  </span>
                </button>
              ))}
            </div>

            {/* "Entrar com outra conta" */}
            <Link href="/login">
              <Button
                variant="ghost"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Entrar com outra conta
              </Button>
            </Link>
          </div>
        )}

        {/* ── PIN Entry Screen ── */}
        {selectedAccount && usePinLogin && (
          <form
            onSubmit={handleLogin}
            className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-md"
          >
            {/* Avatar of selected user */}
            <Avatar className="h-20 w-20 mb-6 ring-3 ring-blue-500/30 shadow-lg shadow-blue-500/10">
              <AvatarImage src={resolveAvatarUrl(selectedAccount.avatarUrl)} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                {getInitials(selectedAccount.displayName)}
              </AvatarFallback>
            </Avatar>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {selectedAccount.displayName}
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
              Digite o PIN de acesso
            </h1>

            {/* Large OTP input */}
            <div className="flex justify-center mb-8">
              <InputOTP
                maxLength={6}
                value={accessPin}
                onChange={setAccessPin}
                autoFocus
              >
                <InputOTPGroup className="gap-2 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      masked
                      className="h-14 w-12 sm:h-16 sm:w-14 text-2xl border rounded-lg border-gray-300 dark:border-gray-600"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {/* Submit button (only visible when PIN complete) */}
            {accessPin.length === 6 && (
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="mb-6 min-w-[160px] animate-in fade-in zoom-in-95 duration-200"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            )}

            {/* "Entrar com uma senha" */}
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setUsePinLogin(false);
                setAccessPin('');
                setError('');
              }}
              className="text-blue-600 dark:text-blue-400 mb-2"
            >
              <Lock className="w-4 h-4 mr-1.5" />
              Entrar com uma senha
            </Button>

            {/* "Entrar com outra conta" */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Entrar com outra conta
            </Button>
          </form>
        )}

        {/* ── Password Entry Screen ── */}
        {selectedAccount && !usePinLogin && (
          <form
            onSubmit={handleLogin}
            className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-sm"
          >
            {/* Avatar of selected user */}
            <Avatar className="h-20 w-20 mb-6 ring-3 ring-blue-500/30 shadow-lg shadow-blue-500/10">
              <AvatarImage src={resolveAvatarUrl(selectedAccount.avatarUrl)} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xl font-bold">
                {getInitials(selectedAccount.displayName)}
              </AvatarFallback>
            </Avatar>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {selectedAccount.displayName}
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">
              Digite sua senha
            </h1>

            {/* Password input */}
            <div className="w-full mb-6">
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
                className="h-12 text-base"
                iconLeft={
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                }
              />
            </div>

            {/* Forgot password */}
            <Link
              href="/forgot-password"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium mb-6"
            >
              Esqueceu a senha?
            </Link>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading || !password}
              size="lg"
              className="mb-6 min-w-[160px]"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            {/* "Entrar com PIN" */}
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setUsePinLogin(true);
                setPassword('');
                setError('');
              }}
              className="text-blue-600 dark:text-blue-400 mb-2"
            >
              Entrar com PIN de Acesso
            </Button>

            {/* "Entrar com outra conta" */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Entrar com outra conta
            </Button>
          </form>
        )}
      </div>
    </AuthBackground>
  );
}
