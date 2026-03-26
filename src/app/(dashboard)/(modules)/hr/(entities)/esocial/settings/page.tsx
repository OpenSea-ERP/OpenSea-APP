'use client';

import { useCallback, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Settings,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  FileCheck,
  Lock,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { esocialService } from '@/services/hr/esocial.service';
import { toast } from 'sonner';

export default function EsocialSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [passphrase, setPassphrase] = useState('');

  // Fetch config
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: ['esocial', 'config'],
    queryFn: () => esocialService.getConfig(),
  });

  // Fetch certificate
  const { data: certData, isLoading: certLoading } = useQuery({
    queryKey: ['esocial', 'certificate'],
    queryFn: () => esocialService.getCertificate(),
  });

  const config = configData?.config;
  const certificate = certData?.certificate;

  // Config mutation
  const configMutation = useMutation({
    mutationFn: esocialService.updateConfig,
    onSuccess: () => {
      toast.success('Configuração atualizada');
      queryClient.invalidateQueries({ queryKey: ['esocial', 'config'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Certificate upload mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, pass }: { file: File; pass: string }) =>
      esocialService.uploadCertificate(file, pass),
    onSuccess: () => {
      toast.success('Certificado enviado com sucesso');
      setPassphrase('');
      queryClient.invalidateQueries({ queryKey: ['esocial', 'certificate'] });
      queryClient.invalidateQueries({ queryKey: ['esocial', 'dashboard'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleToggle = useCallback(
    (field: string, value: boolean) => {
      configMutation.mutate({ [field]: value });
    },
    [configMutation]
  );

  const handleEnvironmentChange = useCallback(
    (env: 'PRODUCAO' | 'HOMOLOGACAO') => {
      configMutation.mutate({ environment: env });
    },
    [configMutation]
  );

  const handleFileUpload = useCallback(() => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Selecione um arquivo PFX');
      return;
    }
    uploadMutation.mutate({ file, pass: passphrase });
  }, [passphrase, uploadMutation]);

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Recursos Humanos', href: '/hr' },
          { label: 'eSocial', href: '/hr/esocial' },
          { label: 'Configurações' },
        ]}
        hasPermission={hasPermission}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push('/hr/esocial')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/8">
              <Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Configurações Gerais</h3>
              <p className="text-xs text-muted-foreground">
                Parâmetros do eSocial para este tenant
              </p>
            </div>
          </div>

          {configLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Environment */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Ambiente
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      config?.environment === 'HOMOLOGACAO'
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => handleEnvironmentChange('HOMOLOGACAO')}
                    disabled={configMutation.isPending}
                  >
                    <Server className="h-4 w-4 mr-1.5" />
                    Homologação
                  </Button>
                  <Button
                    variant={
                      config?.environment === 'PRODUCAO' ? 'default' : 'outline'
                    }
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => handleEnvironmentChange('PRODUCAO')}
                    disabled={configMutation.isPending}
                  >
                    <Server className="h-4 w-4 mr-1.5" />
                    Produção
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Auto-generate toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Geração automática
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gerar eventos automaticamente a partir dos dados cadastrados
                  </p>
                </div>
                <Switch
                  checked={config?.autoGenerate ?? false}
                  onCheckedChange={checked =>
                    handleToggle('autoGenerate', checked)
                  }
                  disabled={configMutation.isPending}
                />
              </div>

              <Separator />

              {/* Require approval toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">
                    Exigir aprovação
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Eventos devem ser aprovados antes da transmissão
                  </p>
                </div>
                <Switch
                  checked={config?.requireApproval ?? true}
                  onCheckedChange={checked =>
                    handleToggle('requireApproval', checked)
                  }
                  disabled={configMutation.isPending}
                />
              </div>

              <Separator />

              {/* Employer info */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Tipo do Empregador
                </Label>
                <div className="flex gap-2">
                  <Button
                    variant={
                      config?.employerType === 'CNPJ' ? 'default' : 'outline'
                    }
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() =>
                      configMutation.mutate({ employerType: 'CNPJ' })
                    }
                    disabled={configMutation.isPending}
                  >
                    CNPJ
                  </Button>
                  <Button
                    variant={
                      config?.employerType === 'CPF' ? 'default' : 'outline'
                    }
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() =>
                      configMutation.mutate({ employerType: 'CPF' })
                    }
                    disabled={configMutation.isPending}
                  >
                    CPF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Certificate Card */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/8">
              <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Certificado Digital</h3>
              <p className="text-xs text-muted-foreground">
                Certificado ICP-Brasil para assinatura e transmissão
              </p>
            </div>
          </div>

          {certLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : certificate ? (
            <div className="space-y-4">
              {/* Certificate info */}
              <div
                className={`rounded-lg border p-4 ${
                  certificate.isExpired
                    ? 'border-rose-200 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/8'
                    : certificate.daysLeft < 30
                      ? 'border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/8'
                      : 'border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/8'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {certificate.isExpired ? (
                    <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  ) : certificate.daysLeft < 30 ? (
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                  <Badge
                    variant={certificate.isExpired ? 'destructive' : 'default'}
                  >
                    {certificate.isExpired
                      ? 'Expirado'
                      : `${certificate.daysLeft} dias restantes`}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">
                      Número de série:
                    </span>
                    <span className="ml-1 font-mono">
                      {certificate.serialNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emissor:</span>
                    <span className="ml-1">{certificate.issuer}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Titular:</span>
                    <span className="ml-1">{certificate.subject}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground">Válido de:</span>
                      <span className="ml-1">
                        {new Date(certificate.validFrom).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Até:</span>
                      <span className="ml-1 font-medium">
                        {new Date(certificate.validUntil).toLocaleDateString(
                          'pt-BR'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Replace certificate */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Substituir certificado
                </Label>
                <div className="space-y-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pfx,.p12"
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Senha do certificado"
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-9 px-3 shrink-0"
                      onClick={handleFileUpload}
                      disabled={uploadMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      {uploadMutation.isPending ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* No certificate */}
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Lock className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">
                  Nenhum certificado configurado
                </p>
                <p className="text-xs mt-1 text-center max-w-xs">
                  Faça o upload de um certificado digital ICP-Brasil (arquivo
                  .pfx ou .p12) para assinar e transmitir eventos.
                </p>
              </div>

              <Separator />

              {/* Upload certificate */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground mb-2 block">
                  Enviar certificado (PFX/P12)
                </Label>
                <div className="space-y-3">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".pfx,.p12"
                    className="text-xs"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Senha do certificado"
                      value={passphrase}
                      onChange={e => setPassphrase(e.target.value)}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      className="h-9 px-3 shrink-0"
                      onClick={handleFileUpload}
                      disabled={uploadMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-1.5" />
                      {uploadMutation.isPending ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-500/8">
            <FileCheck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Sobre o eSocial</h3>
            <p className="text-xs text-muted-foreground">
              Informações sobre o sistema de escrituração fiscal digital
            </p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground space-y-2">
          <p>
            O eSocial (Sistema de Escrituração Digital das Obrigações Fiscais,
            Previdenciárias e Trabalhistas) unifica o envio de informações
            fiscais, trabalhistas e previdenciárias em um único sistema do
            governo federal.
          </p>
          <p>
            Os eventos são gerados automaticamente ou manualmente a partir dos
            dados cadastrados, revisados, aprovados e então transmitidos ao
            webservice do eSocial utilizando o certificado digital ICP-Brasil do
            empregador.
          </p>
          <p>
            Após a transmissão, o sistema consulta automaticamente o resultado
            do processamento, atualizando o status de cada evento (aceito ou
            rejeitado com código de erro).
          </p>
        </div>
      </Card>
    </div>
  );
}
