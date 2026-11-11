from playwright.sync_api import sync_playwright
B="http://localhost:3100"
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
IDS=["overview","profile","branding","regional","policies","taxes","housekeeping","restaurant","channels","payments","documents","billing","messages","users","security","properties","activity","preferences"]
bad=[]; errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for slug in ["azure-bay","sea-pearl","tea-valley","skypod"]:
    for w in [390,1024,1440,2560]:
      pg=b.new_page(viewport={"width":w,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)[:150]))
      pg.goto(B+"/hms"); pg.evaluate(f"localStorage.setItem('hms-property','{slug}')")
      for i in IDS:
        pg.goto(B+"/hms/settings/"+i); pg.wait_for_timeout(450)
        if not pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"): bad.append(("overflow",slug,w,i))
        if w==1440 and slug in ("sea-pearl","skypod"):
          pg.add_script_tag(content=AXE)
          r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes[0].target))")
          if r: bad.append(("axe",slug,i,r))
      pg.close()
print("bad",bad); print("errs",errs[:5])
