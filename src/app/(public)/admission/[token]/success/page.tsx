'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Mail } from 'lucide-react';

export default function AdmissionSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6">
      {/* Success icon */}
      <div className="flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Dados enviados com sucesso!
        </h1>
        <p className="text-muted-foreground max-w-md">
          Suas informações foram recebidas e estão sendo analisadas pela equipe
          de Recursos Humanos.
        </p>
      </div>

      {/* Instructions card */}
      <Card className="p-6 max-w-md w-full bg-white/95 dark:bg-white/5 border-border">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-500" />
            <h2 className="text-sm font-semibold">Próximos passos</h2>
          </div>

          <ul className="text-sm text-muted-foreground space-y-3">
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                A equipe de RH irá revisar seus dados e documentos enviados.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Caso algum documento precise de correção, você será notificado
                por e-mail.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <span>
                Após a aprovação, seu cadastro como funcionário será criado
                automaticamente.
              </span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Info note */}
      <p className="text-xs text-muted-foreground text-center max-w-sm">
        Você pode fechar esta página. Em caso de dúvidas, entre em contato com o
        departamento de Recursos Humanos da empresa.
      </p>
    </div>
  );
}
