'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileTypeIcon } from '@/components/storage/file-type-icon';
import { formatFileSize } from '@/components/storage/utils';
import { storageSharingService } from '@/services/storage';
import type { SharedFileInfo, FileTypeCategory } from '@/types/storage';
import {
  Download,
  Loader2,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SharedFilePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [info, setInfo] = useState<SharedFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const data = await storageSharingService.accessSharedFile(token);
        setInfo(data);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Link inválido ou expirado';
        if (message.toLowerCase().includes('password')) {
          setNeedsPassword(true);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchInfo();
  }, [token]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const result = await storageSharingService.downloadSharedFile(token, {
        password: password || undefined,
      });
      window.open(result.url, '_blank');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao baixar o arquivo';
      if (message.toLowerCase().includes('password') || message.toLowerCase().includes('senha')) {
        setNeedsPassword(true);
        setError('Senha incorreta');
      } else {
        setError(message);
      }
    } finally {
      setDownloading(false);
    }
  }, [token, password]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md w-full mx-4 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Link indisponível
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8">
        {/* File info */}
        {info && (
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <FileTypeIcon
                fileType={info.file.fileType as FileTypeCategory}
                size={48}
              />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 break-all">
              {info.file.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(info.file.size)} · {info.file.mimeType}
            </p>
            {info.link.expiresAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Disponível até{' '}
                {new Date(info.link.expiresAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            {info.link.maxDownloads !== null && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {info.link.downloadCount} de {info.link.maxDownloads} downloads
                realizados
              </p>
            )}
          </div>
        )}

        {/* Password required */}
        {needsPassword && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <Lock className="w-4 h-4" />
              <span>Este arquivo é protegido por senha</span>
            </div>
            <Input
              type="password"
              placeholder="Digite a senha..."
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="h-10"
              onKeyDown={e => {
                if (e.key === 'Enter') handleDownload();
              }}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
        )}

        {/* Download button */}
        <Button
          onClick={handleDownload}
          disabled={downloading || (needsPassword && !password)}
          className="w-full"
          size="lg"
        >
          {downloading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          Baixar arquivo
        </Button>

        {/* Branding */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-600 mt-6">
          Compartilhado via OpenSea
        </p>
      </div>
    </div>
  );
}
