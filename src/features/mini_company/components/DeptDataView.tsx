import React, { useState, useMemo } from 'react';
import RoomTable, { Column } from '../../board/views/Table/RoomTable';
import { CaretDown, Database, Check } from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';

// Table schema definition
export interface TableColumn {
    id: string;
    label: string;
    labelAr?: string;
    type: 'text' | 'number' | 'date' | 'datetime' | 'enum' | 'decimal' | 'boolean' | 'reference' | 'status' | 'currency' | 'person' | 'people';
    required?: boolean;
    description?: string;
    descriptionAr?: string;
    alternatives?: string[]; // Alternative column names for import mapping
    enumValues?: { value: string; label: string; labelAr?: string }[];
    referenceTable?: string; // For linked tables
    width?: number;
    minWidth?: number;
    pinned?: boolean;
}

export interface TableSchema {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    columns: TableColumn[];
    isLinked?: boolean; // If true, this table is managed by another department
    linkedDepartment?: string;
}

export interface DeptDataViewProps {
    departmentId: string;
    departmentName: string;
    departmentNameAr?: string;
    tables: TableSchema[];
    linkedTables?: TableSchema[];
}

// Helper to get status colors
const getStatusColor = (value: string): string => {
    const colorMap: Record<string, string> = {
        active: '#10B981',
        inactive: '#6B7280',
        pending: '#F59E0B',
        approved: '#10B981',
        rejected: '#EF4444',
        draft: '#9CA3AF',
        paid: '#3B82F6',
        churned: '#EF4444',
        prospect: '#8B5CF6',
        enterprise: '#6366F1',
        mid_market: '#3B82F6',
        small_business: '#10B981',
        consumer: '#F59E0B',
        vip: '#EC4899',
        strategic: '#6366F1',
        preferred: '#3B82F6',
        trial: '#F59E0B',
        blocked: '#EF4444',
        low: '#10B981',
        medium: '#F59E0B',
        high: '#EF4444',
        critical: '#DC2626',
        fixed: '#3B82F6',
        variable: '#10B981',
        on_track: '#10B981',
        at_risk: '#F59E0B',
        over_budget: '#EF4444',
        under_budget: '#3B82F6',
        confirmed: '#3B82F6',
        shipped: '#8B5CF6',
        delivered: '#10B981',
        cancelled: '#EF4444',
        partial: '#F59E0B',
        received: '#10B981',
        sent: '#3B82F6',
        converted: '#10B981',
        returned: '#F59E0B',
        complete: '#10B981',
        pass: '#10B981',
        fail: '#EF4444',
        receipt: '#3B82F6',
        issue: '#EF4444',
        transfer: '#8B5CF6',
        adjustment: '#F59E0B',
        return: '#F59E0B',
        in: '#10B981',
        out: '#EF4444',
        main: '#3B82F6',
        distribution: '#8B5CF6',
        retail: '#10B981',
        cold_storage: '#06B6D4',
        maintenance: '#F59E0B',
        discontinued: '#6B7280',
        survey: '#3B82F6',
        review: '#10B981',
        complaint: '#EF4444',
        suggestion: '#F59E0B',
        compliment: '#10B981',
        positive: '#10B981',
        neutral: '#6B7280',
        negative: '#EF4444',
    };
    return colorMap[value] || '#6B7280';
};

// Convert our schema column to RoomTable Column format
const schemaToRoomTableColumn = (col: TableColumn, isRTL: boolean): Column => {
    // Map our types to RoomTable types
    let roomTableType: Column['type'] = 'text';

    switch (col.type) {
        case 'number':
        case 'decimal':
            roomTableType = 'number';
            break;
        case 'date':
        case 'datetime':
            roomTableType = 'date';
            break;
        case 'enum':
        case 'status':
            roomTableType = 'status';
            break;
        case 'boolean':
            roomTableType = 'checkbox';
            break;
        case 'currency':
            roomTableType = 'currency';
            break;
        case 'person':
            roomTableType = 'person';
            break;
        case 'people':
            roomTableType = 'people';
            break;
        default:
            roomTableType = 'text';
    }

    return {
        id: col.id,
        label: isRTL && col.labelAr ? col.labelAr : col.label,
        type: roomTableType,
        width: col.width || 150,
        minWidth: col.minWidth || 100,
        resizable: true,
        pinned: col.pinned,
        // Add status options for enum types
        ...(col.type === 'enum' && col.enumValues ? {
            statusOptions: col.enumValues.map(e => ({
                value: e.value,
                label: isRTL && e.labelAr ? e.labelAr : e.label,
                color: getStatusColor(e.value)
            }))
        } : {})
    };
};

