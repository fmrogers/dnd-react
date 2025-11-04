import { ReactElement } from 'react';

export interface Item {
  id: string;
  name: string;
  category: string;
  gems: number;
  mainSkill: string;
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

type SharedColumnDef = {
  header: string | ReactElement;
  /**
   * Column width in pixels
   *
   * @default 150
   */
  size: number;
};

export type AccessorColumnDef<T, K extends keyof T> = SharedColumnDef & {
  type: 'accessor';
  key: K;
  cell: (context: CellContext<T, K, T[K]>) => React.ReactNode;
};

export type DisplayColumnDef<T> = SharedColumnDef & {
  type: 'display';
  cell: (item: T) => React.ReactNode;
};

export type ColumnDef<TData, TKey extends keyof TData> = AccessorColumnDef<TData, TKey> | DisplayColumnDef<TData>;
