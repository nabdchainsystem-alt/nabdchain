import React, { useState } from 'react';
import { CaretDown as ChevronDown, Plus, DotsThree as MoreHorizontal, Sparkle as Sparkles } from 'phosphor-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GroupData, TaskItem, Status, StatusOption, ColumnWidths } from '../types';

import { SortableTaskRow } from './SortableTaskRow';

interface GroupContainerProps {
  group: GroupData;
  statusOptions: StatusOption[];
  colWidths: ColumnWidths;
  onColResize: (newWidths: ColumnWidths) => void;
  onGroupUpdate: (updatedGroup: GroupData) => void;
}

export const GroupContainer: React.FC<GroupContainerProps> = ({
  group,
  statusOptions,
  colWidths,
  onColResize,
  onGroupUpdate
}) => {
  // ... existing code ...

  // (We need to jump to the SortableTaskRow rendering part)

  // ... (Lines 21-190 omitted, assume unchanged but I'll return full file or target specific block)

  // Render SortableTaskRow with statusOptions

  const [isCollapsed, setIsCollapsed] = useState(false);


  const handleUpdateItem = (updatedItem: TaskItem) => {
    const newItems = group.items.map(item => item.id === updatedItem.id ? updatedItem : item);
    onGroupUpdate({ ...group, items: newItems });
  };

  const handleDeleteItem = (itemId: string) => {
    const newItems = group.items.filter(item => item.id !== itemId);
    onGroupUpdate({ ...group, items: newItems });
  };

  const handleAddItem = () => {
    const newItem: TaskItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Item',
      person: null,
      status: 'To Do', // Default to 'To Do' instead of empty or 'In Progress'? Standard is usually To Do.
      date: null,
      selected: false
    };
    onGroupUpdate({ ...group, items: [...group.items, newItem] });
  };



  // ... (omitted resize logic) ...

  const startResize = (colKey: keyof ColumnWidths) => (e: React.MouseEvent) => {
    // ... logic ...
    e.preventDefault();
    e.stopPropagation();

    const startX = e.pageX;
    const startWidth = colWidths[colKey];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.pageX - startX;
      const newWidth = Math.max(50, startWidth + delta);
      onColResize({ ...colWidths, [colKey]: newWidth });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Stats for footer
  const total = group.items.length;
  const statusCounts = group.items.reduce((acc, item) => {
    // Normalize item status to match options if possible, or just use raw string
    const s = item.status || 'To Do';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="mb-12 font-sans">
      {/* Group Header */}
      <div className="flex items-center group mb-3 relative pl-2">
        <div className="absolute -left-6 opacity-0 group-hover:opacity-100 transition-opacity top-1.5">
          <MoreHorizontal className="w-5 h-5 text-gray-400 cursor-pointer" />
        </div>
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="mr-2 p-1 hover:bg-gray-100 rounded">
          <ChevronDown className={`w-5 h-5 transform transition-transform ${isCollapsed ? '-rotate-90' : ''}`} style={{ color: group.color }} />
        </button>
        <h2
          className="text-[18px] font-normal cursor-text hover:border hover:border-gray-300 px-1 rounded truncate leading-tight"
          style={{ color: group.color }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onGroupUpdate({ ...group, title: e.currentTarget.innerText })}
        >
          {group.title}
        </h2>
        <div className="ml-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

          <span className="text-gray-300 text-xs">{group.items.length} items</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden mb-8 border border-gray-100">
          {/* Table Header */}
          <div className="flex border-b border-gray-200">
            <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: 'transparent' }}></div>

            {/* Checkbox Col */}
            <div className="w-10 flex items-center justify-center border-r border-gray-200 bg-white py-2">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" />
            </div>

            {/* Item Header - Centered */}
            <div className="flex-grow min-w-[300px] border-r border-gray-200 bg-white py-2 px-3 text-[14.7px] font-normal text-[#323338] flex items-center justify-center">
              Item
            </div>

            {/* Resizable Headers - CENTERED & HIGH VISIBILITY RESIZER */}
            <div
              className="border-r border-gray-200 bg-white py-2 px-3 text-[14.7px] font-normal text-[#323338] flex items-center justify-center text-center relative select-none group/col"
              style={{ width: colWidths.person }}
            >
              Person
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-20 hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={startResize('person')}
                title="Drag to resize"
              ></div>
            </div>
            <div
              className="border-r border-gray-200 bg-white py-2 px-3 text-[14.7px] font-normal text-[#323338] flex items-center justify-center text-center relative select-none group/col"
              style={{ width: colWidths.status }}
            >
              Status
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-20 hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={startResize('status')}
                title="Drag to resize"
              ></div>
            </div>
            <div
              className="border-r border-gray-200 bg-white py-2 px-3 text-[14.7px] font-normal text-[#323338] flex items-center justify-center text-center relative select-none group/col"
              style={{ width: colWidths.date }}
            >
              Date
              <div
                className="absolute right-0 top-0 h-full w-2 cursor-col-resize z-20 hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                onMouseDown={startResize('date')}
                title="Drag to resize"
              ></div>
            </div>

            <div className="w-10 bg-white py-2 flex items-center justify-center text-gray-400">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Sortable Context and Rows */}
          <div className="flex flex-col">
            <SortableContext
              items={group.items.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.items.map((item) => (
                <SortableTaskRow
                  key={item.id}
                  item={item}
                  statusOptions={statusOptions}
                  groupColor={group.color}
                  colWidths={colWidths}
                  onUpdate={handleUpdateItem}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </SortableContext>

            {/* Add Item Row */}
            <div className="flex border-b border-gray-200 h-[36px]">
              <div className="w-1.5 flex-shrink-0 bg-transparent rounded-bl-lg" style={{ backgroundColor: group.color }}></div>
              <div className="w-10 border-r border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
                <div className="w-4 h-4 border border-gray-200 rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 opacity-0 hover:opacity-100"></div>
              </div>
              <div className="flex-grow flex items-center pl-10 pr-3 bg-white">
                <input
                  type="text"
                  placeholder="+ Add item"
                  className="w-full text-[14px] outline-none placeholder-gray-400 text-left font-normal"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddItem();
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>

            {/* Summary Footer */}
            <div className="flex h-[36px] border-b border-gray-200">
              <div className="w-1.5 flex-shrink-0 bg-transparent"></div>
              {/* Empty left cells with right border for the first "column" */}
              <div className="w-10 border-r border-gray-200 bg-white"></div>

              {/* Main Item summary area - No vertical borders */}
              <div className="flex-grow bg-white"></div>

              {/* Person summary - No vertical borders */}
              <div className="bg-white" style={{ width: colWidths.person }}></div>

              {/* Status Summary - No vertical borders */}
              <div className="bg-white px-2 py-2" style={{ width: colWidths.status }}>
                <div className="w-full h-full flex rounded overflow-hidden bg-[#aeaeae]">
                  {statusOptions.map(option => {
                    // Match by ID or Label
                    const count = statusCounts[option.id] || statusCounts[option.label] || 0;
                    if (count === 0) return null;
                    const width = (count / total) * 100;
                    // Handle hex color or fallback
                    const color = option.color.startsWith('#') ? option.color : '#aeaeae';
                    return (
                      <div
                        key={option.id}
                        className="h-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: color
                        }}
                        title={`${option.label}: ${count}`}
                      ></div>
                    );
                  })}
                </div>
              </div>

              {/* Date summary - No vertical borders */}
              <div className="bg-white" style={{ width: colWidths.date }}></div>

              {/* Final "after" column area - Keep visual structure */}
              <div className="w-10 bg-white border-l border-gray-200"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};