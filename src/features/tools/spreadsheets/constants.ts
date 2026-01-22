import { GridData } from './types';

export const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
export const NUM_ROWS = 30;

// Initial data mocking the "Financial Report" from the prompt
export const INITIAL_DATA: GridData = {
    // Header
    'C1': { value: 'Financial Report', style: { bold: true, color: 'text-gray-900' } },

    // Table Headers
    'C2': { value: 'Item Name', style: { bold: true, bg: 'bg-gray-100', borderBottom: true } },
    'D2': { value: 'Price', style: { bold: true, align: 'right', bg: 'bg-gray-100', borderBottom: true } },
    'E2': { value: 'Quantity', style: { bold: true, align: 'right', bg: 'bg-gray-100', borderBottom: true } },
    'F2': { value: 'Total', style: { bold: true, align: 'right', bg: 'bg-gray-100', borderBottom: true } },
    'G2': { value: 'In Stock', style: { bold: true, align: 'center', bg: 'bg-gray-100', borderBottom: true } },
    'H2': { value: 'Category', style: { bold: true, bg: 'bg-gray-100', borderBottom: true } },

    // Row 3
    'C3': { value: 'Ergonomic Office Chair' },
    'D3': { value: 150.00, displayValue: '$150.00', style: { align: 'right' } },
    'E3': { value: 5, style: { align: 'right' } },
    'F3': { value: 750.00, displayValue: '$750.00', style: { align: 'right' } },
    'G3': { value: 'Yes', style: { align: 'center', color: 'text-green-600' } },
    'H3': { value: 'Furniture' },

    // Row 4
    'C4': { value: 'Wireless Mouse' },
    'D4': { value: 25.99, displayValue: '$25.99', style: { align: 'right' } },
    'E4': { value: 12, style: { align: 'right' } },
    'F4': { value: 311.88, displayValue: '$311.88', style: { align: 'right' } },
    'G4': { value: 'Yes', style: { align: 'center', color: 'text-green-600' } },
    'H4': { value: 'Electronics' },

    // Row 5
    'C5': { value: 'USB-C Hub' },
    'D5': { value: 45.00, displayValue: '$45.00', style: { align: 'right' } },
    'E5': { value: 3, style: { align: 'right' } },
    'F5': { value: 135.00, displayValue: '$135.00', style: { align: 'right' } },
    'G5': { value: 'Low', style: { align: 'center', color: 'text-red-600' } },
    'H5': { value: 'Electronics' },

    // Row 6
    'C6': { value: 'Mechanical Keyboard' },
    'D6': { value: 120.00, displayValue: '$120.00', style: { align: 'right' } },
    'E6': { value: 8, style: { align: 'right' } },
    'F6': { value: 960.00, displayValue: '$960.00', style: { align: 'right' } },
    'G6': { value: 'Yes', style: { align: 'center', color: 'text-green-600' } },
    'H6': { value: 'Electronics' },

    // Row 7
    'C7': { value: 'Monitor Stand' },
    'D7': { value: 29.50, displayValue: '$29.50', style: { align: 'right' } },
    'E7': { value: 15, style: { align: 'right' } },
    'F7': { value: 442.50, displayValue: '$442.50', style: { align: 'right' } },
    'G7': { value: 'Yes', style: { align: 'center', color: 'text-green-600' } },
    'H7': { value: 'Accessories' },

    // Row 8 (Totals)
    'C8': { value: 'Grand Total', style: { bold: true, bg: 'bg-gray-50' } },
    'D8': { value: '', style: { bg: 'bg-gray-50' } },
    'E8': { value: 43, style: { bold: true, align: 'right', bg: 'bg-gray-50' } },
    'F8': { value: 2599.38, displayValue: '$2,599.38', style: { bold: true, align: 'right', bg: 'bg-gray-50' } },
    'G8': { value: '', style: { bg: 'bg-gray-50' } },
    'H8': { value: '', style: { bg: 'bg-gray-50' } },
};
