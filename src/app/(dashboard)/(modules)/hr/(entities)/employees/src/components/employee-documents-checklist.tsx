'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { storageFilesService } from '@/services/storage/files.service';
import type { StorageFile } from '@/types/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Home,
  Loader2,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

type DocumentStatus = 'PENDENTE' | 'ENVIADO' | 'VALIDADO';

interface DocumentType {
  type: string;
  label: string;
  required: boolean;
  note?: string;
}

interface DocumentCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  documents: DocumentType[];
}

interface EmployeeDocumentsChecklistProps {
  employeeId: string;
  employeeName: string;
  gender?: string | null;
}

// =============================================================================
// DOCUMENT CATEGORIES
// =============================================================================

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    title: 'Identifica\u00e7\u00e3o Pessoal',
    icon: User,
    documents: [
      { type: 'RG', label: 'RG (Identidade)', required: true },
      { type: 'CPF', label: 'CPF', required: true },
      { type: 'CNH', label: 'CNH (Carteira de Motorista)', required: false },
      { type: 'TITULO_ELEITOR', label: 'T\u00edtulo de Eleitor', required: true },
      {
        type: 'RESERVISTA',
        label: 'Certificado de Reservista',
        required: false,
        note: 'Obrigatório para homens',
      },
      { type: 'FOTO_3X4', label: 'Foto 3x4', required: true },
    ],
  },
  {
    title: 'Documentos Trabalhistas',
    icon: Briefcase,
    documents: [
      {
        type: 'CTPS',
        label: 'CTPS (Carteira de Trabalho)',
        required: true,
      },
      { type: 'PIS_PASEP', label: 'PIS/PASEP', required: true },
      {
        type: 'ASO_ADMISSIONAL',
        label: 'Exame Admissional (ASO)',
        required: true,
      },
      {
        type: 'COMPROVANTE_ESCOLARIDADE',
        label: 'Comprovante de Escolaridade',
        required: false,
      },
    ],
  },
  {
    title: 'Endereço e Estado Civil',
    icon: Home,
    documents: [
      {
        type: 'COMPROVANTE_RESIDENCIA',
        label: 'Comprovante de Residência',
        required: true,
      },
      {
        type: 'CERTIDAO_NASCIMENTO',
        label: 'Certidão de Nascimento',
        required: false,
        note: 'Se solteiro(a)',
      },
      {
        type: 'CERTIDAO_CASAMENTO',
        label: 'Certidão de Casamento',
        required: false,
        note: 'Se casado(a)',
      },
    ],
  },
  {
    title: 'Dependentes',
    icon: Users,
    documents: [
      {
        type: 'CERTIDAO_FILHOS',
        label: 'Certidão de Nascimento dos Filhos',
        required: false,
      },
      {
        type: 'CARTAO_VACINA',
        label: 'Cartão de Vacinação (filhos < 7 anos)',
        required: false,
      },
      {
        type: 'DECLARACAO_ESCOLAR',
        label: 'Declaração Escolar (filhos 7-14 anos)',
        required: false,
      },
    ],
  },
  {
    title: 'Outros Documentos',
    icon: FileText,
    documents: [
      {
        type: 'CONTRATO_TRABALHO',
        label: 'Contrato de Trabalho Assinado',
        required: true,
      },
      { type: 'OUTROS', label: 'Outros Documentos', required: false },
    ],
  },
];

// Naming convention: {DOC_TYPE}__{originalName}
const DOC_TYPE_SEPARATOR = '__';

