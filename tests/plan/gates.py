from playwright.sync_api import sync_playwright
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear()")
  def at(prop, path):
    pg.evaluate(f"localStorage.setItem('hms-property','{prop}')"); pg.goto(B+path); pg.wait_for_timeout(1300); return pg.inner_text("main")
  for path,word in [("/hms/housekeeping","Housekeeping is part of Business"),("/hms/meals","Restaurant & Bar is part of Business"),("/hms/meals/pos","Restaurant & Bar is part of Business"),("/hms/meals/kitchen","Restaurant & Bar is part of Business"),("/hms/other-services","part of Business"),("/hms/inventory","Inventory is part of Ultra")]:
    t(f"starter gated {path}", word in at("canopy-nest",path))
  t("starter link goes to billing", pg.locator("a[href='/hms/billing']").count()>0)
  for path in ["/hms/housekeeping","/hms/meals","/hms/other-services"]:
    t(f"business open {path}", "is part of" not in at("sea-pearl",path))
  t("business inventory gated", "Inventory is part of Ultra" in at("sea-pearl","/hms/inventory"))
  t("ultra inventory open", "is part of" not in at("azure-bay","/hms/inventory"))
  t("ultra meals open", "is part of" not in at("azure-bay","/hms/meals"))
  t("no page errors", not errs) ; print(errs[:3])
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
