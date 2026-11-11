import base64, os
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
ok=0; n=0
def chk(c,m):
  global ok,n; n+=1; ok+=bool(c); print(("PASS " if c else "FAIL ")+m)
png="/tmp/p3/t.png"
from PIL import Image; Image.new("RGB",(300,200),(200,120,90)).save(png)
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)))
  pg.goto(B+"/hms/other-services/catalog"); pg.wait_for_selector("table >> text=Airport Transfer")
  imgs=pg.locator("table img").count(); chk(imgs>=4,f"catalog shows service photos ({imgs})")
  nat=pg.evaluate("[...document.querySelectorAll('table img')].every(i=>i.complete&&i.naturalWidth>0)"); chk(nat,"photos load")
  # inventory item photo
  pg.goto(B+"/hms/inventory"); pg.wait_for_selector("table >> text=Guest Soap")
  pg.get_by_role("button",name="Add Item").first.click()
  with pg.expect_file_chooser() as fc: pg.get_by_role("button",name="Add item photo").click()
  fc.value.set_files(png); pg.wait_for_timeout(500)
  chk(pg.get_by_role("button",name="Change item photo").count()==1,"item photo added in sheet")
  pg.fill("#it-name","Photo Test Item"); pg.get_by_role("button",name="Save Item").click(); pg.wait_for_timeout(500)
  row=pg.locator("tr",has_text="Photo Test Item"); chk(row.locator("img").count()==1,"photo shows in stock list")
  # transitions present
  for r in ["/hms/staff","/hms/guests","/hms/discounts","/hms/cashbox","/hms/rooms","/hms/inventory","/hms/other-services","/hms/website/overview"]:
    pg.goto(B+r); pg.wait_for_timeout(1200); chk(pg.locator(".hms-page-in").count()>=1,f"page transition on {r}")
  pg.close()
  m=b.new_page(viewport={"width":390,"height":844}); m.on("pageerror",lambda e: errs.append(str(e)))
  m.goto(B+"/hms/staff/schedule"); m.wait_for_timeout(1500)
  nav=m.get_by_role("navigation",name="Team & HR"); h=nav.bounding_box()["height"]; chk(h<60,f"staff tabs one row at 390 (h={h:.0f})")
  chk(nav.get_by_role("link",name="Leave").is_visible(),"Leave reachable directly on mobile")
  m.goto(B+"/hms/other-services/catalog"); m.wait_for_timeout(1500)
  chk(m.get_by_role("list",name="Services").is_visible(),"catalog cards on mobile")
  m.goto(B+"/hms/other-services/orders"); m.wait_for_timeout(1500)
  chk(m.get_by_role("list",name="Orders").is_visible(),"orders cards on mobile")
  m.get_by_role("list",name="Orders").get_by_role("button").first.click(); m.wait_for_timeout(500)
  chk(m.get_by_role("dialog").count()>=1,"tap order opens details")
  m.goto(B+"/hms/inventory"); m.wait_for_timeout(1500)
  chk(m.get_by_role("list",name="Stock items").is_visible(),"stock cards on mobile")
  for w,hh in [(390,844),(2560,1440)]:
    v=b.new_page(viewport={"width":w,"height":hh})
    for r in ["/hms/staff","/hms/staff/schedule","/hms/staff/leave","/hms/other-services/catalog","/hms/other-services/orders","/hms/inventory","/hms/guests"]:
      v.goto(B+r); v.wait_for_timeout(1300)
      ov=v.evaluate("document.documentElement.scrollWidth-innerWidth"); chk(ov<=0,f"no overflow {w} {r}")
      if w==390:
        v.add_script_tag(content=AXE); res=v.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length))")
        chk(not res,f"axe {r} {res}")
    if w==390: v.goto(B+"/hms/staff/schedule"); v.wait_for_timeout(1200); v.screenshot(path="/tmp/p3/m_schedule.png")
    for r,f in [("/hms/other-services/catalog","cat"),("/hms/inventory","inv"),("/hms/other-services/orders","ord")]:
      v.goto(B+r); v.wait_for_timeout(1300); v.screenshot(path=f"/tmp/p3/{w}_{f}.png")
    v.close()
  chk(not errs,f"no page errors {errs[:2]}")
print(f"{ok}/{n}")
