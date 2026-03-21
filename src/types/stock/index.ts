// Stock module barrel exports
export * from './product.types';
export * from './variant.types';
export * from './item.types';
export * from './warehouse.types';
export * from './supplier.types';
export * from './manufacturer.types';
export * from './category.types';
export * from './template.types';
export * from './volume.types';
export * from './care.types';
export * from './purchase-order.types';
export * from './scan.types';
export * from './inventory.types';
export * from './inventory-session.types';
export * from './import.types';
export * from './analytics.types';
export * from './label.types';
export * from './attachment.types';
export * from './product-care-instruction.types';
export * from './zone.types';
export * from './bin.types';
export * from './layout.types';
export * from './location-label.types';
export * from './health.types';
export * from './search-location.types';
export * from './location-setup.types';

// Re-export pagination types (they were re-exported from old stock.ts)
export type { PaginationMeta, PaginatedQuery } from '../pagination';