function extractDocType(fileName: string): string | null {
  const idx = fileName.indexOf(DOC_TYPE_SEPARATOR);
  if (idx === -1) return null;
  return fileName.substring(0, idx);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EmployeeDocumentsChecklist({
  employeeId,
  employeeName,
  gender,
}: EmployeeDocumentsChecklistProps) {
  const queryClient = useQueryClient();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<StorageFile | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingDocTypeRef = useRef<string | null>(null);
  const isUpdateRef = useRef(false);

  // ============================================================================
  // DATA
  // ============================================================================

  const queryKey = ['employee-documents', employeeId];

  const { data: filesData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await storageFilesService.listFiles({
        entityType: 'employee',
        entityId: employeeId,
        limit: 100,
      });
      return response.files;
    },
  });

  const files = filesData ?? [];

  // Map doc types to their uploaded files
  const filesByDocType = useMemo(() => {
    const map = new Map<string, StorageFile>();
    for (const file of files) {
      const docType = extractDocType(file.name);
      if (docType) {
        // If multiple files for same doc type, keep the most recent
        const existing = map.get(docType);
        if (
          !existing ||
          new Date(file.createdAt) > new Date(existing.createdAt)
        ) {
          map.set(docType, file);
        }
      }
    }
    return map;
  }, [files]);

  // Compute overall progress
  const { requiredCount, completedRequired, totalUploaded } = useMemo(() => {
    let required = 0;
    let completed = 0;
    let uploaded = 0;

    for (const category of DOCUMENT_CATEGORIES) {
      for (const doc of category.documents) {
        // Adjust Reservista requirement based on gender
        const isRequired =
          doc.type === 'RESERVISTA'
            ? gender === 'MALE' || gender === 'MASCULINO'
            : doc.required;

        if (isRequired) required++;
        if (filesByDocType.has(doc.type)) {
          uploaded++;
          if (isRequired) completed++;
        }
      }
    }
    return {
      requiredCount: required,
      completedRequired: completed,
      totalUploaded: uploaded,
    };
  }, [filesByDocType, gender]);

  const progressPercent =
    requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 100;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await storageFilesService.deleteFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Documento removido com sucesso');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Erro ao remover documento');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleCategory = useCallback((title: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  }, []);

  const handleUploadClick = useCallback((docType: string, isUpdate = false) => {
    pendingDocTypeRef.current = docType;
    isUpdateRef.current = isUpdate;
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const docType = pendingDocTypeRef.current;
      if (!file || !docType) return;

      // Reset input so the same file can be selected again
      e.target.value = '';

      // If updating, delete the old file first
      if (isUpdateRef.current) {
        const existingFile = filesByDocType.get(docType);
        if (existingFile) {
          try {
            await storageFilesService.deleteFile(existingFile.id);
          } catch {
            // Continue with upload even if delete fails
          }
        }
      }

      // Rename file with doc type prefix
      const renamedFile = new File(
        [file],
        `${docType}${DOC_TYPE_SEPARATOR}${file.name}`,
        { type: file.type }
      );

      setUploadingDocType(docType);
      setUploadProgress(0);

      try {
        await storageFilesService.uploadFileWithProgress(
          null,
          renamedFile,
          (percent) => setUploadProgress(percent),
          { entityType: 'employee', entityId: employeeId }
        );
        queryClient.invalidateQueries({ queryKey });
        toast.success('Documento enviado com sucesso');
      } catch {
        toast.error('Erro ao enviar documento');
      } finally {
        setUploadingDocType(null);
        setUploadProgress(0);
        pendingDocTypeRef.current = null;
        isUpdateRef.current = false;
      }
    },
    [employeeId, filesByDocType, queryClient, queryKey]
  );

  const handleView = useCallback(async (fileId: string) => {
    try {
      const url = await storageFilesService.getServeUrlWithToken(fileId);
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao abrir documento');
    }
  }, []);

  const handleDownload = useCallback(async (fileId: string) => {
    try {
      const url = await storageFilesService.getServeUrlWithToken(fileId, {
        download: true,
      });
      window.open(url, '_blank');
    } catch {
      toast.error('Erro ao baixar documento');
    }
  }, []);

  const handleDeleteClick = useCallback((file: StorageFile) => {
    setDeleteTarget(file);
    setIsDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
    setIsDeleteOpen(false);
  }, [deleteTarget, deleteMutation]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getDocStatus = useCallback(
    (docType: string): DocumentStatus => {
      if (!filesByDocType.has(docType)) return 'PENDENTE';
      return 'ENVIADO';
    },
    [filesByDocType]
  );

  const isDocRequired = useCallback(
    (doc: DocumentType): boolean => {
      if (doc.type === 'RESERVISTA') {
        return gender === 'MALE' || gender === 'MASCULINO';
      }
      return doc.required;
    },
    [gender]
  );

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <Card className="p-8 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Carregando documentos...
          </span>
        </div>
      </Card>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileSelected}
      />

      {/* ================================================================== */}
      {/* Progress Summary Card                                               */}
      {/* ================================================================== */}
      <Card className="p-5 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-500/10">
            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Documentação do Colaborador
            </h3>
            <p className="text-xs text-muted-foreground">
              {employeeName} &mdash; {completedRequired} de {requiredCount}{' '}
              obrigatórios completos ({progressPercent}%)
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              progressPercent === 100
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/8 dark:text-emerald-300'
                : progressPercent >= 50
                  ? 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/8 dark:text-sky-300'
                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/8 dark:text-amber-300'
            }
          >
            {progressPercent === 100 ? 'Completo' : `${progressPercent}%`}
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent >= 50
                  ? 'bg-sky-500'
                  : 'bg-amber-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{totalUploaded} documentos enviados no total</span>
          <span>
            {requiredCount - completedRequired > 0
              ? `${requiredCount - completedRequired} obrigatório(s) pendente(s)`
              : 'Todos os obrigatórios enviados'}
          </span>
        </div>
      </Card>

      {/* ================================================================== */}
      {/* Document Categories                                                 */}
      {/* ================================================================== */}
      {DOCUMENT_CATEGORIES.map((category) => {
        const CategoryIcon = category.icon;
        const isCollapsed = collapsedCategories.has(category.title);
        const categoryDocs = category.documents;
        const uploadedCount = categoryDocs.filter((d) =>
          filesByDocType.has(d.type)
        ).length;

        return (
          <Card
            key={category.title}
            className="overflow-hidden bg-white dark:bg-slate-800/60 border border-border"
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.title)}
              className="flex items-center gap-3 w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700">
                <CategoryIcon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">
                  {category.title}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-xs tabular-nums border-slate-200 dark:border-slate-600"
              >
                {uploadedCount}/{categoryDocs.length}
              </Badge>
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Document Rows */}
            {!isCollapsed && (
              <div className="border-t border-border">
                {categoryDocs.map((doc) => {
                  const status = getDocStatus(doc.type);
                  const required = isDocRequired(doc);
                  const file = filesByDocType.get(doc.type);
                  const isUploading = uploadingDocType === doc.type;

                  return (
                    <div
                      key={doc.type}
                      className="flex flex-col gap-1 px-4 py-3 border-b last:border-b-0 border-border/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Left: Icon + Label + Badges */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="text-sm text-foreground truncate">
                            {doc.label}
                          </span>
                          {required ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] px-1.5 py-0 border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/8 dark:text-violet-300"
                            >
                              Obrigatório
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] px-1.5 py-0 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
                            >
                              Opcional
                            </Badge>
                          )}
                        </div>

                        {/* Right: Status + Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status badge */}
                          {status === 'PENDENTE' && required && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/8 dark:text-amber-300"
                            >
                              <Clock className="h-3 w-3 mr-0.5" />
                              Pendente
                            </Badge>
                          )}
                          {status === 'PENDENTE' && !required && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
                            >
                              Pendente
                            </Badge>
                          )}
                          {status === 'ENVIADO' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/8 dark:text-sky-300"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-0.5" />
                              Enviado
                            </Badge>
                          )}
                          {status === 'VALIDADO' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/8 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-0.5" />
                              Validado
                            </Badge>
                          )}

                          {/* Action buttons */}
                          {status === 'PENDENTE' && !isUploading && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleUploadClick(doc.type)}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Enviar
                            </Button>
                          )}

                          {file && !isUploading && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Visualizar"
                                onClick={() => handleView(file.id)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Baixar"
                                onClick={() => handleDownload(file.id)}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Atualizar"
                                onClick={() =>
                                  handleUploadClick(doc.type, true)
                                }
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300"
                                title="Remover"
                                onClick={() => handleDeleteClick(file)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}

                          {isUploading && (
                            <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                          )}
                        </div>
                      </div>

                      {/* Upload progress bar */}
                      {isUploading && (
                        <div className="ml-6 flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {uploadProgress}%
                          </span>
                        </div>
                      )}

                      {/* File info when uploaded */}
                      {file && !isUploading && (
                        <div className="ml-6 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[200px]">
                            {file.originalName}
                          </span>
                          <span>&middot;</span>
                          <span>{formatFileSize(file.size)}</span>
                          <span>&middot;</span>
                          <span>Enviado em {formatDate(file.createdAt)}</span>
                        </div>
                      )}

                      {/* Note hint */}
                      {doc.note && !file && (
                        <p className="ml-6 text-[11px] text-muted-foreground italic">
                          {doc.note}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {/* ================================================================== */}
      {/* Delete Confirmation Modal                                           */}
      {/* ================================================================== */}
      <VerifyActionPinModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onSuccess={handleDeleteConfirm}
        title="Confirmar Remoção"
        description={`Digite seu PIN de ação para remover o documento "${deleteTarget?.originalName ?? ''}".`}
      />
    </div>
  );
}
