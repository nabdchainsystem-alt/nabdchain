import React, { useState } from 'react';
import { COLS, NUM_ROWS } from '../constants';
import { GridData } from '../types';

interface GridProps {
  data: GridData;
  selectedCell: { col: string; row: number };
  onSelectCell: (col: string, row: number) => void;
}

export const Grid: React.FC<GridProps> = ({ data, selectedCell, onSelectCell }) => {
  
  const getCellId = (col: string, row: number) => `${col}${row}`;

  return (
    <main className="flex-1 overflow-auto bg-[#f4f4f5] relative">
      <table className="w-full border-collapse bg-white text-sm table-fixed">
        <thead>
          <tr>
            {/* Corner Header */}
            <th className="sticky-corner bg-gray-50 border-r border-b border-gray-300 w-[46px] min-w-[46px] h-[28px] z-50"></th>
            
            {/* Column Headers */}
            {COLS.map((col) => {
               const isSelectedCol = selectedCell.col === col;
               return (
                <th 
                  key={col}
                  className={`sticky-col-header border-r border-b border-gray-300 w-[100px] font-bold text-center select-none 
                    ${isSelectedCol ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-gray-50 text-gray-600'}
                  `}
                >
                  {col}
                </th>
               );
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: NUM_ROWS }, (_, i) => i + 1).map((row) => {
            const isSelectedRow = selectedCell.row === row;
            return (
              <tr key={row} className="h-[28px]">
                {/* Row Header */}
                <td 
                  className={`sticky-row-header border-r border-b border-gray-300 text-center font-medium text-xs select-none
                     ${isSelectedRow ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-gray-50 text-gray-600'}
                  `}
                >
                  {row}
                </td>

                {/* Cells */}
                {COLS.map((col) => {
                  const cellId = getCellId(col, row);
                  const cellData = data[cellId];
                  const isSelected = selectedCell.col === col && selectedCell.row === row;
                  const isInSelectedRowOrCol = selectedCell.col === col || selectedCell.row === row;
                  
                  // Style extraction
                  const style = cellData?.style || {};
                  const alignClass = style.align === 'right' ? 'text-right' : style.align === 'center' ? 'text-center' : 'text-left';
                  const boldClass = style.bold ? 'font-bold' : '';
                  const italicClass = style.italic ? 'italic' : '';
                  const colorClass = style.color || 'text-gray-900';
                  const bgClass = style.bg || (isInSelectedRowOrCol ? 'bg-gray-50' : 'bg-white'); // Subtle highlight for row/col
                  const borderClass = style.borderBottom ? 'border-b-gray-300' : '';
                  
                  return (
                    <td 
                      key={cellId}
                      onClick={() => onSelectCell(col, row)}
                      className={`
                        border-r border-b border-gray-200 px-1 outline-none cursor-cell relative
                        ${alignClass} ${boldClass} ${italicClass} ${colorClass} ${bgClass} ${borderClass}
                        ${isSelected ? 'spreadsheet-cell-selected ring-2 ring-black z-10' : ''}
                      `}
                    >
                      {cellData?.displayValue || cellData?.value || ''}
                      
                      {/* Drag Handle (Only visible when selected) */}
                      {isSelected && (
                        <div className="absolute bottom-[-4px] right-[-4px] w-2 h-2 bg-black border border-white cursor-crosshair z-20"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
};