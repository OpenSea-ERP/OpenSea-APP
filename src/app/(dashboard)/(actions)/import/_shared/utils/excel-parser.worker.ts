// ============================================
// EXCEL/CSV PARSER WEB WORKER
// Executa parsing de arquivos em thread separada
// para não bloquear a UI
// ============================================

import { parseFile, type ParseOptions, type ParseResult } from './excel-parser';

// ============================================
// MESSAGE TYPES
// ============================================

export interface WorkerRequest {
  type: 'parse';
  fileBuffer: ArrayBuffer;
  fileName: string;
  options?: ParseOptions;
}

export interface WorkerSuccessResponse {
  type: 'result';
  data: ParseResult;
}

export interface WorkerErrorResponse {
  type: 'error';
  message: string;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;

// ============================================
// WORKER HANDLER
// ============================================

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { type, fileBuffer, fileName, options } = event.data;

  if (type === 'parse') {
    try {
      const file = new File([fileBuffer], fileName);
      const result = await parseFile(file, options);
      (self as unknown as Worker).postMessage({
        type: 'result',
        data: result,
      } satisfies WorkerSuccessResponse);
    } catch (error) {
      (self as unknown as Worker).postMessage({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Erro ao processar arquivo',
      } satisfies WorkerErrorResponse);
    }
  }
};
