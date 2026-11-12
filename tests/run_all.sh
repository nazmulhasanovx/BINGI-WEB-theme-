#!/bin/bash
# Runs every functional suite against the dev server on :3100. Prints one line per suite.
cd "$(dirname "$0")/.."
for f in tests/plan/gates.py tests/payments/func.py tests/payments/edge.py tests/payments/conn.py tests/expenses/func.py tests/finance/func.py \
         tests/reports/func.py tests/communication/func.py tests/chat/func.py tests/dashboard/func.py tests/website/func.py \
         tests/settings_func.py tests/settings_edge.py tests/bookings/func.py tests/bookings/v3_a.py tests/bookings/v3_b.py tests/bookings/v3_c.py \
         tests/bookings/v3_c2.py tests/bookings/v3_d.py tests/bookings/v3_e.py tests/onboarding/flow.py tests/combo.py tests/news/func.py tests/housekeeping/func.py tests/rooms/func.py tests/rooms/func_v1_adapted.py; do
  r=$(timeout 400 python3 "$f" 2>&1 | grep -E "FAIL|ALL PASS|FAILS:|Error| / [0-9]+" | head -3 | tr '\n' ' ')
  echo "$f :: ${r:-no summary}"
done
