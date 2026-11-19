# HRM → Department views: 8 templates, edit sidebar/home/cards/actions, role levels shown, compare all, "See HMS as" filters the sidebar.
from playwright.sync_api import sync_playwright
import re
B="http://localhost:3100"; F=[]
def t(m,c): print(("PASS " if c else "FAIL ")+m); c or F.append(m)
with sync_playwright() as p:
  b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900}); errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B+"/hms"); pg.evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('hms-property','azure-bay')")
  pg.goto(B+"/hms/staff"); pg.wait_for_timeout(1200)
  for x in pg.locator("[data-news-popup]").get_by_role("button",name="Later").all(): x.click()
  tab=pg.get_by_role("navigation", name="Team & HR").get_by_role("link", name="Department views")
  t("HRM has Department views tab", tab.count()>=1)
  tab.first.click(); pg.wait_for_url("**/staff/views"); pg.wait_for_timeout(800)
  opts=pg.get_by_role("listbox", name="Department views").get_by_role("option")
  t("8 department views", opts.count()==8)
  names=[o.inner_text() for o in opts.all()]
  t("owner + front desk + housekeeping + kitchen + finance present", all(any(n in x for x in names) for n in ["Owner","Front desk","Housekeeping","Restaurant & kitchen","Accounts & finance","Security"]))
  t("front desk selected first", "Front desk view" in pg.locator("h2").filter(has_text="view").first.inner_text())
  sb=pg.get_by_role("checkbox", name="Show Bookings")
  t("front desk: Bookings shown + can change", sb.get_attribute("aria-checked")=="true" and "Can change" in sb.inner_text() and "Opens here" in sb.inner_text())
  rm=pg.get_by_role("checkbox", name="Show Room / Accommodation")
  t("front desk: rooms view only (from role)", "View only" in rm.inner_text())
  pg.screenshot(path="/tmp/dv/1_front.png")
  # hide chat → toast + widget removed
  pg.get_by_role("checkbox", name="Show Chat").click(); pg.wait_for_timeout(300)
  t("hide Chat", pg.get_by_role("checkbox", name="Show Chat").get_attribute("aria-checked")=="false")
  t("chat home card dropped with module", pg.get_by_role("button", name="Unread guest chats").count()==0)
  t("toast", "Chat hidden" in pg.get_by_role("status").first.inner_text())
  # show Reports → role blocks warning (front role has none on Reports)
  pg.get_by_role("checkbox", name="Show Reports").click(); pg.wait_for_timeout(300)
  t("role-blocked warning", "has no access to Reports" in pg.inner_text("main"))
  pg.get_by_role("checkbox", name="Show Reports").click(); pg.wait_for_timeout(200)
  # can't hide home
  pg.get_by_role("checkbox", name="Show Bookings").click(); pg.wait_for_timeout(200)
  t("home can't be hidden", pg.get_by_role("checkbox", name="Show Bookings").get_attribute("aria-checked")=="true")
  # change home
  pg.select_option("#dv-home", "housekeeping"); pg.wait_for_timeout(200)
  t("opens on changes", "Opens here" in pg.get_by_role("checkbox", name="Show Housekeeping").inner_text())
  pg.select_option("#dv-home", "bookings")
  # preview
  pv=pg.get_by_role("region", name="Preview of Front desk view")
  t("preview shows sidebar + actions", "New booking" in pv.inner_text() and "Bookings" in pv.inner_text() and "Chat" not in pv.inner_text())
  # persistence
  pg.reload(); pg.wait_for_timeout(1000)
  t("saved after reload", pg.get_by_role("checkbox", name="Show Chat").get_attribute("aria-checked")=="false")
  # housekeeping + security
  pg.get_by_role("listbox", name="Department views").get_by_role("option", name=re.compile("^Housekeeping")).click(); pg.wait_for_timeout(300)
  t("housekeeping opens on Housekeeping", "Opens here" in pg.get_by_role("checkbox", name="Show Housekeeping").inner_text())
  pg.screenshot(path="/tmp/dv/2_hk.png")
  pg.get_by_role("listbox", name="Department views").get_by_role("option", name=re.compile("^Security")).click(); pg.wait_for_timeout(300)
  t("security: no role warning", "No role is set for Security" in pg.inner_text("main"))
  pg.get_by_role("listbox", name="Department views").get_by_role("option", name=re.compile("^Owner")).click(); pg.wait_for_timeout(300)
  t("owner: everything, locked", pg.get_by_role("checkbox", name="Show Settings").is_disabled() and pg.get_by_role("checkbox", name="Show Settings").get_attribute("aria-checked")=="true")
  # compare all
  pg.get_by_role("radio", name="Compare all").click(); pg.wait_for_timeout(300)
  tbl=pg.get_by_role("region", name="Compare all views")
  t("matrix 20 modules × 8 views", tbl.locator("tbody tr").count()==22 and tbl.locator("thead th").count()==9)
  pg.screenshot(path="/tmp/dv/3_compare.png", full_page=True)
  # See HMS as front desk
  pg.get_by_role("radio", name="By department").click(); pg.get_by_role("listbox", name="Department views").get_by_role("option", name=re.compile("^Front desk")).click(); pg.wait_for_timeout(200)
  pg.get_by_role("button", name="See HMS as Front desk").click(); pg.wait_for_url("**/hms/bookings"); pg.wait_for_timeout(1000)
  nav=pg.get_by_role("navigation", name="HMS").first.inner_text()
  t("banner shows", pg.get_by_role("region", name="Viewing as").count()==1)
  t("sidebar filtered (no Finance/Staff/Chat)", "Bookings" in nav and "Finance" not in nav and "Staff" not in nav and "Chat" not in nav)
  pg.screenshot(path="/tmp/dv/4_viewas.png")
  pg.get_by_role("region", name="Viewing as").get_by_role("button", name="Exit").click(); pg.wait_for_timeout(400)
  nav=pg.get_by_role("navigation", name="HMS").first.inner_text()
  t("exit restores full sidebar", "Finance" in nav and "Staff" in nav)
  t("no page errors", not errs)
  m=b.new_page(viewport={"width":390,"height":844}); m.goto(B+"/hms/staff/views"); m.wait_for_timeout(1200)
  t("mobile: no sideways scroll", m.evaluate("document.documentElement.scrollWidth<=innerWidth+1"))
  m.screenshot(path="/tmp/dv/5_mobile.png", full_page=False)
  b.close()
print("FAILED:",F) if F else print("ALL PASS")
