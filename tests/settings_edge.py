import re, json
from playwright.sync_api import sync_playwright
B="http://localhost:3100"
ok=0;n=0;fails=[]
def t(m,c):
  global ok,n; n+=1; ok+=bool(c); print(("PASS " if c else "FAIL ")+m, flush=True)
  if not c: fails.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); errs=[]
  pg=b.new_page(viewport={"width":1440,"height":900}); pg.on("pageerror",lambda e: errs.append(str(e)[:200]))
  M=lambda: pg.locator("main").inner_text()
  ST=lambda: pg.get_by_role("status").inner_text() if pg.get_by_role("status").count() else ""
  SV=lambda: pg.get_by_role("button",name="Save",exact=True)
  pg.goto(B+"/hms/settings"); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
  # persistence after reload
  pg.goto(B+"/hms/settings/profile"); pg.wait_for_timeout(900)
  pg.get_by_label("Phone",exact=True).first.fill("01999000111"); SV().click(); pg.wait_for_timeout(300)
  pg.reload(); pg.wait_for_timeout(1200)
  t("saved survives reload", pg.get_by_label("Phone",exact=True).first.input_value()=="01999000111")
  t("no save bar after reload (no false dirty)", SV().count()==0)
  # discard
  pg.get_by_label("Phone",exact=True).first.fill("x"); pg.get_by_role("button",name="Discard").click(); pg.wait_for_timeout(200)
  t("discard restores", pg.get_by_label("Phone",exact=True).first.input_value()=="01999000111" and SV().count()==0)
  # validation: empty name
  pg.get_by_label("Property name").fill(""); SV().click(); pg.wait_for_timeout(300)
  t("empty name blocked", "can't be empty" in ST() and SV().count()==1)
  pg.get_by_role("button",name="Discard").click()
  # bad email / phone validation?
  pg.get_by_label("Email",exact=True).first.fill("not-an-email"); SV().click(); pg.wait_for_timeout(300)
  t("bad email blocked", SV().count()==1)
  pg.get_by_role("button",name="Discard").click()
  # unsaved changes when leaving page
  pg.get_by_label("City").fill("Chattogram")
  pg.get_by_role("complementary",name="Settings").get_by_role("link",name="Branding").click(); pg.wait_for_timeout(900)
  t("leaving with unsaved changes asks (dismissed = stay)", "/profile" in pg.url and pg.get_by_label("City").input_value()=="Chattogram")
  pg.get_by_role("button",name="Discard").click(); pg.wait_for_timeout(200)
  # property isolation
  pg.goto(B+"/hms/settings/taxes"); pg.wait_for_timeout(900)
  pg.get_by_label("VAT",exact=True).fill("7"); SV().click(); pg.wait_for_timeout(300)
  pg.evaluate("localStorage.setItem('hms-property','sea-pearl')"); pg.reload(); pg.wait_for_timeout(1200)
  t("other property keeps own VAT", pg.get_by_label("VAT",exact=True).input_value()=="15")
  pg.evaluate("localStorage.setItem('hms-property','azure-bay')"); pg.reload(); pg.wait_for_timeout(1200)
  t("first property still 7", pg.get_by_label("VAT",exact=True).input_value()=="7")
  # number inputs: letters/over 100
  pg.get_by_label("VAT",exact=True).fill("150"); pg.wait_for_timeout(100)
  t("VAT capped at 100", pg.get_by_label("VAT",exact=True).input_value()=="100")
  pg.get_by_label("VAT",exact=True).fill("abc"); t("letters ignored", pg.get_by_label("VAT",exact=True).input_value() in ("0",""))
  pg.get_by_label("VAT",exact=True).fill("15"); SV().click(); pg.wait_for_timeout(300)
  # decimal VAT 7.5
  pg.get_by_label("VAT",exact=True).fill("7.5"); t("decimal VAT kept", pg.get_by_label("VAT",exact=True).input_value()=="7.5"); pg.get_by_role("button",name="Discard").click()
  # policies: check-out after check-in? fee empty
  pg.goto(B+"/hms/settings/policies"); pg.wait_for_timeout(900)
  pg.get_by_label("Free cancellation days").fill("400"); SV().click(); pg.wait_for_timeout(300)
  t("free-cancel days capped at 60", pg.get_by_label("Free cancellation days").input_value()=="60")
  if SV().count(): pg.get_by_role("button",name="Discard").click()
  # payments: enabling bKash on website without account
  pg.goto(B+"/hms/settings/payments"); pg.wait_for_timeout(900)
  pg.get_by_role("switch",name="Nagad on",exact=True).click(); SV().click(); pg.wait_for_timeout(300)
  t("method on without account blocked", SV().count()==1 and "account" in ST().lower())
  if pg.get_by_role("button",name="Discard").count(): pg.get_by_role("button",name="Discard").click()
  # users: last owner / no role invite
  pg.goto(B+"/hms/settings/users"); pg.wait_for_timeout(900)
  pg.get_by_label("Check-out by").fill("15:00") if False else None
  # roles: role with users can't be deleted; delete custom role
  pg.get_by_role("button",name="Roles").click(); pg.get_by_label("New role name").fill("Temp"); pg.get_by_role("button",name="Add role").click()
  t("custom role has delete", pg.get_by_role("button",name="Delete role Temp").count()==1)
  pg.get_by_role("button",name="Delete role Temp").click(); t("deleted before save", "Temp" not in M())
  t("default roles have no delete", pg.get_by_role("button",name=re.compile("^Delete role (Manager|Front office)")).count()==0)
  # printers: add then remove; kitchen printer appears
  pg.goto(B+"/hms/settings/documents"); pg.wait_for_timeout(900)
  pg.get_by_role("button",name="Printers").click(); pg.get_by_label("Printer name").fill("KOT-1"); pg.get_by_label("Printer type").select_option("Kitchen (KOT)"); pg.get_by_role("button",name="Add").click(); SV().click(); pg.wait_for_timeout(300)
  pg.reload(); pg.wait_for_timeout(1000); pg.get_by_role("button",name="Printers").click()
  t("printer persisted", "KOT-1" in M())
  # keyboard: nav links focusable, search Esc
  pg.goto(B+"/hms/settings"); pg.wait_for_timeout(800)
  pg.get_by_label("Search settings").fill("zzzz"); t("search empty state", "Nothing matches" in pg.get_by_role("complementary",name="Settings").inner_text())
  # phone nav current visible
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/settings/messages"); m.wait_for_timeout(1200)
  cur=m.get_by_role("navigation",name="Settings pages").locator("[aria-current=page]"); bx=cur.bounding_box()
  t("phone nav shows current page", bx and 0<=bx["x"] and bx["x"]+bx["width"]<=390)
  t("phone: messages tabs fit", m.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
  m.goto(B+"/hms/settings/users"); m.wait_for_timeout(1200)
  t("phone users no overflow", m.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"))
  m.screenshot(path="/tmp/st/m_users.png", full_page=False)
  m.goto(B+"/hms/settings/payments"); m.wait_for_timeout(1200); m.screenshot(path="/tmp/st/m_pay.png")
  m.goto(B+"/hms/settings/messages"); m.wait_for_timeout(1200); m.screenshot(path="/tmp/st/m_msg.png")
  t(f"no page errors {errs}", not errs)
  print(f"{ok}/{n}"); print("FAILS:",fails)
