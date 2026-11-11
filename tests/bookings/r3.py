import json
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  for slug in ["sea-pearl","mistwood","tea-valley","wave-bunk"]:
    pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(slug+str(e)[:150]))
    pg.goto(B+"/hms"); pg.evaluate(f"localStorage.clear(); localStorage.setItem('hms-property', {json.dumps(slug)})")
    for r in ["/hms/bookings","/hms/bookings/calendar","/hms/bookings/list","/hms/bookings/new","/hms/bookings/view?b=BK-2401","/hms/bookings/board","/hms/bookings/reports","/hms/bookings/close","/hms/bookings/waitlist","/hms/bookings/settings","/hms/bookings/walkin","/hms/housekeeping"]:
      pg.goto(B+r); pg.wait_for_timeout(1400)
      t=pg.locator("main").inner_text()
      print(slug, r, "| loading" if "Loading" in t else "", "| overflow" if pg.evaluate("document.documentElement.scrollWidth-innerWidth")>0 else "", t.replace("\n"," ")[:160])
    pg.goto(B+"/hms/bookings/calendar"); pg.wait_for_timeout(1300); pg.screenshot(path=f"/tmp/bk/r3_{slug}_cal.png")
    pg.close()
  for w,h in [(2560,1440),(1024,768),(768,1024)]:
    q=b.new_page(viewport={"width":w,"height":h}); q.goto(B+"/hms"); q.evaluate("localStorage.clear()")
    for r in ["/hms/bookings","/hms/bookings/calendar","/hms/bookings/new","/hms/bookings/view?b=BK-2402","/hms/bookings/board","/hms/bookings/reports","/hms/housekeeping"]:
      q.goto(B+r); q.wait_for_timeout(1300); q.screenshot(path=f"/tmp/bk/r3_{w}{r.replace('/','_')}.png")
      if q.evaluate("document.documentElement.scrollWidth-innerWidth")>0: print("OVERFLOW",w,r)
      q.add_script_tag(content=AXE); v=q.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length))")
      if v: print("AXE",w,r,v)
  print("errs",errs)
