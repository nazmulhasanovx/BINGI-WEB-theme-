from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100/hms/cashbox"; bad=0; n=0; errs=[]
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
    chk(pg,"today",w); pg.screenshot(path=f"/tmp/cb/today-{w}.png",full_page=True)
    for nm in ["Cash in","Cash out","Close day"]:
      pg.get_by_role("button",name=nm,exact=True).first.click(); pg.wait_for_timeout(400); chk(pg,"sheet "+nm,w,"[role=dialog]")
      pg.screenshot(path=f"/tmp/cb/sheet-{nm.replace(' ','')}-{w}.png"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    pg.goto(B+"/movements"); pg.wait_for_timeout(1000); chk(pg,"moves",w); pg.screenshot(path=f"/tmp/cb/moves-{w}.png",full_page=True)
    pg.goto(B+"/days"); pg.wait_for_timeout(1000); chk(pg,"days",w); pg.screenshot(path=f"/tmp/cb/days-{w}.png",full_page=True)
    pg.goto(B); pg.wait_for_timeout(800); pg.locator("summary",has_text="Demo").click(); pg.get_by_role("button",name="Start today again (not opened)").click(); pg.wait_for_timeout(400)
    chk(pg,"open",w); pg.screenshot(path=f"/tmp/cb/open-{w}.png")
    pg.close()
  print("checked",n,"bad",bad); print("errors",errs[:5])
