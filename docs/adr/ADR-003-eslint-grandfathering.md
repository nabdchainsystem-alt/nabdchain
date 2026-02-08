# ADR-003: ESLint Grandfathering Strategy for `no-explicit-any`

**Status:** Accepted (Implemented)

**Date:** 2025-12

## Context

The codebase had **476 existing `@typescript-eslint/no-explicit-any` violations** when the rule was first enabled as a warning. Fixing all of them at once was infeasible:

- Many `any` types exist at module boundaries (third-party library callbacks, Express middleware, Clerk auth objects) where the correct type is non-trivial to determine.
- Bulk type changes risk introducing runtime regressions -- replacing `any` with a wrong type can cause TypeScript to silently accept incorrect code.
- The `@types/react` package cannot be installed in this codebase (it causes 55,000+ TypeScript errors due to version conflicts), so some React patterns inherently require `any` annotations.
- The team wanted CI to enforce **zero ESLint warnings** (`--max-warnings 0`) to prevent new violations from accumulating.

## Decision

Keep `@typescript-eslint/no-explicit-any` set to `"warn"` globally, and **grandfather existing violations** using targeted ESLint disable comments:

### Rules

1. **Files with 5+ violations:** Add a single file-level disable at the top:
   ```typescript
   /* eslint-disable @typescript-eslint/no-explicit-any */
   ```

2. **Files with fewer than 5 violations:** Use per-line disables:
   ```typescript
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   const handler = (req: any, res: Response) => { ... };
   ```

3. **JSX files:** Use JSX comment syntax for inline disables:
   ```tsx
   {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
   ```
   Or use file-level disables when inline comments are impractical.

4. **New code:** Must not introduce `any` without justification. The CI pipeline enforces `pnpm lint --max-warnings 0`, so any un-suppressed warning fails the build.

### Other grandfathered rules

The same strategy was applied to:
- `no-console` -- existing `console.log` calls were migrated to `logger.ts`, remaining edge cases were suppressed.
- `@typescript-eslint/no-unused-vars` -- prefixed with `_` where possible, or suppressed with `eslint-disable` comments.

## Consequences

### Positive

- **CI enforces zero warnings** on every pull request. New `any` usage is caught immediately.
- The rule is active for all new code, gradually improving type safety.
- No risky bulk refactoring -- existing code continues to work as-is.
- Developers can remove disable comments incrementally as they work on files.

### Negative

- 476 disable comments add visual noise to the codebase.
- File-level disables mask all `any` usage in that file, including new violations. A developer adding a new `any` in a file-level-disabled file will not be warned.
- The true count of `any` usage is hidden from ESLint reporting.

### Mitigations

- Periodic audits: search for `eslint-disable.*no-explicit-any` to track the count over time.
- When a file is substantially refactored, remove the file-level disable and fix remaining violations.
- Destructured variables from typed contexts cannot be prefixed with `_` (the type does not have `_t`), so `eslint-disable` comments are used instead.

## Related Files

- `eslint.config.js` -- ESLint 9 flat config with rule definitions
- `.github/workflows/ci.yml` -- CI pipeline with `--max-warnings 0`
