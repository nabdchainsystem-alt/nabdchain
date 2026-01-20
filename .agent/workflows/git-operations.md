---
description: Git operations policy - manual push only
---

# Git Operations Policy

## Rules

1. **NEVER** automatically run `git push` commands
2. **NEVER** set `SafeToAutoRun: true` for any `git push` command
3. Git commit operations are allowed but should be proposed to the user first
4. All push operations must be done manually by the user

## Allowed Operations (with user approval)
- `git add`
- `git commit`
- `git status`
- `git log`
- `git diff`
- `git branch`
- `git checkout`
- `git stash`

## Forbidden Operations (must be manual)
- `git push` - User must run this manually
- `git push --force` - User must run this manually
- Any remote operations that modify the remote repository
