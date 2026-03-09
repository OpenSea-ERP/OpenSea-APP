import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <div className="text-6xl font-bold text-slate-200 dark:text-slate-800">
            404
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Página não encontrada
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A página que você procura não existe ou foi movida.
          </p>
        </div>
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
