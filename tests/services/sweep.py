import re
from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100/hms/other-services"; P=["","/catalog","/orders","/reports","/setup"]; bad=0; n=0
def axe(pg, sel="main"):
  pg.add_script_tag(content=AXE)
  return pg.evaluate(f"async()=>{{const r=await axe.run(document.querySelector('{sel}'),{{resultTypes:['violations']}});return r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))}}")
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,768,1024,1440):
    pg=b.new_page(viewport={"width":w,"height":900}); pg.goto(B); pg.evaluate("localStorage.clear()")
    for x in P:
      pg.goto(B+x); pg.wait_for_timeout(1100); n+=1
      ov=pg.evaluate("document.documentElement.scrollWidth-innerWidth"); v=axe(pg)
      if ov>0 or v: bad+=1; print(w,x,"ov",ov,v)
    pg.goto(B); pg.wait_for_timeout(900); pg.get_by_role("radio",name="Timeline").click(); pg.wait_for_timeout(300); n+=1
    v=axe(pg); ov=pg.evaluate("document.documentElement.scrollWidth-innerWidth")
    if v or ov>0: bad+=1; print(w,"timeline",ov,v)
    if w in (390,1440):
      steps=[(B,"New Service Order"),(B,"Assign OSO-1044"),(B+"/catalog","Edit Airport Transfer"),(B+"/orders","View Details")]
      for url,name in steps:
        pg.goto(url); pg.wait_for_timeout(900)
        if "Edit" in name: pg.goto(B+"/setup"); pg.wait_for_timeout(600); pg.get_by_role("radio",name="Manager").click(); pg.goto(url); pg.wait_for_timeout(800)
        pg.get_by_role("button",name=name).first.click(); pg.wait_for_timeout(500); n+=1
        v=axe(pg,"[role=dialog]")
        if v: bad+=1; print(w,"sheet",name,v)
        pg.screenshot(path=f"/tmp/os2/sh-{name.replace(' ','_')}-{w}.png"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.close()
  print("checked",n,"bad",bad)
