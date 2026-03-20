// ============================================
// USE FILE PARSER HOOK
// Hook React para parsing de arquivos Excel/CSV
// ============================================

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  parseFile,
  getExcelSheetNames,
  getSheetPreview,
  isValidFileType,
  calculateSheetStatistics,
  type ParseResult,
  type ParsedSheet,
  type ParseOptions,
  type SheetStatistics,
} from '../../_shared/utils/excel-parser';
import type { WorkerResponse } from '../../_shared/utils/excel-parser.worker';

// ============================================
// TYPES
// ============================================

export type FileParserStatus = 'idle' | 'loading' | 'success' | 'error';

export interface UseFileParserState {
  status: FileParserStatus;
  file: File | null;
  result: ParseResult | null;
  activeSheetIndex: number;
  error: string | null;
}

export interface UseFileParserReturn {
  // Estado
  status: FileParserStatus;
  file: File | null;
  result: ParseResult | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;

  // Dados da aba ativa
  activeSheet: ParsedSheet | null;
  activeSheetIndex: number;
  sheetNames: string[];
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
  statistics: SheetStatistics | null;

  // Ações
  parseFile: (
    file: File,
    options?: ParseOptions
  ) => Promise<ParseResult | null>;
  setActiveSheet: (index: number) => void;
  getSheetPreview: (
    sheetIndex: number,
    maxRows?: number
  ) => Promise<ParsedSheet | null>;
  reset: () => void;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: UseFileParserState = {
  status: 'idle',
  file: null,
  result: null,
  activeSheetIndex: 0,
  error: null,
};

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useFileParser(): UseFileParserReturn {
  const [state, setState] = useState<UseFileParserState>(initialState);
  const workerRef = useRef<Worker | null>(null);
  const workerSupportedRef = useRef<boolean | null>(null);

  // ============================================
  // WORKER LIFECYCLE
  // ============================================

  /**
   * Cria o worker lazily na primeira chamada.
   * Retorna null se workers não são suportados (ex: SSR).
   */
  const getWorker = useCallback((): Worker | null => {
    // Se já sabemos que não é suportado, retorna null
    if (workerSupportedRef.current === false) return null;

    // Se já existe, retorna
    if (workerRef.current) return workerRef.current;

    try {
      const worker = new Worker(
        new URL('../../_shared/utils/excel-parser.worker.ts', import.meta.url)
      );
      workerRef.current = worker;
      workerSupportedRef.current = true;
      return worker;
    } catch {
      // Worker não suportado (SSR, browser antigo, etc.)
      workerSupportedRef.current = false;
      return null;
    }
  }, []);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const isLoading = state.status === 'loading';
  const isSuccess = state.status === 'success';
  const isError = state.status === 'error';

  const activeSheet = useMemo(() => {
    if (!state.result?.sheets) return null;
    return state.result.sheets[state.activeSheetIndex] ?? null;
  }, [state.result, state.activeSheetIndex]);

  const sheetNames = useMemo(() => {
    if (!state.result?.sheets) return [];
    return state.result.sheets.map(s => s.name);
  }, [state.result]);

  const headers = useMemo(() => {
    return activeSheet?.headers ?? [];
  }, [activeSheet]);

  const rows = useMemo(() => {
    return activeSheet?.rows ?? [];
  }, [activeSheet]);

  const rowCount = rows.length;

  const statistics = useMemo(() => {
    if (!activeSheet) return null;
    return calculateSheetStatistics(activeSheet);
  }, [activeSheet]);

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Valida se um arquivo pode ser processado
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Verificar tipo de arquivo
      if (!isValidFileType(file)) {
        return {
          valid: false,
          error: 'Formato de arquivo não suportado. Use .xlsx, .xls ou .csv',
        };
      }

      // Verificar tamanho (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          valid: false,
          error: 'Arquivo muito grande. O tamanho máximo é 50MB.',
        };
      }

      return { valid: true };
    },
    []
  );

  /**
   * Parseia um arquivo usando Web Worker (com fallback para main thread)
   */
  const parseFileViaWorker = useCallback(
    (file: File, options?: ParseOptions): Promise<ParseResult> => {
      const worker = getWorker();

      if (!worker) {
        // Fallback: parse on main thread
        return parseFile(file, options);
      }

      return new Promise<ParseResult>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          cleanup();
          if (event.data.type === 'result') {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.message));
          }
        };

        const handleError = (event: ErrorEvent) => {
          cleanup();
          reject(new Error(event.message || 'Erro no Web Worker'));
        };

        const cleanup = () => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);

        file
          .arrayBuffer()
          .then(buffer => {
            worker.postMessage(
              {
                type: 'parse',
                fileBuffer: buffer,
                fileName: file.name,
                options,
              },
              [buffer]
            );
          })
          .catch(err => {
            cleanup();
            reject(err);
          });
      });
    },
    [getWorker]
  );

  /**
   * Parseia um arquivo
   */
  const parseFileFn = useCallback(
    async (file: File, options?: ParseOptions): Promise<ParseResult | null> => {
      // Validar arquivo primeiro
      const validation = validateFile(file);
      if (!validation.valid) {
        setState({
          status: 'error',
          file: null,
          result: null,
          activeSheetIndex: 0,
          error: validation.error ?? 'Erro ao validar arquivo',
        });
        return null;
      }

      // Iniciar parsing
      setState(prev => ({
        ...prev,
        status: 'loading',
        file,
        error: null,
      }));

      try {
        const result = await parseFileViaWorker(file, options);

        if (!result.success) {
          setState({
            status: 'error',
            file,
            result: null,
            activeSheetIndex: 0,
            error: result.error ?? 'Erro ao processar arquivo',
          });
          return null;
        }

        // Verificar se tem dados
        if (
          result.sheets.length === 0 ||
          result.sheets.every(s => s.rows.length === 0)
        ) {
          setState({
            status: 'error',
            file,
            result: null,
            activeSheetIndex: 0,
            error: 'O arquivo não contém dados ou todas as abas estão vazias',
          });
          return null;
        }

        setState({
          status: 'success',
          file,
          result,
          activeSheetIndex: result.activeSheetIndex,
          error: null,
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao processar arquivo';

        setState({
          status: 'error',
          file,
          result: null,
          activeSheetIndex: 0,
          error: errorMessage,
        });

        return null;
      }
    },
    [validateFile, parseFileViaWorker]
  );

  /**
   * Define a aba ativa
   */
  const setActiveSheet = useCallback((index: number) => {
    setState(prev => {
      if (!prev.result?.sheets) return prev;
      if (index < 0 || index >= prev.result.sheets.length) return prev;
      return {
        ...prev,
        activeSheetIndex: index,
      };
    });
  }, []);

  /**
   * Obtém preview de uma aba específica
   */
  const getSheetPreviewFn = useCallback(
    async (
      sheetIndex: number,
      maxRows: number = 10
    ): Promise<ParsedSheet | null> => {
      if (!state.file) return null;
      return getSheetPreview(state.file, sheetIndex, maxRows);
    },
    [state.file]
  );

  /**
   * Reseta o estado do parser
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return useMemo(
    () => ({
      // Estado
      status: state.status,
      file: state.file,
      result: state.result,
      error: state.error,
      isLoading,
      isSuccess,
      isError,

      // Dados da aba ativa
      activeSheet,
      activeSheetIndex: state.activeSheetIndex,
      sheetNames,
      headers,
      rows,
      rowCount,
      statistics,

      // Ações
      parseFile: parseFileFn,
      setActiveSheet,
      getSheetPreview: getSheetPreviewFn,
      reset,
      validateFile,
    }),
    [
      state,
      isLoading,
      isSuccess,
      isError,
      activeSheet,
      sheetNames,
      headers,
      rows,
      rowCount,
      statistics,
      parseFileFn,
      setActiveSheet,
      getSheetPreviewFn,
      reset,
      validateFile,
    ]
  );
}

// ============================================
// UTILITY HOOK: Get Sheet Names
// ============================================

export function useSheetNames() {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSheetNames = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const names = await getExcelSheetNames(file);
      setSheetNames(names);
    } catch {
      setSheetNames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSheetNames([]);
  }, []);

  return {
    sheetNames,
    isLoading,
    loadSheetNames,
    reset,
  };
}

// ============================================
// EXAMPLES / DOCUMENTATION
// ============================================

/**
 * Exemplos de uso:
 *
 * ```tsx
 * function ImportUpload() {
 *   const {
 *     status,
 *     file,
 *     headers,
 *     rows,
 *     rowCount,
 *     statistics,
 *     sheetNames,
 *     activeSheetIndex,
 *     parseFile,
 *     setActiveSheet,
 *     reset,
 *     isLoading,
 *     isError,
 *     error,
 *   } = useFileParser();
 *
 *   const handleFileSelect = async (file: File) => {
 *     const result = await parseFile(file);
 *     if (result) {
 *       console.log('Arquivo processado:', result.sheets.length, 'abas');
 *       console.log('Headers:', result.sheets[0].headers);
 *       console.log('Linhas:', result.sheets[0].rows.length);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         type="file"
 *         accept=".xlsx,.xls,.csv"
 *         onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
 *       />
 *
 *       {isLoading && <p>Processando arquivo...</p>}
 *
 *       {isError && <p className="text-red-500">{error}</p>}
 *
 *       {status === 'success' && (
 *         <div>
 *           <p>Arquivo: {file?.name}</p>
 *           <p>{rowCount} linhas encontradas</p>
 *
 *           {sheetNames.length > 1 && (
 *             <select
 *               value={activeSheetIndex}
 *               onChange={(e) => setActiveSheet(Number(e.target.value))}
 *             >
 *               {sheetNames.map((name, idx) => (
 *                 <option key={idx} value={idx}>{name}</option>
 *               ))}
 *             </select>
 *           )}
 *
 *           <table>
 *             <thead>
 *               <tr>
 *                 {headers.map((h) => <th key={h}>{h}</th>)}
 *               </tr>
 *             </thead>
 *             <tbody>
 *               {rows.slice(0, 10).map((row, idx) => (
 *                 <tr key={idx}>
 *                   {headers.map((h) => <td key={h}>{row[h]}</td>)}
 *                 </tr>
 *               ))}
 *             </tbody>
 *           </table>
 *
 *           {statistics && (
 *             <div>
 *               <p>Taxa de preenchimento: {(statistics.fillRate * 100).toFixed(1)}%</p>
 *               <p>Linhas válidas: {statistics.filledRows} de {statistics.totalRows}</p>
 *             </div>
 *           )}
 *
 *           <button onClick={reset}>Limpar</button>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
