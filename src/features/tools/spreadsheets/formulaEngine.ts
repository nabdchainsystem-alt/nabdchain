import { GridData } from './types';
import { COLS } from './constants';
import { safeEvalArithmetic } from '@/utils/safeEval';

// Parse cell reference like "A1" into { col: 'A', row: 1 }
export const parseCellRef = (ref: string): { col: string; row: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return { col: match[1].toUpperCase(), row: parseInt(match[2], 10) };
};

// Parse range like "A1:B5" into array of cell references
export const parseRange = (range: string): string[] => {
  const parts = range.split(':');
  if (parts.length !== 2) return [];

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);
  if (!start || !end) return [];

  const cells: string[] = [];
  const startColIndex = COLS.indexOf(start.col);
  const endColIndex = COLS.indexOf(end.col);

  if (startColIndex === -1 || endColIndex === -1) return [];

  const minCol = Math.min(startColIndex, endColIndex);
  const maxCol = Math.max(startColIndex, endColIndex);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  for (let colIndex = minCol; colIndex <= maxCol; colIndex++) {
    for (let row = minRow; row <= maxRow; row++) {
      cells.push(`${COLS[colIndex]}${row}`);
    }
  }

  return cells;
};

// Get numeric values from cells (properly evaluates formulas)
const getNumericValues = (refs: string[], data: GridData, visited: Set<string> = new Set()): number[] => {
  const values: number[] = [];
  for (const ref of refs) {
    const normalizedRef = ref.toUpperCase();
    const val = getCellValue(normalizedRef, data, new Set(visited)); // Use fresh visited set for each cell
    if (typeof val === 'number') {
      values.push(val);
    } else if (typeof val === 'string' && !val.startsWith('#')) {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        values.push(num);
      }
    }
  }
  return values;
};

