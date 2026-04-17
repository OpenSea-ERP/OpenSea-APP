'use client';

/**
 * Envelope creation page.
 *
 * Replaces the previous flow (which required pasting the fileId + SHA-256
 * hash as plain text) with a real file upload + client-side hash computation.
 *
 * Flow:
 *   1. User drops / picks a file.
 *   2. We compute SHA-256 of the raw bytes via SubtleCrypto.
 *   3. We upload the file via storageFilesService.smartUpload.
 *   4. The returned StorageFile.id + hash are used to create the envelope.
 */

import { ProtectedRoute } from '@/components/auth/protected-route';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { envelopesService } from '@/services/signature';
import { storageFilesService } from '@/services/storage';
import type {
  EnvelopeRoutingType,
  SignatureLevel,
  SignerInput,
} from '@/types/signature';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  FileSignature,
  Plus,
  Save,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB ceiling for signable documents

async function computeSha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / Math.pow(1024, index);
  return `${value.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

interface UploadedDocument {
  fileId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  hash: string;
}

export default function CreateEnvelopePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [signatureLevel, setSignatureLevel] =
    useState<SignatureLevel>('ADVANCED');
  const [routingType, setRoutingType] =
    useState<EnvelopeRoutingType>('SEQUENTIAL');
  const [sourceModule, setSourceModule] = useState('manual');
  const [sourceEntityType, setSourceEntityType] = useState('document');
  const [sourceEntityId, setSourceEntityId] = useState('');

  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'hashing' | 'uploading'>(
    'idle'
  );
  const [isDragging, setIsDragging] = useState(false);

  const [signers, setSigners] = useState<SignerInput[]>([
    {
      order: 1,
      group: 1,
      role: 'SIGNER',
      signatureLevel: 'ADVANCED',
    },
  ]);

  const handleFileSelected = useCallback(async (file: File) => {
    if (file.size === 0) {
      toast.error('O arquivo selecionado está vazio.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error(
        `O arquivo excede o limite de ${formatBytes(MAX_UPLOAD_BYTES)}.`
      );
      return;
    }

    setIsUploading(true);
    setUploadStage('hashing');
    setUploadProgress(0);

    try {
      const hash = await computeSha256Hex(file);

      setUploadStage('uploading');
      const response = await storageFilesService.smartUpload(
        null,
        file,
        percent => setUploadProgress(percent),
        { entityType: 'signature-envelope' }
      );

      setUploadedDocument({
        fileId: response.file.id,
        fileName: response.file.name,
        fileSize: response.file.size,
        mimeType: response.file.mimeType,
        hash,
      });
      toast.success('Documento carregado com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar o documento.';
      toast.error(message);
    } finally {
      setIsUploading(false);
      setUploadStage('idle');
      setUploadProgress(0);
    }
  }, []);

  const handleRemoveDocument = useCallback(() => {
    setUploadedDocument(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFilePick = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) void handleFileSelected(file);
      if (event.target) event.target.value = '';
    },
    [handleFileSelected]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) void handleFileSelected(file);
    },
    [handleFileSelected]
  );

  const addSigner = useCallback(() => {
    setSigners(prev => [
      ...prev,
      {
        order: prev.length + 1,
        group: routingType === 'PARALLEL' ? 1 : prev.length + 1,
        role: 'SIGNER',
        signatureLevel,
      },
    ]);
  }, [routingType, signatureLevel]);

  const removeSigner = useCallback((index: number) => {
    setSigners(prev => prev.filter((_, position) => position !== index));
  }, []);

  const updateSigner = useCallback(
    (index: number, field: keyof SignerInput, value: string | number) => {
      setSigners(prev =>
        prev.map((signer, position) =>
          position === index ? { ...signer, [field]: value } : signer
        )
      );
    },
    []
  );

  const createMutation = useMutation({
    mutationFn: () => {
      if (!uploadedDocument) {
        throw new Error('Faça o upload do documento antes de continuar.');
      }
      return envelopesService.createEnvelope({
        title,
        description: description || undefined,
        signatureLevel,
        documentFileId: uploadedDocument.fileId,
        documentHash: uploadedDocument.hash,
        sourceModule,
        sourceEntityType,
        sourceEntityId,
        routingType,
        signers,
      });
    },
    onSuccess: response => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'envelopes'] });
      toast.success('Envelope criado com sucesso.');
      router.push(`/signature/envelopes/${response.envelope.id}`);
    },
    onError: error => {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível criar o envelope.';
      toast.error(message);
    },
  });

  const canSubmit = Boolean(
    title.trim() &&
      uploadedDocument &&
      signers.length > 0 &&
      !createMutation.isPending
  );

  return (
    <ProtectedRoute
      requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.REGISTER}
    >
      <div className="flex h-full flex-col">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Envelopes', href: '/signature/envelopes' },
            { label: 'Novo Envelope' },
          ]}
          buttons={[
            {
              title: createMutation.isPending ? 'Criando...' : 'Criar Envelope',
              icon: Save,
              onClick: () => createMutation.mutate(),
              disabled: !canSubmit,
            },
          ]}
        />

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Document upload */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" />
              <h2 className="font-medium">Documento a assinar</h2>
            </div>

            {!uploadedDocument ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={
                  'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ' +
                  (isDragging
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-300 hover:border-gray-400 dark:border-slate-600 dark:hover:border-slate-500')
                }
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png"
                  onChange={handleFilePick}
                  disabled={isUploading}
                />
                <Upload className="h-10 w-10 text-gray-400 dark:text-slate-500" />
                <p className="text-sm font-medium">
                  {isUploading
                    ? uploadStage === 'hashing'
                      ? 'Calculando hash SHA-256...'
                      : 'Enviando documento...'
                    : 'Arraste o documento aqui ou clique para selecionar'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Aceita PDF, DOCX, ODT, JPG e PNG — até{' '}
                  {formatBytes(MAX_UPLOAD_BYTES)}
                </p>
                {isUploading && uploadStage === 'uploading' && (
                  <Progress
                    value={uploadProgress}
                    className="mt-3 h-1 w-full max-w-sm"
                  />
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-500/5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {uploadedDocument.fileName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatBytes(uploadedDocument.fileSize)} ·{' '}
                    {uploadedDocument.mimeType}
                  </p>
                  <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                    SHA-256: {uploadedDocument.hash}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={handleRemoveDocument}
                  aria-label="Remover documento"
                  className="shrink-0 text-rose-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Envelope metadata */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-blue-600" />
              <h2 className="font-medium">Dados do envelope</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Ex.: Contrato de Prestação de Serviços"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Descreva o documento..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Nível de Assinatura</Label>
                <select
                  value={signatureLevel}
                  onChange={event =>
                    setSignatureLevel(event.target.value as SignatureLevel)
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="SIMPLE">Simples</option>
                  <option value="ADVANCED">Avançada</option>
                  <option value="QUALIFIED">Qualificada (ICP-Brasil)</option>
                </select>
              </div>
              <div>
                <Label>Tipo de Roteamento</Label>
                <select
                  value={routingType}
                  onChange={event =>
                    setRoutingType(event.target.value as EnvelopeRoutingType)
                  }
                  className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="SEQUENTIAL">Sequencial</option>
                  <option value="PARALLEL">Paralelo</option>
                  <option value="HYBRID">Híbrido</option>
                </select>
              </div>
              <div>
                <Label>Módulo de Origem</Label>
                <Input
                  value={sourceModule}
                  onChange={event => setSourceModule(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo de Entidade</Label>
                <Input
                  value={sourceEntityType}
                  onChange={event => setSourceEntityType(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>ID da Entidade</Label>
                <Input
                  value={sourceEntityId}
                  onChange={event => setSourceEntityId(event.target.value)}
                  className="mt-1"
                  placeholder="Opcional — deixe em branco para documento avulso"
                />
              </div>
            </div>
          </Card>

          {/* Signers */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h2 className="font-medium">
                  Assinantes ({signers.length})
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={addSigner}>
                <Plus className="mr-1 h-4 w-4" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div
                  key={`signer-${index}`}
                  className="space-y-2 rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Assinante {index + 1}
                    </span>
                    {signers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500"
                        onClick={() => removeSigner(index)}
                        aria-label="Remover assinante"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div>
                      <Label className="text-xs">E-mail externo</Label>
                      <Input
                        type="email"
                        value={signer.externalEmail ?? ''}
                        onChange={event =>
                          updateSigner(
                            index,
                            'externalEmail',
                            event.target.value
                          )
                        }
                        placeholder="email@exemplo.com"
                        className="mt-0.5 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={signer.externalName ?? ''}
                        onChange={event =>
                          updateSigner(index, 'externalName', event.target.value)
                        }
                        placeholder="Nome completo"
                        className="mt-0.5 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Papel</Label>
                      <select
                        value={signer.role}
                        onChange={event =>
                          updateSigner(index, 'role', event.target.value)
                        }
                        className="mt-0.5 h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                      >
                        <option value="SIGNER">Assinante</option>
                        <option value="APPROVER">Aprovador</option>
                        <option value="WITNESS">Testemunha</option>
                        <option value="REVIEWER">Revisor</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Ordem</Label>
                      <Input
                        type="number"
                        min={1}
                        value={signer.order}
                        onChange={event =>
                          updateSigner(
                            index,
                            'order',
                            Number(event.target.value)
                          )
                        }
                        className="mt-0.5 h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
