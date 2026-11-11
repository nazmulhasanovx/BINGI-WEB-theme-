from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
num=lambda s: int(re.sub(r"[^\d]","",s) or 0)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}, accept_downloads=True)
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/payments"); pg.wait_for_timeout(1800)
  main=pg.inner_text("main")
  t("page title", "Payments" in main and "Every payment and refund" in main)
  for k in ["Collected","Refunded","Net received","Balance due","Net received by day","By method"]: t("kpi "+k, k in main)
  rows=pg.locator("table tbody tr"); n30=rows.count(); t("30-day rows > 0", n30>0)
  srcs=set(pg.locator("table tbody tr td:nth-child(4)").all_inner_texts()); print(srcs)
  t("rooms + restaurant + services rows (ultra)", {"Room booking","Restaurant & Bar","Other services"} <= srcs)
  pg.get_by_role("button",name="All",exact=True).click(); pg.wait_for_timeout(300); nall=rows.count()
  pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300); ntd=rows.count() if pg.locator("table").count() else 0
  t("period filter narrows", nall>=n30>=ntd); print(nall,n30,ntd)
  pg.get_by_role("button",name="All",exact=True).click(); pg.wait_for_timeout(300)
  pg.get_by_label("Source").select_option("restaurant"); pg.wait_for_timeout(300)
  t("source filter", set(pg.locator("table tbody tr td:nth-child(4)").all_inner_texts())=={"Restaurant & Bar"})
  pg.get_by_label("Source").select_option(""); pg.get_by_label("Method").select_option("Cash"); pg.wait_for_timeout(300)
  t("method filter", set(pg.locator("table tbody tr td:nth-child(5)").all_inner_texts())=={"Cash"})
  pg.get_by_role("button",name="Clear").click(); pg.get_by_placeholder("Booking, guest, reference").fill("zzzz"); pg.wait_for_timeout(300)
  t("empty state", "No payments match" in pg.inner_text("main"))
  pg.get_by_role("button",name="Clear").click(); pg.wait_for_timeout(300)
  # detail sheet
  pg.locator("table tbody tr").first.click(); pg.wait_for_timeout(500)
  d=pg.get_by_role("dialog"); t("detail opens", d.count()==1 and "Gateway / reference" in d.inner_text())
  pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
  # export
  with pg.expect_download() as dl: pg.get_by_role("button",name="Export").click()
  path=dl.value.path(); txt=open(path).read(); t("csv export has header+rows", txt.startswith('"Payment ID"') and txt.count("\n")>=1)
  # no double count: room-charged restaurant bills absent
  t("no 'Charged to room' rows", "Charged to room" not in pg.inner_text("main"))
  # To collect
  pg.get_by_role("tab",name=re.compile("To collect")).click(); pg.wait_for_timeout(400)
  tc=pg.get_by_role("link",name="Take payment"); t("to-collect list", tc.count()>0)
  due_kpi=num(pg.locator("p:text-is('Balance due') + p").inner_text())
  owed=sum(num(x) for x in pg.locator("ul li b.text-hms-red").all_inner_texts()); t("balance due = sum of list", due_kpi==owed); print(due_kpi,owed)
  href=tc.first.get_attribute("href"); t("take payment opens booking pay", "do=pay" in href)
  code=re.search(r"b=([^&]+)",href).group(1)
  # pay it in full in booking, come back
  tc.first.click(); pg.wait_for_timeout(1500)
  t("booking pay panel open", "Payment" in pg.inner_text("main") or "payment" in pg.inner_text("main"))
  pg.screenshot(path="/tmp/pay/booking_pay.png")
  pg.goto(B+"/hms/payments"); pg.wait_for_timeout(1500); pg.screenshot(path="/tmp/pay/desk.png", full_page=True)
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/payments"); m.wait_for_timeout(1500); m.screenshot(path="/tmp/pay/m.png", full_page=True)
  b.close()
  print("errors", errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
