'use client';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronsUpDown,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  companyDocumentsApi,
  type CompanyDocument,
} from '../api/company-documents.api';

const DOCUMENT_TYPE_SUGGESTIONS = [
  'Cartão CNPJ',
  'Contrato Social',
  'Inscrição Municipal',
  'Inscrição Estadual',
  'Alvará de Funcionamento',
  'CND Federal',
  'CND Estadual',
  'CND Municipal',
  'CND FGTS',
  'CND Trabalhista',
  'Certificado Digital',
  'Licença Ambiental',
  'Licença Sanitária',
  'Procuração',
  'Comprovante de Endereço',
  'Outros',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExpirationStatus(expiresAt: string | null): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
} | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expDate = new Date(expiresAt);
  const diffDays = Math.ceil(
    (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return { label: 'Vencido', variant: 'destructive' };
  if (diffDays <= 30)
    return { label: `Vence em ${diffDays} dia(s)`, variant: 'destructive' };
  if (diffDays <= 90)
    return { label: `Vence em ${diffDays} dias`, variant: 'secondary' };
  return {
    label: `Válido até ${expDate.toLocaleDateString('pt-BR')}`,
    variant: 'outline',
  };
}

interface CompanyDocumentsTabProps {
  companyId: string;
}

export function CompanyDocumentsTab({ companyId }: CompanyDocumentsTabProps) {
  const queryClient = useQueryClient();
  const queryKey = ['companies', companyId, 'documents'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyDocument | null>(
    null
  );
  const [isDeletePinOpen, setIsDeletePinOpen] = useState(false);
  const [newDocType, setNewDocType] = useState('');
  const [newDocExpires, setNewDocExpires] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typePopoverOpen, setTypePopoverOpen] = useState(false);

  // Query
  const { data: documents = [], isLoading } = useQuery<CompanyDocument[]>({
    queryKey,
    queryFn: () => companyDocumentsApi.list(companyId),
    enabled: !!companyId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: {
      file: File;
      documentType: string;
      expiresAt?: string;
      notes?: string;
    }) => companyDocumentsApi.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Documento adicionado com sucesso!');
      resetAddForm();
    },
    onError: () => {
      toast.error('Erro ao adicionar documento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) =>
      companyDocumentsApi.delete(companyId, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Documento removido com sucesso!');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Erro ao remover documento');
    },
  });

  // Handlers
  const resetAddForm = useCallback(() => {
    setIsAddOpen(false);
    setNewDocType('');
    setNewDocExpires('');
    setNewDocNotes('');
    setSelectedFile(null);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!selectedFile || !newDocType.trim()) return;
    await createMutation.mutateAsync({
      file: selectedFile,
      documentType: newDocType.trim(),
      expiresAt: newDocExpires || undefined,
      notes: newDocNotes || undefined,
    });
  }, [selectedFile, newDocType, newDocExpires, newDocNotes, createMutation]);

  const handleView = useCallback(
    (doc: CompanyDocument) => {
      const url = companyDocumentsApi.getFileUrl(companyId, doc.id);
      window.open(url, '_blank');
    },
    [companyId]
  );

  const handleDownload = useCallback(
    (doc: CompanyDocument) => {
      const url = companyDocumentsApi.getFileUrl(companyId, doc.id, true);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || 'documento';
      a.click();
    },
    [companyId]
  );

  const handleDeleteRequest = useCallback((doc: CompanyDocument) => {
    setDeleteTarget(doc);
    setIsDeletePinOpen(true);
  }, []);

  const handleDeleteConfirmed = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch (error) {
      logger.error(
        'Erro ao remover documento',
        error instanceof Error ? error : undefined
      );
    }
  }, [deleteTarget, deleteMutation]);

  return (
    <TabsContent value="documents" className="space-y-6 w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Empresariais
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gerencie os documentos legais e certidões da empresa
          </p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Adicionar Documento
        </Button>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <Card className="p-12 text-center bg-white/5">
          <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <h4 className="text-lg font-medium mb-1">
            Nenhum documento cadastrado
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione documentos empresariais como Cartão CNPJ, Contrato Social,
            CNDs e outros.
          </p>
          <Button variant="outline" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Documento
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map(doc => {
            const expStatus = getExpirationStatus(doc.expiresAt);
            return (
              <Card
                key={doc.id}
                className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 flex flex-col"
              >
                {/* Document Type */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {doc.documentType}
                      </p>
                      {doc.fileName && (
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.fileName}
                          {doc.fileSize
                            ? ` • ${formatFileSize(doc.fileSize)}`
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiration Badge */}
                {expStatus && (
                  <div className="mb-3">
                    <Badge
                      variant={expStatus.variant}
                      className="text-xs gap-1"
                    >
                      {expStatus.variant === 'destructive' && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {expStatus.variant === 'outline' && (
                        <Calendar className="h-3 w-3" />
                      )}
                      {expStatus.label}
                    </Badge>
                  </div>
                )}

                {/* Notes */}
                {doc.notes && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {doc.notes}
                  </p>
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground mb-3 mt-auto">
                  Adicionado em{' '}
                  {new Date(doc.createdAt).toLocaleDateString('pt-BR')}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  {doc.fileKey && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleView(doc)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteRequest(doc)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Document Dialog */}
      <Dialog open={isAddOpen} onOpenChange={open => !open && resetAddForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Adicionar Documento
            </DialogTitle>
            <DialogDescription>
              Selecione o tipo de documento e faça o upload do arquivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Type - Combobox */}
            <div className="space-y-2">
              <Label>Tipo de Documento *</Label>
              <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                  >
                    {newDocType || 'Selecione ou digite...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput
                      placeholder="Buscar ou digitar tipo..."
                      value={newDocType}
                      onValueChange={setNewDocType}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <button
                          className="w-full text-left px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded"
                          onClick={() => {
                            setTypePopoverOpen(false);
                          }}
                        >
                          Usar &quot;{newDocType}&quot;
                        </button>
                      </CommandEmpty>
                      <CommandGroup>
                        {DOCUMENT_TYPE_SUGGESTIONS.filter(
                          t => !documents.some(d => d.documentType === t)
                        ).map(type => (
                          <CommandItem
                            key={type}
                            value={type}
                            onSelect={() => {
                              setNewDocType(type);
                              setTypePopoverOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${newDocType === type ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {type}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Arquivo *</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
              />
              {selectedFile ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                  <span className="text-sm truncate flex-1">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(selectedFile.size)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={newDocExpires}
                onChange={e => setNewDocExpires(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações sobre o documento..."
                value={newDocNotes}
                onChange={e => setNewDocNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetAddForm}>
              Cancelar
            </Button>
            <Button
              onClick={handleAdd}
              disabled={
                !selectedFile || !newDocType.trim() || createMutation.isPending
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Adicionar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation with PIN */}
      <VerifyActionPinModal
        isOpen={isDeletePinOpen}
        onClose={() => {
          setIsDeletePinOpen(false);
          setDeleteTarget(null);
        }}
        onSuccess={handleDeleteConfirmed}
        title="Remover Documento"
        description={`Digite seu PIN de ação para remover o documento "${deleteTarget?.documentType ?? ''}". O arquivo associado será excluído permanentemente.`}
      />
    </TabsContent>
  );
}
