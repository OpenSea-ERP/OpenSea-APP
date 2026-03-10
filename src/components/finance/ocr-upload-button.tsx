'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useOcrExtract, usePasteExtract } from '@/hooks/finance';
import type { OcrExtractResult } from '@/services/finance';
import { Camera, ClipboardPaste, Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// PROPS
// ============================================================================

interface OcrUploadButtonProps {
  onExtracted: (result: OcrExtractResult) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OcrUploadButton({ onExtracted }: OcrUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const ocrMutation = useOcrExtract();
  const pasteMutation = usePasteExtract();

  const isLoading = ocrMutation.isPending || pasteMutation.isPending;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const result = await ocrMutation.mutateAsync(file);
        onExtracted(result);
      } catch {
        toast.error('Erro ao processar o arquivo. Tente novamente.');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [ocrMutation, onExtracted],
  );

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) {
      toast.error('Cole o texto do boleto ou documento financeiro.');
      return;
    }

    try {
      const result = await pasteMutation.mutateAsync(pasteText);
      onExtracted(result);
      setPasteDialogOpen(false);
      setPasteText('');
    } catch {
      toast.error('Erro ao processar o texto. Tente novamente.');
    }
  }, [pasteText, pasteMutation, onExtracted]);

  return (
    <div className="flex gap-2">
      {/* File upload button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        Importar de Imagem/PDF
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Paste text button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={() => setPasteDialogOpen(true)}
        className="gap-2"
      >
        <ClipboardPaste className="h-4 w-4" />
        Colar Texto
      </Button>

      {/* Paste dialog */}
      <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Colar Texto Financeiro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole o texto do boleto, duplicata ou documento financeiro abaixo.
              O sistema identificará automaticamente valor, vencimento e
              beneficiário.
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Cole o texto do documento aqui..."
              rows={8}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPasteDialogOpen(false);
                  setPasteText('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={pasteMutation.isPending || !pasteText.trim()}
              >
                {pasteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Extrair Dados'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
