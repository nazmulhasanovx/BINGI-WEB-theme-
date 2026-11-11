from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
num=lambda s: int(re.sub(r"[^\d]","",s) or 0)*(-1 if "−" in s or s.strip().startswith("-") else 1)
IDS=["daily","register","profit","occupancy","bookings","guests","payments","expenses","restaurant","services","inventory","staff"]
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}, accept_downloads=True)
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  for rid in IDS:
    pg.goto(B+f"/hms/reports?r={rid}"); pg.wait_for_timeout(1300)
    nav=pg.locator("nav[aria-label=Reports] button[aria-current=page]")
    t(f"{rid} opens", nav.count()==1 and len(pg.locator("main section").all())>=1)
  pg.goto(B+"/hms/reports?r=daily"); pg.wait_for_timeout(1300); pg.screenshot(path="/tmp/rep/daily.png", full_page=True)
  k=lambda l: num(pg.locator(f"p:text-is('{l}') + p").first.inner_text())
  gross=k("Gross sales"); parts=k("Room sales")+k("Food & drink sales")+k("Service sales"); t("gross = rooms+food+services", abs(gross-parts)<=3); print(gross,parts)
  col=k("Collections"); rf=k("Refunds"); ex=k("Expenses paid"); net=k("Net cash"); t("net cash", net==col-rf-ex); print(col,rf,ex,net)
  # cross-check with Payments page (This month = same as payments? payments uses 30 days) -> use 30 days on both
  pg.get_by_role("button",name="Last 30 days").click(); pg.wait_for_timeout(500); col30=k("Collections")
  pg.goto(B+"/hms/payments"); pg.wait_for_timeout(1500); pcol=num(pg.locator("p:text-is('Collected') + p").inner_text())
  t("collections match Payments (30 days)", col30==pcol); print(col30,pcol)
  # profit matches expenses spent
  pg.goto(B+"/hms/reports?r=expenses"); pg.wait_for_timeout(1300); paid=k("Paid out")
  pg.goto(B+"/hms/operations"); pg.wait_for_timeout(1500); spent=num(pg.locator("p:text-is('Spent') + p").inner_text())
  t("expenses report (this month) = Expenses › Spent", paid==spent); print(paid,spent)
  # sort + csv + custom range validation
  pg.goto(B+"/hms/reports?r=register"); pg.wait_for_timeout(1300)
  pg.locator("th button", has_text="Amount").first.click(); pg.wait_for_timeout(300)
  vals=[num(x) for x in pg.locator("main table tbody tr td:last-child").all_inner_texts()[:10]]
  t("sort desc by amount", vals==sorted(vals,reverse=True))
  with pg.expect_download() as d: pg.get_by_role("button",name=re.compile("Download .* CSV")).first.click()
  t("csv", open(d.value.path()).read().startswith('"Date"'))
  with pg.expect_download() as d: pg.get_by_role("button",name="Excel").click()
  t("excel file", d.value.suggested_filename.endswith(".xls") and "<table>" in open(d.value.path()).read())
  pg.get_by_role("button",name="Custom").click(); pg.locator("#rf").fill("2026-11-09"); pg.locator("#rt").fill("2026-11-01"); pg.wait_for_timeout(300)
  t("custom range validation", "Pick a start date" in pg.inner_text("main"))
  # plan filtering
  pg.evaluate("localStorage.setItem('hms-property','canopy-nest')"); pg.goto(B+"/hms/reports"); pg.wait_for_timeout(1300)
  labels=pg.locator("nav[aria-label=Reports] button").all_inner_texts(); print(labels)
  t("starter: no restaurant/services/inventory/staff/expenses", not any(x in labels for x in ["Restaurant & Bar","Other services","Inventory","Staff cost","Expenses"]))
  t("starter daily has no food KPI", "Food & drink sales" not in pg.inner_text("main"))
  pg.goto(B+"/hms/reports?r=staff"); pg.wait_for_timeout(1000); t("gated report falls back to daily", pg.locator("nav[aria-label=Reports] button[aria-current=page]").inner_text()=="Daily sales")
  pg.goto(B+"/hms/bookings/reports"); pg.wait_for_timeout(1300); t("bookings reports links to full reports", pg.get_by_role("link",name="All reports").count()==1)
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/reports?r=occupancy"); m.wait_for_timeout(1500); m.screenshot(path="/tmp/rep/m.png", full_page=True)
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
