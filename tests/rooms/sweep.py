from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100/hms/rooms"; bad=0; n=0; errs=[]
def axe(pg, sel="main"):
  pg.add_script_tag(content=AXE)
  return pg.evaluate(f"async()=>{{const r=await axe.run(document.querySelector('{sel}'),{{resultTypes:['violations']}});return r.violations.filter(v=>['serious','critical'].includes(v.impact)).map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))}}")
def chk(pg,tag,w,sel="main"):
  global bad,n
  n+=1; ov=pg.evaluate("document.documentElement.scrollWidth-innerWidth"); v=axe(pg,sel)
  if ov>0 or v: bad+=1; print(w,tag,"ov",ov,v)
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (390,768,1024,1440):
    pg=b.new_page(viewport={"width":w,"height":900}); pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type=="error" and errs.append(m.text))
    pg.goto(B); pg.evaluate("localStorage.clear()"); pg.goto(B); pg.wait_for_timeout(1500)
    chk(pg,"grid",w); pg.screenshot(path=f"/tmp/rm/grid-{w}.png",full_page=True)
    pg.get_by_role("radio",name="List view").click(); pg.wait_for_timeout(300); chk(pg,"list",w); pg.screenshot(path=f"/tmp/rm/list-{w}.png",full_page=True)
    print("w",w); pg.locator("main li button[aria-expanded]").first.click(timeout=5000); pg.wait_for_timeout(200); chk(pg,"open",w)
    pg.get_by_role("button",name="Edit ").first.click(); pg.wait_for_timeout(500); chk(pg,"drawer",w,"[role=dialog]"); pg.screenshot(path=f"/tmp/rm/drawer-{w}.png")
    pg.keyboard.press("Escape"); pg.goto(B+"/numbers"); pg.wait_for_timeout(1000); chk(pg,"numbers",w)
    pg.close()
  print("checked",n,"bad",bad); print("errors",errs[:5])
