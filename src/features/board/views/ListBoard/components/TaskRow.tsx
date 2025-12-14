import React from 'react';
import { User, MessageCircle, X } from 'lucide-react';
import { TaskItem, Status, StatusOption, ColumnWidths } from '../types';
import { StatusCell } from './StatusCell';
import { DateCell } from './DateCell';

interface TaskRowProps {
  item: TaskItem;
  statusOptions: StatusOption[];
  groupColor: string;
  colWidths: ColumnWidths;
  onUpdate: (updatedItem: TaskItem) => void;
  onDelete: () => void;
  isOverlay?: boolean;
  dragHandleProps?: any;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  item,
  statusOptions,
  groupColor,
  colWidths,
  onUpdate,
  onDelete,
  isOverlay = false,
  dragHandleProps
}) => {

  const handleStatusChange = (newStatus: Status) => {
    onUpdate({ ...item, status: newStatus });
  };

  const handleDateChange = (newDate: string | null) => {
    onUpdate({ ...item, date: newDate });
  };

  return (
    <div
      className={`flex border-b border-gray-200 h-[36px] group/row bg-white ${isOverlay ? 'shadow-lg ring-1 ring-gray-200 rotate-1' : 'hover:bg-gray-50'}`}
    >
      {/* Color Bar */}
      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: groupColor }}></div>

      {/* Checkbox / Drag Handle Area */}
      <div
        className="w-10 flex items-center justify-center border-r border-gray-200 bg-white group-hover/row:bg-gray-50 cursor-grab active:cursor-grabbing"
        {...dragHandleProps}
      >
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer"
          checked={item.selected}
          onChange={(e) => onUpdate({ ...item, selected: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Item Name - Increased Padding to pl-10 */}
      <div className="flex-grow min-w-[300px] border-r border-gray-200 bg-white group-hover/row:bg-gray-50 pl-10 pr-3 flex items-center relative">
        <input
          className="w-full h-full bg-transparent outline-none text-[14px] text-[#323338] truncate text-left font-normal"
          value={item.name}
          onChange={(e) => onUpdate({ ...item, name: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
        {!isOverlay && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity bg-white/50 backdrop-blur-sm pl-2">
            <button className="text-gray-400 hover:text-gray-600"><MessageCircle className="w-4 h-4" /></button>
            <button className="text-gray-400 hover:text-red-600" onClick={onDelete}><X className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Person - Centered */}
      <div
        className="border-r border-gray-200 bg-white group-hover/row:bg-gray-50 flex items-center justify-center px-3 relative flex-shrink-0"
        style={{ width: colWidths.person }}
      >
        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-300 cursor-pointer">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Status - Centered via StatusCell */}
      <div
        className="border-r border-gray-200 bg-white group-hover/row:bg-gray-50 p-1 flex-shrink-0"
        style={{ width: colWidths.status }}
      >
        <StatusCell status={item.status} options={statusOptions} onClick={handleStatusChange} />
      </div>

      {/* Date - Centered via DateCell */}
      <div
        className="border-r border-gray-200 bg-white group-hover/row:bg-gray-50 flex-shrink-0"
        style={{ width: colWidths.date }}
      >
        <DateCell date={item.date} onChange={handleDateChange} />
      </div>

      {/* Empty End */}
      <div className="w-10 bg-white group-hover/row:bg-gray-50"></div>
    </div>
  );
};