// Manufacturer Types

export interface Manufacturer {
  id: string;
  code: string; // Codigo hierarquico auto-gerado (3 digitos: 001)
  sequentialCode?: number | null;
  name: string;
  legalName?: string | null;
  cnpj?: string | null;
  country: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  isActive: boolean;
  rating?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateManufacturerRequest {
  name: string;
  legalName?: string;
  cnpj?: string;
  country: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
  rating?: number;
  notes?: string;
}

export interface UpdateManufacturerRequest {
  name?: string;
  legalName?: string;
  cnpj?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
  rating?: number;
  notes?: string;
}

export interface ManufacturersResponse {
  manufacturers: Manufacturer[];
}

export interface ManufacturerResponse {
  manufacturer: Manufacturer;
}
