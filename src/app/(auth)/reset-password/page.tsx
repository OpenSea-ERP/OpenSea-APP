'use client';

import { AuthBackground } from '@/components/ui/auth-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useResetPassword } from '@/hooks/use-auth';
import { logger } from '@/lib/logger';
import { useForm } from '@tanstack/react-form';
import {
  PasswordStrengthChecklist,
  isPasswordStrong,
} from '@/components/ui/password-strength-checklist';
import { AlertCircle, CheckCircle2, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const forced = searchParams.get('forced') === 'true';
  const reason = searchParams.get('reason');

  const [error, setError] = useState(
    !token
      ? 'Token não fornecido. Verifique o link de redefinição de senha.'
      : ''
  );
  const [step, setStep] = useState<'reset' | 'success'>('reset');
  const resetPassword = useResetPassword();

  const form = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    } as ResetPasswordFormData,
    onSubmit: async ({ value }: { value: ResetPasswordFormData }) => {
      setError('');

      if (!token) {
        setError('Token não fornecido');
        return;
      }

      if (value.password !== value.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (!isPasswordStrong(value.password)) {
        setError('A senha não atende aos requisitos de segurança');
        return;
      }

      try {
        await resetPassword.mutateAsync({
          token,
          newPassword: value.password,
        });

        setStep('success');
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erro ao redefinir senha';
        setError(errorMessage);
        logger.error(
          'Erro ao redefinir senha',
          err instanceof Error ? err : undefined
        );
      }
    },
  });

  return (
    <AuthBackground>
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl shadow-blue-600/40 mb-4 ${
                forced
                  ? 'bg-linear-to-br from-red-500 to-red-600'
                  : 'bg-linear-to-br from-blue-500 to-blue-600'
              }`}
            >
              <span className="text-3xl">{forced ? '⚠️' : '🔐'}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {forced ? 'Redefinição Obrigatória' : 'Redefinir Senha'}
            </h1>
            <p className="text-gray-600 dark:text-white/60">
              {step === 'reset'
                ? 'Crie uma nova senha para continuar'
                : 'Senha redefinida com sucesso!'}
            </p>
          </div>

          {/* Card */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardContent className="p-6 sm:p-8">
              {/* Forced Reset Alert */}
              {forced && step === 'reset' && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Ação Obrigatória
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        Um administrador solicitou que você redefina sua senha
                        antes de continuar.
                      </p>
                      {reason && (
                        <p className="text-xs text-red-700 dark:text-red-300 italic mt-2">
                          Motivo: {reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success message */}
              {step === 'success' && (
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Senha Redefinida com Sucesso!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      {forced
                        ? 'Você pode agora fazer login com sua nova senha.'
                        : 'Sua senha foi alterada com sucesso. Faça login com sua nova senha.'}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/fast-login')}
                    className="w-full"
                    size="lg"
                  >
                    Ir para Login
                  </Button>
                </div>
              )}

              {/* Form */}
              {step === 'reset' && (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    form.handleSubmit();
                  }}
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

                  {/* Password Field */}
                  <form.Field name="password">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="password">Nova Senha</Label>
                        <PasswordInput
                          id="password"
                          placeholder="••••••••"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          autoFocus
                          minLength={8}
                          iconLeft={
                            <Lock className="w-5 h-5 text-gray-500 dark:text-white/40" />
                          }
                        />
                        <PasswordStrengthChecklist
                          password={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>

                  {/* Confirm Password Field */}
                  <form.Field name="confirmPassword">
                    {field => (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">
                          Confirmar Nova Senha
                        </Label>
                        <PasswordInput
                          id="confirmPassword"
                          placeholder="••••••••"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          minLength={6}
                          iconLeft={
                            <Lock className="w-5 h-5 text-gray-500 dark:text-white/40" />
                          }
                        />
                      </div>
                    )}
                  </form.Field>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={resetPassword.isPending || !token}
                  >
                    {resetPassword.isPending
                      ? 'Redefinindo...'
                      : 'Redefinir Senha'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Back to login - only show if not forced */}
          {!forced && step === 'reset' && (
            <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <Link
                href="/fast-login"
                className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors inline-flex items-center gap-2 font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar para login
              </Link>
            </div>
          )}
        </div>
      </div>
    </AuthBackground>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
