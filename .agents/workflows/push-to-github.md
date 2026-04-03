---
description: push all changes to github after every edit or fix
---

After completing **every code edit or bug fix**, run the following steps in order using `run_command` in the project root (`c:\Users\david\OneDrive\Desktop\School\Mobile and Web Architecture and Design\Course Project`).

## Steps

1. Stage all changes:
```powershell
git add -A
```

2. Commit with a descriptive message that summarises what was changed. Use conventional commit prefixes:
- `fix:` for bug fixes
- `feat:` for new features or UI additions  
- `refactor:` for code restructuring
- `chore:` for config/dependency changes

Example:
```powershell
git commit -m "fix: correct route ordering in dispatch vehicles.js to prevent /available shadowing"
```

3. Push to main:
```powershell
git push origin main
```

## Notes
- Run all three as separate `run_command` calls (PowerShell does not support `&&` as a statement separator).
- If `git status --short` shows no staged files, the file may have already been committed — skip to push.
- Always check for a non-zero exit code before proceeding to the next step.
- Do NOT auto-run `git push` — always prompt the user to approve before pushing.
