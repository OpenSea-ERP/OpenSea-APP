export interface ProductionEntryData {
  id: string;
  jobCardId: string;
  operatorId: string;
  quantityGood: number;
  quantityScrapped: number;
  quantityRework: number;
  enteredAt: string;
  notes: string | null;
}
