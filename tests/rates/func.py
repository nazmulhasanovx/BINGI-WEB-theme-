import re
from playwright.sync_api import sync_playwright, expect
B="http://localhost:3100/hms/discounts"; ok=0; fail=0
def t(name, cond):
  global ok, fail
  if cond: ok+=1
  else: fail+=1; print("FAIL", name)
def day(pg, n):  # Easy calendar day button
  return pg.locator("section[aria-label$=' prices'] button[aria-pressed]").filter(has=pg.locator("span", has_text=re.compile(rf"^{n}$"))).first
def price(pg, n): return day(pg,n).inner_text().split("\n")[-1]
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":1000}); errs=[]
  pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B); pg.evaluate("localStorage.clear()"); pg.goto(B); pg.wait_for_timeout(1200)
  cats=pg.get_by_role("radiogroup",name="Room category").get_by_role("radio")
  t("categories listed", cats.count()>=3)
  t("tonight price shown", "৳12,000" in cats.first.inner_text() and "tonight" in cats.first.inner_text())
  t("first selected", cats.first.get_attribute("aria-checked")=="true")
  t("past day disabled", day(pg,9).is_disabled())
  t("closed seed day", "Closed" in day(pg,15).inner_text())
  t("weekend price", "13,800" in day(pg,13).inner_text())
  t("flash deal shows", "12,420" in day(pg,13).inner_text() and "10,800" in day(pg,16).inner_text())
  t("no deal before start", "12,000" in price(pg,11))
  # set single day price
  day(pg,11).click(); pg.wait_for_timeout(200)
  panel=pg.get_by_role("region",name="Edit selected nights")
  t("panel opens", panel.is_visible() and "Nov 11" in panel.inner_text())
  inp=panel.locator("input[inputmode=numeric]").first; inp.fill("15000"); pg.wait_for_timeout(100)
  t("guest total hint", "guest pays" in panel.inner_text())
  panel.get_by_role("button",name="Save").click(); pg.wait_for_timeout(300)
  t("price saved", "15,000" in price(pg,11)); t("toast", "updated" in pg.get_by_role("status").inner_text())
  t("custom dot sr text", "custom price" in day(pg,11).text_content())
  # range select via shift
  day(pg,17).click(); day(pg,19).click(modifiers=["Shift"]); pg.wait_for_timeout(200)
  t("range label", "3 nights" in panel.inner_text())
  panel.get_by_role("button",name="+10%").click()
  t("quick +10%", panel.locator("input[inputmode=numeric]").first.input_value()=="13200")
  panel.get_by_role("button",name="Save").click(); pg.wait_for_timeout(300)
  t("range saved deal", "11,880" in price(pg,18))
  # close a day
  day(pg,24).click(); panel.get_by_label("Open for sale").uncheck(); panel.get_by_role("button",name="Save").click(); pg.wait_for_timeout(300)
  t("closed day", "Closed" in day(pg,24).inner_text())
  # reset
  day(pg,11).click(); panel.get_by_role("button",name="Use default").click(); pg.wait_for_timeout(300)
  t("reset to default", "12,000" in price(pg,11))
  # weekends button selection
  pg.get_by_role("button",name="Weekends").click(); pg.wait_for_timeout(200)
  t("weekends picked", re.search(r"\d+ nights", panel.inner_text()) is not None)
  panel.get_by_role("button",name="Close").click()
  # default prices
  pg.get_by_label("Fri–Sat / night").fill("14500"); pg.get_by_role("button",name="Save default prices").click(); pg.wait_for_timeout(300)
  t("weekend default changed", "14,500" in day(pg,13).inner_text())
  pg.get_by_label("Base / night").fill("12500"); pg.get_by_role("button",name="Save default prices").click(); pg.wait_for_timeout(300)
  t("base changed", "12,500" in cats.first.inner_text())
  # base syncs to rooms store
  t("rooms store synced", pg.evaluate("Object.keys(localStorage).filter(k=>k.includes('rooms')).some(k=>localStorage[k].includes('12500'))"))
  # switch category
  cats.nth(1).click(); pg.wait_for_timeout(200)
  t("category switch", "16,000" in price(pg,12))
  t("summary month", "If every room sells" in pg.get_by_role("main").inner_text())
  # advanced mode
  pg.get_by_role("radio",name="Advanced · room by room").click(); pg.wait_for_timeout(300)
  t("whole property row", pg.get_by_role("rowheader",name=re.compile("Whole property")).is_visible())
  pg.get_by_role("button",name=re.compile("change room 101 premium")).click()
  pg.get_by_label("Room 101 premium").fill("2000"); pg.get_by_label("Room 101 premium").press("Enter"); pg.wait_for_timeout(300)
  t("premium applied", pg.get_by_role("button",name=re.compile(r"^Room 101 Nov 12 ")).inner_text()=="৳14,500")
  pg.get_by_role("button",name=re.compile(r"^Room 102 Nov 12 ")).click(); pg.wait_for_timeout(200)
  t("room panel", "Room 102" in panel.inner_text())
  panel.locator("input[inputmode=numeric]").first.fill("20000"); panel.get_by_role("button",name="Save").click(); pg.wait_for_timeout(300)
  t("room-wise price", pg.get_by_role("button",name=re.compile(r"^Room 102 Nov 12 ")).inner_text()=="৳20,000")
  t("category unaffected", pg.get_by_role("button",name=re.compile(r"^Room 103 Nov 12 ")).inner_text()=="৳12,500")
  # persistence
  pg.reload(); pg.wait_for_timeout(1200)
  t("persist", "14,500" in day(pg,13).inner_text())
  # discounts
  pg.goto(B+"/campaigns"); pg.wait_for_timeout(1000)
  t("kpis", "Active" in pg.get_by_role("main").inner_text() and "ACTIVE_CAMPAIGNS" not in pg.get_by_role("main").inner_text())
  pg.get_by_role("button",name="New campaign").click(); dlg=pg.get_by_role("dialog")
  dlg.get_by_role("button",name="Publish").click()
  t("validation name", "Enter a name" in dlg.inner_text())
  dlg.get_by_role("radio",name=re.compile("Coupon code")).click(); dlg.get_by_label("Name (English)").fill("Eid")
  dlg.get_by_label("Coupon code").fill("BIZ1500"); dlg.get_by_role("button",name="Publish").click()
  t("dup code", "already used" in dlg.inner_text())
  dlg.get_by_role("button",name="Generate").click()
  t("generate code", dlg.get_by_label("Coupon code").input_value().startswith("EID"))
  dlg.get_by_label("Percent").fill("95"); dlg.get_by_role("button",name="Publish").click()
  t("max percent", "Up to 90%" in dlg.inner_text())
  dlg.get_by_label("Percent").fill("15"); dlg.get_by_role("radio",name="Room types").click(); dlg.get_by_role("button",name="Publish").click()
  t("scope required", "Pick at least one room type" in dlg.inner_text())
  dlg.get_by_role("button",name="Deluxe Garden View").click(); dlg.get_by_role("button",name="Publish").click(); pg.wait_for_timeout(300)
  t("created", pg.get_by_role("dialog").count()==0 and "Eid" in pg.get_by_role("main").inner_text())
  # flash deal create and reflect
  pg.get_by_role("button",name="New campaign").click(); dlg=pg.get_by_role("dialog")
  dlg.get_by_label("Name (English)").fill("Flash20"); dlg.get_by_label("Percent").fill("20"); dlg.get_by_role("button",name="Publish").click(); pg.wait_for_timeout(300)
  pg.goto(B); pg.wait_for_timeout(1000)
  t("flash on calendar", "10,000" in price(pg,11))  # 12,500 * 0.8
  pg.goto(B+"/campaigns"); pg.wait_for_timeout(900)
  card=pg.locator("li").filter(has_text="Flash20"); card.get_by_role("button",name="Pause").click(); pg.wait_for_timeout(200)
  t("paused", "Paused" in card.inner_text())
  card.get_by_role("button",name="Resume").click(); pg.wait_for_timeout(200)
  t("resumed", "Active" in card.inner_text())
  pg.get_by_role("tab",name=re.compile("Expired")).click()
  t("filter expired", pg.locator("li").filter(has_text="Werwer").count()==1 and pg.locator("li").filter(has_text="Flash20").count()==0)
  pg.get_by_role("tab",name=re.compile("^All")).click()
  pg.once("dialog", lambda d: d.accept()); pg.get_by_role("button",name="Delete Flash20").click(); pg.wait_for_timeout(300)
  t("deleted", pg.locator("li").filter(has_text="Flash20").count()==0)
  pg.locator("li").filter(has_text="Corporate").get_by_role("button",name="Edit").click(); dlg=pg.get_by_role("dialog")
  t("edit prefilled", dlg.get_by_label("Coupon code").input_value()=="BIZ1500")
  dlg.get_by_role("button",name="Save draft").click(); pg.wait_for_timeout(300)
  t("draft", "Draft" in pg.locator("li").filter(has_text="Corporate").inner_text())
  pg.get_by_label("Search campaigns").fill("eid")
  t("search", pg.locator("ul > li").count()==1)
  # mobile range
  m=b.new_page(viewport={"width":390,"height":860}); m.goto(B); m.wait_for_timeout(1200)
  m.get_by_role("button",name="16").first  # noop
  day(m,16).click(); m.get_by_role("button",name="Select range").click(); day(m,18).click(); m.wait_for_timeout(400)
  t("mobile range", "3 nights" in m.get_by_role("region",name="Edit selected nights").inner_text())
  t("mobile compact price", "k" in day(m,20).inner_text())
  t("no page errors", not errs)
  print(f"{ok}/{ok+fail}")
