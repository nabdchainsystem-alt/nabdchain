/**
 * RoomTableBody — Table scrollable area with groups, headers, rows, and DnD
 *
 * Extracted to reduce RoomTable.tsx line count.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { createPortal } from 'react-dom';
import {
  Plus,
  PushPin as Pin,
  CaretRight as ChevronRight,
  CaretDown as ChevronDown,
  Trash,
  DotsThree as MoreHorizontal,
} from 'phosphor-react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
  SensorDescriptor,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { ColumnMenu } from '../../../components/ColumnMenu';
import { ChartBuilderConfig } from '../../../components/chart-builder/types';
import { AIChartCard } from '../../../components/AIChartCard';
import { TableHeaderCell, SortableRow, SortableGroupWrapper, GroupDragHandle, EditableName } from './index';
import { Column, Row, TableGroup, SortRule, isDoneStatus } from '../types';

interface RoomTableBodyProps {
  // Refs
  tableBodyRef: React.RefObject<HTMLDivElement | null>;
  dir: string;
  isRTL: boolean;
  t: (key: string) => string;

  // Pinned charts
  pinnedCharts: ChartBuilderConfig[];
  handleDeletePinnedChart: (index: number) => void;

  // DnD sensors
  sensors: SensorDescriptor<any>[];

  // Column DnD
  handleStructureDragStart: (event: any) => void;
  handleStructureDragOver: (event: any) => void;
  handleStructureDragEnd: (event: any) => void;
  activeColumnDragId: string | null;

  // Row DnD
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  activeDragId: string | null;

  // Data
  columns: Column[];
  rows: Row[];
  visibleColumns: Column[];
  paginatedGroups: TableGroup[];
  hideGroupHeader?: boolean;
  sortRules: SortRule[];

  // Group operations
  handleToggleGroupCollapse: (id: string) => void;
  handleToggleGroupPin: (id: string) => void;
  handleUpdateGroupName: (id: string, name: string) => void;
  handleDeleteGroup: (id: string) => void;
  setDeleteConfig: (config: any) => void;

  // Column operations
  renamingColId: string | null;
  setRenamingColId: (id: string | null) => void;
  handleRenameColumn: (id: string, name: string) => void;
  handleSort: (colId: string, direction: 'asc' | 'desc') => void;
  handleDeleteColumn: (id: string) => void;
  handleSelectAll: (checked: boolean) => void;
  setActiveHeaderMenu: (menu: any) => void;
  startResize: (colId: string, startX: number) => void;

  // Column menu
  activeColumnMenu: { rect: DOMRect } | null;
  setActiveColumnMenu: (menu: { rect: DOMRect } | null) => void;
  handleAddColumn: (type: string, label: string, options?: any) => void;

  // Creation rows
  CREATION_ROW_ID: string;
  creationRows: Record<string, Partial<Row>>;
  creationRowInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;

  // Rendering
  renderCellContent: (col: Column, row: Row, inputRef?: React.Ref<HTMLInputElement>) => React.ReactNode;
  renderRowContent: (row: Row, dragListeners?: any, isOverlay?: boolean) => React.ReactNode;
  checkedRows: Set<string>;
}

export const RoomTableBody: React.FC<RoomTableBodyProps> = ({
  tableBodyRef,
  dir,
  isRTL,
  t,
  pinnedCharts,
  handleDeletePinnedChart,
  sensors,
  handleStructureDragStart,
  handleStructureDragOver,
  handleStructureDragEnd,
  activeColumnDragId,
  handleDragStart,
  handleDragEnd,
  activeDragId,
  columns,
  rows,
  visibleColumns,
  paginatedGroups,
  hideGroupHeader,
  sortRules,
  handleToggleGroupCollapse,
  handleToggleGroupPin,
  handleUpdateGroupName,
  handleDeleteGroup,
  setDeleteConfig,
  renamingColId,
  setRenamingColId,
  handleRenameColumn,
  handleSort,
  handleDeleteColumn,
  handleSelectAll,
  setActiveHeaderMenu,
  startResize,
  activeColumnMenu,
  setActiveColumnMenu,
  handleAddColumn,
  CREATION_ROW_ID,
  creationRows,
  creationRowInputRefs,
  renderCellContent,
  renderRowContent,
  checkedRows,
}) => (
  <div
    ref={tableBodyRef}
    className="flex-1 overflow-y-auto overflow-x-auto bg-white dark:bg-stone-900 relative"
    dir={dir}
    style={{
      WebkitOverflowScrolling: 'touch',
      paddingBottom: '40px',
      overscrollBehavior: 'none',
      isolation: 'isolate',
    }}
  >
    {/* Pinned Charts Section */}
    {pinnedCharts.length > 0 && (
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-100 dark:border-stone-800">
        {pinnedCharts.map((config, idx) => (
          <AIChartCard
            key={idx}
            config={config}
            columns={columns}
            rows={rows}
            onDelete={() => handleDeletePinnedChart(idx)}
          />
        ))}
      </div>
    )}

    {/* Table Groups - Wrapped in single DndContext for Columns */}
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleStructureDragStart}
      onDragOver={handleStructureDragOver}
      onDragEnd={handleStructureDragEnd}
    >
      <SortableContext items={paginatedGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
        {paginatedGroups.map((group, groupIndex) => {
          const totalWidth = columns.reduce((acc, col) => acc + col.width, 0);
          return (
            <SortableGroupWrapper key={group.id} group={group}>
              <div className={hideGroupHeader && groupIndex > 0 ? '' : 'mb-4'}>
                {/* Group Header */}
                {(!hideGroupHeader || paginatedGroups.length > 1) && (
                  <div
                    className="shrink-0 bg-white dark:bg-monday-dark-surface border-b border-stone-100 dark:border-stone-800/50 sticky top-0 z-50"
                    style={{ minWidth: totalWidth }}
                  >
                    <div className="flex items-center gap-2 px-4 py-3 sticky start-0 z-10 w-fit bg-white dark:bg-monday-dark-surface">
                      <GroupDragHandle colorClass={group.color.bg} />
                      <button
                        onClick={() => handleToggleGroupCollapse(group.id)}
                        className="p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors text-stone-500 hover:text-stone-700"
                      >
                        {group.isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        onClick={() => handleToggleGroupPin(group.id)}
                        className={`p-1 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-md transition-colors ${group.isPinned ? 'text-blue-600 dark:text-blue-400 rotate-45' : 'text-stone-400 hover:text-stone-600'}`}
                        title={group.isPinned ? t('unpin_group') : t('pin_group')}
                      >
                        <Pin size={16} className={group.isPinned ? 'fill-current' : ''} />
                      </button>
                      <EditableName
                        name={group.name}
                        onRename={(newName) => handleUpdateGroupName(group.id, newName)}
                        className={`${group.color.text} text-[24px]`}
                      />
                      <span className="text-xs text-stone-400 ms-2">
                        {group.rows.length} {group.rows.length === 1 ? t('item_singular') : t('items_plural')}
                      </span>
                      {/* 3-dot menu */}
                      <div className="relative ms-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const menu = e.currentTarget.nextElementSibling;
                            if (menu) menu.classList.toggle('hidden');
                          }}
                          className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
                        >
                          <MoreHorizontal size={16} className="text-stone-400" />
                        </button>
                        <div className="hidden absolute start-0 top-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg shadow-xl z-50 min-w-[120px] py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfig({
                                isOpen: true,
                                title: t('delete_group_confirm').replace('{0}', group.name),
                                description: t('delete_group_description'),
                                onConfirm: () => handleDeleteGroup(group.id),
                              });
                              const menu = e.currentTarget.parentElement;
                              if (menu) menu.classList.add('hidden');
                            }}
                            className="w-full text-start px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Trash size={14} />
                            {t('delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!group.isCollapsed && (
                  <>
                    {/* Table Header */}
                    {(groupIndex === 0 || !hideGroupHeader) && (
                      <SortableContext
                        items={visibleColumns.map((c) => `${group.id}__${c.id}`)}
                        strategy={horizontalListSortingStrategy}
                      >
                        <div
                          className="group flex items-center border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 h-10 flex-shrink-0 min-w-max sticky z-[35]"
                          style={{ top: hideGroupHeader ? 0 : '57px' }}
                        >
                          {visibleColumns.map((col, index) => {
                            const isSticky = !!col.pinned;
                            let leftPos = 0;
                            if (isSticky) {
                              for (let i = 0; i < index; i++) {
                                if (visibleColumns[i].pinned) leftPos += visibleColumns[i].width;
                              }
                            }

                            return (
                              <TableHeaderCell
                                key={`${group.id}__${col.id}`}
                                col={col}
                                index={index}
                                columnsLength={visibleColumns.length}
                                group={group}
                                rows={rows}
                                renamingColId={renamingColId}
                                setRenamingColId={setRenamingColId}
                                handleRenameColumn={handleRenameColumn}
                                handleSort={handleSort}
                                sortDirection={sortRules?.find((r) => r.column === col.id)?.direction || null}
                                handleDeleteColumn={handleDeleteColumn}
                                handleSelectAll={handleSelectAll}
                                setActiveHeaderMenu={setActiveHeaderMenu}
                                startResize={startResize}
                                activeColumnDragId={activeColumnDragId}
                                style={{
                                  width: col.width,
                                  ...(isSticky && {
                                    [isRTL ? 'right' : 'left']: leftPos,
                                    position: 'sticky',
                                    willChange: isRTL ? 'transform, right' : 'transform, left',
                                  }),
                                  backgroundColor:
                                    col.headerColor || col.backgroundColor || (isSticky ? undefined : undefined),
                                }}
                                showRightShadow={isSticky && !visibleColumns[index + 1]?.pinned}
                              />
                            );
                          })}
                          <div className="relative h-full flex flex-col justify-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveColumnMenu({ rect });
                              }}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="flex items-center justify-center w-8 h-full border-s border-stone-200/50 dark:border-stone-800 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                            {activeColumnMenu &&
                              createPortal(
                                <>
                                  <div
                                    className="fixed inset-0 z-[90] bg-transparent"
                                    onClick={() => setActiveColumnMenu(null)}
                                  />
                                  <div
                                    className="fixed z-[100]"
                                    style={{
                                      top: `${activeColumnMenu.rect.bottom + 8}px`,
                                      ...(() => {
                                        const menuWidth = 350;
                                        const buttonRect = activeColumnMenu.rect;
                                        const viewportWidth = window.innerWidth;
                                        const padding = 8;

                                        if (isRTL) {
                                          const spaceOnRight = viewportWidth - buttonRect.left;
                                          if (spaceOnRight >= menuWidth + padding) {
                                            return { left: `${Math.max(padding, buttonRect.left)}px` };
                                          } else {
                                            return { right: `${padding}px` };
                                          }
                                        } else {
                                          const spaceOnLeft = buttonRect.right;
                                          if (spaceOnLeft >= menuWidth + padding) {
                                            return {
                                              right: `${Math.max(padding, viewportWidth - buttonRect.right)}px`,
                                            };
                                          } else {
                                            return { left: `${padding}px` };
                                          }
                                        }
                                      })(),
                                    }}
                                  >
                                    <ColumnMenu
                                      onClose={() => setActiveColumnMenu(null)}
                                      onSelect={(type, label, options) => {
                                        handleAddColumn(type, label, options);
                                      }}
                                    />
                                  </div>
                                </>,
                                document.body,
                              )}
                          </div>
                          <div className="w-24 shrink-0" />
                        </div>
                      </SortableContext>
                    )}

                    {/* Group Rows */}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      {/* Creation Row */}
                      {(!hideGroupHeader || groupIndex === 0 || paginatedGroups.length > 1) && (
                        <div className="group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50 bg-white dark:bg-stone-900 min-w-max relative z-20">
                          {(() => {
                            const creationRowData: Row = {
                              id: CREATION_ROW_ID,
                              groupId: group.id,
                              status: null,
                              dueDate: null,
                              date: new Date().toISOString(),
                              priority: null,
                              ...creationRows[group.id],
                            } as Row;

                            return visibleColumns.map((col, index) => {
                              const isSticky = !!col.pinned;
                              let leftPos = 0;
                              if (isSticky) {
                                for (let i = 0; i < index; i++) {
                                  if (visibleColumns[i].pinned) leftPos += visibleColumns[i].width;
                                }
                              }

                              const isPrimaryCol =
                                col.id ===
                                (
                                  visibleColumns.find((c) => c.id === 'name') ||
                                  visibleColumns.find((c) => c.id !== 'select')
                                )?.id;

                              return (
                                <div
                                  key={col.id}
                                  data-row-id={CREATION_ROW_ID}
                                  data-col-id={col.id}
                                  style={{
                                    width: col.width,
                                    ...(isSticky && {
                                      [isRTL ? 'right' : 'left']: leftPos,
                                      position: 'sticky',
                                      willChange: isRTL ? 'transform, right' : 'transform, left',
                                    }),
                                  }}
                                  className={`h-full border-e border-stone-100 dark:border-stone-800 ${col.id === 'select' ? 'flex items-center justify-center cursor-default' : ''} ${isSticky ? 'z-10 bg-white dark:bg-stone-900 shadow-sm' : ''} ${isSticky && !visibleColumns[index + 1]?.pinned ? `after:absolute ${isRTL ? 'after:left-0' : 'after:right-0'} after:top-0 after:h-full after:w-[1px] after:shadow-[2px_0_4px_rgba(0,0,0,0.08)]` : ''}`}
                                >
                                  {col.id === 'select' ? (
                                    <div className="w-full h-full flex items-center justify-center px-2">
                                      {/* Empty */}
                                    </div>
                                  ) : isPrimaryCol ? (
                                    renderCellContent(col, creationRowData, (el) => {
                                      if (el) creationRowInputRefs.current[group.id] = el;
                                    })
                                  ) : null}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}

                      <SortableContext items={group.rows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                        {group.rows.map((row) => (
                          <SortableRow
                            key={row.id}
                            row={row}
                            className={`
                                                            group flex items-center h-10 border-b border-stone-100 dark:border-stone-800/50
                                                            hover:bg-stone-50 dark:hover:bg-stone-800/30 transition-colors relative min-w-max
                                                            ${activeDragId === row.id ? 'opacity-30' : ''}
                                                            ${isDoneStatus(row.status) ? 'bg-green-50 dark:bg-green-900/20' : checkedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-white dark:bg-stone-900'}
                                                        `}
                          >
                            {(dragListeners, isRowDragging) => renderRowContent(row, dragListeners, isRowDragging)}
                          </SortableRow>
                        ))}
                      </SortableContext>

                      {createPortal(
                        <DragOverlay
                          dropAnimation={{
                            sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }),
                          }}
                        >
                          {activeDragId ? (
                            <div className="flex items-center h-10 border border-indigo-500 bg-white dark:bg-stone-800 shadow-xl rounded pointer-events-none opacity-90 scale-105 overflow-hidden min-w-max">
                              {(() => {
                                const row = rows.find((r) => r.id === activeDragId);
                                if (!row) return null;
                                return renderRowContent(row, null, true);
                              })()}
                            </div>
                          ) : null}
                        </DragOverlay>,
                        document.body,
                      )}
                    </DndContext>
                  </>
                )}
              </div>
            </SortableGroupWrapper>
          );
        })}
      </SortableContext>
      {createPortal(
        <DragOverlay
          dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}
        >
          {activeColumnDragId
            ? (() => {
                const dragCol = columns.find((c) => c.id === activeColumnDragId);

                return (
                  <div
                    className="h-10 px-3 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded pointer-events-none border border-stone-300 dark:border-stone-600"
                    style={{
                      width: dragCol?.width || 150,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-300 truncate">
                      {dragCol?.label || activeColumnDragId}
                    </span>
                  </div>
                );
              })()
            : null}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  </div>
);
