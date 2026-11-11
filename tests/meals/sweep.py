from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100/hms/meals"; bad=0; n=0; errs=[]
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
    pg.goto(B); pg.evaluate("localStorage.clear()")
    for x in ["","/pos","/orders","/kitchen","/menu","/tables","/reports","/settings","/cashbox","/cash-settings"]:
      pg.goto(B+x); pg.wait_for_timeout(1200); chk(pg,x or "/",w)
      if w in (390,1440): pg.screenshot(path=f"/tmp/ml/s{x.replace('/','-') or '-ov'}-{w}.png",full_page=True)
    pg.goto(B+"/orders"); pg.wait_for_timeout(1000)
    pg.get_by_role("button",name="View").first.click(); pg.wait_for_timeout(400); chk(pg,"order sheet",w,"[role=dialog]"); pg.screenshot(path=f"/tmp/ml/sh-order-{w}.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(200)
    pg.get_by_role("tab",name="Not paid").click(); pg.wait_for_timeout(200)
    pg.get_by_role("button",name="Take payment").first.click(); pg.wait_for_timeout(400); chk(pg,"pay sheet",w,"[role=dialog]"); pg.screenshot(path=f"/tmp/ml/sh-pay-{w}.png"); pg.keyboard.press("Escape")
    pg.goto(B+"/menu"); pg.wait_for_timeout(900); pg.get_by_role("button",name="Add item").click(); pg.wait_for_timeout(300); chk(pg,"item sheet",w,"[role=dialog]"); pg.keyboard.press("Escape")
    pg.goto(B+"/tables"); pg.wait_for_timeout(900); pg.get_by_role("button",name="QR",exact=True).first.click(); pg.wait_for_timeout(600); chk(pg,"qr sheet",w,"[role=dialog]"); pg.screenshot(path=f"/tmp/ml/sh-qr-{w}.png"); pg.keyboard.press("Escape")
    pg.close()
  print("checked",n,"bad",bad); print("errors",errs[:5])
