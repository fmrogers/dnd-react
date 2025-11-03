import { ReactNode } from 'react';

export interface Item {
  id: string;
  name: string;
  children?: Item[];
}

export type RowContext<T> = {
  original: T;
  isDragging: boolean;
  isExpanded: boolean;
  toggleExpanded: () => void;
  /**
   * The level of the row in the tree structure, starting from 0 for root items.
   */
  childLevel: number;
};

export type CellContext<T, K extends keyof T, ValueType extends T[K]> = {
  row: RowContext<T>;
  getValue: () => ValueType;
};

export type AccessorColumnDef<T, K extends keyof T> = {
  type: 'accessor';
  key: K;
  header?: string | ReactNode;
  cell: (context: CellContext<T, K, T[K]>) => React.ReactNode;
};

export type DisplayColumnDef<T> = {
  type: 'display';
  header?: string | ReactNode;
  cell: (item: T) => React.ReactNode;
};

export type ColumnDef<TData, TKey extends keyof TData> = AccessorColumnDef<TData, TKey> | DisplayColumnDef<TData>;
