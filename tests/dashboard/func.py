from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms"); pg.wait_for_timeout(2000); pg.screenshot(path="/tmp/db/ultra.png", full_page=True)
  pri=pg.locator("section[aria-labelledby=pri] ul").inner_text(); print(pri)
  t("priorities from modules", "to collect from today" in pri and "unread guest message" in pri)
  t("no hardcoded 48/14", "48" not in pg.locator("main").inner_text().split("Team & inventory")[-1][:200])
  links=[pg.locator("section[aria-labelledby=pri] ul a").nth(i).get_attribute("href") for i in range(pg.locator("section[aria-labelledby=pri] ul a").count())]
  ok=True
  for l in links:
    pg.goto(B+l); pg.wait_for_timeout(900)
    if "404" in pg.title() or "could not be found" in pg.inner_text("body"): ok=False; print("bad",l)
  t("every priority link opens", ok)
  # meals badge real
  pg.goto(B+"/hms"); pg.wait_for_timeout(1500)
  mb=pg.locator("nav a[href='/hms/meals'] span[aria-label$='waiting']"); t("meals badge real count", mb.count()==0 or mb.first.inner_text().isdigit())
  # chat read → priority line updates
  pg.evaluate("localStorage.setItem('hms-property','canopy-nest')"); pg.goto(B+"/hms"); pg.wait_for_timeout(1800); pg.screenshot(path="/tmp/db/starter.png", full_page=True)
  pri=pg.locator("section[aria-labelledby=pri] ul").inner_text(); t("starter: no QR / expenses lines", "QR order" not in pri and "expense" not in pri.lower())
  t("starter: no meals badge", pg.locator("nav a[href='/hms/meals'] span[aria-label$='waiting']").count()==0)
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
