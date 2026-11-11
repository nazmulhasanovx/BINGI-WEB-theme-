import re, json
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
ok=0;n=0;fails=[]
def t(m,c):
  global ok,n; n+=1; ok+=bool(c); print(("PASS " if c else "FAIL ")+m, flush=True)
  if not c: fails.append(m)
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
def axe(pg,label):
  pg.add_script_tag(content=AXE)
  r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length+':'+v.nodes[0].target))")
  t(f"axe {label} {r}", not r)
W=lambda i,name,phone,st,ps,dn,ref:{"id":i,"createdAt":"2026-11-10T09:00:00Z","stay":{"roomSlug":"premier-ocean-view","plan":"breakfast","checkIn":"2026-11-14","checkOut":"2026-11-16","adults":2,"children":0},"extras":[],"quote":{"nights":2,"lines":[],"roomTotal":18000,"extrasTotal":0,"discount":0,"subtotal":18000,"serviceCharge":1800,"vat":2970,"total":22770},"guest":{"name":name,"phone":phone,"request":"Late arrival"},"payment":{"method":"advance","dueNow":dn,"reference":ref,"provider":"bKash"},"bookingStatus":st,"paymentStatus":ps}
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)[:200]))
  M=lambda: pg.locator("main").inner_text()
  ST=lambda: pg.get_by_role("status").inner_text() if pg.get_by_role("status").count() else ""
  pg.goto(B+"/hms/bookings"); pg.evaluate("localStorage.clear()")
  st={"cart":{"stay":None,"extras":[]},"bookings":[W("WBK-2026-111111","Web Guest A","01755000111","pending","advance-submitted",6831,"TX99881"),W("WBK-2026-222222","Web Guest B","01755000222","pending","pay-at-hotel",0,None)],"session":None}
  pg.evaluate("s=>localStorage.setItem('bingi-grand:azure-bay', s)", json.dumps(st)); pg.reload(); pg.wait_for_timeout(1500)
  R=pg.get_by_role("region",name="Website requests")
  t("website requests shown", R.count()==1 and "2 new from your website" in R.inner_text())
  axe(pg,"today with web requests")
  R.get_by_role("button",name="Decline").nth(1).click(); pg.wait_for_timeout(300)
  t("declined one", "1 new from your website" in pg.get_by_role("region",name="Website requests").inner_text())
  R=pg.get_by_role("region",name="Website requests")
  R.get_by_role("checkbox").check(); R.get_by_role("button",name="Accept").click(); pg.wait_for_timeout(1500)
  t(f"accepted → booking page ({ST()})", "/hms/bookings/view" in pg.url and "Website" in M() and "WBK-2026-111111" in M())
  pg.get_by_role("tab",name="Bill & payments").click(); pg.wait_for_timeout(300)
  t("advance recorded", "৳6,831" in M())
  gs=json.loads(pg.evaluate("localStorage.getItem('bingi-grand:azure-bay')"))
  bs={x["id"]:x for x in gs["bookings"]}
  t("guest side updated", bs["WBK-2026-111111"]["bookingStatus"]=="confirmed" and bs["WBK-2026-111111"].get("hmsCode","").startswith("BK-") and bs["WBK-2026-222222"]["bookingStatus"]=="cancelled")
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1000)
  t("inbox empty after", pg.get_by_role("region",name="Website requests").count()==0)
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
