import { describe, it, expect } from 'vitest';
import { safeEvalArithmetic, safeEvalFormula } from './safeEval';

describe('safeEvalArithmetic', () => {
  it('evaluates basic arithmetic', () => {
    expect(safeEvalArithmetic('2 + 3')).toBe(5);
    expect(safeEvalArithmetic('10 - 4')).toBe(6);
    expect(safeEvalArithmetic('3 * 7')).toBe(21);
    expect(safeEvalArithmetic('20 / 4')).toBe(5);
  });

  it('handles parentheses', () => {
    expect(safeEvalArithmetic('(2 + 3) * 4')).toBe(20);
    expect(safeEvalArithmetic('10 / (2 + 3)')).toBe(2);
  });

  it('handles decimals', () => {
    expect(safeEvalArithmetic('1.5 + 2.5')).toBe(4);
    expect(safeEvalArithmetic('3.14 * 2')).toBeCloseTo(6.28);
  });

  it('returns null for empty input', () => {
    expect(safeEvalArithmetic('')).toBeNull();
    expect(safeEvalArithmetic('  ')).toBeNull();
  });

  it('returns null for invalid expressions', () => {
    expect(safeEvalArithmetic('abc')).toBeNull();
    expect(safeEvalArithmetic('2 +')).toBeNull();
  });

  it('does NOT allow arbitrary code execution', () => {
    expect(safeEvalArithmetic('process.exit(1)')).toBeNull();
    expect(safeEvalArithmetic('require("child_process")')).toBeNull();
    expect(safeEvalArithmetic('console.log("xss")')).toBeNull();
    expect(safeEvalArithmetic('alert(1)')).toBeNull();
  });

  it('handles negative numbers', () => {
    expect(safeEvalArithmetic('-5 + 3')).toBe(-2);
    expect(safeEvalArithmetic('-(2 + 3)')).toBe(-5);
  });

  it('handles chained operations', () => {
    expect(safeEvalArithmetic('1 + 2 + 3 + 4')).toBe(10);
    expect(safeEvalArithmetic('100 * 0.1 * 0.5')).toBeCloseTo(5);
  });
});

describe('safeEvalFormula', () => {
  it('evaluates numeric expressions', () => {
    expect(safeEvalFormula('2 + 3')).toBe(5);
    expect(safeEvalFormula('10 * 5')).toBe(50);
  });

  it('returns null for empty input', () => {
    expect(safeEvalFormula('')).toBeNull();
    expect(safeEvalFormula('   ')).toBeNull();
  });

  it('returns null for invalid expressions', () => {
    expect(safeEvalFormula('+++')).toBeNull();
  });

  it('blocks code injection attempts', () => {
    expect(safeEvalFormula('process.exit(1)')).toBeNull();
    expect(safeEvalFormula('(() => { while(true){} })()')).toBeNull();
    expect(safeEvalFormula('this.constructor.constructor("return process")()')).toBeNull();
  });
});