// Main Component
export const DeptDataView: React.FC<DeptDataViewProps> = ({
    departmentId,
    departmentName,
    departmentNameAr,
    tables,
    linkedTables = []
}) => {
    const { language } = useAppContext();
    const isRTL = language === 'ar';

    const allTables = useMemo(() => [...tables, ...linkedTables], [tables, linkedTables]);
    const [activeTableId, setActiveTableId] = useState<string>(tables[0]?.id || '');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const activeTable = useMemo(() =>
        allTables.find(t => t.id === activeTableId) || tables[0],
        [allTables, activeTableId, tables]
    );

    // Convert table schema to RoomTable columns
    const roomTableColumns = useMemo((): Column[] => {
        if (!activeTable) return [];

        // Always add select column first
        const cols: Column[] = [
            { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true }
        ];

        // Add schema columns
        activeTable.columns.forEach((col, idx) => {
            const roomCol = schemaToRoomTableColumn(col, isRTL);
            // Pin the first data column
            if (idx === 0) {
                roomCol.pinned = true;
            }
            cols.push(roomCol);
        });

        return cols;
    }, [activeTable, isRTL]);

    // Unique viewId for each table (v2 to reset cached columns from old 'name' id)
    const viewId = `dept-data-${departmentId}-${activeTableId}-v2`;

    return (
        <div className={`h-full flex flex-col bg-stone-50 dark:bg-stone-900 ${isRTL ? 'rtl' : 'ltr'}`}>
            {/* Header with table selector */}
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database size={20} className="text-stone-500 dark:text-stone-400" />
                    <div>
                        <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                            {isRTL && departmentNameAr ? departmentNameAr : departmentName} - {isRTL ? 'بيانات القسم' : 'Department Data'}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                            {isRTL && activeTable?.descriptionAr ? activeTable.descriptionAr : activeTable?.description}
                        </p>
                    </div>
                </div>

                {/* Table Selector Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-2 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 rounded-lg transition-colors"
                    >
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                            {isRTL && activeTable?.nameAr ? activeTable.nameAr : activeTable?.name}
                        </span>
                        {activeTable?.isLinked && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded">
                                {isRTL ? 'مرتبط' : 'Linked'}
                            </span>
                        )}
                        <CaretDown size={16} className={`text-stone-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setIsDropdownOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-white dark:bg-stone-800 rounded-lg shadow-lg border border-stone-200 dark:border-stone-700 py-1 max-h-80 overflow-y-auto">
                                {/* Own Tables */}
                                {tables.length > 0 && (
                                    <div className="px-3 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                        {isRTL ? 'جداول القسم' : 'Department Tables'}
                                    </div>
                                )}
                                {tables.map(table => (
                                    <button
                                        key={table.id}
                                        onClick={() => {
                                            setActiveTableId(table.id);
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full px-3 py-2 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${
                                            activeTableId === table.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                        }`}
                                    >
                                        <span className="text-sm text-stone-700 dark:text-stone-300">
                                            {isRTL && table.nameAr ? table.nameAr : table.name}
                                        </span>
                                        {activeTableId === table.id && (
                                            <Check size={16} className="text-blue-500" />
                                        )}
                                    </button>
                                ))}

                                {/* Linked Tables */}
                                {linkedTables.length > 0 && (
                                    <>
                                        <div className="border-t border-stone-200 dark:border-stone-700 my-1" />
                                        <div className="px-3 py-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                                            {isRTL ? 'جداول مرتبطة' : 'Linked Tables'}
                                        </div>
                                        {linkedTables.map(table => (
                                            <button
                                                key={table.id}
                                                onClick={() => {
                                                    setActiveTableId(table.id);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-3 py-2 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors ${
                                                    activeTableId === table.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-stone-700 dark:text-stone-300">
                                                        {isRTL && table.nameAr ? table.nameAr : table.name}
                                                    </span>
                                                    <span className="text-xs text-amber-600 dark:text-amber-400">
                                                        ({table.linkedDepartment})
                                                    </span>
                                                </div>
                                                {activeTableId === table.id && (
                                                    <Check size={16} className="text-blue-500" />
                                                )}
                                            </button>
                                        ))}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* RoomTable */}
            <div className="flex-1 overflow-hidden">
                <RoomTable
                    key={viewId}
                    roomId={`dept-${departmentId}`}
                    viewId={viewId}
                    defaultColumns={roomTableColumns}
                    enableImport={!activeTable?.isLinked}
                    hideGroupHeader={true}
                    showPagination={true}
                />
            </div>
        </div>
    );
};

export default DeptDataView;
