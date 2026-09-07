# SheetSniper - Chrome Web Store Listing & Review Guide

## 1. Store Metadata

- **Title**: SheetSniper - 2026 Amazon FBA Calculator & Sheets Sync
- **Summary (Short Description - max 132 chars)**:
  `Accurate 2026 Amazon FBA fee calculator and 1-click sync to Google Sheets for Online Arbitrage sellers.` (104 characters)
- **Category**: Shopping (or Productivity)
- **Primary Language**: English (United States)
- **Pricing**: Free with in-app purchase ($9.99/mo or $79/yr)

---

## 2. Detailed Description (Copy & Paste to CWS Console)

```markdown
🎯 Stop paying $99/mo just for an Amazon FBA calculator. SheetSniper gives you accurate 2026 Amazon FBA calculations right on the product page and saves your profitable leads to Google Sheets in one click.

Whether you do Online Arbitrage (OA), Retail Arbitrage, or Wholesale, Amazon’s constantly changing fees can eat your profit margins if you rely on outdated tools.

⚡ WHAT MAKES SHEETSNIPER DIFFERENT?

1. 100% UPDATED 2026 OFFICIAL FBA FEES
Most free extensions still calculate with 2025 rates. SheetSniper includes:
• Official 2026 Amazon FBA Fulfillment Fee Tiers (including 2oz small-standard granular brackets).
• Active 3.5% Fuel & Inflation Surcharge calculation.
• Inbound Placement Service Fees (Minimal Split default + Optimized $0 toggle).
• Low-Inventory Fee simulation ($0.32).
• True Dimensional Weight vs. Actual Weight automatic adoption (139 divisor).

2. ONE-CLICK SYNC TO GOOGLE SHEETS
No more copying and pasting ASINs, profit margins, and dimensions manually.
• Hit "Push to Google Sheets" and SheetSniper instantly appends an 18-column sourcing row to your Google Drive.
• Includes ASIN, Product Title, Buy Cost, Sell Price, Net Profit, ROI %, Break-even Price, Dimensions, Weight, and Direct Amazon URL.

3. ZERO SERVER ARCHITECTURE · 100% PRIVATE & FAST
Unlike other tools that scrape your data and send your winning leads to their third-party databases, SheetSniper connects your browser DIRECTLY to your own Google Drive using secure Google OAuth (`auth/drive.file`).
• We never see, store, or sell your product leads.
• Lightning-fast speed with lightweight Shadow DOM that won’t slow down Amazon pages.

4. REAL-TIME PROFIT & BREAK-EVEN ANALYSIS
Type your Buy Cost (COG) and instantly see:
• Estimated Net Profit ($)
• ROI (%) & Profit Margin (%)
• Exact Break-Even Price
• Complete breakdown of Referral, Fulfillment, Placement, and Shipping fees.

---

💎 PRICING TRANSPARENCY:
• FBA Profit Calculator: 100% FREE FOREVER (Unlimited calculations, breakdowns, and break-even analysis).
• Google Sheets Sync: 10 Lifetime Free Pushes + 7-Day Free Pro Trial starting from your first push.
• SheetSniper Pro ($9.99/month or $79/year): Unlimited 1-click pushes to Google Sheets. Cancel anytime.

Built by active sellers for active sellers. Spend less time crunching numbers and more time finding winning inventory!
```

---

## 3. Chrome Web Store Privacy Questionnaire Answers

### Single Purpose Statement:
> "SheetSniper calculates real-time Amazon FBA fees and profit margins on Amazon product pages, and allows sellers to log calculated sourcing data to their personal Google Sheet with a single click."

### Permission Justifications:
1. **`identity`**:
   > "Used exclusively to authenticate the user via Google OAuth (`auth/drive.file` scope) so the extension can create and append sourcing rows to the user's personal Google Sheet on Google Drive."
2. **`storage`**:
   > "Used locally to store user default preferences (such as default inbound shipping cost and prep cost) and track free push quota locally on the client."
3. **`host_permissions`**:
   - `https://*.amazon.com/*` & `https://*.amazon.co.jp/*`: "Required to extract product title, price, dimensions, weight, and category from product detail pages to perform FBA fee calculations."
   - `https://www.googleapis.com/*` & `https://sheets.googleapis.com/*`: "Required to make direct REST API requests to Google Drive and Google Sheets to create the sourcing log and append rows."
   - `https://extensionpay.com/*`: "Required to verify optional subscription status and provide secure checkout via Stripe without hosting an external server."

### Data Usage:
- Do you collect personal information? **No**.
- Do you transfer data to third parties? **No**.
- Is data stored locally or directly in user's cloud? **Yes, direct to user's Google Drive**.

---

## 4. Required Visual Assets Checklist

1. **Icon**: 128x128 px (Ready in `icons/icon128.png`). Recommended: 512x512 px PNG.
2. **Screenshots (1280x800 or 640x400 px)**:
   - Screenshot 1: Amazon product page showing the floating panel with Net Profit, ROI, and Buy Cost.
   - Screenshot 2: Accordion opened showing the 2026 Amazon Fees Breakdown (Fuel surcharge, Inbound placement fee, FBA fee).
   - Screenshot 3: One-click "Push to Google Sheets" success toast + resulting Google Sheet with 18 columns filled.
3. **Small Promo Tile (440x280 px)**:
   - Clean dark background (`#0f172a`), SheetSniper logo (`🎯`), title "SheetSniper", tagline "2026 Amazon FBA Calculator & 1-Click Google Sheets Sync".
