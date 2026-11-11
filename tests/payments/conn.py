from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
num=lambda s: int(re.sub(r"[^\d]","",s) or 0)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/payments"); pg.wait_for_timeout(1500); pg.get_by_role("button",name="Today",exact=True).click()
  col0=num(pg.locator("p:text-is('Collected') + p").inner_text()); due0=num(pg.locator("p:text-is('Balance due') + p").inner_text())
  pg.goto(B+"/hms/cashbox"); pg.wait_for_timeout(1500); cb0=pg.inner_text("main")
  pg.goto(B+"/hms/payments?tab=collect"); pg.wait_for_timeout(1500)
  pg.get_by_role("link",name="Take payment").first.click(); pg.wait_for_timeout(1500)
  pg.locator("#pay-amt").fill("777"); (pg.get_by_role("radio",name="Cash").first.check() if pg.get_by_role("radio",name="Cash").count() else None)
  pg.get_by_role("button",name=re.compile("^Record payment")).click(); pg.wait_for_timeout(900)
  pg.goto(B+"/hms/payments"); pg.wait_for_timeout(1500); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300)
  col1=num(pg.locator("p:text-is('Collected') + p").inner_text()); due1=num(pg.locator("p:text-is('Balance due') + p").inner_text())
  t("collected +777", col1-col0==777); t("balance due −777", due0-due1==777); print(col0,col1,due0,due1)
  pg.goto(B+"/hms/cashbox/movements"); pg.wait_for_timeout(1500)
  t("cash shows in Cashbox movements", "777" in pg.inner_text("main"))
  # restaurant room-charged order not in payments: count restaurant rows equals paid non-room orders
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
