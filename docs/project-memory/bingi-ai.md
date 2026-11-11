# BinGi AI

## Goal and status
- (9 Nov 2026) BinGi AI will manage the business across all BinGi software: auto-reply, inventory, HRM, everything. It must not be too complex.
- It must run both locally and on the cloud.
- It is built fully with Claude Code in the repo nazmulhasanovx/BINGI-AI-. Plans are in its `plan/` folder.
- Status: Coming Soon. Nothing is live in production.

## Working rules
- Keep developing and resume automatically when usage limits reset. He does not need per-task updates; he reviews when a version is fully complete.
- Every version: build → test → fix → only then move to the next version.
- Keep working without stopping. Tell him only when a version is 100% ready, and test everything thoroughly.
- He tests every version on his Mac and on the Claude server, so there must be an easy way to test (a browser test page).
- The UI should look like Claude's UI, with BinGi branding.

## Ideas
- Staff upload a photo of an inventory list or memo, and the items are added to Inventory.
- The 10 suggested AI ideas were approved for the plan (repo `plan/10_Ideas_Backlog.md`).

## Hardware
- Mac: M1 MacBook Air, 8 GB RAM, 256 GB. Should run with a local model (Ollama).
- (11 Nov 2026) Windows PC: Ryzen 5 5600G, 16 GB RAM, 256 GB NVMe, no graphics card.
