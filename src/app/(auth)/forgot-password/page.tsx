'use client';

import { AuthBackground } from '@/components/ui/auth-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useResetPassword, useSendPasswordReset } from '@/hooks/use-auth';
import { logger } from '@/lib/logger';
import { useForm } from '@tanstack/react-form';
import {
  PasswordStrengthChecklist,
  isPasswordStrong,
} from '@/components/ui/password-strength-checklist';
import {
  CheckCircle2,
  ChevronLeft,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

type ForgotPasswordStep = 'email' | 'code' | 'new-password' | 'success';

interface ForgotPasswordFormData {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>(
    token ? 'new-password' : 'email'
  );
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const sendPasswordReset = useSendPasswordReset();
  const resetPassword = useResetPassword();

  const form = useForm({
    defaultValues: {
      email: '',
      code: token || '',
      password: '',
      confirmPassword: '',
    } as ForgotPasswordFormData,
    onSubmit: async ({ value }: { value: ForgotPasswordFormData }) => {
      setError('');

      try {
        if (currentStep === 'new-password') {
          if (value.password !== value.confirmPassword) {
            setError('As senhas não coincidem');
            return;
          }
          if (!isPasswordStrong(value.password)) {
            setError('A senha não atende aos requisitos de segurança');
            return;
          }

          await resetPassword.mutateAsync({
            token: value.code,
            newPassword: value.password,
          });

          setCurrentStep('success');
        }
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = form.getFieldValue('email');

    if (!emailValue || !emailValue.includes('@')) {
      setError('Digite um email válido');
      return;
    }

    try {
      setError('');
      await sendPasswordReset.mutateAsync({ email: emailValue });
      setEmail(emailValue);
      setCurrentStep('code');
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao enviar email';
      setError(errorMessage);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeValue = form.getFieldValue('code');

    if (!codeValue || codeValue.length < 6) {
      setError('Digite o código de verificação válido');
      return;
    }

    setError('');
    setCurrentStep('new-password');
  };

  return (
    <AuthBackground>
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-600/40 mb-4">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Recuperar Senha
            </h1>
            <p className="text-gray-600 dark:text-white/60">
              {currentStep === 'email' &&
                'Digite seu email para receber o código'}
              {currentStep === 'code' &&
                'Digite o código enviado para seu email'}
              {currentStep === 'new-password' && 'Crie uma nova senha'}
              {currentStep === 'success' && 'Senha redefinida com sucesso!'}
            </p>
          </div>

          {/* Card */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardContent className="p-6 sm:p-8">
              {/* Success message */}
              {currentStep === 'success' && (
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 dark:bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-500 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Senha Redefinida!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-white/60">
                      Sua senha foi alterada com sucesso. Faça login com sua
                      nova senha.
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
              {currentStep !== 'success' && (
                <form
                  onSubmit={
                    currentStep === 'email'
                      ? handleEmailSubmit
                      : currentStep === 'code'
                        ? handleCodeSubmit
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
                      className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                        currentStep === 'email'
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                    <div
                      className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                        currentStep === 'code'
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                    <div
                      className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
                        currentStep === 'new-password'
                          ? 'bg-blue-600 dark:bg-blue-400'
                          : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  </div>

                  {/* Step 1: Email */}
                  {currentStep === 'email' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <form.Field name="email">
                        {field => (
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={field.state.value}
                                onChange={e =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                autoFocus
                                className="pl-12"
                              />
                            </div>
                          </div>
                        )}
                      </form.Field>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={sendPasswordReset.isPending}
                      >
                        {sendPasswordReset.isPending
                          ? 'Enviando...'
                          : 'Enviar Código'}
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Code */}
                  {currentStep === 'code' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50">
                        <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                          Enviamos um código para{' '}
                          <span className="font-medium">{email}</span>
                        </p>
                      </div>

                      <form.Field name="code">
                        {field => (
                          <div className="space-y-2">
                            <Label htmlFor="code">Código de Verificação</Label>
                            <div className="relative">
                              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40" />
                              <Input
                                id="code"
                                type="text"
                                placeholder="000000"
                                value={field.state.value}
                                onChange={e =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                autoFocus
                                maxLength={6}
                                className="pl-12"
                              />
                            </div>
                          </div>
                        )}
                      </form.Field>

                      <Button type="submit" className="w-full" size="lg">
                        Verificar Código
                      </Button>
                    </div>
                  )}

                  {/* Step 3: New Password */}
                  {currentStep === 'new-password' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                      <form.Field name="password">
                        {field => (
                          <div className="space-y-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40" />
                              <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={field.state.value}
                                onChange={e =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                autoFocus
                                className="pl-12"
                              />
                            </div>
                            <PasswordStrengthChecklist
                              password={field.state.value}
                            />
                          </div>
                        )}
                      </form.Field>

                      <form.Field name="confirmPassword">
                        {field => (
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                              Confirmar Nova Senha
                            </Label>
                            <div className="relative">
                              <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40" />
                              <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={field.state.value}
                                onChange={e =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                className="pl-12"
                              />
                            </div>
                          </div>
                        )}
                      </form.Field>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={resetPassword.isPending}
                      >
                        {resetPassword.isPending
                          ? 'Redefinindo...'
                          : 'Redefinir Senha'}
                      </Button>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Back to login */}
          {currentStep !== 'success' && (
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

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
