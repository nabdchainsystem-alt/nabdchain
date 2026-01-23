import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Row } from '../Table/RoomTable';
import {
    CaretDown as ChevronDown,
    FileText,
    Download,
    Upload,
    Funnel as Filter,
    Layout,
    SortDescending as ArrowDownWideNarrow,
    Calculator as Sigma
} from 'phosphor-react';
import { PortalPopup } from '../../../../components/ui/PortalPopup';
import { boardLogger } from '../../../../utils/logger';

interface PivotTableProps {
    roomId: string;
}

type AggregationType = 'count' | 'list';

interface PivotConfig {
    rowGroup: string;
    colGroup: string;
    valueField: string;
    aggregation: AggregationType;
}

const AVAILABLE_FIELDS = [
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'assignees', label: 'Person' },
    { id: 'dueDate', label: 'Due Date' },
    { id: 'name', label: 'Task Name' },
];

// --- Custom Components ---

const ConfigDropdown: React.FC<{
    label: string;
    icon: React.ElementType;
    value: string;
    options: { id: string; label: string }[];
    onChange: (val: string) => void;
}> = ({ label, icon: Icon, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLButtonElement>(null);

    const selectedLabel = options.find(o => o.id === value)?.label || value;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">{label}</span>
            <button
                ref={ref}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-40 px-3 py-2 bg-white dark:bg-monday-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Icon size={14} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{selectedLabel}</span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <PortalPopup
                    triggerRef={ref}
                    onClose={() => setIsOpen(false)}
                    side="bottom"
                    align="start"
                >
                    <div className="w-40 bg-white dark:bg-monday-dark-surface border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${value === opt.id ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </PortalPopup>
            )}
        </div>
    );
};

