import re, json
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
  M=lambda: pg.locator("main").inner_text()
  ST=lambda: pg.get_by_role("status").inner_text() if pg.get_by_role("status").count() else ""
  pg.goto(B+"/hms/housekeeping"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1800)
  t("housekeeping page live (not placeholder)", "Housekeeping" in M() and "Live in HMS" not in M() and "Start cleaning" in M())
  dirty0=pg.get_by_role("button",name=re.compile("^Start cleaning room")).count()
  btn=pg.get_by_role("button",name=re.compile("^Start cleaning room")).first; room=btn.get_attribute("aria-label").split()[-1]
  btn.click(); pg.wait_for_timeout(250); t("start cleaning", pg.get_by_role("button",name=f"Mark clean room {room}").count()==1)
  pg.get_by_role("button",name=f"Mark clean room {room}").click(); pg.wait_for_timeout(250)
  t("clean → ready", pg.get_by_role("button",name=re.compile("^Start cleaning room")).count()==dirty0-1)
  axe(pg,"hk easy")
  pg.get_by_role("radio",name="Details").click(); pg.wait_for_timeout(300)
  t("details: tasks + out of order", "Tasks" in M() and "Out of order" in M() and "Done today" in M())
  sel=pg.get_by_role("combobox",name=re.compile("^Assign ")).first
  opts=sel.locator("option").all_inner_texts(); t(f"staff from HRM {opts[:3]}", any("Hossain" in o or "Akter" in o or "Hasan" in o for o in opts))
  sel.select_option(index=1); pg.wait_for_timeout(200)
  pg.get_by_role("button",name=re.compile("^Start ")).first.click(); pg.wait_for_timeout(200)
  pg.get_by_role("button",name=re.compile("^Finish ")).first.click(); pg.wait_for_timeout(200)
  t("task done", "done" in ST())
  # OOO with date range in the future
  pg.get_by_label("Room out of order").select_option(index=2); ooo_room=pg.get_by_label("Room out of order").input_value()
  pg.get_by_label("Out of order reason").fill("Paint"); pg.get_by_label("Out of order from").fill("2026-11-15"); pg.get_by_label("Back in service on").fill("2026-11-17")
  pg.get_by_role("button",name="Mark out of order").click(); pg.wait_for_timeout(300)
  t("ooo scheduled", "Paint" in M() and "15 Nov" in M())
  axe(pg,"hk details")
  pg.goto(B+"/hms/bookings/calendar"); pg.wait_for_timeout(1500)
  r=pg.locator(f"[data-room='{ooo_room}']")
  t("calendar: ooo only on those days", r.get_by_role("button",name=re.compile(f"New booking, Room {ooo_room}, 16 Nov")).count()==0 and r.get_by_role("button",name=re.compile(f"New booking, Room {ooo_room}, 1[89] Nov")).count()>=1)
  # ---- checkout makes room dirty + task
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1200)
  pg.get_by_role("tab",name=re.compile("^Leaving")).click(); pg.wait_for_timeout(200)
  lv=pg.get_by_role("region",name="Leaving",exact=True); bt=lv.get_by_role("button",name=re.compile("^Check out ")).first
  bt.click(); pg.wait_for_timeout(1300)
  croom=re.search(r"Room (\S+)", pg.get_by_role("region",name="Check out",exact=True).inner_text())
  P=pg.get_by_role("region",name="Check out",exact=True)
  full=P.get_by_role("button",name=re.compile("^Full"))
  if full.count(): full.click(); P.get_by_role("radio",name="Cash").click()
  P.get_by_role("button",name=re.compile("^Check out")).last.click(); pg.wait_for_timeout(600)
  hdr=M(); room_out=re.search(r"Room (\d+\S*)", hdr).group(1) if re.search(r"Room (\d+\S*)", hdr) else None
  t(f"checked out ({ST()})", "checked out" in ST().lower())
  pg.goto(B+"/hms/housekeeping"); pg.wait_for_timeout(1300)
  t(f"room {room_out} dirty after checkout", room_out and pg.get_by_role("button",name=f"Start cleaning room {room_out}").count()==1)
  # ---- arrival readiness warning
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1200)
  # mark an arriving room dirty then open check-in
  arr=pg.get_by_role("region",name="Arriving",exact=True)
  lab=arr.get_by_role("button",name=re.compile(r", Room ")).first.get_attribute("aria-label"); aroom=lab.split("Room ")[-1]
  pg.goto(B+"/hms/housekeeping"); pg.wait_for_timeout(1200)
  d=pg.get_by_role("button",name=f"Mark room {aroom} dirty")
  if d.count(): d.click(); pg.wait_for_timeout(200)
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1200)
  t("today shows room dirty tag", "Room dirty" in M())
  arr=pg.get_by_role("region",name="Arriving",exact=True)
  arr.get_by_role("button",name=re.compile(rf", Room {re.escape(aroom)}$")).first.click(); pg.wait_for_timeout(1200)
  pg.goto(pg.url.split("&")[0]+"&do=checkin"); pg.wait_for_timeout(1300)
  t("check-in readiness note", "not cleaned yet" in M())
  # ---- board readiness
  pg.goto(B+"/hms/bookings/board"); pg.wait_for_timeout(1300)
  t("board shows needs cleaning", "needs cleaning" in M())
  # ---- website request → accept
  slug=pg.evaluate("localStorage.getItem('bingi.hms.property')") 
  hotel=pg.evaluate("(()=>{for(const k of Object.keys(localStorage)) if(k.startsWith('bingi.bookings')) return k; return null})()")
  print("keys", slug, hotel)
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(800)
  info=pg.evaluate("""()=>{const ks=Object.keys(localStorage);return ks}""")
  print(info)
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
