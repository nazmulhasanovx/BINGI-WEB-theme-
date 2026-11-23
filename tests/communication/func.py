from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
num=lambda s: float(re.sub(r"[^\d.]","",s) or 0)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/communication"); pg.wait_for_timeout(1800); pg.screenshot(path="/tmp/cm/ov.png", full_page=True)
  main=pg.inner_text("main")
  for k in ["Email credits","SMS credits","Sent today","Cost this month","automatic messages on","Prototype"]: t("overview "+k, k in main)
  sms0=int(num(pg.locator("p:has-text('SMS credits') + p").first.inner_text()))
  # automatic messages: toggle + persists in settings
  pg.get_by_role("tab",name="Automatic messages").click(); pg.wait_for_timeout(500)
  t("15 events in groups", pg.locator("main ul li").count()>=15 and "Team alerts" in pg.inner_text("main"))
  cb=pg.get_by_label("Room ready by SMS"); was=cb.is_checked(); cb.click(); pg.wait_for_timeout(300)
  pg.reload(); pg.wait_for_timeout(1500); t("toggle persists", pg.get_by_label("Room ready by SMS").is_checked()!=was)
  # edit confirm text → bookings settings
  pg.get_by_role("button",name="Edit text for Booking confirmed").click(); pg.wait_for_timeout(300)
  dl=pg.get_by_role("dialog"); t("preview fills placeholders", "{guest}" not in dl.locator("p.whitespace-pre-wrap").inner_text())
  pg.locator("#tpl").fill("Hi {guest}, booking {code} confirmed. "+"x"*400); pg.wait_for_timeout(200)
  t("sms parts warning", "shorten it" in dl.inner_text())
  pg.locator("#tpl").fill("Hi {guest}, booking {code} at {hotel} is confirmed."); pg.get_by_role("button",name="Save text").click(); pg.wait_for_timeout(400)
  pg.goto(B+"/hms/settings/messages"); pg.wait_for_timeout(1300)
  # policy
  pg.goto(B+"/hms/communication?tab=policy"); pg.wait_for_timeout(1300)
  t("save disabled when clean", pg.get_by_role("button",name="Save policy").is_disabled())
  pg.get_by_role("radio",name=re.compile("Cost-aware")).click(); t("profile applies fields", not pg.get_by_label("SMS when email fails").is_checked())
  pg.get_by_label("SMS sender name (optional)").fill("TOO LONG SENDER"); t("sender validation", "up to 11" in pg.inner_text("main") and pg.get_by_role("button",name="Save policy").is_disabled())
  pg.get_by_label("SMS sender name (optional)").fill("AZUREBAY"); pg.get_by_role("button",name="Save policy").click(); pg.wait_for_timeout(300)
  pg.reload(); pg.wait_for_timeout(1300); t("policy persists", pg.get_by_label("SMS sender name (optional)").input_value()=="AZUREBAY")
  # credits buy → finance
  pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1500); ms0=num(pg.locator("p:text-is('SMS & email') + p").inner_text())
  pg.goto(B+"/hms/communication?tab=credits"); pg.wait_for_timeout(1300)
  pg.get_by_role("button",name="Buy").first.click(); pg.wait_for_timeout(300); pg.get_by_role("button",name=re.compile("^Pay ")).click(); pg.wait_for_timeout(400)
  t("bought listed", "CR-1001" in pg.inner_text("main"))
  sms1=int(num(pg.locator("p:has-text('SMS credits') + p").first.inner_text())); t("SMS credits +100", sms1==sms0+100); print(sms0,sms1)
  pg.goto(B+"/hms/finance"); pg.wait_for_timeout(1500); ms1=num(pg.locator("p:text-is('SMS & email') + p").inner_text()); t("finance SMS & email +45", abs(ms1-ms0-45)<0.01); print(ms0,ms1)
  # history: compose & failed retry
  pg.goto(B+"/hms/communication?tab=history"); pg.wait_for_timeout(1300)
  n0=pg.locator("main ul li").count()
  pg.get_by_role("button",name="New message").click(); pg.get_by_role("button",name=re.compile("^Send")).click(); t("compose needs text", "Write a message" in pg.get_by_role("dialog").inner_text())
  pg.locator("#cm-t").fill("Dear {guest}, your airport pickup is at 3 pm."); pg.get_by_role("button",name=re.compile("^Send")).click(); pg.wait_for_timeout(400)
  t("sent appears", pg.locator("main ul li").count()==n0+1 and "Sent by staff" in pg.locator("main ul li").first.inner_text())
  pg.get_by_label("Status").select_option("failed"); pg.wait_for_timeout(300)
  if pg.locator("main ul li").count():
    pg.locator("main ul li button").first.click(); pg.get_by_role("button",name="Send again").click(); pg.wait_for_timeout(300)
    t("retry clears failed", "Sent again" in pg.inner_text("body"))
  pg.goto(B+"/hms/communication?tab=report"); pg.wait_for_timeout(1300); t("report table", pg.locator("main table tbody tr").count()>0)
  pg.evaluate("localStorage.setItem('hms-property','sea-pearl')"); pg.goto(B+"/hms/communication?tab=credits"); pg.wait_for_timeout(1300)
  t("business: Messaging is Ultra (plan page)", "is part of Ultra" in pg.inner_text("main"))  # (only one demo property is on Ultra, so per-property isolation is covered by the store tests)
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
