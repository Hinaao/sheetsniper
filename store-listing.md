# SheetSniper - Chrome Web Store Listing & ASO Guide (Updated for 2026 Q4)

## 1. Store Metadata

- **Title (Item Name - max 75 chars)**:
  `SheetSniper - 2026 Amazon FBA Profit Calculator & Sheets Sync` (61 chars)
- **Summary (Short Description - max 132 chars)**:
  `2026 Amazon FBA Profit Calculator & 1-Click Google Sheets Sync for Online Arbitrage (OA) & Wholesale. No Seller Central login needed.` (130 chars)
- **Category**: Productivity (or Shopping)
- **Primary Language**: English (United States)
- **Pricing**: Free with in-app purchase ($9.99/mo or $79/yr)

---

## 2. Detailed Description (Copy & Paste to CWS Console)

```markdown
🎯 Stop paying $40–$99/month just to calculate Amazon fees and log sourcing leads. SheetSniper is the fast, lightweight, and 100% private 2026 Amazon FBA Profit Calculator that logs profitable leads directly into your Google Sheets in a single click.

Designed specifically for Online Arbitrage (OA), Retail Arbitrage (RA), and Wholesale sellers who want accurate fee calculations without risking their Amazon account or giving up their private product leads.

---

⚡ WHY ACTIVE AMAZON SELLERS CHOOSE SHEETSNIPER:

1. 🔒 100% PRIVATE · NO SELLER CENTRAL LOGIN REQUIRED
• Never risk your Amazon seller account. SheetSniper does NOT connect to your Seller Central account and requires ZERO SP-API / MWS developer permissions.
• 100% Client-Side Calculations: Extracts product dimensions and category directly from the Amazon listing in your browser.
• Zero-Server Architecture: Your winning product leads are sent directly from your browser to your private Google Drive via official Google OAuth. We never see, track, store, or sell your sourcing leads.

2. 📊 100% ACCURATE 2026 AMAZON FBA FEE CALCULATIONS
Most free calculators are still using outdated 2024–2025 rate cards. SheetSniper has the latest 2026 Amazon fee schedules built right in:
• 2026 Amazon FBA Fulfillment Fee Tiers (including granular 2-oz small-standard brackets).
• Inbound Placement Service Fees (toggle between Minimal Split vs. Amazon-Optimized $0 inbound).
• Low-Inventory-Level Fee simulation ($0.32 buffer).
• Active 3.5% Fuel & Inflation Surcharge automatically accounted for.
• Q4 Holiday Peak Fulfillment Fee adjustments.
• Automatic Dimensional Weight vs. Actual Unit Weight calculation (standard 139 divisor).

3. 🚀 1-CLICK SYNC DIRECTLY TO GOOGLE SHEETS
Stop wasting hours copy-pasting ASINs, margins, and fees into messy spreadsheets.
• Click "Push to Google Sheets" on any Amazon listing, and SheetSniper instantly appends an organized 18-column lead record to your personal sourcing sheet.
• Captured data points: ASIN, Product Title, Buy Cost (COG), Selling Price, Net Profit, ROI %, Profit Margin %, Break-Even Price, Referral Fee, FBA Fulfillment Fee, Inbound Placement Fee, Estimated Inbound Shipping, Prep Cost, Item Weight, Dimensions, Category, BSR, and direct Amazon product URL.
• Automatically creates a clean, pre-formatted "SheetSniper Sourcing Log" in your Google Drive on your first push!

4. 💡 REAL-TIME PROFIT & BREAK-EVEN ANALYSIS ON THE LISTING
Simply enter your Buy Cost (COG) right next to the Buy Box and instantly see:
• Net Profit ($) & ROI (%)
• Profit Margin (%)
• Exact Break-Even Selling Price
• Full transparent fee breakdown (Referral, FBA, Placement, Shipping, Prep)

5. ⚡ LIGHTWEIGHT & FAST (NO BROWSER LAG)
Built with modern Shadow DOM technology. SheetSniper loads instantly and will never slow down your Amazon browsing, Keepa charts, or sourcing flow.

---

💰 TRANSPARENT PRICING:
• 2026 Amazon FBA Profit Calculator: 100% FREE FOREVER (Unlimited profit, fee, and break-even calculations right on the page).
• Google Sheets Sync: 10 Free Lifetime Pushes + 7-Day Free Pro Trial.
• SheetSniper Pro ($9.99/mo or $79/year): Unlimited 1-click pushes to Google Sheets. Cancel anytime directly with one click.

---

🔍 FREQUENTLY ASKED QUESTIONS:

Q: Does SheetSniper require my Amazon Seller Central credentials?
A: Absolutely not! SheetSniper does not connect to Amazon Seller Central or request API keys. Calculations are executed 100% locally in your browser, keeping your account completely safe from third-party app suspensions.

Q: Is this a good alternative to RevSeller, SellerAmp SAS, or ScanUnlimited?
A: Yes! If you don't want to pay $30 to $100 per month for heavy software and prefer tracking your leads in customizable Google Spreadsheets, SheetSniper provides the essential fee calculations and 1-click sheet logging at a fraction of the cost.

Q: What markets does SheetSniper support?
A: Fully optimized for Amazon US (amazon.com) and Amazon Japan (amazon.co.jp).

---

Built by active sellers for active sellers. Eliminate manual data entry, protect your margins against placement fees, and accelerate your Q4 sourcing today with SheetSniper!
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
