# Apply Acquisition OS repository hardening

This handoff package was prepared because Cloud Agents on Hostpitality cannot push to `aldeville11/acquisition-os`.

## Option A — Git patch (recommended)

On your PC, in your **acquisition-os** clone:

```powershell
cd $HOME\Desktop\acquisition-os
# if your clone is still nested under Hostpitality:
# cd $HOME\Desktop\Hostpitality-STR-Turnover-Operations\acquisition-os

git checkout main
git pull origin main

# Download the patch from Hostpitality (after this PR merges), or copy from this folder:
# https://raw.githubusercontent.com/aldeville11/Hostpitality-STR-Turnover-Operations/main/docs/acquisition-os-handoff/acquisition-os-hardening.patch

Invoke-WebRequest -Uri "https://raw.githubusercontent.com/aldeville11/Hostpitality-STR-Turnover-Operations/main/docs/acquisition-os-handoff/acquisition-os-hardening.patch" -OutFile hardening.patch
git apply hardening.patch
git add -A
git commit -m "chore: repository hardening for standalone Acquisition OS"
git push origin main
```

## Option B — Bundle

```powershell
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/aldeville11/Hostpitality-STR-Turnover-Operations/main/docs/acquisition-os-handoff/acquisition-os-hardening.bundle" -OutFile hardening.bundle
git fetch hardening.bundle cursor/repo-hardening-74ae:cursor/repo-hardening-74ae
git checkout cursor/repo-hardening-74ae
git push -u origin cursor/repo-hardening-74ae
# open PR on acquisition-os, or merge to main locally:
git checkout main
git merge cursor/repo-hardening-74ae
git push origin main
```

## After push

1. Confirm Actions run: https://github.com/aldeville11/acquisition-os/actions  
2. Apply branch protection: see hardening doc `docs/ops/BRANCH_PROTECTION.md` in the Acquisition OS repo  
3. Do **not** start Sprint 3 until CI green + branch protection + plan approval
