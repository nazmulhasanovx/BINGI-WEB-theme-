import re
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
AXE=open("/tmp/axe/node_modules/axe-core/axe.min.js").read()
ok=0;n=0;fails=[]
def t(m,c):
  global ok,n; n+=1; ok+=bool(c); print(("PASS " if c else "FAIL ")+m, flush=True)
  if not c: fails.append(m)
def axe(pg,label):
  pg.add_script_tag(content=AXE)
  r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa']}).then(r=>r.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>v.id+':'+v.nodes.length+':'+v.nodes[0].target))")
  t(f"axe {label} {r}", not r)
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)[:200]))
  pg.add_init_script("window.print=()=>{window.__printed=(window.__printed||0)+1}; window.open=(...a)=>{window.__opened=a; return {document:{write(){},close(){}},focus(){},print(){window.__printed=(window.__printed||0)+1},close(){}}}")
  M=lambda: pg.locator("main").inner_text()
  ST=lambda: pg.get_by_role("status").inner_text() if pg.get_by_role("status").count() else ""
  pg.goto(B+"/hms/bookings"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
  t("Day close tab", pg.get_by_role("link",name="Day close").count()==1)
  # ---- booking policies live in Settings (one home)
  pg.goto(B+"/hms/settings/policies"); pg.wait_for_timeout(1200)
  t("settings page", "Cancellation & no-show" in M())
  pg.get_by_label("Late check-out",exact=True).select_option("charge")
  f=pg.get_by_label("Late check-out fee"); f.fill(""); f.type("2000"); t("typing keeps focus", f.input_value()=="2000")
  pg.get_by_role("button",name="Save",exact=True).click(); pg.wait_for_timeout(300); t("settings saved", "saved" in ST())
  axe(pg,"settings")
  # ---- in-house booking: bill tab, charges, deposit, docs
  pg.goto(B+"/hms/bookings/list"); pg.wait_for_timeout(1200)
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1000)
  pg.get_by_role("tab",name=re.compile("^In house")).click(); pg.wait_for_timeout(200)
  reg=pg.get_by_role("region",name="In house",exact=True)
  reg.get_by_role("button").first.click(); pg.wait_for_timeout(1300)
  t("booking page", "/hms/bookings/view" in pg.url)
  pg.get_by_role("tab",name="Bill & payments").click(); pg.wait_for_timeout(300)
  before=M()
  pg.get_by_role("button",name="Laundry",exact=True).click(); pg.get_by_label("Charge amount").fill("450"); pg.get_by_role("button",name="Add",exact=True).click(); pg.wait_for_timeout(300)
  t("charge added", "Laundry" in M() and "৳450" in M())
  pg.get_by_label("Deposit amount").fill("3000"); pg.get_by_role("button",name="Take deposit").click(); pg.wait_for_timeout(300)
  t(f"deposit held ({ST()})", "Holding" in M() and "৳3,000" in M())
  pg.get_by_role("button",name="Remove Laundry").click(); pg.wait_for_timeout(300); t("charge removed", "Remove Laundry" not in pg.content())
  axe(pg,"bill tab")
  pg.get_by_role("tab",name="Documents & messages").click(); pg.wait_for_timeout(300)
  t("docs list", all(x in M() for x in ["Booking confirmation","Registration card","Invoice","Receipt"]))
  pg.get_by_role("button",name=re.compile(r"Print \/ PDF")).first.click(); pg.wait_for_timeout(60)
  t("print doc rendered", "Booking confirmation" in (pg.evaluate("[...document.querySelectorAll('iframe[aria-hidden]')].map(f=>f.contentDocument.body.innerText).join(' ')") or "") or "CONFIRM" in (pg.evaluate("[...document.querySelectorAll('iframe[aria-hidden]')].map(f=>f.contentDocument.body.innerText).join(' ')") or "").upper())
  t("messages filled", "Confirmation message" in M() and "{guest}" not in M())
  t("whatsapp link", pg.locator("a[href^='https://wa.me/']").count()>=1)
  axe(pg,"docs tab")
  # ---- cancel policy fee on upcoming booking
  pg.goto(B+"/hms/bookings/list"); pg.wait_for_timeout(1200)
  # ---- day close
  pg.goto(B+"/hms/bookings/close"); pg.wait_for_timeout(1300)
  t("day close page", "Not arrived" in M() and "Room revenue" in M())
  ns=pg.get_by_role("button",name=re.compile("^Mark .* no-show"))
  cnt=ns.count()
  if cnt: ns.first.click(); pg.wait_for_timeout(300); t(f"no-show marked ({ST()})", "no-show" in ST() and pg.get_by_role("button",name=re.compile("^Mark .* no-show")).count()==cnt-1)
  axe(pg,"day close")
  pg.get_by_role("button",name="Close the day").click(); pg.wait_for_timeout(300)
  t("day closed", "Day closed" in M() and "Closed days" in M())
  # ---- wizard meal plan
  pg.goto(B+"/hms/bookings/new"); pg.wait_for_timeout(1300)
  pg.get_by_role("button",name=re.compile(r"^Room \d")).first.click(); pg.wait_for_timeout(200)
  tot0=pg.locator("#nb-summary").inner_text()
  for i in range(2):
    pg.locator("#nb-summary").get_by_role("button",name=re.compile("^Next")).click(); pg.wait_for_timeout(300)
    if i==0:
      pg.get_by_label("Phone number").fill("01811223344"); pg.wait_for_timeout(200); pg.get_by_label("Full name").fill("Plan Test")
  mp=pg.get_by_role("button",name=re.compile("^Dinner"))
  t("meal plan option", mp.count()>=1)
  if mp.count(): mp.first.click(); pg.wait_for_timeout(200); t("total changes with plan", pg.locator("#nb-summary").inner_text()!=tot0 and "meal plan" in pg.locator("#nb-summary").inner_text())
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
