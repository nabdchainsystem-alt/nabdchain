# ADR-004: Replace `new Function()` with Safe Arithmetic Parser

**Status:** Accepted (Implemented)

**Date:** 2025-11

## Context

The spreadsheet/formula feature in the board system used `new Function()` to evaluate user-entered formulas:

```typescript
// BEFORE (vulnerable)
const result = new Function('return ' + userInput)();
```

This is equivalent to `eval()` and allows **arbitrary JavaScript code execution** in the browser context. A malicious or accidental formula like `fetch('/api/delete-all')` or `document.cookie` would execute with full page privileges.

Security audit flagged this as a **critical vulnerability** (CWE-94: Improper Control of Generation of Code).

## Decision

Replace `new Function()` with the `expr-eval` library, which provides a **sandboxed expression parser** that only supports arithmetic and string operations. The implementation lives in `src/utils/safeEval.ts`.

### Implementation

```typescript
import { Parser } from 'expr-eval';

const parser = new Parser({
  operators: {
    add: true,
    subtract: true,
    multiply: true,
    divide: true,
    power: true,
    remainder: true,
    comparison: true,
    logical: true,
    conditional: true,
    concatenate: true,
    // Explicitly disabled:
    factorial: false,
    sin: false, cos: false, tan: false,
    asin: false, acos: false, atan: false,
    sqrt: false, log: false, ln: false,
    assignment: false,  // Prevents variable mutation
  },
});
```

Two functions are exported:

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| `safeEvalArithmetic(expr)` | `"2 + 3 * 4"` | `14` | Numeric formulas |
| `safeEvalFormula(expr)` | `"'hello' + ' world'"` | `"hello world"` | Mixed string/number formulas |

Both return `null` on any parse error, preventing exceptions from propagating.

### What is blocked

- Function calls (`fetch()`, `alert()`, `eval()`)
- Property access (`document.cookie`, `window.location`)
- Variable assignment (`x = 5`)
- Prototype pollution (`__proto__`, `constructor`)
- Any JavaScript syntax beyond arithmetic and string concatenation

## Consequences

### Positive

- **Eliminates arbitrary code execution** -- the parser has no access to the DOM, network, or JavaScript runtime.
- Formulas that worked before (`2+2`, `price * quantity`) continue to work identically.
- `null` return on invalid input provides graceful degradation instead of thrown errors.
- 12 unit tests in `src/utils/safeEval.test.ts` verify both valid and malicious inputs.

### Negative

- Advanced math functions (sin, cos, sqrt, log) are disabled. If needed in the future, they can be selectively enabled in the parser config without security risk.
- The `expr-eval` library adds ~15KB to the bundle (gzipped). This is acceptable for the security benefit.
- Formulas that relied on JavaScript-specific syntax (ternary with side effects, function calls) will no longer work. No such formulas existed in practice.

## Related Files

- `src/utils/safeEval.ts` -- safe evaluator implementation
- `src/utils/safeEval.test.ts` -- 12 unit tests
- `src/features/board/views/Table/components/pickers/FormulaPicker.tsx` -- primary consumer
- `src/features/tools/spreadsheets/formulaEngine.ts` -- spreadsheet formula engine
