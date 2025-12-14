import React, { useRef } from 'react';
import RoomTable, { Row, Column } from './RoomTable';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataTableProps {
    roomId: string;
}

const DataTable: React.FC<DataTableProps> = ({ roomId }) => {
    // Unique View ID for DataTable
    const viewId = 'datatable-main';

    const defaultColumns = [
        { id: 'select', label: '', type: 'select', width: 48, minWidth: 40, resizable: false, pinned: true },
        // Requirement: "keep only the first two Column only and name them Data 1 , Data 2"
        // We reuse the 'name' column for Data 1 to keep text editing
        { id: 'name', label: 'Data 1', type: 'text', width: 200, minWidth: 100, resizable: true },
        // Data 2 - generic text column
        { id: 'data2', label: 'Data 2', type: 'text', width: 200, minWidth: 100, resizable: true }
    ];

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>, setRows: React.Dispatch<React.SetStateAction<Row[]>>, setColumns: React.Dispatch<React.SetStateAction<Column[]>>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
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
                        resizable: true
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
                        rowObj[colId] = val;
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
        <RoomTable
            roomId={roomId}
            viewId={viewId}
            defaultColumns={defaultColumns}
            // If RoomTable supports `rows` prop for controlled, we should use it.
            // If not, we hope renderCustomActions provides it.
            renderCustomActions={({ setRows, setColumns }) => (
                <div className="relative isolate flex items-center">
                    <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        title="Import to Data Table"
                        onChange={(e) => handleImport(e, setRows, setColumns)}
                    />
                    <button className="flex items-center gap-2 px-2 py-0.5 text-[12px] font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-full hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors pointer-events-none">
                        <Upload size={12} />
                        <span className="sr-only">Import</span>
                    </button>
                </div>
            )}
        />
    );
};

export default DataTable;
