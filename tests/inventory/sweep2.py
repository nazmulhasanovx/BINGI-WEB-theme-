import re
from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100"; P=["","/purchase","/count","/recipes","/history","/reports","/setup"]; bad=0; n=0
def axe(pg, sel="main"):
  pg.add_script_tag(content=AXE)
  return pg.evaluate(f"async()=>{{const r=await axe.run(document.querySelector('{sel}'),{{resultTypes:['violations']}});return r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))}}")
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,768,1024,1440):
    pg=b.new_page(viewport={"width":w,"height":900}); pg.goto(B+"/hms/inventory"); pg.evaluate("localStorage.clear()")
    for x in P:
      pg.goto(B+"/hms/inventory"+x); pg.wait_for_timeout(1100); n+=1
      ov=pg.evaluate("document.documentElement.scrollWidth-innerWidth"); v=axe(pg)
      if ov>0 or v: bad+=1; print(w,x,"ov",ov,v)
    if w in (390,1440):
      pg.goto(B+"/hms/inventory"); pg.wait_for_timeout(900)
      sheets=[("Transfer",None),("Receive",None),("Add Item",None)]
      for name,_ in sheets:
        pg.get_by_role("button",name=name,exact=True).first.click(); pg.wait_for_timeout(500); n+=1
        v=axe(pg,"[role=dialog]")
        if v: bad+=1; print(w,"sheet",name,v)
        pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
      pg.goto(B+"/hms/inventory/purchase"); pg.wait_for_timeout(900)
      for name in ["New order","PO-1001","PO-1002"]:
        pg.get_by_role("button",name=name).first.click(); pg.wait_for_timeout(500); n+=1
        v=axe(pg,"[role=dialog]"); 
        if v: bad+=1; print(w,"sheet",name,v)
        pg.screenshot(path=f"/tmp/iv/sh-{name}-{w}.png"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
      pg.goto(B+"/hms/inventory/recipes"); pg.wait_for_timeout(900)
      for name in ["Record sales","Add recipe"]:
        pg.get_by_role("button",name=name).first.click(); pg.wait_for_timeout(500); n+=1
        v=axe(pg,"[role=dialog]")
        if v: bad+=1; print(w,"sheet",name,v)
        pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
      pg.goto(B+"/hms/inventory/count"); pg.wait_for_timeout(900); pg.get_by_role("button",name="Start count").click(); pg.wait_for_timeout(600); n+=1
      ov=pg.evaluate("document.documentElement.scrollWidth-innerWidth"); v=axe(pg)
      if ov>0 or v: bad+=1; print(w,"count session",ov,v)
      pg.screenshot(path=f"/tmp/iv/count-{w}.png", full_page=True)
    pg.close()
  print("checked",n,"bad",bad)
