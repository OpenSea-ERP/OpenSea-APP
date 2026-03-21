'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { envelopesService } from '@/services/signature';
import type { SignerInput, SignatureLevel, EnvelopeRoutingType } from '@/types/signature';
import { Plus, Trash2, FileSignature, Save, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateEnvelopePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [signatureLevel, setSignatureLevel] = useState<SignatureLevel>('ADVANCED');
  const [routingType, setRoutingType] = useState<EnvelopeRoutingType>('SEQUENTIAL');
  const [sourceModule, setSourceModule] = useState('manual');
  const [sourceEntityType, setSourceEntityType] = useState('document');
  const [sourceEntityId, setSourceEntityId] = useState('');
  const [documentFileId, setDocumentFileId] = useState('');
  const [documentHash, setDocumentHash] = useState('');
  const [signers, setSigners] = useState<SignerInput[]>([
    {
      order: 1,
      group: 1,
      role: 'SIGNER',
      signatureLevel: 'ADVANCED',
    },
  ]);

  const addSigner = () => {
    setSigners((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        group: routingType === 'PARALLEL' ? 1 : prev.length + 1,
        role: 'SIGNER',
        signatureLevel: signatureLevel,
      },
    ]);
  };

  const removeSigner = (index: number) => {
    setSigners((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSigner = (index: number, field: string, value: string | number) => {
    setSigners((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  };

  const createMutation = useMutation({
    mutationFn: () =>
      envelopesService.createEnvelope({
        title,
        description: description || undefined,
        signatureLevel,
        documentFileId,
        documentHash,
        sourceModule,
        sourceEntityType,
        sourceEntityId,
        routingType,
        signers,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'envelopes'] });
      toast.success('Envelope criado com sucesso');
      router.push(`/signature/envelopes/${data.envelope.id}`);
    },
    onError: () => {
      toast.error('Erro ao criar envelope');
    },
  });

  const canSubmit = title.trim() && documentFileId && documentHash && signers.length > 0;

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.REGISTER}>
      <div className="flex flex-col h-full">
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
              disabled: !canSubmit || createMutation.isPending,
            },
          ]}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Document Info */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileSignature className="h-5 w-5 text-blue-600" />
              <h2 className="font-medium">Dados do Documento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Título *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Contrato de Prestação de Serviços"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o documento..."
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>ID do Arquivo (Storage) *</Label>
                <Input
                  value={documentFileId}
                  onChange={(e) => setDocumentFileId(e.target.value)}
                  placeholder="UUID do arquivo no Storage"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Hash do Documento (SHA-256) *</Label>
                <Input
                  value={documentHash}
                  onChange={(e) => setDocumentHash(e.target.value)}
                  placeholder="Hash SHA-256"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nível de Assinatura</Label>
                <select
                  value={signatureLevel}
                  onChange={(e) => setSignatureLevel(e.target.value as SignatureLevel)}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                  onChange={(e) => setRoutingType(e.target.value as EnvelopeRoutingType)}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                  onChange={(e) => setSourceModule(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo de Entidade</Label>
                <Input
                  value={sourceEntityType}
                  onChange={(e) => setSourceEntityType(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>ID da Entidade</Label>
                <Input
                  value={sourceEntityId}
                  onChange={(e) => setSourceEntityId(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Signers */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h2 className="font-medium">Assinantes ({signers.length})</h2>
              </div>
              <Button variant="outline" size="sm" onClick={addSigner}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {signers.map((signer, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-muted/30 space-y-2"
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
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">E-mail externo</Label>
                      <Input
                        value={signer.externalEmail ?? ''}
                        onChange={(e) =>
                          updateSigner(index, 'externalEmail', e.target.value)
                        }
                        placeholder="email@exemplo.com"
                        className="mt-0.5 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={signer.externalName ?? ''}
                        onChange={(e) =>
                          updateSigner(index, 'externalName', e.target.value)
                        }
                        placeholder="Nome completo"
                        className="mt-0.5 h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Papel</Label>
                      <select
                        value={signer.role}
                        onChange={(e) =>
                          updateSigner(index, 'role', e.target.value)
                        }
                        className="w-full mt-0.5 h-8 rounded-md border border-input bg-background px-2 text-xs"
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
                        onChange={(e) =>
                          updateSigner(index, 'order', Number(e.target.value))
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
