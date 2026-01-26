import { GridData, Sheet, SpreadsheetState } from './types';

// Extend columns to Z
export const COLS = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
export const NUM_ROWS = 100;
export const DEFAULT_COL_WIDTH = 100;
export const DEFAULT_ROW_HEIGHT = 28;
export const MIN_COL_WIDTH = 50;
export const MIN_ROW_HEIGHT = 20;

// Font options
export const FONT_FAMILIES = [
    'Inter',
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
];

export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

// Color presets for text and background
export const COLOR_PRESETS = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
];

// Empty initial data
export const INITIAL_DATA: GridData = {};

// Generate a unique ID
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Create a new empty sheet
export const createEmptySheet = (name: string = 'Sheet1'): Sheet => ({
    id: generateId(),
    name,
    data: {},
    columnWidths: {},
    rowHeights: {},
});

// Initial spreadsheet state
export const createInitialState = (): SpreadsheetState => {
    const sheet = createEmptySheet('Sheet1');
    return {
        title: 'Untitled Spreadsheet',
        sheets: [sheet],
        activeSheetId: sheet.id,
        selectedCell: { col: 'A', row: 1 },
        selectedRange: undefined,
        editingCell: null,
        clipboard: undefined,
    };
};

// Storage key for persistence
export const STORAGE_KEY = 'nabd-spreadsheet-data';