export const PivotTable: React.FC<PivotTableProps> = ({ roomId }) => {
    const storageKeyRows = `board-tasks-${roomId}`;
    const [rows, setRows] = useState<Row[]>([]);

    // Configuration State
    const [config, setConfig] = useState<PivotConfig>({
        rowGroup: 'status',
        colGroup: 'priority',
        valueField: 'name',
        aggregation: 'count'
    });

    // Load Data
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKeyRows);
            if (saved) {
                const parsed = JSON.parse(saved);
                setRows(parsed);
            }
        } catch (e) {
            boardLogger.error('Failed to load tasks for pivot table', e);
        }
    }, [storageKeyRows]);

    // Process Data
    const pivotedData = useMemo(() => {
        const rowValues = new Set<string>();
        const colValues = new Set<string>();
        const dataMap = new Map<string, any>(); // key: "rowVal::colVal", value: aggregated

        rows.forEach(row => {
            // Extract values, handling arrays (like assignees) or nulls
            let rVal = row[config.rowGroup];
            let cVal = row[config.colGroup];

            // Improved labeling for missing values
            const getLabel = (val: any, field: string) => {
                if (!val || val === 'Empty' || (Array.isArray(val) && val.length === 0)) {
                    if (field === 'assignees') return 'Unassigned';
                    if (field === 'dueDate') return 'No Date';
                    if (field === 'priority') return 'No Priority';
                    if (field === 'status') return 'No Status';
                    return 'Uncategorized';
                }
                return String(Array.isArray(val) ? val[0] : val);
            };

            const rLabel = getLabel(rVal, config.rowGroup);
            const cLabel = getLabel(cVal, config.colGroup);

            rowValues.add(rLabel);
            colValues.add(cLabel);

            const key = `${rLabel}::${cLabel}`;

            if (!dataMap.has(key)) {
                dataMap.set(key, []);
            }
            dataMap.get(key).push(row);
        });

        // Convert sets to sorted arrays
        const sortedRowHeaders = Array.from(rowValues).sort();
        const sortedColHeaders = Array.from(colValues).sort();

        // Move "Unassigned"/"No X" to the end or beginning? Usually beginning or end.
        // Let's keep simple sort for now, but usually they go to bottom/end if possible.

        return {
            rowHeaders: sortedRowHeaders,
            colHeaders: sortedColHeaders,
            dataMap
        };
    }, [rows, config]);

    const handleGenerateReport = () => {
        // Create CSV Content
        const headers = ['Row Group', ...pivotedData.colHeaders, 'Total'];
        const csvRows = [headers.join(',')];

        pivotedData.rowHeaders.forEach(rowHeader => {
            let rowTotal = 0;
            const rowData = [rowHeader];

            pivotedData.colHeaders.forEach(colHeader => {
                const key = `${rowHeader}::${colHeader}`;
                const items = pivotedData.dataMap.get(key) || [];
                rowTotal += items.length;

                if (config.aggregation === 'count') {
                    rowData.push(String(items.length));
                } else {
                    // For List, we join items with a semicolon
                    rowData.push(`"${items.map((i: Row) => i[config.valueField]).join('; ')}"`);
                }
            });
            rowData.push(String(rowTotal));
            csvRows.push(rowData.join(','));
        });

        // Add Grand Total
        const pivotTotal = rows.length;
        const totalRow = ['Total'];
        pivotedData.colHeaders.forEach(colHeader => {
            const colTotal = pivotedData.rowHeaders.reduce((acc, rowHeader) => {
                const key = `${rowHeader}::${colHeader}`;
                const items = pivotedData.dataMap.get(key) || [];
                return acc + items.length;
            }, 0);
            totalRow.push(String(colTotal));
        });
        totalRow.push(String(pivotTotal));
        csvRows.push(totalRow.join(','));

        // Trigger Download
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pivot_report_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    // Helper to map header text to field ID
    const mapHeaderToField = (header: string) => {
        const h = header.toLowerCase().trim();
        if (h.includes('name') || h.includes('task') || h.includes('title')) return 'name';
        if (h.includes('person') || h.includes('assignee') || h.includes('owner') || h.includes('who')) return 'assignees';
        if (h.includes('due') || h.includes('date') || h.includes('deadline') || h.includes('when')) return 'dueDate';
        if (h.includes('status') || h.includes('state') || h.includes('stage')) return 'status';
        if (h.includes('priority') || h.includes('importance') || h.includes('level')) return 'priority';
        return null;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();

        // Handle CSV vs XLSX
        if (file.name.endsWith('.csv')) {
            reader.onload = (event) => {
                const text = event.target?.result as string;
                if (!text) return;

                // Simple CSV Parser
                const lines = text.split('\n');
                if (lines.length < 2) return; // Need headers and at least one row

                const headers = lines[0].split(',').map(h => h.trim());
                const newRows: Row[] = [];

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    // Handle basic comma separation (does not handle quoted commas correctly, but enough for simple usage)
                    const values = line.split(',');
                    const row: Row = { id: Date.now().toString() + '_' + i }; // Unique ID

                    let hasData = false;
                    headers.forEach((header, index) => {
                        const val = values[index]?.trim();
                        if (val) {
                            const field = mapHeaderToField(header);
                            if (field) {
                                // Handle Arrays for assignees
                                if (field === 'assignees') {
                                    row[field] = [val];
                                } else {
                                    row[field] = val;
                                }
                                hasData = true;
                            }
                        }
                    });

                    if (hasData) {
                        // Defaults
                        if (!row.status) row.status = 'To Do';
                        newRows.push(row);
                    }
                }

                if (newRows.length > 0) {
                    const updatedRows = [...rows, ...newRows];
                    setRows(updatedRows);
                    localStorage.setItem(storageKeyRows, JSON.stringify(updatedRows));
                    alert(`Successfully imported ${newRows.length} tasks from CSV.`);
                } else {
                    alert('No valid tasks found in CSV.');
                }
            };
            reader.readAsText(file);
        } else {
            // XLSX Loader
            reader.onload = (e) => {
                const data = e.target?.result;
                try {
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]; // array of arrays

                    if (jsonData.length < 2) {
                        alert('Excel file is empty or missing headers.');
                        return;
                    }

                    const headers = jsonData[0] as string[];
                    const newRows: Row[] = [];

                    for (let i = 1; i < jsonData.length; i++) {
                        const rowArray = jsonData[i];
                        if (!rowArray || rowArray.length === 0) continue;

                        const row: Row = { id: Date.now().toString() + '_' + i }; // Unique ID
                        let hasData = false;

                        headers.forEach((header, index) => {
                            // Excel reading might skip empty trailing cells, so check index
                            if (index >= rowArray.length) return;

                            const val = rowArray[index];
                            if (val !== undefined && val !== null && String(val).trim() !== '') {
                                const field = mapHeaderToField(String(header));
                                if (field) {
                                    // Handle Arrays for assignees
                                    if (field === 'assignees') {
                                        row[field] = [String(val)];
                                    } else {
                                        row[field] = String(val); // Force string for simplicity
                                    }
                                    hasData = true;
                                }
                            }
                        });

                        if (hasData) {
                            if (!row.status) row.status = 'To Do'; // Default
                            newRows.push(row);
                        }
                    }

                    if (newRows.length > 0) {
                        const updatedRows = [...rows, ...newRows];
                        setRows(updatedRows);
                        localStorage.setItem(storageKeyRows, JSON.stringify(updatedRows));
                        alert(`Successfully imported ${newRows.length} tasks from Excel.`);
                    } else {
                        alert('No valid tasks found in Excel file.');
                    }

                } catch (error) {
                    boardLogger.error('Error reading excel file', error);
                    alert('Failed to read Excel file.');
                }
            };
            reader.readAsBinaryString(file);
        }

        // Reset input
        e.target.value = '';
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-monday-dark-surface text-gray-900 dark:text-gray-100 p-6 overflow-hidden">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".csv, .xlsx, .xls"
            />

            {/* Toolbar Area */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-6 p-1">

                {/* Configuration Controls */}
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-monday-dark-elevated p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <ConfigDropdown
                        label="Rows"
                        icon={Layout}
                        value={config.rowGroup}
                        options={AVAILABLE_FIELDS}
                        onChange={(val) => setConfig({ ...config, rowGroup: val })}
                    />
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 self-end mb-2 mx-1" />
                    <ConfigDropdown
                        label="Columns"
                        icon={ArrowDownWideNarrow}
                        value={config.colGroup}
                        options={AVAILABLE_FIELDS}
                        onChange={(val) => setConfig({ ...config, colGroup: val })}
                    />
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 self-end mb-2 mx-1" />
                    <ConfigDropdown
                        label="Values"
                        icon={Filter}
                        value={config.valueField}
                        options={AVAILABLE_FIELDS}
                        onChange={(val) => setConfig({ ...config, valueField: val })}
                    />
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 self-end mb-2 mx-1" />
                    <ConfigDropdown
                        label="Aggregation"
                        icon={Sigma}
                        value={config.aggregation}
                        options={[{ id: 'count', label: 'Count' }, { id: 'list', label: 'List' }]}
                        onChange={(val) => setConfig({ ...config, aggregation: val as AggregationType })}
                    />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-monday-dark-elevated border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 text-gray-600 dark:text-gray-300 rounded-lg shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <Upload size={16} />
                        <span className="text-sm font-medium">Import</span>
                    </button>

                    <button
                        onClick={handleGenerateReport}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md shadow-indigo-200 dark:shadow-none transition-colors"
                    >
                        <FileText size={16} />
                        <span className="text-sm font-medium">Generate Report</span>
                    </button>
                </div>
            </div>

            {/* Pivot Table Grid */}
            <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
                <table className="min-w-full border-collapse bg-white dark:bg-monday-dark-surface">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-monday-dark-elevated">
                        <tr>
                            {/* Top-Left Corner (Row Label) */}
                            <th className="p-4 text-left text-[14.7px] font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 border-r dark:border-gray-800 w-48 bg-gray-100/50 dark:bg-monday-dark-elevated">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-normal">{AVAILABLE_FIELDS.find(f => f.id === config.rowGroup)?.label}</span>
                                    <ChevronDown size={12} className="-rotate-90 text-gray-300" />
                                    <span className="text-gray-700 dark:text-gray-200">{AVAILABLE_FIELDS.find(f => f.id === config.colGroup)?.label}</span>
                                </div>
                            </th>

                            {/* Column Headers */}
                            {pivotedData.colHeaders.map(colHeader => (
                                <th key={colHeader} className="p-4 text-left text-[14.7px] font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-800 min-w-[150px]">
                                    {colHeader}
                                </th>
                            ))}
                            <th className="p-4 text-left text-[14.7px] font-semibold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-monday-dark-elevated min-w-[100px]">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {pivotedData.rowHeaders.map(rowHeader => {
                            let rowTotal = 0;

                            return (
                                <tr key={rowHeader} className="hover:bg-gray-50 dark:hover:bg-[#20232b]/50 transition-colors">
                                    {/* Row Header */}
                                    <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 border-r border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-monday-dark-elevated/30">
                                        {rowHeader}
                                    </td>

                                    {/* Cells */}
                                    {pivotedData.colHeaders.map(colHeader => {
                                        const key = `${rowHeader}::${colHeader}`;
                                        const items = pivotedData.dataMap.get(key) || [];
                                        rowTotal += items.length;

                                        return (
                                            <td key={colHeader} className="p-4 text-sm border-b border-gray-100 dark:border-gray-800">
                                                {config.aggregation === 'count' ? (
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${items.length > 0 ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-400'}`}>
                                                        {items.length || '-'}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-1 max-h-[100px] overflow-y-auto">
                                                        {items.map((item: Row) => (
                                                            <div key={item.id} className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                                                                • {item[config.valueField]}
                                                            </div>
                                                        ))}
                                                        {items.length === 0 && <span className="text-gray-400">-</span>}
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                    {/* Row Total */}
                                    <td className="p-4 text-sm font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 bg-gray-50/10 dark:bg-monday-dark-elevated/10">
                                        {rowTotal}
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Grand Total Row */}
                        <tr className="bg-gray-50 dark:bg-monday-dark-elevated font-semibold border-t-2 border-gray-200 dark:border-gray-700">
                            <td className="p-4 text-sm border-r border-gray-200 dark:border-gray-700">Total</td>
                            {pivotedData.colHeaders.map(colHeader => {
                                const total = pivotedData.rowHeaders.reduce((acc, rowHeader) => {
                                    const key = `${rowHeader}::${colHeader}`;
                                    const items = pivotedData.dataMap.get(key) || [];
                                    return acc + items.length;
                                }, 0);
                                return (
                                    <td key={colHeader} className="p-4 text-sm text-gray-900 dark:text-gray-100">
                                        {total}
                                    </td>
                                )
                            })}
                            <td className="p-4 text-sm text-indigo-600 dark:text-indigo-400 font-bold">
                                {rows.length}
                            </td>
                        </tr>
                    </tbody>
                </table>
                {rows.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <p>No data available to display.</p>
                        <p className="text-sm">Add tasks in the Table or Kanban view first.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
