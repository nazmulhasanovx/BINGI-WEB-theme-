# Every theme demo: home + sub-pages, 390 & 1440: page errors, not-found, horizontal overflow, broken images; axe on home.
import sys, re, json
from playwright.sync_api import sync_playwright
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
B="http://localhost:3100"
SLUGS=sys.argv[1].split(",")
SUBS=["","/rooms","/offers","/dining","/experiences","/explore","/events","/policies","/stay"]
bad=[]; seen=0
with sync_playwright() as p:
  b=p.chromium.launch()
  for w in (1440,390):
    pg=b.new_page(viewport={"width":w,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)[:120]))
    for s in SLUGS:
      for sub in (SUBS if w==1440 else ["","/rooms","/stay"]):
        errs.clear()
        r=pg.goto(f"{B}/hotel/{s}{sub}"); pg.wait_for_timeout(700)
        seen+=1
        body=pg.inner_text("body")
        if r and r.status>=400 or "could not be found" in body.lower():
          if sub in ("","/rooms","/policies","/stay"): bad.append(("404",s,sub,w))
          continue
        pg.evaluate("async()=>{for(let y=0;y<4000;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0)}"); pg.wait_for_timeout(250)
        if pg.evaluate("document.documentElement.scrollWidth>window.innerWidth+1"): bad.append(("overflow",s,sub,w,pg.evaluate("[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>window.innerWidth+2).slice(0,2).map(e=>e.tagName+'.'+String(e.className).slice(0,50))")))
        broken=pg.evaluate("[...document.images].filter(i=>i.complete&&i.naturalWidth===0&&i.getBoundingClientRect().width>0).map(i=>i.src.slice(-50))")
        if broken: bad.append(("img",s,sub,w,broken[:2]))
        if errs: bad.append(("err",s,sub,w,errs[:1]))
        if w==1440 and sub=="":
          pg.wait_for_timeout(1300)  # let reveal animations finish before checking contrast
          pg.add_script_tag(content=AXE)
          a=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length))")
          if a: bad.append(("axe",s,a))
    pg.close()
  b.close()
print("checked",seen); print("\n".join(map(str,bad)) if bad else "THEMES CLEAN")
