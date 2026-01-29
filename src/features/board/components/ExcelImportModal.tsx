import React, { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import {
    X,
    UploadSimple,
    FileXls,
    Table as TableIcon,
    Check,
    Warning,
    ArrowRight,
    CaretDown,
    MagnifyingGlass,
    Trash,
    Plus
} from 'phosphor-react';
import { useAppContext } from '../../../contexts/AppContext';
import { Column, Row } from '../views/Table/types';
import { v4 as uuidv4 } from 'uuid';

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (rows: Row[], newColumns?: Column[]) => void;
    existingColumns: Column[];
    groupId?: string;
}

interface ParsedSheet {
    name: string;
    headers: string[];
    data: Record<string, any>[];
    rowCount: number;
}

interface ColumnMapping {
    excelColumn: string;
    boardColumn: string | null; // null = skip, 'new' = create new
    newColumnType?: string;
}

const COLUMN_TYPES = [
    { id: 'text', label: 'Text' },
    { id: 'number', label: 'Number' },
    { id: 'date', label: 'Date' },
    { id: 'status', label: 'Status' },
    { id: 'priority', label: 'Priority' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Phone' },
    { id: 'url', label: 'URL' },
    { id: 'checkbox', label: 'Checkbox' },
    { id: 'currency', label: 'Currency' },
    { id: 'rating', label: 'Rating' },
];

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    existingColumns,
    groupId
}) => {
    const { t, dir } = useAppContext();
    const isRTL = dir === 'rtl';

    // Steps: 'upload' | 'select_sheet' | 'mapping' | 'preview'
    const [step, setStep] = useState<'upload' | 'select_sheet' | 'mapping' | 'preview'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [sheets, setSheets] = useState<ParsedSheet[]>([]);
    const [selectedSheet, setSelectedSheet] = useState<ParsedSheet | null>(null);
    const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Parse Excel file
    const parseExcelFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });

            const parsedSheets: ParsedSheet[] = workbook.SheetNames.map(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
                    header: 1,
                    defval: '',
                    raw: false
                });

                // First row is headers
                const headers = (jsonData[0] as string[] || []).map((h, i) =>
                    h?.toString().trim() || `Column ${i + 1}`
                );

                // Rest is data - filter out completely empty rows
                const rows = jsonData.slice(1).map(row => {
                    const rowData: Record<string, any> = {};
                    headers.forEach((header, index) => {
                        rowData[header] = (row as any[])[index] ?? '';
                    });
                    return rowData;
                }).filter(row => {
                    // Check if row has any non-empty, non-whitespace values
                    return Object.values(row).some(v => {
                        if (v === null || v === undefined) return false;
                        const strVal = String(v).trim();
                        return strVal !== '' && strVal !== 'undefined' && strVal !== 'null';
                    });
                });

                return {
                    name: sheetName,
                    headers,
                    data: rows,
                    rowCount: rows.length
                };
            });

            setSheets(parsedSheets);

            // If only one sheet, auto-select it
            if (parsedSheets.length === 1) {
                handleSelectSheet(parsedSheets[0]);
            } else {
                setStep('select_sheet');
            }
        } catch (err) {
            setError(t('excel_parse_error') || 'Failed to parse Excel file. Please check the file format.');
            console.error('Excel parse error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    // Handle file drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (
            droppedFile.name.endsWith('.xlsx') ||
            droppedFile.name.endsWith('.xls') ||
            droppedFile.name.endsWith('.csv')
        )) {
            setFile(droppedFile);
            parseExcelFile(droppedFile);
        } else {
            setError(t('invalid_file_type') || 'Please upload an Excel file (.xlsx, .xls) or CSV file');
        }
    }, [parseExcelFile, t]);

    // Handle file input
    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseExcelFile(selectedFile);
        }
    }, [parseExcelFile]);

    // Select sheet and initialize mappings
    const handleSelectSheet = useCallback((sheet: ParsedSheet) => {
        setSelectedSheet(sheet);

        // Auto-map columns with matching names
        const mappings: ColumnMapping[] = sheet.headers.map(header => {
            const headerLower = header.toLowerCase().trim();

            // Try to find matching existing column
            // Exclude 'select' column and columns without proper labels
            const matchingColumn = existingColumns.find(col => {
                // Skip system columns
                if (['select'].includes(col.id)) return false;

                const colLabel = col.label?.toLowerCase().trim();
                const colId = col.id?.toLowerCase().trim();

                // Skip columns without proper labels for fuzzy matching
                if (!colLabel || colLabel.length < 2) return colId === headerLower;

                // Exact match on label or id
                if (colLabel === headerLower || colId === headerLower) return true;

                // Partial match only if both strings are meaningful (at least 3 chars)
                if (headerLower.length >= 3 && colLabel.length >= 3) {
                    return colLabel.includes(headerLower) || headerLower.includes(colLabel);
                }

                return false;
            });

            return {
                excelColumn: header,
                boardColumn: matchingColumn?.id || 'new',
                newColumnType: matchingColumn ? undefined : guessColumnType(header, sheet.data.slice(0, 10).map(r => r[header]))
            };
        });

        setColumnMappings(mappings);
        setStep('mapping');
    }, [existingColumns]);

    // Guess column type from header name and sample data
    const guessColumnType = (header: string, sampleData: any[]): string => {
        const headerLower = header.toLowerCase();

        // Check header name patterns
        if (headerLower.includes('email') || headerLower.includes('mail')) return 'email';
        if (headerLower.includes('phone') || headerLower.includes('mobile') || headerLower.includes('tel')) return 'phone';
        if (headerLower.includes('url') || headerLower.includes('link') || headerLower.includes('website')) return 'url';
        if (headerLower.includes('date') || headerLower.includes('time') || headerLower.includes('created') || headerLower.includes('updated')) return 'date';
        if (headerLower.includes('status')) return 'status';
        if (headerLower.includes('priority')) return 'priority';
        if (headerLower.includes('price') || headerLower.includes('cost') || headerLower.includes('amount') || headerLower.includes('total')) return 'currency';
        if (headerLower.includes('rating') || headerLower.includes('score') || headerLower.includes('stars')) return 'rating';
        if (headerLower.includes('done') || headerLower.includes('complete') || headerLower.includes('check')) return 'checkbox';

        // Check sample data patterns
        const nonEmptyValues = sampleData.filter(v => v !== null && v !== undefined && v !== '');
        if (nonEmptyValues.length > 0) {
            // Check if all values are numbers
            if (nonEmptyValues.every(v => !isNaN(Number(v)))) return 'number';

            // Check if values look like dates
            if (nonEmptyValues.every(v => {
                const dateStr = String(v);
                return !isNaN(Date.parse(dateStr)) || /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dateStr);
            })) return 'date';

            // Check if values look like emails
            if (nonEmptyValues.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v)))) return 'email';

            // Check if values look like URLs
            if (nonEmptyValues.every(v => /^https?:\/\//.test(String(v)))) return 'url';

            // Check if values look like booleans
            if (nonEmptyValues.every(v => ['true', 'false', 'yes', 'no', '1', '0'].includes(String(v).toLowerCase()))) return 'checkbox';
        }

        return 'text';
    };

    // Update column mapping
    const updateMapping = useCallback((index: number, updates: Partial<ColumnMapping>) => {
        setColumnMappings(prev => prev.map((m, i) =>
            i === index ? { ...m, ...updates } : m
        ));
    }, []);

    // Perform import
    const handleImport = useCallback(() => {
        if (!selectedSheet) return;

        const newColumns: Column[] = [];
        const columnIdMap: Record<string, string> = {};

        // Create new columns as needed
        columnMappings.forEach(mapping => {
            if (mapping.boardColumn === 'new') {
                const newColId = mapping.excelColumn.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString().slice(-4);
                newColumns.push({
                    id: newColId,
                    label: mapping.excelColumn,
                    type: mapping.newColumnType || 'text',
                    width: 150,
                    minWidth: 100,
                    resizable: true
                });
                columnIdMap[mapping.excelColumn] = newColId;
            } else if (mapping.boardColumn) {
                columnIdMap[mapping.excelColumn] = mapping.boardColumn;
            }
        });

        // Transform data to rows
        const rows: Row[] = selectedSheet.data.map(excelRow => {
            const row: Row = {
                id: uuidv4(),
                groupId: groupId
            };

            columnMappings.forEach(mapping => {
                if (mapping.boardColumn === null) return; // Skip

                const targetColId = columnIdMap[mapping.excelColumn];
                if (!targetColId) return;

                let value = excelRow[mapping.excelColumn];

                // Transform value based on column type
                const colType = mapping.boardColumn === 'new'
                    ? mapping.newColumnType
                    : existingColumns.find(c => c.id === mapping.boardColumn)?.type;

                if (colType === 'checkbox') {
                    value = ['true', 'yes', '1', 'x', '✓', '✔'].includes(String(value).toLowerCase());
                } else if (colType === 'number' || colType === 'currency' || colType === 'rating') {
                    value = parseFloat(String(value).replace(/[^0-9.-]/g, '')) || null;
                } else if (colType === 'date') {
                    // Try to parse date
                    const dateVal = new Date(value);
                    value = isNaN(dateVal.getTime()) ? value : dateVal.toISOString();
                }

                row[targetColId] = value;
            });

            return row;
        }).filter(row => {
            // Final check: only include rows that have at least one non-empty mapped value
            const mappedKeys = Object.keys(row).filter(k => k !== 'id' && k !== 'groupId');
            return mappedKeys.some(key => {
                const val = row[key];
                if (val === null || val === undefined || val === '') return false;
                if (typeof val === 'string' && val.trim() === '') return false;
                return true;
            });
        });

        if (rows.length === 0) {
            setError(t('no_valid_data') || 'No valid data to import. All rows appear to be empty.');
            return;
        }

        onImport(rows, newColumns);
        handleClose();
    }, [selectedSheet, columnMappings, existingColumns, groupId, onImport]);

    // Reset and close
    const handleClose = useCallback(() => {
        setStep('upload');
        setFile(null);
        setSheets([]);
        setSelectedSheet(null);
        setColumnMappings([]);
        setError(null);
        onClose();
    }, [onClose]);

    // Filter columns for dropdown
    const availableColumns = useMemo(() => {
        return existingColumns.filter(col => !['select'].includes(col.id));
    }, [existingColumns]);

    if (!isOpen) return null;

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
            <div
                className="bg-white dark:bg-stone-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                dir={dir}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <FileXls size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-100">
                                {t('import_excel') || 'Import from Excel'}
                            </h2>
                            <p className="text-xs text-stone-500 dark:text-stone-400">
                                {step === 'upload' && (t('upload_excel_desc') || 'Upload your Excel or CSV file')}
                                {step === 'select_sheet' && (t('select_sheet_desc') || 'Choose which sheet to import')}
                                {step === 'mapping' && (t('map_columns_desc') || 'Map Excel columns to board columns')}
                                {step === 'preview' && (t('preview_import_desc') || 'Review and confirm import')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-stone-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Upload Step */}
                    {step === 'upload' && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                                isDragging
                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600'
                            }`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                        >
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-stone-600 dark:text-stone-400">
                                        {t('parsing_file') || 'Parsing file...'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <UploadSimple size={48} className="mx-auto mb-4 text-stone-400" />
                                    <p className="text-lg font-medium text-stone-700 dark:text-stone-200 mb-2">
                                        {t('drag_drop_excel') || 'Drag and drop your Excel file here'}
                                    </p>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                                        {t('or') || 'or'}
                                    </p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-colors">
                                        <UploadSimple size={18} />
                                        <span>{t('browse_files') || 'Browse Files'}</span>
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileInput}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-xs text-stone-400 mt-4">
                                        {t('supported_formats') || 'Supports .xlsx, .xls, and .csv files'}
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* Sheet Selection Step */}
                    {step === 'select_sheet' && (
                        <div className="space-y-3">
                            <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                                {t('multiple_sheets_found') || 'Multiple sheets found. Select one to import:'}
                            </p>
                            {sheets.map((sheet, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelectSheet(sheet)}
                                    className="w-full flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg border border-stone-200 dark:border-stone-700 transition-colors text-start"
                                >
                                    <div className="flex items-center gap-3">
                                        <TableIcon size={20} className="text-stone-500" />
                                        <div>
                                            <p className="font-medium text-stone-700 dark:text-stone-200">{sheet.name}</p>
                                            <p className="text-xs text-stone-500">
                                                {sheet.rowCount} {t('rows') || 'rows'} • {sheet.headers.length} {t('columns') || 'columns'}
                                            </p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className={`text-stone-400 ${isRTL ? 'rotate-180' : ''}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Column Mapping Step */}
                    {step === 'mapping' && selectedSheet && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm text-stone-600 dark:text-stone-400">
                                    {t('map_columns_instruction') || 'Map each Excel column to a board column, or create new ones:'}
                                </p>
                                <span className="text-xs text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded">
                                    {selectedSheet.rowCount} {t('rows_to_import') || 'rows to import'}
                                </span>
                            </div>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                {columnMappings.map((mapping, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-800 rounded-lg"
                                    >
                                        {/* Excel Column */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-stone-500 mb-1">{t('excel_column') || 'Excel Column'}</div>
                                            <div className="flex items-center gap-2">
                                                <FileXls size={16} className="text-emerald-500 shrink-0" />
                                                <span className="text-sm font-medium text-stone-700 dark:text-stone-200 truncate">
                                                    {mapping.excelColumn}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ArrowRight size={18} className={`text-stone-400 shrink-0 ${isRTL ? 'rotate-180' : ''}`} />

                                        {/* Board Column Selection */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-stone-500 mb-1">{t('board_column') || 'Board Column'}</div>
                                            <select
                                                value={mapping.boardColumn || 'skip'}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    updateMapping(index, {
                                                        boardColumn: val === 'skip' ? null : val,
                                                        newColumnType: val === 'new' ? guessColumnType(mapping.excelColumn, selectedSheet.data.slice(0, 10).map(r => r[mapping.excelColumn])) : undefined
                                                    });
                                                }}
                                                className="w-full px-3 py-1.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            >
                                                <option value="skip">{t('skip_column') || '-- Skip --'}</option>
                                                <option value="new">{t('create_new_column') || '+ Create New Column'}</option>
                                                <optgroup label={t('existing_columns') || 'Existing Columns'}>
                                                    {availableColumns.map(col => (
                                                        <option key={col.id} value={col.id}>{col.label}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>

                                        {/* New Column Type Selection */}
                                        {mapping.boardColumn === 'new' && (
                                            <div className="w-32 shrink-0">
                                                <div className="text-xs text-stone-500 mb-1">{t('type') || 'Type'}</div>
                                                <select
                                                    value={mapping.newColumnType || 'text'}
                                                    onChange={(e) => updateMapping(index, { newColumnType: e.target.value })}
                                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                                >
                                                    {COLUMN_TYPES.map(type => (
                                                        <option key={type.id} value={type.id}>{type.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Preview Sample Data */}
                            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                                <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-2">
                                    {t('sample_data') || 'Sample Data Preview'}
                                </p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="bg-stone-100 dark:bg-stone-800">
                                                {selectedSheet.headers.slice(0, 5).map((header, i) => (
                                                    <th key={i} className="px-3 py-2 text-start font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap">
                                                        {header}
                                                    </th>
                                                ))}
                                                {selectedSheet.headers.length > 5 && (
                                                    <th className="px-3 py-2 text-stone-400">...</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedSheet.data.slice(0, 3).map((row, i) => (
                                                <tr key={i} className="border-b border-stone-100 dark:border-stone-800">
                                                    {selectedSheet.headers.slice(0, 5).map((header, j) => (
                                                        <td key={j} className="px-3 py-2 text-stone-700 dark:text-stone-300 whitespace-nowrap truncate max-w-[150px]">
                                                            {String(row[header] ?? '')}
                                                        </td>
                                                    ))}
                                                    {selectedSheet.headers.length > 5 && (
                                                        <td className="px-3 py-2 text-stone-400">...</td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <Warning size={20} className="text-red-500 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="text-sm text-stone-500">
                        {file && (
                            <span className="flex items-center gap-2">
                                <FileXls size={16} className="text-emerald-500" />
                                {file.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {step !== 'upload' && (
                            <button
                                onClick={() => {
                                    if (step === 'mapping') {
                                        setStep(sheets.length > 1 ? 'select_sheet' : 'upload');
                                    } else if (step === 'select_sheet') {
                                        setStep('upload');
                                    }
                                }}
                                className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                            >
                                {t('back') || 'Back'}
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                        >
                            {t('cancel') || 'Cancel'}
                        </button>
                        {step === 'mapping' && (
                            <button
                                onClick={handleImport}
                                disabled={!columnMappings.some(m => m.boardColumn !== null)}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Check size={16} />
                                {t('import_data') || 'Import Data'}
                                <span className="text-emerald-200">({selectedSheet?.rowCount} {t('rows') || 'rows'})</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};
