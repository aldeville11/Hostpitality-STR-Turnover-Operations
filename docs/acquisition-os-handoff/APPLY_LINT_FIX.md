# Apply ESLint preserve-caught-error fix

## PowerShell (in acquisition-os folder)

```powershell
cd $HOME\Desktop\Hostpitality-STR-Turnover-Operations\acquisition-os

git checkout main
git pull origin main

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/aldeville11/Hostpitality-STR-Turnover-Operations/main/docs/acquisition-os-handoff/aos-lint-fix.patch" -OutFile lint-fix.patch

git apply lint-fix.patch
git add apps/api/src/platform/sql-store.ts
git commit -m "fix(api): attach error cause for preserve-caught-error lint"
git push origin main
```

Then Dependabot PR CI should pass after rebase, or merge this to main and close/rebuild the Dependabot PR.
