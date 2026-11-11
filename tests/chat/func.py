from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
  errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/chat"); pg.wait_for_timeout(1800); pg.screenshot(path="/tmp/ch/list.png")
  badge=pg.locator("nav a[href='/hms/chat'] span[aria-label$='unread']")
  t("sidebar unread badge", badge.count()>=1); u0=int(badge.first.inner_text()) if badge.count() else 0
  t("conversations listed", pg.locator("aside ul li").count()>=5)
  pg.get_by_role("button",name=re.compile("^Enquiries")).click(); pg.wait_for_timeout(200); t("enquiries filter", pg.locator("aside ul li").count()==2 and "ENQUIRY" in pg.locator("aside ul").inner_text())
  pg.get_by_role("button",name=re.compile("^Unread")).click(); pg.wait_for_timeout(200); nun=pg.locator("aside ul li").count()
  pg.locator("aside ul li button").first.click(); pg.wait_for_timeout(700)
  t("opening marks read", int(badge.first.inner_text()) < u0 if badge.count() else True)
  pg.screenshot(path="/tmp/ch/conv.png")
  pg.get_by_role("button",name=re.compile("^All")).click(); pg.wait_for_timeout(200)
  # booking thread with side panel
  pg.locator("aside ul li button", has_text="BK-").first.click(); pg.wait_for_timeout(600)
  t("booking side panel", pg.locator("aside[aria-label=Booking]").count()==1 and "Open booking" in pg.locator("aside[aria-label=Booking]").inner_text())
  n0=pg.locator("main .justify-end").count()
  pg.locator("#msg").fill("Your room will be ready at 12."); pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
  t("send with Enter", pg.locator("main .justify-end").count()==n0+1)
  pg.locator("#msg").fill("line1"); pg.keyboard.press("Shift+Enter"); pg.keyboard.type("line2"); t("shift+enter newline", "line1\nline2"==pg.locator("#msg").input_value())
  pg.locator("#msg").fill("")
  # quick replies manage
  pg.get_by_role("button",name="Quick replies").click(); pg.wait_for_timeout(300)
  pg.get_by_label("Payment note").fill("Send the advance by bKash and share the TrxID")
  pg.get_by_label("Location / directions").fill("Kolatoli Road, next to the Sugandha point")
  pg.get_by_label("Reply name").fill("Breakfast"); pg.get_by_label("Reply text").fill("Breakfast is 7–10 am, 1st floor."); pg.get_by_role("button",name="Add").click()
  pg.get_by_role("button",name="Save",exact=True).click(); pg.wait_for_timeout(400)
  t("chips appear", all(pg.get_by_role("button",name=x,exact=True).count()==1 for x in ["Payment details","Location","Breakfast"]))
  pg.get_by_role("button",name="Payment details",exact=True).click(); v=pg.locator("#msg").input_value(); t("payment chip inserts note", "TrxID" in v)
  pg.locator("#msg").fill(""); pg.get_by_role("button",name="Breakfast",exact=True).click(); t("quick reply inserts", "7–10 am" in pg.locator("#msg").input_value())
  pg.locator("#msg").fill("")
  # demo guest reply → unread when away
  pg.get_by_role("button",name="Demo: guest replies").click(); pg.wait_for_timeout(300); t("guest reply shows", "Thanks! See you soon." in pg.inner_text("main"))
  # settings page now links
  pg.goto(B+"/hms/settings/messages"); pg.wait_for_timeout(1300)
  t("settings links to Communication + Chat", pg.get_by_role("link",name="Open Communication Center").count()==1 and pg.get_by_role("link",name="Open Chat").count()==1 and "1 quick replies" in pg.inner_text("main"))
  # booking → chat link
  code="BK-2405"
  pg.goto(B+f"/hms/chat?b={code}"); pg.wait_for_timeout(1500); t("chat?b opens booking thread", code in pg.locator("main header").first.inner_text()); print(code)
  # new conversation
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/chat"); m.wait_for_timeout(1500); m.screenshot(path="/tmp/ch/m_list.png")
  m.locator("aside ul li button").first.click(); m.wait_for_timeout(700); m.screenshot(path="/tmp/ch/m_conv.png")
  t("mobile: conversation full screen with back", m.get_by_role("button",name="Back to conversations").is_visible() and not m.locator("aside").first.is_visible())
  b.close(); print(errs[:3]); t("no page errors", not errs)
print("FAILED:",F) if F else print("ALL PASS")
