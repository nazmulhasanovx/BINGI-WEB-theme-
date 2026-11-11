# Generic sweep: python3 tests/sweep.py /hms/payments /hms/payments?tab=collect ...  (4 properties × 4 widths, overflow + axe + errors)
import sys
from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100"; bad=[]
PROPS=["azure-bay","sea-pearl","canopy-nest","coral-cove"]; W=[390,768,1024,1440]
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in W:
    pg=b.new_page(viewport={"width":w,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(B+"/hms"); pg.evaluate("localStorage.clear()")
    for prop in PROPS:
      pg.evaluate(f"localStorage.setItem('hms-property','{prop}')")
      for path in sys.argv[1:]:
        pg.goto(B+path); pg.wait_for_timeout(1100)
        if pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1"): bad.append(("overflow",prop,w,path))
        if w in (390,1440):
          pg.add_script_tag(content=AXE)
          r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes[0].target))")
          if r: bad.append(("axe",prop,w,path,r))
    if errs: bad.append(("errors",w,errs[:2]))
    pg.close()
  b.close()
print("\n".join(map(str,bad)) if bad else "SWEEP CLEAN")
