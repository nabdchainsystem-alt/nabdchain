/**
 * Central type definitions index
 * Re-exports all types for convenient importing
 *
 * Usage:
 *   import { Board, Task, CreateBoardData } from '@/types';
 */

// Core domain types
export * from '../types';

// Service DTOs and interfaces
export * from '../services/types';

// Utility types
export type { StorageKey } from '../utils/storage';
