# Sidebar — Expandable mode (fix 28 Nov 2026)

Status: prototype. Flat = groups + main modules (unchanged). Expandable = same groups and modules, and each main module opens to show its own sub-pages (the module's tabs). The active module opens by itself; the chevron opens/closes any module.

Sub-pages follow plan + role (src/components/hms/Shell.tsx SUBS + useSubs):
- f = plan feature (e.g. Room board = Business, Full HR pages = Ultra). Missing: hidden, or shown with a lock to Owner/Manager on Business/Ultra (same rule as modules).
- edit = only roles that can change the module (setup, menu, catalog, settings pages).
- boss = Owner, Manager, Accountant only (reports, day close, payroll, settings like taxes, users & roles).

Screens: n_all.png (Ultra: owner, front desk, housekeeping, owner in Restaurant, kitchen), b_all.png (Business owner: HR pages locked, Inventory locked). Backend must apply the same rule.
