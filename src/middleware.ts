import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Nota: Middleware não tem acesso ao localStorage, apenas a cookies
  // A verificação de autenticação real é feita no AuthContext
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes (inclui fast-login)
  const publicRoutes = [
    '/login',
    '/fast-login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/',
    '/select-tenant',
  ];
  const isPublicRoute =
    publicRoutes.includes(pathname) || pathname.startsWith('/central');

  // Se tiver cookie de token e está tentando acessar login/register, redireciona para dashboard
  if (
    token &&
    (pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/fast-login')
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Permite acesso a rotas públicas sem verificação
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Para rotas protegidas, permite acesso
  // A verificação real acontece no AuthContext que tem acesso ao localStorage
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
