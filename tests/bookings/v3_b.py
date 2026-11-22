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
  M=lambda: pg.locator("main").inner_text()
  ST=lambda: pg.get_by_role("status").inner_text() if pg.get_by_role("status").count() else ""
  pg.goto(B+"/hms/bookings"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
  # ---- room board
  pg.get_by_role("link",name="Room board").click(); pg.wait_for_timeout(1200)
  t("board page", "/hms/bookings/board" in pg.url and "Ready to sell" in M())
  t("board states", all(x in M() for x in ["In house","Arriving","Free"]))
  pg.get_by_role("radio",name=re.compile("^In house")).click(); pg.wait_for_timeout(200)
  t("board filter", "Ready to sell" not in M())
  axe(pg,"board")
  pg.get_by_role("radio",name=re.compile("^All rooms")).click()
  # ---- walk-in from board free room
  pg.get_by_role("button",name=re.compile(r"^Room \S+, Free")).first.click(); pg.wait_for_timeout(1200)
  t("walk-in page with room", "/hms/bookings/walkin?room=" in pg.url and pg.get_by_role("radio",checked=True).count()>=1)
  axe(pg,"walk-in")
  pg.get_by_role("button",name="Book & check in").click(); pg.wait_for_timeout(200)
  t("walk-in phone required", "phone" in M())
  pg.get_by_label("Phone").fill("01999888777"); pg.get_by_label("Full name").fill("Walk In Guest"); pg.get_by_label("Take now (optional)").fill("500")
  pg.get_by_role("button",name="Book & check in").click(); pg.wait_for_timeout(1500)
  t("walk-in → check-in panel", "do=checkin" in pg.url and pg.get_by_role("region",name="Check in",exact=True).count()==1)
  t("walk-in channel", "Walk-in" in M())
  P=pg.get_by_role("region",name="Check in",exact=True)
  P.get_by_label("ID type").select_option("NID"); P.get_by_label("ID number").fill("1995264837")
  P.get_by_role("button",name=re.compile("^Check in")).click(); pg.wait_for_timeout(600)
  t(f"walk-in checked in ({ST()})", "checked in" in ST())
  # ---- ⌘K booking search
  pg.keyboard.press("Control+k"); pg.wait_for_timeout(300)
  pg.get_by_role("combobox").fill("Walk In"); pg.wait_for_timeout(300)
  dlg=pg.get_by_role("dialog",name="Search")
  t("⌘K finds booking", "Bookings" in dlg.inner_text().title() and "BK-" in dlg.inner_text())
  pg.keyboard.press("Escape")
  # ---- group booking via wizard (2 rooms)
  pg.goto(B+"/hms/bookings/new?from=2026-11-20"); pg.wait_for_timeout(1300)
  rb=pg.get_by_role("button",name=re.compile(r"^Room \d"))
  rb.nth(0).click(); rb.nth(1).click(); pg.wait_for_timeout(200)
  pg.locator("#nb-summary").get_by_role("button",name=re.compile("^Next")).click(); pg.wait_for_timeout(300)
  pg.get_by_label("Phone number").fill("01712345000"); pg.wait_for_timeout(200); pg.get_by_label("Full name").fill("Group Lead")
  for i in range(2): pg.locator("#nb-summary").get_by_role("button",name=re.compile("^Next")).click(); pg.wait_for_timeout(300)
  pg.locator("#nb-summary").get_by_role("button",name=re.compile("^Confirm")).click(); pg.wait_for_timeout(1500)
  link=pg.get_by_role("link",name=re.compile("^Group GRP"))
  t("group link on booking", link.count()==1)
  link.click(); pg.wait_for_timeout(1300)
  t("group page", "/hms/bookings/group?g=" in pg.url and "2 rooms" in M())
  pg.get_by_role("button",name=re.compile("^Full ·")).click(); pg.get_by_role("radio",name="bKash").click(); pg.get_by_role("button",name="Take payment").click(); pg.wait_for_timeout(400)
  t(f"group paid ({ST()})", "shared across 2 rooms" in ST() and "Group payment" not in M())
  axe(pg,"group")
  # ---- calendar drag move
  pg.goto(B+"/hms/bookings/calendar"); pg.wait_for_timeout(1500)
  bar=pg.get_by_role("button",name=re.compile(r"Group Lead.*Room")).first
  bb=bar.bounding_box(); lab=bar.get_attribute("aria-label")
  room0=re.search(r"Room (\S+),",lab).group(1)
  # target: empty row near the end of the list
  rows=pg.locator("[data-room]")
  target=None
  for i in range(rows.count()-1,0,-1):
    r=rows.nth(i); code=r.get_attribute("data-room"); bx=r.bounding_box()
    if not bx or not (150<bx["y"]<850) or code==room0: continue
    bars=r.locator("button[aria-label^='BK-']"); clash=False
    for j in range(bars.count()):
      q=bars.nth(j).bounding_box()
      if q and q["x"]<bb["x"]+bb["width"]+80 and q["x"]+q["width"]>bb["x"]: clash=True
    if not clash: target=(code,bx); break
  print("drag", room0, "->", target[0])
  pg.mouse.move(bb["x"]+bb["width"]/2, bb["y"]+bb["height"]/2); pg.mouse.down()
  pg.mouse.move(bb["x"]+bb["width"]/2+20, bb["y"]+10, steps=3)
  pg.mouse.move(bb["x"]+bb["width"]/2, target[1]["y"]+22, steps=8); pg.mouse.up(); pg.wait_for_timeout(400)
  cm=pg.get_by_role("region",name="Confirm move")
  t("confirm move shown", cm.count()==1 and target[0] in cm.inner_text())
  t("still on calendar (no open)", "/calendar" in pg.url)
  cm.get_by_role("button",name="Confirm move").click(); pg.wait_for_timeout(400)
  t(f"moved ({ST()})", f"Room {target[0]}" in ST())
  # drag end to extend
  bar=pg.get_by_role("button",name=re.compile(rf"Group Lead, Room {target[0]}")).first; bb=bar.bounding_box()
  W=pg.locator("[data-room]").first.bounding_box()["width"]/14
  pg.mouse.move(bb["x"]+bb["width"]-3, bb["y"]+bb["height"]/2); pg.mouse.down(); pg.mouse.move(bb["x"]+bb["width"]-3+W*1.1, bb["y"]+bb["height"]/2, steps=6); pg.mouse.up(); pg.wait_for_timeout(300)
  cm=pg.get_by_role("region",name="Confirm move")
  t("extend confirm shows new dates + price", cm.count()==1 and "→" in cm.inner_text() and "room price" in cm.inner_text())
  cm.get_by_role("button",name="Confirm move").click(); pg.wait_for_timeout(300)
  # drag create
  r=pg.locator(f"[data-room='{room0}']"); rb2=r.bounding_box()
  cells=r.get_by_role("button",name=re.compile("^New booking"))
  c1=cells.nth(cells.count()-3).bounding_box(); c2=cells.nth(cells.count()-1).bounding_box()
  pg.mouse.move(c1["x"]+5,c1["y"]+10); pg.mouse.down(); pg.mouse.move(c2["x"]+5,c2["y"]+10,steps=6); pg.mouse.up(); pg.wait_for_timeout(1200)
  t("drag-create opens wizard with to", "/hms/bookings/new" in pg.url and "to=" in pg.url)
  axe(pg,"wizard")
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
