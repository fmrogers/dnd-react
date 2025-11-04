import { AccessorColumnDef, DisplayColumnDef } from './types';

export function buildColumnHelper<T>() {
  return {
    accessor: <K extends keyof T>(
      key: K,
      options: Partial<Omit<AccessorColumnDef<T, K>, 'key' | 'type'>>,
    ): AccessorColumnDef<T, K> => ({
      type: 'accessor',
      key,
      header: String(key),
      size: DEFAULT_COLUMN_SIZE,
      cell: (context) => String(context.getValue()), // TODO: Add default cell
      ...options,
    }),
    display: (options: Partial<Omit<DisplayColumnDef<T>, 'type'>>) => ({
      type: 'display',
      ...options,
    }),
  };
}

const DEFAULT_COLUMN_SIZE = 150; // px
