import { AccessorColumnDef, DisplayColumnDef } from './types';

export function buildColumnHelper<T>() {
  return {
    accessor: <K extends keyof T>(
      key: K,
      options: Partial<Omit<AccessorColumnDef<T, K>, 'key' | 'type'>>,
    ): AccessorColumnDef<T, K> => ({
      type: 'accessor',
      key,
      cell: (context) => String(context.getValue()), // TODO: Add default cell
      ...options,
    }),
    display: (options: Partial<Omit<DisplayColumnDef<T>, 'type'>>) => ({
      type: 'display',
      ...options,
    }),
  };
}
