# Settings › My preferences (appearance): 7 fonts (BinGi, Apple SF, Google Sans Flex, Roboto, Inter, Plus Jakarta, device),
# each applied to text + headings and really loaded; Bangla stays Hind Siliguri; theme previews keep their font; persists;
# text size, reduce motion, sidebar style; no overflow on phone; axe.
from playwright.sync_api import sync_playwright
import json
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
FIRST={"bingi":"Instrument Sans Variable","apple":"-apple-system","google":"Google Sans Flex Variable","roboto":"Roboto Variable","inter":"Inter Variable","jakarta":"Plus Jakarta Sans Variable","system":"system-ui"}
HEAD={"bingi":"Bricolage Grotesque Variable","apple":"-apple-system","google":"Google Sans Flex Variable","roboto":"Roboto Variable","inter":"Inter Variable","jakarta":"Plus Jakarta Sans Variable","system":"system-ui"}
NAME={"bingi":"BinGi","apple":"Apple (SF Pro)","google":"Google Sans Flex","roboto":"Roboto","inter":"Inter","jakarta":"Plus Jakarta Sans","system":"Device default"}
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/settings/preferences"); pg.wait_for_timeout(1500)
  for x in pg.locator("[data-news-popup]").get_by_role("button",name="Later").all(): x.click()
  rg=pg.get_by_role("radiogroup", name="Font")
  t("7 font choices", rg.get_by_role("radio").count()==7)
  t("BinGi is default", rg.get_by_role("radio", name="BinGi").get_attribute("aria-checked")=="true")
  ff=lambda sel: pg.evaluate(f"getComputedStyle(document.querySelector({json.dumps(sel)})).fontFamily")
  for fid in FIRST:
    rg.get_by_role("radio", name=NAME[fid]).click(); pg.wait_for_timeout(250)
    pg.evaluate("document.fonts.ready")
    body=ff("main p"); h1=ff("main h1"); nav=ff("nav[aria-label=HMS] a")
    ok=FIRST[fid] in body and HEAD[fid] in h1 and FIRST[fid] in nav
    t(f"{fid}: text, heading and sidebar use it", ok)
    if fid not in ("apple","system"):
      loaded=pg.evaluate(f"""(async()=>{{await document.fonts.load('600 16px "{FIRST[fid]}"'); return document.fonts.check('600 16px "{FIRST[fid]}"') && [...document.fonts].some(f=>f.family.replace(/"/g,'')==='{FIRST[fid]}' && f.status==='loaded')}})()""")
      t(f"{fid}: font file really loaded", loaded)
    t(f"{fid}: Bangla falls back to Hind Siliguri", "Hind Siliguri" in body)
    pg.screenshot(path=f"/tmp/ap/font_{fid}.png")
  hind=pg.evaluate("""(async()=>{await document.fonts.load('16px "Hind Siliguri"', 'অতিথি'); return [...document.fonts].some(f=>f.family.replace(/"/g,'')==='Hind Siliguri' && f.status==='loaded')})()""")
  t("Hind Siliguri loaded for Bangla", hind)
  # sample cards each show their own font
  t("each card previews its own font", all(FIRST[k] in pg.evaluate(f"getComputedStyle(document.querySelector('[data-sample={k}]')).fontFamily") for k in FIRST))
  # persist + other pages
  rg.get_by_role("radio", name="Google Sans Flex").click(); pg.wait_for_timeout(200)
  pg.reload(); pg.wait_for_timeout(1200)
  t("kept after reload", pg.get_by_role("radiogroup", name="Font").get_by_role("radio", name="Google Sans Flex").get_attribute("aria-checked")=="true")
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1200)
  t("applies on Bookings", "Google Sans Flex" in ff("main h1") and "Google Sans Flex" in ff("main table td"))
  pg.screenshot(path="/tmp/ap/bookings_google.png")
  # theme preview keeps its own font
  pg.goto(B+"/hms/website/overview"); pg.wait_for_timeout(1500)
  th=pg.evaluate("(()=>{const r=document.querySelector('#hotel-theme'); if(!r) return 'none'; const h=r.querySelector('h1,h2'); return getComputedStyle(r).fontFamily+' | '+(h?getComputedStyle(h).fontFamily:'')})()")
  t("website theme preview keeps its font", th=="none" or "Google Sans Flex" not in th)
  # text size
  pg.goto(B+"/hms/settings/preferences"); pg.wait_for_timeout(1000)
  for lab,z in [("Large","1.1"),("Larger","1.2"),("Small","0.9"),("Normal","")]:
    pg.get_by_role("button", name=lab, exact=True).click(); pg.wait_for_timeout(200)
    zz=pg.evaluate("document.querySelector('main').style.zoom")
    t(f"text size {lab}", zz==z)
  # reduce motion
  pg.get_by_role("switch", name="Reduce motion").click(); pg.wait_for_timeout(200)
  t("reduce motion on whole app", pg.evaluate("document.querySelector('.hms-app').classList.contains('hms-no-motion')"))
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(800)
  dur=pg.evaluate("getComputedStyle(document.querySelector('.hms-page-in')||document.querySelector('main *')).animationDuration")
  t("animations off", dur in ("1e-05s","0.00001s","0s"))
  pg.goto(B+"/hms/settings/preferences"); pg.wait_for_timeout(800)
  pg.get_by_role("switch", name="Reduce motion").click()
  # sidebar style
  pg.get_by_role("button", name="Fold groups").click(); pg.wait_for_timeout(300)
  t("sidebar folds groups", pg.locator("nav[aria-label=HMS] button[aria-expanded]").count()>0)
  pg.get_by_role("button", name="Show all").click(); pg.wait_for_timeout(300)
  t("sidebar shows all", pg.locator("nav[aria-label=HMS] button[aria-expanded]").count()==0)
  t("no page errors", not errs)
  # phone: widest fonts, no sideways scroll
  m=b.new_page(viewport={"width":390,"height":844})
  m.goto(B+"/hms"); m.evaluate("localStorage.setItem('hms-property','azure-bay')")
  for fid in ["google","roboto","apple","jakarta"]:
    m.evaluate(f"localStorage.setItem('bingi.hms.prefs', JSON.stringify({{zoom:100,reduceMotion:false,font:'{fid}'}}))")
    bad=[]
    for path in ["/hms","/hms/bookings","/hms/settings/preferences","/hms/staff/views","/hms/settings/billing"]:
      m.goto(B+path); m.wait_for_timeout(900)
      if m.evaluate("document.documentElement.scrollWidth>innerWidth+1"): bad.append(path)
    t(f"phone {fid}: no sideways scroll", not bad)
  m.screenshot(path="/tmp/ap/phone_jakarta.png")
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
