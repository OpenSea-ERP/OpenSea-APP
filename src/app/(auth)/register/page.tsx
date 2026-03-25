'use client';

import { AuthBackground } from '@/components/ui/auth-background';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PasswordStrengthChecklist,
  isPasswordStrong,
} from '@/components/ui/password-strength-checklist';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import { useForm } from '@tanstack/react-form';
import {
  CheckCircle2,
  ChevronRight,
  Hash,
  Info,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface RegisterFormData {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    } as RegisterFormData,
    onSubmit: async ({ value }: { value: RegisterFormData }) => {
      setError('');

      // Validations
      if (value.password !== value.confirmPassword) {
        setError('As senhas não coincidem');
        return;
      }

      if (!isPasswordStrong(value.password)) {
        setError('A senha não atende aos requisitos de segurança');
        return;
      }

      if (value.username.length < 3) {
        setError('O nome de usuário deve ter pelo menos 3 caracteres');
        return;
      }

      try {
        await register({
          email: value.email,
          password: value.password,
          username: value.username,
          profile: {
            name: value.name,
          },
        });
        router.push('/');
      } catch (err: unknown) {
        setError(translateError(err));
        logger.error(
          'Erro no registro',
          err instanceof Error ? err : undefined
        );
      }
    },
  });

  return (
    <AuthBackground>
      <ThemeToggle />

      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600 shadow-2xl shadow-blue-600/40 mb-4">
              <span className="text-3xl">🌊</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Criar Conta
            </h1>
            <p className="text-gray-600 dark:text-white/60">
              Comece sua jornada no OpenSea
            </p>
          </div>

          {/* Register Card */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            <CardContent className="p-6 sm:p-8">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
                className="space-y-5"
              >
                {/* Error message */}
                {error && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-rose-600 dark:text-rose-400 text-center">
                      {error}
                    </p>
                  </div>
                )}

                {/* Name */}
                <form.Field name="name">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40  z-10 pointer-events-none" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="João Silva"
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

                {/* Username */}
                <form.Field name="username">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="username">Nome de Usuário</Label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40 z-10 pointer-events-none " />
                        <Input
                          id="username"
                          type="text"
                          placeholder="joaosilva"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="pl-12"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* Email */}
                <form.Field name="email">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40 z-10 pointer-events-none" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="joao@email.com"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="pl-12"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* Password */}
                <form.Field name="password">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40 z-10 pointer-events-none" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="pl-12"
                        />
                      </div>
                      <PasswordStrengthChecklist password={field.state.value} />
                    </div>
                  )}
                </form.Field>

                {/* Confirm Password */}
                <form.Field name="confirmPassword">
                  {field => (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <div className="relative">
                        <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-white/40 z-10 pointer-events-none" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={field.state.value}
                          onChange={e => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          className="pl-12"
                        />
                      </div>
                    </div>
                  )}
                </form.Field>

                {/* Terms */}
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Ao criar uma conta, você concorda com nossos{' '}
                    <Link
                      href="/terms"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                    >
                      Termos de Serviço
                    </Link>{' '}
                    e{' '}
                    <Link
                      href="/privacy"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? 'Criando conta...' : 'Criar Conta'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Login link */}
          <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <p className="text-gray-600 dark:text-white/60">
              Já tem uma conta?{' '}
              <Link
                href="/fast-login"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
