# Deal Analyzer

This tool supports multiple calculation presets and bases. Presets correspond to common underwriting views:

- **DealCheck** – parity with DealCheck: loan and cap on purchase price, expenses on EGI, invested = down payment.
- **Lender** – bank-oriented view; invested basis includes rehab and closing.
- **Conservative** – all-in denominators for loan and cap, expenses on gross rent.
- **Broker** – marketing view using purchase price and gross rent.
- **Custom** – user-defined bases.

Key rental KPIs are computed via `lib/calc/formulas.ts`. Each KPI includes an `explain` field showing formulas and inputs used to derive it.