// Get cell value (recursively evaluates formulas)
export const getCellValue = (cellId: string, data: GridData, visited: Set<string> = new Set()): number | string => {
  // Prevent circular references
  if (visited.has(cellId)) {
    return '#CIRCULAR!';
  }

  // Normalize cell ID to uppercase
  const normalizedId = cellId.toUpperCase();
  const cell = data[normalizedId];

  if (!cell) return 0; // Return 0 for empty cells (better for arithmetic)

  if (cell.formula) {
    visited.add(normalizedId);
    const result = evaluateFormula(cell.formula, data, visited);
    visited.delete(normalizedId);
    return result;
  }

  // Return the actual value - if it's a number, return number; if string, return string
  const val = cell.value;
  if (val === '' || val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;

  // Try to parse as number
  const num = parseFloat(String(val));
  return isNaN(num) ? val : num;
};

// Built-in formula functions
const formulaFunctions: Record<string, (args: string[], data: GridData, visited: Set<string>) => number | string> = {
  SUM: (args, data, visited) => {
    let sum = 0;
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        const values = getNumericValues(cells, data, visited);
        sum += values.reduce((a, b) => a + b, 0);
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (!isNaN(num)) sum += num;
      }
    }
    return sum;
  },

  AVERAGE: (args, data, visited) => {
    let sum = 0;
    let count = 0;
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        const values = getNumericValues(cells, data, visited);
        sum += values.reduce((a, b) => a + b, 0);
        count += values.length;
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (!isNaN(num)) {
          sum += num;
          count++;
        }
      }
    }
    return count > 0 ? sum / count : 0;
  },

  COUNT: (args, data, visited) => {
    let count = 0;
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        const values = getNumericValues(cells, data, visited);
        count += values.length;
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        if (typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val)) && !val.startsWith('#'))) {
          count++;
        }
      }
    }
    return count;
  },

  COUNTA: (args, data, visited) => {
    let count = 0;
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        for (const cellId of cells) {
          const val = getCellValue(cellId.toUpperCase(), data, visited);
          if (val !== 0 && val !== '' && val !== null && val !== undefined) {
            count++;
          }
        }
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        if (val !== 0 && val !== '' && val !== null && val !== undefined) {
          count++;
        }
      }
    }
    return count;
  },

  MIN: (args, data, visited) => {
    const values: number[] = [];
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        values.push(...getNumericValues(cells, data, visited));
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (!isNaN(num)) values.push(num);
      }
    }
    return values.length > 0 ? Math.min(...values) : 0;
  },

  MAX: (args, data, visited) => {
    const values: number[] = [];
    for (const arg of args) {
      if (arg.includes(':')) {
        const cells = parseRange(arg);
        values.push(...getNumericValues(cells, data, visited));
      } else {
        const val = getCellValue(arg.toUpperCase(), data, visited);
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (!isNaN(num)) values.push(num);
      }
    }
    return values.length > 0 ? Math.max(...values) : 0;
  },

  IF: (args, data, visited) => {
    if (args.length < 2) return '#ERROR!';

    // Evaluate condition
    let condition = false;
    const condArg = args[0].trim();

    // Simple comparison parsing
    const comparisons = ['>=', '<=', '<>', '!=', '=', '>', '<'];
    let foundComparison = false;

    for (const op of comparisons) {
      if (condArg.includes(op)) {
        const [left, right] = condArg.split(op).map((s) => s.trim());
        const leftVal = parseCellRef(left)
          ? getCellValue(left, data, visited)
          : isNaN(Number(left))
            ? left
            : Number(left);
        const rightVal = parseCellRef(right)
          ? getCellValue(right, data, visited)
          : isNaN(Number(right))
            ? right
            : Number(right);

        switch (op) {
          case '>=':
            condition = Number(leftVal) >= Number(rightVal);
            break;
          case '<=':
            condition = Number(leftVal) <= Number(rightVal);
            break;
          case '<>':
          case '!=':
            condition = leftVal !== rightVal;
            break;
          case '=':
            condition = leftVal === rightVal;
            break;
          case '>':
            condition = Number(leftVal) > Number(rightVal);
            break;
          case '<':
            condition = Number(leftVal) < Number(rightVal);
            break;
        }
        foundComparison = true;
        break;
      }
    }

    if (!foundComparison) {
      const val = parseCellRef(condArg) ? getCellValue(condArg, data, visited) : condArg;
      condition = Boolean(val);
    }

    const trueVal = args[1]
      ? parseCellRef(args[1].trim())
        ? getCellValue(args[1].trim(), data, visited)
        : args[1].trim()
      : '';
    const falseVal = args[2]
      ? parseCellRef(args[2].trim())
        ? getCellValue(args[2].trim(), data, visited)
        : args[2].trim()
      : '';

    return condition ? trueVal : falseVal;
  },

  CONCAT: (args, data, visited) => {
    return args
      .map((arg) => {
        if (parseCellRef(arg.trim())) {
          return String(getCellValue(arg.trim(), data, visited));
        }
        return arg.replace(/^"(.*)"$/, '$1');
      })
      .join('');
  },

  ABS: (args, data, visited) => {
    if (args.length === 0) return '#ERROR!';
    const val = parseCellRef(args[0].trim()) ? getCellValue(args[0].trim(), data, visited) : Number(args[0]);
    return Math.abs(Number(val));
  },

  ROUND: (args, data, visited) => {
    if (args.length === 0) return '#ERROR!';
    const val = parseCellRef(args[0].trim()) ? getCellValue(args[0].trim(), data, visited) : Number(args[0]);
    const decimals = args[1] ? Number(args[1]) : 0;
    const factor = Math.pow(10, decimals);
    return Math.round(Number(val) * factor) / factor;
  },

  UPPER: (args, data, visited) => {
    if (args.length === 0) return '';
    const val = parseCellRef(args[0].trim())
      ? getCellValue(args[0].trim(), data, visited)
      : args[0].replace(/^"(.*)"$/, '$1');
    return String(val).toUpperCase();
  },

  LOWER: (args, data, visited) => {
    if (args.length === 0) return '';
    const val = parseCellRef(args[0].trim())
      ? getCellValue(args[0].trim(), data, visited)
      : args[0].replace(/^"(.*)"$/, '$1');
    return String(val).toLowerCase();
  },

  LEN: (args, data, visited) => {
    if (args.length === 0) return 0;
    const val = parseCellRef(args[0].trim())
      ? getCellValue(args[0].trim(), data, visited)
      : args[0].replace(/^"(.*)"$/, '$1');
    return String(val).length;
  },

  NOW: () => {
    const now = new Date();
    return now.toLocaleString();
  },

  TODAY: () => {
    return new Date().toLocaleDateString();
  },

  PI: () => Math.PI,

  SQRT: (args, data, visited) => {
    if (args.length === 0) return '#ERROR!';
    const val = parseCellRef(args[0].trim()) ? getCellValue(args[0].trim(), data, visited) : Number(args[0]);
    const num = Number(val);
    return num < 0 ? '#NUM!' : Math.sqrt(num);
  },

  POWER: (args, data, visited) => {
    if (args.length < 2) return '#ERROR!';
    const base = parseCellRef(args[0].trim()) ? Number(getCellValue(args[0].trim(), data, visited)) : Number(args[0]);
    const exp = parseCellRef(args[1].trim()) ? Number(getCellValue(args[1].trim(), data, visited)) : Number(args[1]);
    return Math.pow(base, exp);
  },
};

