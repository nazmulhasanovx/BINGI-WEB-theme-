# Modules, Plans & Roles v1 (22 Nov 2026): plan × role decides the sidebar, the page guard and the home.
import re
from playwright.sync_api import sync_playwright
B = "http://localhost:3100"; R = []
def t(n, ok, d=""): R.append(ok); print(("PASS " if ok else "FAIL ") + n, "" if ok else d)
def nav(pg): return [x.strip() for x in pg.get_by_role("navigation", name="HMS").first.locator("a").all_inner_texts()]
with sync_playwright() as p:
  b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 900}); errs = []
  pg.on("pageerror", lambda e: errs.append(str(e)))
  pg.goto(B + "/hms"); pg.evaluate("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('bingi-news-seen','all')")
  def go(prop, path="/hms", view=None, w=1800):
    pg.evaluate(f"localStorage.setItem('hms-property','{prop}')")
    pg.evaluate(f"sessionStorage.setItem('bingi-view-as','{view}')" if view else "sessionStorage.removeItem('bingi-view-as')")
    pg.goto(B + path); pg.wait_for_timeout(w)
  # --- Starter owner: hidden, not locked; upgrade card; Finance stays (BinGi balance + payouts) ---
  go("tea-valley"); n = nav(pg)
  for m in ["Housekeeping", "Meals", "Staff", "Inventory", "Cashbox", "Expenses", "Communication Center", "Other Services"]:
    t(f"starter hides {m}", not any(x.startswith(m) for x in n), n)
  for m in ["Dashboard", "Bookings", "Guests", "Chat", "Payments", "Finance", "Billing & Subscription", "Reports", "Website Management", "Settings"]:
    t(f"starter shows {m}", any(x.startswith(m) for x in n), n)
  t("starter: no lock icons", pg.get_by_label("Not in your plan").count() == 0)
  t("starter: upgrade card for owner", pg.get_by_role("link", name=re.compile("See Business")).count() >= 1)
  t("starter dashboard: booking sources", pg.get_by_role("heading", name="Booking sources").count() == 1)
  go("tea-valley", "/hms/housekeeping")
  t("starter owner direct link → plan page", "is part of Business" in pg.locator("main").inner_text())
  go("tea-valley", "/hms/bookings/board")
  t("starter: room board → plan page", "Room board is part of Business" in pg.locator("main").inner_text())
  go("tea-valley", "/hms/bookings")
  t("starter: no Room board tab", pg.get_by_role("navigation", name="Bookings views").get_by_role("link", name="Room board").count() == 0)
  # --- Business owner: Ultra modules locked ---
  go("sea-pearl"); n = nav(pg)
  locks = pg.get_by_role("navigation", name="HMS").first.get_by_label("Not in your plan").count()
  t("business: 3 locks (Staff, Inventory, Communication)", locks == 3, locks)
  for m in ["Housekeeping", "Meals", "Cashbox", "Expenses", "Other Services"]:
    t(f"business shows {m}", any(x.startswith(m) for x in n), n)
  t("business: no upgrade card", pg.get_by_role("link", name=re.compile("See Business")).count() == 0)
  go("sea-pearl", "/hms/communication")
  t("business: communication → Ultra plan page", "is part of Ultra" in pg.locator("main").inner_text())
  go("sea-pearl", "/hms/bookings")
  t("business: Room board tab", pg.get_by_role("navigation", name="Bookings views").get_by_role("link", name="Room board").count() == 1)
  # --- Ultra owner: everything, no locks ---
  go("azure-bay")
  t("ultra: no locks", pg.get_by_label("Not in your plan").count() == 0)
  t("ultra: 20 sidebar items", len(nav(pg)) == 20, len(nav(pg)))
  # --- Roles (Business property) ---
  go("sea-pearl", view="front"); n = nav(pg)
  t("front desk: role home", pg.get_by_role("heading", name="Arriving today").count() == 1 and "Front desk" in pg.locator("main").inner_text())
  t("front desk: no locks shown", pg.get_by_label("Not in your plan").count() == 0)
  t("front desk: Payments + Cashbox (desk money)", "Payments" in n and "Cashbox" in n, n)
  t("front desk: no Finance / Expenses / Billing / Settings", not any(x in n for x in ["Finance", "Expenses", "Billing & Subscription", "Settings"]), n)
  t("front desk: no revenue numbers", "Today’s revenue" not in pg.locator("main").inner_text())
  t("front desk: Take payment action", pg.get_by_role("link", name="Take payment").count() == 1)
  go("sea-pearl", "/hms/finance", view="front")
  t("front desk → finance: no access", pg.get_by_role("heading", name="You don't have access").count() == 1)
  go("sea-pearl", "/hms/housekeeping", view="front")
  t("front desk: housekeeping view only strip", pg.get_by_role("status", name="View only").count() == 1)
  go("sea-pearl", "/hms/staff", view="front")
  t("front desk → staff (not in plan): no access, no upgrade", pg.get_by_role("heading", name="You don't have access").count() == 1)
  go("sea-pearl", view="housekeeping"); n = nav(pg)
  t("housekeeping: 3 items", n == ["Dashboard", "Room / Accommodation", "Housekeeping"], n)
  t("housekeeping: cleaning tasks home", pg.get_by_role("heading", name="Cleaning tasks").count() == 1)
  go("sea-pearl", view="finance"); n = nav(pg)
  t("accountant: Billing (view) + Finance + Expenses", all(x in n for x in ["Billing & Subscription", "Finance", "Expenses", "Payments"]), n)
  t("accountant: no Website / Settings", "Website Management" not in n and "Settings" not in n, n)
  go("sea-pearl", "/hms/billing", view="finance")
  t("accountant: billing view only", pg.get_by_role("status", name="View only").count() == 1)
  go("sea-pearl", view="management"); n = nav(pg)
  t("manager: sees locks", pg.get_by_role("navigation", name="HMS").first.get_by_label("Not in your plan").count() == 3)
  t("manager: no Billing", "Billing & Subscription" not in n, n)
  t("manager: plan dashboard", pg.get_by_role("heading", name="Today's priorities").count() == 1)
  go("azure-bay", view="store"); n = nav(pg)
  t("ultra store role: inventory home", pg.get_by_role("heading", name="Low stock").count() == 1 and "Inventory" in n, n)
  go("azure-bay", view="hr"); n = nav(pg)
  t("ultra HR role: staff + leave list", "Staff" in n and pg.get_by_role("heading", name="Leave requests").count() == 1, n)
  # --- Account menu: View as role ---
  go("sea-pearl")
  pg.get_by_role("button", name=re.compile("Md Yeapas")).click(); pg.wait_for_timeout(200)
  pg.get_by_label("View as role").select_option("housekeeping"); pg.wait_for_timeout(1500)
  t("account menu: view as housekeeping", nav(pg) == ["Dashboard", "Room / Accommodation", "Housekeeping"], nav(pg))
  pg.get_by_role("button", name="Exit").click(); pg.wait_for_timeout(800)
  t("exit view as → owner sidebar", len(nav(pg)) == 20, len(nav(pg)))
  # --- Settings › Users & roles: split money areas + new roles ---
  go("azure-bay", "/hms/settings/users"); pg.get_by_role("button", name="Roles").click(); pg.wait_for_timeout(300)
  body = pg.locator("main").inner_text()
  t("roles page: Desk money + Office money + Rates", all(x in body for x in ["Desk money", "Office money", "Rates"]), body[:300])
  t("roles page: Store + HR roles", "Store" in body and "HR" in body)
  # --- old saved roles migrate ---
  pg.evaluate("""(() => { const k = 'bingi.settings.v1.sea-pearl'; const s = JSON.parse(localStorage.getItem(k) || 'null');
    if (!s) return; s.roles = s.roles.filter(r => r.id !== 'store' && r.id !== 'hr').map(r => { const p = { ...r.perms }; p.Money = p['Desk money'] || 'none'; delete p['Desk money']; delete p['Office money']; delete p.Rates; return { ...r, perms: p }; }); localStorage.setItem(k, JSON.stringify(s)); })()""")
  go("sea-pearl", "/hms/settings/users"); pg.get_by_role("button", name="Roles").click(); pg.wait_for_timeout(300)
  body = pg.locator("main").inner_text()
  t("migration keeps the page working", "Desk money" in body and "Store" in body, body[:200])
  # --- mobile tab bar respects the role ---
  pg.set_viewport_size({"width": 390, "height": 844})
  go("sea-pearl", view="housekeeping")
  tabs = pg.get_by_role("navigation", name="Quick navigation").inner_text()
  t("mobile tabs follow role", "Bookings" not in tabs and "Housekeeping" in tabs, tabs)
  t("no page errors", not errs, errs[:3])
  b.close()
print("ALL PASS" if all(R) else f"FAILED {R.count(False)}")
