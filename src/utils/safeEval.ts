import { Parser } from 'expr-eval';

const parser = new Parser({
  operators: {
    add: true,
    concatenate: true,
    conditional: true,
    divide: true,
    factorial: false,
    logical: true,
    comparison: true,
    multiply: true,
    power: true,
    remainder: true,
    subtract: true,
    sin: false,
    cos: false,
    tan: false,
    asin: false,
    acos: false,
    atan: false,
    sqrt: false,
    log: false,
    ln: false,
    assignment: false,
  },
});

/**
 * Safely evaluate a pure arithmetic expression (numbers + operators only).
 * Returns the numeric result or null on failure.
 */
export function safeEvalArithmetic(expr: string): number | null {
  try {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    const result = parser.evaluate(trimmed);
    if (typeof result !== 'number' || isNaN(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Safely evaluate a formula that may contain strings and numbers.
 * Supports arithmetic, string concatenation via +, and quoted string literals.
 * Returns the result or null on failure.
 */
export function safeEvalFormula(expr: string): string | number | null {
  try {
    const trimmed = expr.trim();
    if (!trimmed) return null;
    const result = parser.evaluate(trimmed);
    if (result === undefined || result === null) return null;
    if (typeof result === 'number' && isNaN(result)) return null;
    return result;
  } catch {
    return null;
  }
}
