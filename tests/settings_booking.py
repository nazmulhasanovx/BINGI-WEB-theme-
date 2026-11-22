# Settings › How guests book (22 Nov 2026): live "Booking Requests" for website + marketplace; website follows it.
from playwright.sync_api import sync_playwright
import re, os
os.makedirs("/tmp/bkc", exist_ok=True)
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch()
  for W in [1440, 390]:
    pg=b.new_page(viewport={"width":W,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','sea-pearl')")
    pg.goto(B+"/hms/settings/booking"); pg.wait_for_timeout(1500)
    for x in pg.locator("[data-news-popup]").get_by_role("button",name="Later").all(): x.click()
    m=pg.locator("main")
    t(f"[{W}] 3 choices + 2 channels", all(m.get_by_role("region", name=n).count()==1 for n in ["Full payment","Advance payment","Booking request"]) and m.get_by_role("tab").count()==2)
    t(f"[{W}] default from old policy: advance on", m.get_by_role("switch", name="Advance payment on website").get_attribute("aria-checked")=="true")
    pg.screenshot(path=f"/tmp/bkc/{W}-1.png", full_page=True)
    # website: only booking request
    for n,v in [("Booking request","true"),("Full payment","false")]:
      sw=m.get_by_role("switch", name=f"{n} on website")
      if sw.get_attribute("aria-checked")!=v: sw.click()
    adv=m.get_by_role("switch", name="Advance payment on website")
    if adv.get_attribute("aria-checked")=="true": adv.click()
    t(f"[{W}] preview shows request only", "Request to book" in m.get_by_role("list", name="Guest checkout preview").inner_text() and "now" not in m.get_by_role("list", name="Guest checkout preview").inner_text())
    m.get_by_role("switch", name="Booking request on website").click(); pg.wait_for_timeout(100)
    t(f"[{W}] at least one stays on", "At least one choice must stay on" in m.inner_text())
    # marketplace separate
    m.get_by_role("tab", name="BinGi Marketplace").click(); pg.wait_for_timeout(100)
    t(f"[{W}] marketplace same as website by default", m.get_by_role("switch", name="Marketplace same as website").get_attribute("aria-checked")=="true")
    m.get_by_role("switch", name="Marketplace same as website").click()
    m.get_by_role("switch", name="Full payment on marketplace").click(); pg.wait_for_timeout(100)
    t(f"[{W}] marketplace set apart", m.get_by_role("switch", name="Full payment on marketplace").get_attribute("aria-checked")=="true")
    pg.screenshot(path=f"/tmp/bkc/{W}-2.png", full_page=True)
    pg.get_by_role("button", name="Save", exact=True).click(); pg.wait_for_timeout(400)
    # website follows
    pg.goto(B+"/hotel/sea-pearl/policies"); pg.wait_for_timeout(1800)
    txt=pg.inner_text("main")
    acc=re.search(r"Accepted:[^\n]*", txt)
    t(f"[{W}] website policies: booking request only ({acc and acc.group(0)})", acc is not None and "Booking request" in acc.group(0) and "advance" not in acc.group(0))
    pg.goto(B+"/hms/website/booking"); pg.wait_for_timeout(1500)
    t(f"[{W}] Website Management points to Settings", pg.get_by_role("link", name="Change in Settings").count()==1)
    t(f"[{W}] no sideways scroll", pg.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
    t(f"[{W}] no page errors", not errs); errs and print(errs[:2])
    pg.close()
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