// Parse formula arguments (handle nested functions and quoted strings)
const parseArguments = (argsString: string): string[] => {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;

  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];

    if (char === '"' && argsString[i - 1] !== '\\') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      depth++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
};

// Main formula evaluation function
export const evaluateFormula = (formula: string, data: GridData, visited: Set<string> = new Set()): number | string => {
  if (!formula.startsWith('=')) return formula;

  const expression = formula.slice(1).trim();

  if (!expression) return '';

  // Check for function call (e.g., SUM(A1:A5), AVERAGE(A1,A2,A3))
  const funcMatch = expression.match(/^([A-Z]+)\((.*)\)$/i);
  if (funcMatch) {
    const funcName = funcMatch[1].toUpperCase();
    const argsString = funcMatch[2];
    const args = parseArguments(argsString);

    const func = formulaFunctions[funcName];
    if (func) {
      try {
        return func(args, data, visited);
      } catch {
        return '#ERROR!';
      }
    }
    return '#NAME?';
  }

  // Check for simple cell reference (e.g., =A1)
  const cellRef = parseCellRef(expression);
  if (cellRef) {
    return getCellValue(expression.toUpperCase(), data, visited);
  }

  // Try to evaluate as arithmetic expression (e.g., =A1+A2, =A1*2+B1)
  try {
    // First, replace all cell references with their numeric values
    let evalExpr = expression;
    let hasError = false;

    // Match cell references like A1, B2, AA123, etc.
    evalExpr = evalExpr.replace(/\b([A-Z]+)(\d+)\b/gi, (match) => {
      const val = getCellValue(match.toUpperCase(), data, visited);

      // If the value is an error string, mark it
      if (typeof val === 'string' && val.startsWith('#')) {
        hasError = true;
        return '0'; // Placeholder to not break regex
      }

      // Convert to number
      if (typeof val === 'number') {
        // Handle negative numbers properly
        return val < 0 ? `(${val})` : String(val);
      }

      // Try to parse string as number
      const num = parseFloat(String(val));
      if (isNaN(num)) {
        hasError = true;
        return '0';
      }
      return num < 0 ? `(${num})` : String(num);
    });

    if (hasError) {
      return '#VALUE!';
    }

    // Safety check - only allow numbers, operators, parentheses, whitespace, and decimal points
    // Also allow 'e' for scientific notation
    if (!/^[\d\s+\-*/().eE]+$/.test(evalExpr)) {
      return '#VALUE!';
    }

    // Additional safety: check for empty or invalid expressions
    if (!evalExpr.trim() || evalExpr.trim() === '') {
      return 0;
    }

    // Use safe expression parser (no arbitrary code execution)
    const result = safeEvalArithmetic(evalExpr);

    if (result === null) {
      return '#NUM!';
    }

    if (!isFinite(result)) {
      return '#DIV/0!';
    }

    // Round to avoid floating point precision issues
    return Math.round(result * 1000000000000) / 1000000000000;
  } catch (_e) {
    return '#ERROR!';
  }
};

// Format number for display
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

// Format as currency
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency,
  });
};

// Format as percentage
export const formatPercentage = (value: number, decimals: number = 0): string => {
  return (value * 100).toFixed(decimals) + '%';
};
