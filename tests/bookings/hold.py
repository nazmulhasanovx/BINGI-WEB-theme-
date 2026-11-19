# Booking hold: hold any guest (name + phone) from step 1, room blocked, shows On hold, confirm / extend / release, runs out by itself.
from playwright.sync_api import sync_playwright
import json, re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
KEY="bingi-bookings-v1-azure-bay"
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  def new(frm="2026-11-14", to="2026-11-16"):
    pg.goto(B+f"/hms/bookings/new?from={frm}&to={to}"); pg.wait_for_timeout(1500)
    for x in pg.locator("[data-news-popup]").get_by_role("button",name="Later").all(): x.click()
  new()
  t("no hold button before a room is picked", pg.get_by_role("button", name=re.compile("Hold room")).count()==0)
  room=pg.locator("[role=group][aria-label$=' rooms'] button").first; code=room.inner_text().strip(); room.click(); pg.wait_for_timeout(200)
  t("next button names the next step", pg.get_by_role("button", name="Next: Guest").count()==1)
  pg.get_by_role("button", name="Hold room for later").first.click(); pg.wait_for_timeout(300)
  dlg=pg.get_by_role("dialog", name=f"Hold Room {code}")
  t("hold sheet opens", dlg.count()==1)
  pg.screenshot(path="/tmp/hold/1_sheet.png")
  dlg.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_timeout(200)
  t("needs name/phone", "full name" in dlg.get_by_role("alert").inner_text().lower())
  dlg.get_by_label("Guest name").fill("Karim Ahmed"); dlg.get_by_label("Phone").fill("01712-345678")
  dlg.get_by_role("radio", name="6 hours").click(); dlg.get_by_role("button", name="Waiting for advance").click()
  dlg.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_url("**/bookings/view**"); pg.wait_for_timeout(900)
  bc=re.search(r"b=(BK-\d+)", pg.url).group(1)
  t("toast says held", "held for Karim Ahmed until" in pg.get_by_role("status").first.inner_text())
  t("status pill On hold", pg.get_by_text("On hold", exact=True).count()>=1)
  ban=pg.get_by_role("region", name="Hold")
  t("hold banner with time left", "Room held until" in ban.inner_text() and ("h left" in ban.inner_text() or "min left" in ban.inner_text()) and "Waiting for advance" in ban.inner_text())
  pg.screenshot(path="/tmp/hold/2_view.png")
  # room is blocked for others
  new(); free=[x.inner_text().strip() for x in pg.locator("[role=group][aria-label$=' rooms'] button").all()]
  t("held room not offered to others", code not in free)
  # list
  pg.goto(B+"/hms/bookings"); pg.wait_for_timeout(1200)
  tab=pg.get_by_role("tab", name=re.compile("^On hold"))
  t("On hold tab appears with count", tab.count()==1 and "(1)" in tab.inner_text())
  tab.click(); pg.wait_for_timeout(300)
  t("list shows Held tag", "Held ·" in pg.inner_text("main"))
  pg.screenshot(path="/tmp/hold/3_list.png")
  # extend
  pg.goto(B+f"/hms/bookings/view?b={bc}"); pg.wait_for_timeout(1000)
  pg.get_by_role("region", name="Hold").get_by_role("button", name="Extend").click(); pg.wait_for_timeout(300)
  d=pg.get_by_role("dialog", name="Extend hold"); t("extend sheet", d.count()==1)
  d.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_timeout(400)
  st=json.loads(pg.evaluate(f"localStorage.getItem('{KEY}')")); bb=[x for x in st["list"] if x["code"]==bc][0]
  t("extended + logged", any("Hold extended" in l["text"] for l in bb["log"]))
  # confirm
  pg.get_by_role("region", name="Hold").get_by_role("button", name="Confirm booking").click(); pg.wait_for_timeout(400)
  t("confirm → Confirmed, banner gone", pg.get_by_role("region", name="Hold").count()==0 and pg.get_by_text("Confirmed", exact=True).count()>=1)
  # second hold, then release
  new("2026-11-20","2026-11-21"); pg.locator("[role=group][aria-label$=' rooms'] button").first.click()
  pg.get_by_role("button", name="Hold room for later").first.click(); d=pg.get_by_role("dialog").first
  d.get_by_label("Guest name").fill("Walk Guest"); d.get_by_label("Phone").fill("01812-000111"); d.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_url("**/bookings/view**"); pg.wait_for_timeout(800)
  pg.get_by_role("region", name="Hold").get_by_role("button", name="Release").click(); pg.wait_for_timeout(400)
  t("release → Cancelled", pg.get_by_text("Cancelled", exact=True).count()>=1 and pg.get_by_role("region", name="Hold").count()==0)
  # third hold runs out by itself
  new("2026-11-22","2026-11-23"); pg.locator("[role=group][aria-label$=' rooms'] button").first.click()
  pg.get_by_role("button", name="Hold room for later").first.click(); d=pg.get_by_role("dialog").first
  d.get_by_label("Guest name").fill("Late Guest"); d.get_by_label("Phone").fill("01912-222333"); d.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_url("**/bookings/view**"); pg.wait_for_timeout(800)
  c3=re.search(r"b=(BK-\d+)", pg.url).group(1)
  pg.evaluate(f"""(()=>{{const s=JSON.parse(localStorage.getItem('{KEY}')); const x=s.list.find(b=>b.code==='{c3}'); x.hold.until='2026-11-10T00:01'; localStorage.setItem('{KEY}', JSON.stringify(s));}})()""")
  pg.reload(); pg.wait_for_timeout(1500)
  st=json.loads(pg.evaluate(f"localStorage.getItem('{KEY}')")); x=[y for y in st["list"] if y["code"]==c3][0]
  t("expired hold frees itself", x["status"]=="Cancelled" and x["cancel"]["reason"]=="Hold ran out" and x["cancel"]["keep"]==0)
  # hold from review step for a saved guest
  new("2026-11-25","2026-11-26"); pg.locator("[role=group][aria-label$=' rooms'] button").first.click()
  pg.get_by_role("button", name="Next: Guest").click(); pg.wait_for_timeout(300)
  pg.get_by_label("Phone number").fill("01712-345678"); pg.wait_for_timeout(300)
  t("saved guest found by phone", pg.get_by_role("button", name="Use this guest").count()==1)
  pg.get_by_role("button", name="Hold room for later").first.click(); d=pg.get_by_role("dialog").first
  t("sheet shows saved guest", "Karim Ahmed" in d.inner_text())
  d.get_by_role("button", name=re.compile("^Hold until")).click(); pg.wait_for_url("**/bookings/view**"); pg.wait_for_timeout(800)
  st=json.loads(pg.evaluate(f"localStorage.getItem('{KEY}')")); ks=[y for y in st["list"] if y.get("hold")]
  t("held for the same saved guest", len(ks)==1 and ks[0]["guestId"]==bb["guestId"])
  t("no page errors", not errs)
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/bookings/new?from=2026-11-27&to=2026-11-28"); m.wait_for_timeout(1500)
  m.locator("[role=group][aria-label$=' rooms'] button").first.click(); m.get_by_role("button", name="Hold room for later").last.click(); m.wait_for_timeout(400)
  t("mobile: hold sheet fits", m.evaluate("document.documentElement.scrollWidth<=innerWidth+1") and m.get_by_role("dialog").count()==1)
  m.screenshot(path="/tmp/hold/4_mobile.png")
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
