import re
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
ok=0;n=0;fails=[]
def t(m,c):
  global ok,n; n+=1; ok+=bool(c); print(("PASS " if c else "FAIL ")+m, flush=True)
  if not c: fails.append(m)
def axe(pg,label):
  pg.add_script_tag(content=AXE)
  r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length+':'+v.nodes[0].target))")
  t(f"axe {label} {r}", not r)
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)[:200]))
  M=lambda: pg.locator("main").inner_text()
  pg.goto(B+"/hms/bookings"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1800)
  t("needs attention strip", "Needs attention" in M())
  nav=pg.get_by_role("navigation",name="Bookings views"); nav.locator("summary").click(); nav.get_by_role("link",name="Booking reports").click(); pg.wait_for_timeout(1300)
  t("reports page", "/hms/bookings/reports" in pg.url and all(x in M() for x in ["Occupancy","ADR","RevPAR","Where bookings come from","By room type"]))
  occ=re.search(r"Occupancy\n+(\d+)%",M()); t(f"occupancy number {occ and occ.group(1)}", occ and 0<=int(occ.group(1))<=100)
  t("source mix has OTA", "Booking.com" in M() or "Agoda" in M() or "Expedia" in M())
  bars=pg.get_by_role("listitem").filter(has_text="")
  t("7 night bars", pg.get_by_role("list",name="Occupancy by night").get_by_role("listitem").count()==7)
  axe(pg,"reports")
  pg.get_by_role("radio",name="Next 30 days").click(); pg.wait_for_timeout(300)
  t("30 bars", pg.get_by_role("list",name="Occupancy by night").get_by_role("listitem").count()==30)
  pg.get_by_role("radio",name="This month").click(); pg.wait_for_timeout(300)
  t("month bars 30", pg.get_by_role("list",name="Occupancy by night").get_by_role("listitem").count()==30)
  # math cross-check ADR*sold == revenue approx
  txt=M(); s=re.search(r"(\d+) of (\d+) room-nights",txt); adr=int(re.search(r"ADR\n+৳([\d,]+)",txt).group(1).replace(",","")); rev=int(re.search(r"Room revenue\n+৳([\d,]+)",txt).group(1).replace(",",""))
  t(f"ADR×nights≈revenue ({adr}×{s.group(1)} vs {rev})", abs(adr*int(s.group(1))-rev)<=int(s.group(1)))
  # mobile
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/bookings/reports"); m.wait_for_timeout(1500)
  t("mobile no horizontal overflow", m.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
  for path in ["/hms/bookings","/hms/bookings/board","/hms/bookings/waitlist","/hms/bookings/close","/hms/settings/policies","/hms/housekeeping","/hms/bookings/walkin"]:
    m.goto(B+path); m.wait_for_timeout(1200)
    t(f"mobile ok {path}", m.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
