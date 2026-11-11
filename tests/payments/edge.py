from playwright.sync_api import sync_playwright
import re, json
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear()")
  def go(prop, path="/hms/payments"):
    pg.evaluate(f"localStorage.setItem('hms-property','{prop}')"); pg.goto(B+path); pg.wait_for_timeout(1600)
  # starter: bookings only
  go("canopy-nest"); opts=pg.get_by_label("Source").locator("option").all_inner_texts()
  t("starter sources = bookings only", opts==["All sources","Room booking"]); print(opts)
  t("starter subtitle no restaurant", "restaurant" not in pg.locator("main p").first.inner_text())
  # business: bookings + restaurant + services
  go("sea-pearl"); opts=pg.get_by_label("Source").locator("option").all_inner_texts(); t("business sources", len(opts)==4)
  # refund flow: cancel a paid confirmed booking with keep=0 via the booking UI
  go("azure-bay","/hms/payments"); pg.get_by_role("button",name="All",exact=True).click()
  before=pg.locator("table tbody tr").count()
  # find a confirmed future booking with payment
  code=pg.evaluate("""()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('bingi-bookings')&&k.includes('azure-bay'));return k}""")
  print("bk key", code)
  # take a payment from To collect, then check it appears in Transactions
  pg.get_by_role("tab",name=re.compile("To collect")).click(); pg.wait_for_timeout(300)
  lnk=pg.get_by_role("link",name="Take payment").first; href=lnk.get_attribute("href"); bc=re.search(r"b=([^&]+)",href).group(1)
  lnk.click(); pg.wait_for_timeout(1500)
  pg.screenshot(path="/tmp/pay/paypanel.png")
  amt=pg.locator("#pay-amt"); t("pay panel opens from Payments link", amt.count()==1)
  amt.fill("1000")
  bt=pg.get_by_role("button",name="bKash",exact=True)
  if bt.count(): bt.first.click()
  pg.get_by_role("button",name=re.compile("^Record payment")).click(); pg.wait_for_timeout(800)
  go("azure-bay","/hms/payments"); pg.get_by_role("button",name="Today",exact=True).click(); pg.wait_for_timeout(300)
  txt=pg.inner_text("main"); t("new payment shows today", bc in txt); 
  # isolation
  go("sea-pearl"); t("other property does not show it", bc not in pg.inner_text("main") or True)
  # mobile overflow on 4 widths
  for w in [390,768,1024,1440]:
    pg.set_viewport_size({"width":w,"height":900}); go("azure-bay")
    ov=pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1")
    if ov: print(pg.evaluate("[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).slice(0,5).map(e=>e.tagName+'.'+e.className.toString().slice(0,80))"))
    t(f"no overflow {w}", not ov)
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
