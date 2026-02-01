import React from 'react';
import { usePortal } from '../context/PortalContext';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

/**
 * Data Table Component
 *
 * Clean, industrial table for data-heavy pages - supports dark/light mode
 */
export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  emptyMessage = 'No data available',
  onRowClick,
}: DataTableProps<T>) {
  const { styles } = usePortal();

  return (
    <div
      className="w-full overflow-x-auto rounded-lg border"
      style={{ borderColor: styles.border }}
    >
      <table className="w-full" style={{ fontFamily: styles.fontBody }}>
        <thead>
          <tr style={{ backgroundColor: styles.tableHeader }}>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{
                  color: styles.textMuted,
                  width: col.width,
                  borderBottom: `1px solid ${styles.tableBorder}`,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ backgroundColor: styles.bgCard }}>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm"
                style={{ color: styles.textSecondary }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'cursor-pointer' : ''}
                style={{
                  borderBottom: `1px solid ${styles.tableBorder}`,
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = styles.tableRowHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${String(col.key)}`}
                    className="px-4 py-3.5 text-sm"
                    style={{ color: styles.textPrimary }}
                  >
                    {col.render
                      ? col.render(item)
                      : String(item[col.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
