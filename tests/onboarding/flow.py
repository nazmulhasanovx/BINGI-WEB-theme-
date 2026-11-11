# Owner onboarding v7.4 (round 1, 12 Nov): full walk with checks, desktop + phone, English + Bangla.
from playwright.sync_api import sync_playwright
import re, json, sys
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
def walk(b, W, en=True):
  pg=b.new_page(viewport={"width":W,"height":900 if W>500 else 844}); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); pg.on("dialog",lambda d:d.accept())
  T=lambda bn,eng: eng if en else bn
  NXT=re.compile(T("পরের ধাপ|পরের|এগিয়ে","^(Next|Continue)"))
  def nx():
    try: pg.get_by_role("button",name=NXT).last.click(timeout=8000)
    except Exception: pg.screenshot(path=f"/tmp/ob/fail-{W}.png"); print("NEXT not found at", h1(), [x for x in pg.get_by_role("button").all_inner_texts() if x.strip()][-8:]); raise
    pg.wait_for_timeout(420)
  def h1(): return pg.locator("h1").first.inner_text() if pg.locator("h1").count() else "?"
  def alert(): a=pg.locator("main [role=alert]"); return a.first.inner_text() if a.count() else ""
  def ov(): return pg.evaluate("document.documentElement.scrollWidth>innerWidth+1")
  pg.goto(B+"/onboarding"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1200)
  if en: pg.get_by_role("button",name="EN",exact=True).click()
  tag=f"[{W} {'EN' if en else 'BN'}] "
  pg.locator("#ph").fill("12345"); pg.get_by_role("button",name=re.compile("Send code|কোড পাঠান")).click(); t(tag+"bad phone blocked", pg.locator("#otp").count()==0)
  pg.locator("#ph").fill("01712345678"); pg.get_by_role("button",name=re.compile("Send code|কোড পাঠান")).click(); pg.wait_for_timeout(300)
  pg.locator("#otp").fill("123456"); pg.get_by_role("button",name=re.compile("Verify|যাচাই")).click(); pg.wait_for_timeout(600)
  pg.get_by_role("button",name=re.compile("Add a new property|নতুন")).first.click(); pg.wait_for_timeout(1000)
  nx(); t(tag+"type required", h1()==T("কী ধরনের property চালান?","What kind of property do you run?") or "type" in alert().lower() or "ধরন" in alert())
  pg.get_by_role("radio").first.click(); nx()
  nx(); t(tag+"name required", bool(alert()))
  pg.locator("input").first.fill("Hill View Hotel"); nx()
  nx(); t(tag+"address required", bool(alert()))
  t(tag+"address typed inline (no map needed)", pg.locator("#ad-road").count()==1 and pg.locator("#ad-city").count()==1)
  pg.locator("#ad-road").fill("Zindabazar Road"); pg.locator("#ad-city").fill("Sylhet"); nx()
  t(tag+"address saved", any(d.get("city")=="Sylhet" for d in json.loads(pg.evaluate("localStorage.getItem('bingi-onb-v1')") or '{"drafts":[]}')["drafts"]))
  nx(); nx(); nx()  # extras, what you rent, where
  pg.get_by_role("button",name=re.compile("Add your first room type|প্রথম")).click(); pg.wait_for_timeout(300)
  pg.locator("main button").filter(has_text=re.compile("^\\s*(Deluxe|ডিলাক্স)\\s*$")).first.click(); nx()
  pg.locator("#price").fill("4500"); nx()
  pg.get_by_role("button",name=re.compile("View rooms|রুম দেখুন")).first.click(); pg.get_by_role("button",name=re.compile(r"\+(5|৫)")).click(); pg.get_by_role("button",name=re.compile("^(Done|ঠিক আছে)$")).click(); pg.wait_for_timeout(200); nx()
  pg.get_by_role("button",name=re.compile(r"\(\d+|\([০-৯]+")).last.click(); pg.wait_for_timeout(400)
  t(tag+"room type saved (5 rooms)", re.search(r"(5 rooms|৫টা রুম|৫ টা রুম|৫টি রুম)", pg.locator("body").inner_text()) is not None)
  nx()
  t(tag+"Moderate cancellation preselected", pg.get_by_role("radio",name=re.compile("Moderate|মাঝারি")).get_attribute("aria-checked")=="true")
  nx(); nx(); nx()  # booking, tools, team
  t(tag+"BinGi Payments 'later' preselected", pg.get_by_role("radio",name=re.compile("Set up later|পরে")).first.get_attribute("aria-checked")=="true")
  nx(); nx()  # payments, website
  rec=pg.locator("[role=radio]").filter(has_text=re.compile("Best fit|আপনার জন্য"))
  t(tag+"best-fit plan preselected", rec.count()==1 and rec.first.get_attribute("aria-checked")=="true")
  t(tag+"regular price struck", pg.locator("main s").count()>=2)
  t(tag+"no sideways scroll", not ov())
  nx(); nx()  # plan, documents
  pg.get_by_role("button",name=re.compile("Submit|জমা")).last.click(); pg.wait_for_timeout(600)
  t(tag+"submitted", re.search("Setup submitted|জমা হয়েছে|সেটআপ জমা", pg.locator("body").inner_text()) is not None)
  t(tag+"no page errors", not errs); print(errs[:2])
  pg.close()
with sync_playwright() as p:
  b=p.chromium.launch()
  walk(b,1440,True); walk(b,390,True); walk(b,1440,False)
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
