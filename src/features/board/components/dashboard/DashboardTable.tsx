import React from 'react';

interface Column {
  header: string;
  accessor: string;
  render?: (value: string, row?: Record<string, string>) => React.ReactNode;
}

interface DashboardTableProps {
  title: string;
  columns: Column[];
  data: Record<string, string>[];
}

export const DashboardTable: React.FC<DashboardTableProps> = ({ title, columns, data }) => {
  return (
    <div className="bg-white dark:bg-monday-dark-surface rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="overflow-auto flex-1">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.length > 0 ? (
              data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {col.render ? col.render(row[col.accessor]) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-400">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
