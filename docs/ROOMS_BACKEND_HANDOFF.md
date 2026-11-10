# Rooms / Accommodations — frontend ↔ backend handoff (v1, 10 Nov 2026)

**For:** HMS frontend dev + backend dev
**Backend source:** `ACCOMMODATION_MANAGEMENT_DEVELOPMENT_PLAN.md` v1.12 (M1/M2 in progress behind `ACCOMMODATION_DRAFT_CONFIGURATION_ENABLED`)
**Prototype:** `BINGI-WEB-theme-` repo → `/hms/rooms/*` (Next.js, localStorage per property). Branch `rooms-backend-align`.

**Status:** The prototype is **aligned to the plan's rules but not connected to any API.** The real HMS repo (`Bingi_hotel_management_web`) and the M0 contract doc were not available, so the exact endpoint paths and payloads below are **not confirmed**. They are grouped by the plan's §3.3 endpoint groups.

---

## 1. What changed in the prototype to match the backend plan

| Area | Before | Now (matches plan) |
|---|---|---|
| Core types | 6 including Dormitory | 5: ROOM, COTTAGE, VILLA, APARTMENT, OTHER |
| Presets | 14 cards incl. Dormitory | 13 with stable codes; CAPSULE_POD → OTHER (whole pod), HOLIDAY_HOME → VILLA (switchable), OTHER_CUSTOM |
| Dormitory / beds | Beds per room, bed codes D101-B01 | Removed. Per-bed selling is out of scope. Existing dorm categories show a "Not in this release" notice |
| Property types | Labels only | 10 stable codes (HOTEL … OTHER_CUSTOM) with type suggestions |
| Location kinds | building/floor/zone/block | BUILDING, TOWER, WING / FLOOR, LEVEL / ZONE, AREA, SECTION, CLUSTER / BLOCK (kind select in setup) |
| Numbering templates | 5 | 6 with codes: FLOOR_BASED, SEQUENTIAL, PREFIX_BASED, BLOCK_BASED, ZONE_BASED, CUSTOM_MANUAL |
| Category approval | None | New category = `pending`. Drafts allowed, **Publish disabled** until approved. Demo "Approve (BinGi demo)" button stands in for Superadmin |
| Delete draft unit | Hard delete | **Archive draft**: frees capacity, keeps the code reserved, hidden by default, "Archived" filter + stat |
| Category archive | None | Only when **all** its units are archived |
| Batch size | Unlimited | Max **100** per batch; extras listed as "not added" |
| Setup save | Last write wins | **Optimistic version**: stale → "Someone else saved…" + Reload latest |
| Label policy | Rooms if only Room enabled | "Rooms" only when Room is the only enabled **and** the only existing type; otherwise / before setup "Accommodations" |
| Capacity | Units count | "Units in use" (draft + published, not archived) with note: shared package limit + per-unit add-on come from Billing |
| Bug fixed | — | Setup and Add screens now start from saved browser data, not the server seed (previous version could overwrite enabled types) |

---

## 2. Screen → API map

> Endpoint names are **descriptive**, not final paths. Confirm against M0 / the real repo's routes.

### 2.1 Setup — `/hms/rooms/setup` (also the onboarding Room Inventory step, 4 internal screens)

| Step | UI | Backend (plan group) | Plan status |
|---|---|---|---|
| Types | Property type (read-only from onboarding), enable core types | Catalogs GET; configuration GET + save with `version` | **Built** (gated HMS + onboarding screen 1) |
| Locations | Building/Tower/Wing → Floor/Level; Zone/Area/Section/Cluster → Block; code optional | Location tree list/create, edit name/order, impact preview, deactivate unused leaf | **Built** (gated HMS + onboarding screen 2) |
| Numbering | Template per type, prefixes, live preview | Numbering-rule CRUD, number preview, collision check | **Not built** (plan: open) |
| Review | Summary, save | Save configuration `version` | Partly |

Rules the UI must respect:
- Saving sends the `version` loaded at screen open. On a stale-version error: show the banner, reload, ask the user to redo the change.
- **Location codes, parents and kinds are locked after creation** in the backend. The prototype still lets the code be edited before save — in the real UI, lock them once the location exists.
- "Remove floor" in the prototype = **deactivate an unused leaf** in the backend (codes stay reserved). Call impact preview first.

### 2.2 Add accommodation — `/hms/rooms/new` (5 steps)

