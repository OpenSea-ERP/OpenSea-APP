import { useCallback, useMemo } from 'react';

import type {
  ColumnMapping,
  EntityImportDefinition,
  ImportAIBridge,
  ImportFieldConfig,
  ImportRow,
} from '../types';

interface UseImportAIOptions {
  entityDefinition: EntityImportDefinition;
  columns: ImportFieldConfig[];
  onFillData: (rows: ImportRow[]) => void;
  onApplyMapping: (mapping: ColumnMapping[]) => void;
  getRows: () => ImportRow[];
  getReferenceData: () => Record<string, { id: string; label: string }[]>;
}

export function useImportAI(options: UseImportAIOptions): ImportAIBridge {
  const {
    entityDefinition,
    columns,
    onFillData,
    onApplyMapping,
    getRows,
    getReferenceData,
  } = options;

  const fillFromAI = useCallback(
    (rows: ImportRow[]) => {
      onFillData(rows);
    },
    [onFillData]
  );

  const exportForAI = useCallback(() => {
    return {
      entityType: entityDefinition.entityType,
      columns,
      rows: getRows(),
      referenceData: getReferenceData(),
    };
  }, [entityDefinition, columns, getRows, getReferenceData]);

  const applySuggestedMapping = useCallback(
    (mapping: ColumnMapping[]) => {
      onApplyMapping(mapping);
    },
    [onApplyMapping]
  );

  const getEntityDef = useCallback(() => entityDefinition, [entityDefinition]);

  return useMemo(
    () => ({
      fillFromAI,
      exportForAI,
      applySuggestedMapping,
      getEntityDefinition: getEntityDef,
    }),
    [fillFromAI, exportForAI, applySuggestedMapping, getEntityDef]
  );
}
