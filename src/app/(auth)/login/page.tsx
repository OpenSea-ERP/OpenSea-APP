'use client';

import { AuthBackground } from '@/components/ui/auth-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
// Tenant auto-selection is now handled by the backend during login
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import { useForm } from '@tanstack/react-form';
import { ChevronLeft, ChevronRight, Lock, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type LoginStep = 'identifier' | 'password';

interface LoginFormData {
  identifier: string;
  password: string;
}

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<LoginStep>('identifier');
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');

  const form = useForm({
    defaultValues: {
      identifier: '',
      password: '',
    } as LoginFormData,
    onSubmit: async ({ value }: { value: LoginFormData }) => {
      setError('');

      try {
        const result = await login({
          email: value.identifier,
          password: value.password,
        });
        if (!result.redirected) {
          // Super admins vão direto para o Central
          if (result.isSuperAdmin) {
            router.push('/central');
            return;
          }

          // Se o backend já auto-selecionou o tenant, vai direto para o dashboard
          if (result.autoSelectedTenant) {
            router.push('/');
            return;
          }

          // Se tem 0 ou 2+ tenants, vai para a página de seleção
          router.push('/select-tenant');
        }
      } catch (err: unknown) {
        setError(translateError(err));
        logger.error('Erro no login', err instanceof Error ? err : undefined);
      }
    },
  });

  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = form.getFieldValue('identifier');

    if (!value || value.length < 3) {
      setError('Digite um email ou nome de usuário válido');
      return;
    }

    setError('');
    setIdentifier(value);
    setCurrentStep('password');
  };

  const handleBack = () => {
    setCurrentStep('identifier');
    setError('');
    form.setFieldValue('password', '');
  };

  return (
    <AuthBackground>
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-600/40 mb-4">
              <span className="text-3xl">🌊</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              OpenSea
            </h1>
            <p className="text-gray-600 dark:text-white/60">
              Entre na sua conta
            </p>
          </div>

          {/* Login Card */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardContent className="p-6 sm:p-8">
              <form
                onSubmit={
                  currentStep === 'identifier'
                    ? handleIdentifierSubmit
                    : e => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                      }
                }
                className="space-y-6"
              >
                {/* Error message */}
                {error && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-rose-600 dark:text-rose-400 text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <div
                    className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                      currentStep === 'identifier'
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                  <div
                    className={`h-1.5 w-12 rounded-full transition-all duration-300 ${
                      currentStep === 'password'
                        ? 'bg-blue-600 dark:bg-blue-400'
                        : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                </div>

                {/* Step 1: Identifier */}
                {currentStep === 'identifier' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <form.Field name="identifier">
                      {field => (
                        <div className="space-y-2">
                          <Label htmlFor="identifier">
                            Email ou Nome de Usuário
                          </Label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40 z-10 pointer-events-none" />
                            <Input
                              id="identifier"
                              type="text"
                              placeholder="seu@email.com ou @usuario"
                              value={field.state.value}
                              onChange={e => field.handleChange(e.target.value)}
                              onBlur={field.handleBlur}
                              autoFocus
                              className="pl-12"
                            />
                          </div>
                        </div>
                      )}
                    </form.Field>

                    <Button type="submit" className="w-full" size="lg">
                      Continuar
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}

                {/* Step 2: Password */}
                {currentStep === 'password' && (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Show identifier */}
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 shadow-sm">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate font-medium">
                        {identifier}
                      </span>
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>

                    <form.Field name="password">
                      {field => (
                        <div className="space-y-2">
                          <Label htmlFor="password">Senha</Label>
                          <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            value={field.state.value}
                            onChange={e => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            autoFocus
                            iconLeft={
                              <Lock className="w-5 h-5 text-gray-500 dark:text-white/40" />
                            }
                          />
                        </div>
                      )}
                    </form.Field>

                    {/* Forgot password */}
                    <div className="text-right">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        className="flex-1"
                        size="lg"
                      >
                        <ChevronLeft className="w-5 h-5 mr-2" />
                        Voltar
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isLoading}
                        size="lg"
                      >
                        {isLoading ? 'Entrando...' : 'Entrar'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthBackground>
  );
}