| Step | UI | Backend | Plan status |
|---|---|---|---|
| 1 Type | Preset card; "works as" core switch for specialty; turn on a disabled core | Catalog (presets); configuration save (enable type) | Built |
| 2 Category | Pick existing or create (name, price, guests, size, bedrooms, bathrooms, amenities, optional YouTube) | Category draft create/edit | **Built** (draft basics); one-category trial enforced |
| 3 Location & units | Number library: pick, Next N, Range, Type numbers; max 100 | Exact-code **preview** (conflicts + capacity) → atomic batch draft create | **Built** (explicit per-unit location, local number, full code) |
| 4 Details & pricing | Only differences: own price, video inherit/replace/hide, note | Unit edit (versioned) | Partly (location/number/code edit built) |
| 5 Review | Checks (unique codes, price, approval, batch ≤100) → Save setup draft / Create as draft / Publish | Batch create; publish | Draft **built**; **publish not built** |

Notes:
- The prototype computes codes in the browser from the numbering template. Today's backend accepts **explicit codes**, so the frontend can send computed codes until numbering rules exist on the server.
- Batch create is **all-or-nothing**: on conflict, show the exact codes, create nothing (prototype already does this).
- "Save setup draft" (no codes reserved) is a client-side resume draft; there is no backend endpoint for it in the plan. Decide: keep it client-side or drop it.

### 2.3 Units list — `/hms/rooms`

| UI | Backend | Status |
|---|---|---|
| Stats: Units in use / Published / Drafts / Archived | Usage-summary API (shared capacity, legacy Rooms, new units, remaining) | **Built** (read-only card) |
| Grouped list, filters (type, status incl. Archived) | Unit search | Built (category units list) |
| Drawer: own price, video, note, Publish / Move to draft / Archive draft | Unit edit; draft archive; publish/unpublish | Archive **built**; publish **not built** |
| Publish all drafts | Bulk publish | Not built |

### 2.4 Categories — `/hms/rooms/categories`

| UI | Backend | Status |
|---|---|---|
| Card + approval banner "Waiting for BinGi approval" | Category approval status | Pending count shown in Superadmin read-only panel; **approval UI not built** |
| Edit (name unique) | Category edit | Built — **locked once approved/mapped/published/has units** |
| Archive (all units archived) | Category archive (versioned) | **Built** |

### 2.5 Billing note (Units page + Review)
Shared unit limit across all types + per-unit add-on. Backend quote preview exists (read-only, non-payable). The prototype only shows a text note; it does **not** calculate the price.

---

## 3. Frontend blueprint (real HMS repo)

1. Reuse the dev's existing gated screens for Types, Locations, Categories, Units, usage card and quote panel. **Don't rebuild them**; restyle to the prototype layout.
2. Port from the prototype: the 5-step Add wizard and number library (pick / Next N / Range / Type numbers), the review checks, the drawer, the approval banner, archive flows, the stale-version banner, the label policy and the empty/intro screen.
3. One shared setup component for HMS `/rooms/setup` and the onboarding Room Inventory step (4 internal screens). Keep the `room_inventory` step key.
4. Every write: role + property + permission (`manage_rooms`) + Rooms module + subscription. Hide/disable actions the user can't do.
5. States per screen: loading, empty (intro "Set up your accommodation once"), error, stale version, capacity full, trial limit (one category, three bookings pre-KYC).
6. Keep these separate in UI: unit lifecycle (draft/published/archived), category approval, room readiness/housekeeping, maintenance, booking and payment status.

## 4. Backend blueprint (what the prototype needs that isn't built yet)

1. Numbering-rule CRUD + server number preview (6 templates).
2. Publish / unpublish unit and bulk publish, refusing unapproved categories and over-capacity.
3. Superadmin category approval (approve / reject with reason) + HMS read of approval status.
4. Unit details edit: own rate, media mode (inherit/replace/hide), YouTube validation, note.
5. Confirm: is "Save setup draft" (client resume) needed server-side?

## 5. Open questions (need M0 / the real repo)

1. Exact endpoint paths and payload shapes for each group above.
2. Error codes for stale version, capacity full, trial limit, code conflict — the UI shows different messages for each.
3. Does approval apply to the category, each unit, or publication? (Plan §: "decide whether existing room approval extends…".) Prototype assumes category.
4. Can a hotel reactivate a deactivated location or unarchive a unit? (Plan: reactivation rules open.)
5. Mixed-property label: is the "only represented type" counted from published units, or drafts too? Prototype counts all non-archived units.
6. Migration of existing dorm / per-bed hotels (e.g. hostel demo): hidden, read-only, or converted?

## 6. Not done in this release
Allocation and availability (M3), bookings for non-Room units, public website Stays / themes (M5), billing checkout, OTA mapping, photo upload — all backend or later milestones. The prototype makes none of these claims.
