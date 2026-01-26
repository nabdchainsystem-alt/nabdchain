import React, { useRef, useState } from 'react';
import RoomTable, { Row, Column } from './RoomTable';
import { Upload, Download, ChartBar as BarChart3, Sparkle as Sparkles, Trash } from 'phosphor-react';
import * as XLSX from 'xlsx';
import { ConfirmModal } from '../../components/ConfirmModal';

interface DataTableProps {
    roomId: string;
}

const DataTable: React.FC<DataTableProps & { viewId?: string }> = ({ roomId, viewId: propViewId }) => {
    // Unique View ID for DataTable: Use prop if available, otherwise default to 'datatable-v2' to force fresh state
    const viewId = propViewId || 'datatable-v2';
    const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
    const setRowsRef = useRef<React.Dispatch<React.SetStateAction<Row[]>> | null>(null);

    const defaultColumns = [
        { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true },
        // Requirement: "keep only the first two Column only and name them Data 1 , Data 2"
        // We reuse the 'name' column for Data 1 to keep text editing
        { id: 'name', label: 'Data 1', type: 'text', width: 200, minWidth: 100, resizable: true, pinned: true },
        // Data 2 - generic text column
        { id: 'data2', label: 'Data 2', type: 'text', width: 200, minWidth: 100, resizable: true }
    ];

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>, setRows: React.Dispatch<React.SetStateAction<Row[]>>, setColumns: React.Dispatch<React.SetStateAction<Column[]>>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];

            // Read as array of arrays
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

            if (data.length === 0) return;

            const headers = data[0] as string[];
            const rowsData = data.slice(1); // All data rows

            // 1. Generate New Columns
            const newCols: Column[] = [
                { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true }
            ];

            const headerToIdMap: Record<number, string> = {};

            headers.forEach((h, index) => {
                // Sanitize ID
                let id = String(h || '').toLowerCase().replace(/\s+/g, '_').replace(/[^\w]/g, '');
                if (!id) id = `col_${index}`;

                // Ensure unique IDs
                let uniqueId = id;
                let counter = 1;
                while (newCols.some(c => c.id === uniqueId) || uniqueId === 'select') {
                    uniqueId = `${id}_${counter}`;
                    counter++;
                }

                // Force first column to be 'name' to keep RoomTable default editing behavior for primary column
                if (index === 0) {
                    uniqueId = 'name';
                    newCols.push({
                        id: uniqueId,
                        label: String(h || 'Name'),
                        type: 'text',
                        width: 200,
                        minWidth: 100,
                        resizable: true,
                        pinned: true
                    });
                } else {
                    newCols.push({
                        id: uniqueId,
                        label: String(h || `Column ${index + 1}`),
                        type: 'text',
                        width: 150,
                        minWidth: 100,
                        resizable: true
                    });
                }
                headerToIdMap[index] = uniqueId;
            });

            // 2. Generate Rows
            const newRows: Row[] = rowsData.map((rowArr, i) => {
                const rowObj: Row = { id: Date.now().toString() + '-' + i };
                headers.forEach((_, idx) => {
                    const val = rowArr[idx];
                    const colId = headerToIdMap[idx];
                    if (colId) {
                        // Normalize Date objects to ISO strings for consistency
                        if (val instanceof Date) {
                            rowObj[colId] = val.toISOString();
                        } else {
                            rowObj[colId] = val;
                        }
                    }
                });
                // Ensure defaults for RoomTable structure if they don't exist in Excel
                if (!rowObj.status) rowObj.status = 'To Do';
                if (!rowObj.assignees) rowObj.assignees = [];

                return rowObj;
            });

            // Replace existing data completely
            setColumns(newCols);
            setRows(newRows);
        };
        reader.readAsBinaryString(file);

        // Reset input
        e.target.value = '';
    };

    // Initial load? RoomTable usually loads data. 
    // If we lift state, we need to handle loading.
    // Let's stick to the simpler integration first: 
    // Does RoomTable expose data? 
    // Let's optimistically assume `renderCustomActions` signature includes rows/columns, 
    // OR we change the pattern to use `rows` and `columns` props on RoomTable (controlled mode).
    // Let's try Controlled Mode if supported, otherwise we might need to modify RoomTable.
    // given I cannot see RoomTable source in previous turns easily, 
    // I will try to use `renderCustomActions` params. 
    // If that fails, I'll have to Refactor.
    // Actually, I can check imports. 

    // Let's MODIFY to ADD specific imports and the Modal.
    // And assuming renderCustomActions gives us access.

    return (
        <>
            <RoomTable
                key={viewId}
                roomId={roomId}
                viewId={viewId}
                defaultColumns={defaultColumns}
                enableImport={true}
                hideGroupHeader={true}
                showPagination={true}
                renderCustomActions={({ setRows, setColumns, setIsChartModalOpen, setIsAIReportModalOpen }) => (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsChartModalOpen(true)}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group"
                        >
                            <BarChart3 size={15} className="group-hover:scale-110 transition-transform" />
                            <span>Generate Chart</span>
                        </button>
                        <button
                            onClick={() => setIsAIReportModalOpen(true)}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group"
                        >
                            <Sparkles size={15} className="group-hover:scale-110 transition-transform" />
                            <span>AI Report</span>
                        </button>
                        <div className="w-px h-4 bg-stone-300 dark:bg-stone-600 mx-1" />
                        <button
                            onClick={() => {
                                setRowsRef.current = setRows;
                                setIsClearDataModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors group"
                        >
                            <Trash size={15} className="group-hover:scale-110 transition-transform" />
                            <span>Clear Data</span>
                        </button>
                    </div>
                )}
            />
            <ConfirmModal
                isOpen={isClearDataModalOpen}
                onClose={() => setIsClearDataModalOpen(false)}
                onConfirm={() => {
                    if (setRowsRef.current) {
                        setRowsRef.current([]);
                    }
                    setIsClearDataModalOpen(false);
                }}
                title="Clear all data?"
                description="This will permanently delete all data from this table. This action cannot be undone."
                confirmText="Clear Data"
                type="danger"
            />
        </>
    );
};

export default DataTable;
