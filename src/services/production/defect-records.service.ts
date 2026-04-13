import { apiClient } from '@/lib/api-client';

export interface DefectRecord {
  id: string;
  inspectionResultId: string | null;
  defectTypeId: string;
  operatorId: string | null;
  quantity: number;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export const defectRecordsService = {
  async list(inspectionResultId: string) {
    return apiClient.get<{ defectRecords: DefectRecord[] }>(
      `/v1/production/defect-records?inspectionResultId=${inspectionResultId}`,
    );
  },
  async create(data: {
    inspectionResultId?: string;
    defectTypeId: string;
    operatorId?: string;
    quantity?: number;
    severity: string;
    description?: string;
    imageUrl?: string;
  }) {
    return apiClient.post<{ defectRecord: DefectRecord }>(
      '/v1/production/defect-records',
      data,
    );
  },
};
