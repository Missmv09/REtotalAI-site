#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   chmod +x scripts/run_deal_tests.sh
#   SERVICE=https://retotalai-site.onrender.com ./scripts/run_deal_tests.sh
#
# Requires: jq, curl

SERVICE="${SERVICE:-https://retotalai-site.onrender.com}"
HDR_CONTENT='Content-Type: application/json'
ORIGIN='Origin: https://r-etotal-ai-site.vercel.app'

opener() {
  if command -v open >/dev/null 2>&1; then open "$1";
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$1";
  else echo "Open this in a browser: $1"; fi
}

post_deal() {
  local body="$1"
  curl -s -X POST "$SERVICE/api/deals" -H "$HDR_CONTENT" -H "$ORIGIN" -d "$body" | jq -r .id
}

echo "Running tests against: $SERVICE"
echo "===================================================="

echo "[1] Rental — baseline"
ID1=$(post_deal '{
  "property": { "address": "123 Oak Lane, Dallas, TX", "type": "Single Family" },
  "numbers": {
    "purchase": 150000, "arv": 160000, "rehab": 10000, "rent": 1300,
    "taxes": 2500, "insurance": 900, "hoa": 0,
    "vacancyPct": 5, "maintenancePct": 5, "managementPct": 8, "otherMonthly": 25,
    "downPct": 20, "ratePct": 7.0, "termYears": 30
  }
}')
echo "Deal ID: $ID1"
opener "$SERVICE/api/deals/$ID1/report"

echo "[2] Rental — stronger"
ID2=$(post_deal '{
  "property": { "address": "742 Evergreen Terrace, Springfield, USA", "type": "Single Family" },
  "numbers": {
    "purchase": 180000, "arv": 220000, "rehab": 15000, "rent": 1950,
    "taxes": 3600, "insurance": 1200, "hoa": 0,
    "vacancyPct": 5, "maintenancePct": 5, "managementPct": 8, "otherMonthly": 50,
    "downPct": 20, "ratePct": 7.0, "termYears": 30
  }
}')
echo "Deal ID: $ID2"
opener "$SERVICE/api/deals/$ID2/report"

echo "[3] Flip — negative margin"
ID3=$(post_deal '{
  "property": { "address": "456 Maple St, Atlanta, GA", "type": "Fix & Flip" },
  "numbers": {
    "purchase": 220000, "arv": 320000, "rehab": 60000,
    "downPct": 15, "ratePct": 8.5,
    "holdingMonths": 6, "carryOtherMonthly": 200,
    "sellingCostPct": 8, "closingCostPct": 2
  }
}')
echo "Deal ID: $ID3"
opener "$SERVICE/api/deals/$ID3/report"

echo "[4] Flip — profitable"
ID4=$(post_deal '{
  "property": { "address": "456 Maple St, Atlanta, GA", "type": "Fix & Flip" },
  "numbers": {
    "purchase": 220000, "arv": 360000, "rehab": 60000,
    "downPct": 15, "ratePct": 8.5,
    "holdingMonths": 6, "carryOtherMonthly": 200,
    "sellingCostPct": 8, "closingCostPct": 2
  }
}')
echo "Deal ID: $ID4"
opener "$SERVICE/api/deals/$ID4/report"

echo "[5] Pagination stress"
ID5=$(post_deal '{
  "property": { "address": "999 Long Report Way, Phoenix, AZ", "type": "Single Family" },
  "numbers": {
    "purchase": 275000, "arv": 375000, "rehab": 65000, "rent": 2600,
    "taxes": 6200, "insurance": 1800, "hoa": 150,
    "vacancyPct": 7, "maintenancePct": 8, "managementPct": 9, "otherMonthly": 100,
    "downPct": 20, "ratePct": 7.25, "termYears": 30,
    "holdingMonths": 7, "carryOtherMonthly": 250,
    "sellingCostPct": 8, "closingCostPct": 2
  }
}')
echo "Deal ID: $ID5"
opener "$SERVICE/api/deals/$ID5/report"

echo "[6] Flip only — no rent"
ID6=$(post_deal '{
  "property": { "address": "No Rent Test, Miami, FL", "type": "Condo" },
  "numbers": {
    "purchase": 300000, "arv": 360000, "rehab": 40000,
    "downPct": 20, "ratePct": 7.0, "termYears": 30,
    "holdingMonths": 6, "sellingCostPct": 7, "closingCostPct": 2
  }
}')
echo "Deal ID: $ID6"
opener "$SERVICE/api/deals/$ID6/report"

echo "===================================================="
echo "All tests posted. Opened PDFs (use browser/system viewer)."

