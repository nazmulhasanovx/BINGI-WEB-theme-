# Module audit 28 Nov 2026 — shared rules for every agent

Site: https://hms.bingi.app (testing server, owner said "test freely").
Account already logged in Chrome: owner Md Yeapas (user 75), property HTL-000001 Pan Pacific Sonargaon Dhaka.
API: https://api.bingi.app/api/*  headers: Authorization: Bearer <localStorage.token>, X-Branch-Id: <localStorage.active_branch_id>, Accept: application/json.
JS helper (paste at start of each javascript call; navigation wipes it):
  const T=localStorage.getItem('token').replace(/"/g,''),BR=(localStorage.getItem('active_branch_id')||'').replace(/"/g,'');
  const f=async(p,o={},ms=20000)=>{const ac=new AbortController();setTimeout(()=>ac.abort(),ms);try{const r=await fetch('https://api.bingi.app/api/'+p,{...o,signal:ac.signal,headers:{Authorization:'Bearer '+T,'X-Branch-Id':BR,Accept:'application/json','Content-Type':'application/json'}});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t}return {s:r.status,j}}catch(e){return {s:'timeout'}}};
  window.alert=()=>{};window.confirm=()=>true;   // avoid frozen tab
The JS tool blocks output containing query strings/cookies/base64 — return short strings/numbers only.

BROWSER
- Call tabs_context_mcp, then create YOUR OWN tab (tabs_create_mcp). Never use another agent's tab. Close your tab at the end.
- Other agents work at the same time in other tabs on the same property. Don't change shared settings (VAT, cashbox settings, room prices, plan) unless your brief says so; if you change one, put it back and note it.
- Before any click that may open a browser dialog, run the alert/confirm override above.

SAFETY (hard)
- Never type passwords, card numbers, real NID. Never click a real payment gateway / "Continue to secure payment". Never accept Terms. Never buy/upgrade a plan.
- Don't delete existing real-looking data. Create test data with names starting "QA28 " and list every record you create.
- Pricing / plans / Super Admin are OUT of scope.

WHAT TO CHECK per module
1. Function: every tab, button, form, filter, empty/loading/error state. Does it work? API status codes for failures.
2. Business logic: numbers add up inside the module AND against linked modules (e.g. booking paid vs payments vs cashbox vs finance vs reports). Status rules (booking status, payment status, room readiness, maintenance kept separate). Permission/role effects if visible.
3. UI/UX vs earlier approved design: compare with
   - prototype source: /home/claude/bingi-web-theme-/src/app/hms/<module>/ and src/components/<module>/ (approved redesign, prototype only)
   - previous live QA notes: /home/claude/wt/qa/docs/qa/Bugs_UI_UX_Problem/*.txt and /home/claude/wt/qa/docs/qa/BinGi_HMS_*_QA_2026-11-24.txt
   - latest retest: /home/claude/wt/qa/docs/qa/Bugs_UI_UX_Problem/retest/RETEST_2026-11-28_Operations.txt
   For each screen: MATCH / PARTLY / NO MATCH with the prototype, and which old issue is now fixed / still open.
4. Text quality: raw keys, English/Bangla mix, currency format (৳ / BDT / Tk.), decimals, dates, debug labels.
5. Layout at 1568 wide and at narrow width if you can (resize not required).

EVIDENCE: API endpoint + status + key numbers, or exact on-screen text. Never invent a number. If not tested, say NOT TESTED and why.

OUTPUT: write ONE markdown file /home/claude/wt/qa/docs/qa/Module_Audit_2026-11-28/<your file name>.md :
  # <Group> — module audit 28 Nov 2026
  ## Summary (5 lines: what works, worst problems, counts P0/P1/P2)
  ## <Module> (repeat per module)
     ### Screens & functions tested   (table: Screen/function | Result OK/BUG | Evidence)
     ### Business logic checks        (table: Check | Expected | Actual | Result)
     ### UI/UX vs approved design     (table: Screen | Prototype | Live | MATCH/PARTLY/NO)
     ### Old issues status            (ID | 24/25 Nov | 28 Nov)
     ### Bugs                         (ID <GROUP>-<MOD>-P0/P1/P2-nn | what | steps | expected | actual | fix idea)
  ## Test data created
  ## Not tested (why)
Severity: P0 = wrong money/stock/availability, data loss, blocked core flow. P1 = wrong number shown, broken secondary flow, misleading UI. P2 = cosmetic/text.
Write the file progressively (save after each module) so nothing is lost if you stop.
Work time budget: about 100 minutes. Then finish the file and close your tab.
Don't git commit; the lead merges.
