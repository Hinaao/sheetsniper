# SheetSniper: Amazon FBA 2026 Fee Calculator & One-Click Sheet Sync
## Product Requirements Document (PRD) & Technical Specification

### 1. Executive Summary
- **Product Name**: SheetSniper for Amazon (Chrome Extension)
- **Target Audience**: Amazon US Online Arbitrage (OA) & Wholesale sellers.
- **Value Proposition**: "Instant FBA profit calculation including 2026 hidden fees (Inbound Placement & Low-Inventory), exported to your personal Google Sheet in exactly one click. No $99/mo Helium 10 bloat."
- **Monetization**:
  - **Free Tier**: Real-time on-page profit calculation & breakdown (unlimited).
  - **Pro Tier ($9.99/mo)**: 1-Click Google Sheets export, custom column mapping, history tracking, multi-sheet presets.

---

### 2. Core Functional Requirements (MVP)

#### 2.1 On-Page Overlay (Amazon US `amazon.com/dp/{ASIN}`)
- Injected natively into the right sidebar (above or below the Buy Box) or floating side drawer.
- **Auto-extracted fields from DOM**:
  - `ASIN`
  - `Product Title`
  - `Current Buy Box Price` (or lowest FBA offer)
  - `Category`
  - `Dimensions (L x W x H)` & `Weight` (for FBA tier classification)
- **User Input fields**:
  - `Buy Cost ($)` (primary input)
  - `Inbound Shipping ($/lb or flat)` (default: $0.30/lb)
  - `Prep Fee ($)` (default: $0.00)
- **Calculated Outputs (Real-time)**:
  - `Referral Fee ($)` (Category-based, typically 8% to 15%)
  - `FBA Fulfillment Fee ($)` (Standard / Oversize tier calculated from dimensions/weight)
  - `Inbound Placement Service Fee ($)` (2026 Rule: Minimal split vs. Amazon-optimized split)
  - `Estimated Low-Inventory-Level Fee ($)` (configurable toggle)
  - `Net Profit ($)` = Sell Price - Buy Cost - Referral Fee - FBA Fee - Placement Fee - Inbound Shipping - Prep
  - `ROI (%)` = (Net Profit / Total Cost) * 100
  - `Margin (%)` = (Net Profit / Sell Price) * 100
  - `Break-Even Price ($)`

#### 2.2 One-Click Google Sheets Sync (Paywalled Feature)
- Single prominent button: **[ 🚀 Add to Sheet ]**
- **Action**: Appends a new row to the user's selected Google Sheet & Tab.
- **Default Columns**:
  1. `Timestamp` (YYYY-MM-DD HH:mm)
  2. `ASIN`
  3. `Product Title`
  4. `Buy Price ($)`
  5. `Sell Price ($)`
  6. `Net Profit ($)`
  7. `ROI (%)`
  8. `FBA Fee ($)`
  9. `Inbound Placement Fee ($)`
  10. `Amazon URL`
- **Feedback**: Instant checkmark animation ("Saved to row #142!") with toast notification.

---

### 3. Technical Architecture (Manifest V3)

1. **Zero External Backend for Core Sync**:
   - Uses Google OAuth 2.0 (via `chrome.identity`) to talk directly from the extension to `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append`.
   - No user data passes through our servers (huge selling point for privacy-sensitive Amazon sellers).
2. **Shadow DOM Injection**:
   - Inject the calculator UI into a `#sheetsniper-root` Shadow DOM to prevent Amazon's CSS from breaking our styling, and prevent our CSS from leaking into Amazon.
3. **Resilient DOM Selectors**:
   - Multi-fallback extraction logic for Buy Box price, dimensions, and category (meta tags, JSON-LD, table `#productDetails_techSpec_section_1`, etc.).
