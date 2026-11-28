# Creative ops — 28 Nov 2026 (branch feat/creative-ops, not on main)

Status: prototype, demo data. Not in the live HMS.

## 1. Housekeeping › Floor map (floor_map.png)
- New tab (also in the Expandable sidebar). The building drawn floor by floor, top floor first (floors/zones from Rooms setup).
- Room tile colour = cleaning state: Ready, Dirty, Cleaning, Awaiting inspection, Out of order. Tag = today (Guest in / Arriving / Leaving), initials = who has the task.
- Filter chips with counts. Tap a room → panel: type, floor, today's guest, task → Open task / Inspect, Add cleaning task (High if arriving), Mark dirty.
- Backend: none new — same housekeeping tasks + room states.

## 2. Booking calendar — drag to move, now with a live preview (calendar_drag.png)
- Drag-to-move already existed (room and/or dates, drag right edge = check-out, confirm with price change).
- New: while dragging, a dashed box shows where the stay lands; green = free, red = blocked, with a tag near the pointer
  ("Room 104 · 15 Nov – 17 Nov · 2 nights" or "Can't drop · Taken by BK-2402"). Dropping on a blocked spot shows the reason and does nothing.
- Same rules as moveStay (past check-in, out of order, clash, in-house only room/check-out).
- Not done: touch drag on tablets (needs long-press design).

## 3. Dashboard › Morning summary (morning_summary.png)
- Today in a few lines: arrivals, departures, in house/occupancy, room revenue, to collect, rooms not ready, restaurant orders, top 3 "needs you".
- SMS / Email toggles, Send now (goes through Messaging, counts credits, appears in Messaging › History as "Morning summary").
- "Send every morning at 08:00" is saved on this device only — **daily automatic sending needs a backend scheduler** (labelled in the UI).
- Owner contact = property phone/email (live: owner's own phone/email from the user profile).
