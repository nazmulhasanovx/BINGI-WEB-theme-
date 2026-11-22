# HRM simplified (22 Nov 2026): one HR (no Easy/Full), 6 tabs, Tools menu, one approvals inbox on Today,
# People chips, whole-row open, schedule tap-to-edit + copy last week, Department views from Users & roles.
# Every older function must still be reachable.
import re
from playwright.sync_api import sync_playwright
B="http://localhost:3100"; R=[]
def t(n, ok, d=""): R.append(ok); print(("PASS " if ok else "FAIL ")+n, "" if ok else d)
with sync_playwright() as p:
  b=p.chromium.launch()
  pg=b.new_page(viewport={"width":1280,"height":900}); errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
  pg.on("dialog", lambda d: d.accept())
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('hms-property','azure-bay'); localStorage.setItem('bingi-news-seen','all')")
  go=lambda path: (pg.goto(B+path), pg.wait_for_timeout(1500))
  go("/hms/staff")
  tabs=[x.strip() for x in pg.get_by_role("navigation",name="Team & HR").locator("a").all_inner_texts()]
  t("6 tabs", tabs==["Today","People","Attendance","Schedule","Leave","Payroll"], tabs)
  t("no Easy / Full switch", pg.get_by_role("radiogroup",name="Team & HR view").count()==0)
  # Tools menu
  for label, head in [("Hiring","Hiring"),("Team operations","Team Operations"),("Department views","Department"),("HR settings & reports","Settings")]:
    go("/hms/staff"); pg.get_by_role("button",name=re.compile("Tools")).click(); pg.wait_for_timeout(150)
    pg.get_by_role("menuitem",name=re.compile("^"+re.escape(label))).click(); pg.wait_for_timeout(1300)
    t(f"tools → {label}", head.lower() in pg.locator("main").inner_text().lower())
  # Today inbox
  go("/hms/staff")
  inbox=pg.get_by_role("list",name="Requests waiting")
  n0=pg.get_by_role("button",name=re.compile("^Approve ")).count()
  t("inbox lists leave + corrections + overtime + swaps", n0>=4 and all(k in pg.locator("main").inner_text() for k in ["Annual Leave","Attendance correction","Overtime"]), n0)
  if pg.get_by_role("button",name=re.compile("^Show all")).count(): pg.get_by_role("button",name=re.compile("^Show all")).click()
  total=pg.get_by_role("button",name=re.compile("^Approve ")).count()
  first=pg.get_by_role("button",name=re.compile("^Approve .*leave", re.I)).first
  lbl=first.get_attribute("aria-label"); first.click(); pg.wait_for_timeout(400)
  t("approve leave from Today", pg.get_by_role("button",name=lbl).count()==0 and pg.get_by_role("button",name=re.compile("^Approve ")).count()==total-1, lbl)
  rej=pg.get_by_role("button",name=re.compile("^Reject Attendance correction")).first
  rl=rej.get_attribute("aria-label"); rej.click(); pg.wait_for_timeout(400)
  t("reject correction from Today", pg.get_by_role("button",name=rl).count()==0)
  go("/hms/staff/leave")
  t("approved leave shows on Leave page", "Approved" in pg.locator("main").inner_text())
  go("/hms/staff/attendance"); pg.get_by_role("button",name=re.compile("^Corrections")).click(); pg.wait_for_timeout(300)
  t("rejected correction kept in the attendance log", "Rejected" in pg.locator("main").inner_text())
  go("/hms/staff/operations")
  t("Team operations: requests log", pg.get_by_role("button",name="Requests log").count()==1)
  # Add staff from Today
  go("/hms/staff"); pg.get_by_role("button",name=re.compile("Add staff")).first.click(); pg.wait_for_timeout(300)
  t("add staff drawer", pg.get_by_role("dialog",name="Add staff").count()==1); pg.keyboard.press("Escape")
  # People
  go("/hms/staff/people")
  pg.get_by_role("button",name=re.compile(r"^App invites")).click(); pg.wait_for_timeout(250)
  t("people: app invites chip shows invite actions", pg.get_by_role("button",name=re.compile("Send invitation|Resend")).count()>=1)
  pg.get_by_role("button",name=re.compile(r"^Joining & probation")).click(); pg.wait_for_timeout(250)
  t("people: joining & probation chip", pg.get_by_role("button",name="Confirm").count()>=1 or "Joining" in pg.locator("main").inner_text())
  pg.get_by_role("button",name=re.compile(r"^All \(")).click(); pg.wait_for_timeout(250)
  t("people: no Open buttons", pg.locator("main").get_by_role("link",name=re.compile("^Open$")).count()==0)
  pg.locator("main tbody tr").first.locator("td").nth(2).click(); pg.wait_for_timeout(1200)
  t("people: row opens profile", "/hms/staff/people/" in pg.url, pg.url)
  # Schedule
  go("/hms/staff/schedule")
  t("schedule: grouped by department", pg.locator("main tbody tr td[colspan='8']").count()>=3)
  t("schedule: no pencil buttons", pg.locator("main svg.lucide-pencil").count()==0)
  cell=pg.get_by_role("button",name=re.compile(r"^Edit ")).first; cl=cell.get_attribute("aria-label"); cell.click(); pg.wait_for_timeout(300)
  dlg=pg.get_by_role("dialog",name="Edit shift")
  t("schedule: tap a day opens shift editor", dlg.count()==1)
  dlg.get_by_role("button",name=re.compile("^Night")).click(); pg.wait_for_timeout(300)
  t("schedule: shift changed", pg.get_by_role("button",name=cl).inner_text().startswith("Night"))
  pg.get_by_role("button",name="Copy last week").click(); pg.wait_for_timeout(400)
  t("schedule: copy last week", "Copied from previous week" in pg.locator("body").inner_text())
  # Attendance + Payroll
  go("/hms/staff/attendance"); pg.get_by_role("button",name=re.compile("Mark attendance")).first.click(); pg.wait_for_timeout(300)
  t("attendance: mark drawer", pg.get_by_role("dialog",name="Mark attendance").count()==1); pg.keyboard.press("Escape")
  go("/hms/staff/payroll")
  t("payroll: sub-sections kept", all(pg.get_by_role("button",name=n).count()>=1 for n in ["Payroll runs","Salary structures"]))
  pg.locator("main tbody tr").first.locator("td").nth(2).click(); pg.wait_for_timeout(1200)
  t("payroll: row opens the pay line", "/hms/staff/payroll/" in pg.url, pg.url)
  # Department views from Settings
  go("/hms/settings/users"); pg.get_by_role("link",name=re.compile("Department views")).click(); pg.wait_for_timeout(1300)
  t("Users & roles → Department views", pg.url.endswith("/hms/staff/views"))
  # phone
  pg.set_viewport_size({"width":390,"height":844}); go("/hms/staff")
  ov=pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
  t("phone: no sideways scroll on Today", not ov)
  t("no page errors", not errs, errs[:2])
  b.close()
print("ALL PASS" if all(R) else f"FAILED {R.count(False)}")
