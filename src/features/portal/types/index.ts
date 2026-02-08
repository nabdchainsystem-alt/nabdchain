// Portal Types
// NOTE: Do not use `export *` here - type files have intentional name overlaps
// for domain-specific variants (e.g. OrderFilters in item.types vs order.types).
// Import directly from the specific type file you need:
//   import { ... } from '../types/item.types';
//   import { ... } from '../types/order.types';
//   import { ... } from '../types/timeline.types';
//   import { ... } from '../types/notification.types';
//   import { ... } from '../types/comparison.types';
//   import { ... } from '../types/supplier.types';
//   import { ... } from '../types/return.types';
//   import { ... } from '../types/rfq-marketplace.types';

// Re-export only non-conflicting types
export * from './notification.types';
export * from './comparison.types';
