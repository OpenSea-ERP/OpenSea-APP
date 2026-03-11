'use client';

import { apiClient } from '@/lib/api-client';
import { useCallback, useRef, useState } from 'react';
import type { ImportProgress, ImportResult, ImportRowData } from '../types';
import { ENTITY_DEFINITIONS } from '../config/entity-definitions';

const BRASIL_API_URL = 'https://brasilapi.com.br/api/cnpj/v1';

interface CNPJResponse {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
  email: string | null;
  ddd_telefone_1: string | null;
  ddd_telefone_2: string | null;
  situacao_cadastral: number | null;
  descricao_situacao_cadastral: string | null;
  natureza_juridica: string | null;
  descricao_tipo_de_logradouro: string | null;
  atividade_principal: Array<{ codigo: string; descricao: string }> | null;
}

interface UseCNPJImportProcessOptions {
  entityType: 'manufacturers' | 'companies';
  batchSize?: number;
  delayBetweenItems?: number;
  delayBetweenBatches?: number;
  onComplete?: (result: ImportResult) => void;
  onError?: (error: Error) => void;
}

export function useCNPJImportProcess({
  entityType,
  batchSize = 3,
  delayBetweenItems = 500,
  delayBetweenBatches = 2000,
  onComplete,
  onError,
}: UseCNPJImportProcessOptions) {
  const [progress, setProgress] = useState<ImportProgress>({
    status: 'idle',
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    currentBatch: 0,
    totalBatches: 0,
    errors: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const currentBatchRef = useRef(0);

  const entityDef = ENTITY_DEFINITIONS[entityType];
  // Use entity definition endpoint, with correct fallbacks per entity type
  const apiEndpoint =
    entityDef?.apiEndpoint ||
    (entityType === 'manufacturers'
      ? '/v1/manufacturers'
      : '/v1/admin/companies');

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const fetchCNPJData = async (cnpj: string): Promise<CNPJResponse | null> => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    try {
      const response = await fetch(`${BRASIL_API_URL}/${cleanCNPJ}`);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        return null;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT') {
        throw error;
      }
      return null;
    }
  };

  // Helper to remove null/undefined values from object
  const removeNullValues = (
    obj: Record<string, unknown>
  ): Record<string, unknown> => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value != null)
    );
  };

  const transformCNPJDataToEntity = (
    cnpjData: CNPJResponse | null,
    originalData: Record<string, unknown>,
    entityType: 'manufacturers' | 'companies'
  ): Record<string, unknown> => {
    const tradeName = originalData.tradeName as string | undefined;
    // Use razao_social or nome_fantasia as the name
    const name =
      cnpjData?.razao_social ||
      cnpjData?.nome_fantasia ||
      tradeName ||
      'Nome não informado';

    // Build address with proper format
    const buildAddress = () => {
      if (!cnpjData?.logradouro) return undefined;
      const tipoLogradouro = cnpjData.descricao_tipo_de_logradouro || '';
      const logradouro = cnpjData.logradouro;
      const numero = cnpjData.numero || '';
      return `${tipoLogradouro} ${logradouro}${numero ? `, ${numero}` : ''}`.trim();
    };

    if (entityType === 'manufacturers') {
      return removeNullValues({
        name, // Required field for API
        legalName: cnpjData?.razao_social || undefined,
        tradeName: cnpjData?.nome_fantasia || tradeName || undefined,
        cnpj: (originalData.cnpj as string).replace(/\D/g, ''),
        email: cnpjData?.email || undefined,
        phoneMain: cnpjData?.ddd_telefone_1 || undefined,
        addressLine1: buildAddress(),
        addressLine2: cnpjData?.complemento || undefined,
        city: cnpjData?.municipio || undefined,
        state: cnpjData?.uf || undefined,
        postalCode: cnpjData?.cep || undefined,
        country: 'Brasil',
      });
    } else {
      // companies
      return removeNullValues({
        name, // Required field for API
        legalName: cnpjData?.razao_social || undefined,
        tradeName: cnpjData?.nome_fantasia || tradeName || undefined,
        cnpj: (originalData.cnpj as string).replace(/\D/g, ''),
        email: cnpjData?.email || undefined,
        phoneMain: cnpjData?.ddd_telefone_1 || undefined,
        legalNature: cnpjData?.natureza_juridica || undefined,
        status:
          cnpjData?.descricao_situacao_cadastral === 'ATIVA'
            ? 'ACTIVE'
            : 'INACTIVE',
      });
    }
  };

  const createEntity = async (
    data: Record<string, unknown>,
    _signal: AbortSignal
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    try {
      const result = await apiClient.post<{
        id?: string;
        data?: { id?: string };
        manufacturer?: { id: string };
        company?: { id: string };
      }>(apiEndpoint, data);

      // Handle different response formats
      const id =
        result.id ||
        result.data?.id ||
        result.manufacturer?.id ||
        result.company?.id;
      return { success: true, id };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  };

  const processRow = async (
    row: ImportRowData,
    signal: AbortSignal
  ): Promise<{ success: boolean; id?: string; error?: string }> => {
    const cnpj = row.data.cnpj as string;

    if (!cnpj) {
      return { success: false, error: 'CNPJ não informado' };
    }

    try {
      // Fetch CNPJ data from BrasilAPI
      const cnpjData = await fetchCNPJData(cnpj);

      // Transform data
      const entityData = transformCNPJDataToEntity(
        cnpjData,
        row.data,
        entityType
      );

      // Create entity
      return await createEntity(entityData, signal);
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMIT') {
        // Wait and retry
        await delay(5000);
        return processRow(row, signal);
      }
      throw error;
    }
  };

  const startImport = useCallback(
    async (rows: ImportRowData[]): Promise<ImportResult> => {
      if (rows.length === 0) {
        return {
          success: true,
          totalRows: 0,
          importedRows: 0,
          skippedRows: 0,
          failedRows: 0,
          results: [],
          createdIds: [],
        };
      }

      abortControllerRef.current = new AbortController();
      isPausedRef.current = false;

      const totalBatches = Math.ceil(rows.length / batchSize);

      setProgress({
        status: 'importing',
        total: rows.length,
        processed: 0,
        successful: 0,
        failed: 0,
        currentBatch: 0,
        totalBatches,
        errors: [],
        startedAt: new Date(),
      });

      const results: Array<{
        rowIndex: number;
        success: boolean;
        entityId?: string;
        error?: string;
      }> = [];
      const createdIds: string[] = [];
      const errors: Array<{
        row: number;
        message: string;
        data?: Record<string, unknown>;
      }> = [];

      let processed = 0;
      let successful = 0;
      let failed = 0;

      try {
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          currentBatchRef.current = batchIndex;

          // Check if paused
          while (isPausedRef.current) {
            await delay(100);
          }

          // Check if cancelled
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Import cancelled');
          }

          const start = batchIndex * batchSize;
          const end = Math.min(start + batchSize, rows.length);
          const batchRows = rows.slice(start, end);

          setProgress(prev => ({
            ...prev,
            currentBatch: batchIndex + 1,
          }));

          // Process each row in the batch sequentially (for rate limiting)
          for (const row of batchRows) {
            // Check if cancelled
            if (abortControllerRef.current?.signal.aborted) {
              throw new Error('Import cancelled');
            }

            // Check if paused
            while (isPausedRef.current) {
              await delay(100);
            }

            const result = await processRow(
              row,
              abortControllerRef.current!.signal
            );

            processed++;

            if (result.success) {
              successful++;
              if (result.id) {
                createdIds.push(result.id);
              }
              results.push({
                rowIndex: row.rowIndex,
                success: true,
                entityId: result.id,
              });
            } else {
              failed++;
              errors.push({
                row: row.rowIndex + 1,
                message: result.error || 'Erro desconhecido',
                data: row.data,
              });
              results.push({
                rowIndex: row.rowIndex,
                success: false,
                error: result.error,
              });
            }

            setProgress(prev => ({
              ...prev,
              processed,
              successful,
              failed,
              errors: [...errors],
            }));

            // Delay between items
            if (batchRows.indexOf(row) < batchRows.length - 1) {
              await delay(delayBetweenItems);
            }
          }

          // Delay between batches
          if (batchIndex < totalBatches - 1) {
            await delay(delayBetweenBatches);
          }
        }

        const finalResult: ImportResult = {
          success: failed === 0,
          totalRows: rows.length,
          importedRows: successful,
          skippedRows: 0,
          failedRows: failed,
          results,
          createdIds,
        };

        setProgress(prev => ({
          ...prev,
          status: 'completed',
          completedAt: new Date(),
        }));

        onComplete?.(finalResult);
        return finalResult;
      } catch (error) {
        const isCancelled =
          error instanceof Error &&
          (error.name === 'AbortError' || error.message === 'Import cancelled');

        setProgress(prev => ({
          ...prev,
          status: isCancelled ? 'cancelled' : 'failed',
          completedAt: new Date(),
        }));

        if (!isCancelled && error instanceof Error) {
          onError?.(error);
        }

        return {
          success: false,
          totalRows: rows.length,
          importedRows: successful,
          skippedRows: 0,
          failedRows: failed,
          results,
          createdIds,
        };
      }
    },
    [
      batchSize,
      delayBetweenItems,
      delayBetweenBatches,
      entityType,
      apiEndpoint,
      onComplete,
      onError,
    ]
  );

  const pauseImport = useCallback(() => {
    isPausedRef.current = true;
    setProgress(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resumeImport = useCallback(() => {
    isPausedRef.current = false;
    setProgress(prev => ({ ...prev, status: 'importing' }));
  }, []);

  const cancelImport = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setProgress({
      status: 'idle',
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      currentBatch: 0,
      totalBatches: 0,
      errors: [],
    });
  }, []);

  return {
    progress,
    startImport,
    pauseImport,
    resumeImport,
    cancelImport,
    reset,
    isProcessing:
      progress.status === 'importing' || progress.status === 'paused',
    isCompleted: progress.status === 'completed',
    isFailed: progress.status === 'failed',
    isCancelled: progress.status === 'cancelled',
  };
}
