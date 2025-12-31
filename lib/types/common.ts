/**
 * Common Utility Types
 * Shared type definitions used across the application
 */

export type ID = string | number;

export type Timestamp = string | Date;

export type ImageUrl = string;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncFunction<T = void> = () => Promise<T>;

export type VoidFunction = () => void;

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export interface KeyValuePair<T = any> {
  key: string;
  value: T;
}

export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  order: SortOrder;
}

export interface FilterConfig {
  [key: string]: any;
}
