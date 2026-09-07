/**
 * SheetSniper - Background Service Worker
 * Handles Google OAuth, Sheet Creation with drive.file scope, Data Appending,
 * and ExtensionPay ($9.99/mo / $79/yr) Monetization & Free Trial Gates.
 */

try {
  importScripts('../lib/ExtPay.js');
} catch (e) {
  console.warn('[SheetSniper BG] Could not load ExtPay library:', e);
}

const EXTPAY_ID = 'sheetsniper';
let extpay = null;
if (typeof ExtPay !== 'undefined') {
  try {
    extpay = ExtPay(EXTPAY_ID);
    extpay.startBackground();
  } catch (e) {
    console.warn('[SheetSniper BG] ExtPay initialization skipped:', e);
  }
}

const SPREADSHEET_TITLE = 'SheetSniper Sourcing Log';
const SHEET_HEADERS = [
  'Date Added',
  'ASIN',
  'Product Title',
  'Category',
  'Buy Cost ($)',
  'Sell Price ($)',
  'Net Profit ($)',
  'ROI (%)',
  'Margin (%)',
  'Break Even ($)',
  'Size Tier',
  'Total Amazon Fees ($)',
  'Fulfillment Fee ($)',
  'Placement Fee ($)',
  'Inbound Ship ($)',
  'Dimensions (in)',
  'Weight (lbs)',
  'Amazon URL'
];

/**
 * Check plan & push entitlement:
 * - Free: 10 lifetime pushes
 * - Trial: 7 days free trial starting from first push
 * - Pro: Unlimited pushes via ExtensionPay / Stripe ($9.99/mo or $79/yr)
 */
async function checkProStatus() {
  if (extpay) {
    try {
      const user = await extpay.getUser();
      if (user && user.paid) {
        return {
          allowed: true,
          plan: 'pro',
          isPaid: true,
          badgeText: 'PRO',
          message: 'SheetSniper Pro Active'
        };
      }
    } catch (e) {
      console.warn('[SheetSniper BG] ExtPay user check skipped/offline:', e);
    }
  }

  const data = await chrome.storage.local.get(['pushesUsed', 'trialStartedAt']);
  const pushesUsed = data.pushesUsed || 0;
  const trialStartedAt = data.trialStartedAt || null;

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isWithinTrial = trialStartedAt && (Date.now() - trialStartedAt < SEVEN_DAYS_MS);

  if (isWithinTrial) {
    const daysRemaining = Math.max(1, Math.ceil((trialStartedAt + SEVEN_DAYS_MS - Date.now()) / (24 * 60 * 60 * 1000)));
    return {
      allowed: true,
      plan: 'trial',
      isPaid: false,
      daysRemaining,
      pushesUsed,
      badgeText: `TRIAL (${daysRemaining}d)`,
      message: `Pro Trial: ${daysRemaining} day(s) left`
    };
  }

  if (pushesUsed < 10) {
    const pushesLeft = 10 - pushesUsed;
    return {
      allowed: true,
      plan: 'free',
      isPaid: false,
      pushesLeft,
      pushesUsed,
      badgeText: `FREE (${pushesLeft}/10)`,
      message: `Free Tier: ${pushesLeft} push(es) remaining`
    };
  }

  return {
    allowed: false,
    plan: 'expired',
    isPaid: false,
    pushesUsed,
    badgeText: 'UPGRADE',
    message: 'Free pushes limit reached (10/10). Upgrade to Pro for unlimited sync.'
  };
}

async function recordSuccessfulPush() {
  const data = await chrome.storage.local.get(['pushesUsed', 'trialStartedAt']);
  const pushesUsed = (data.pushesUsed || 0) + 1;
  const trialStartedAt = data.trialStartedAt || Date.now();
  await chrome.storage.local.set({ pushesUsed, trialStartedAt });
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PUSH_TO_SHEETS') {
    (async () => {
      // 1. Verify push entitlement
      const plan = await checkProStatus();
      if (!plan.allowed) {
        return {
          success: false,
          code: 'PAYWALL',
          error: plan.message,
          planStatus: plan
        };
      }

      // 2. Execute push
      const pushRes = await handlePushToSheets(message.payload);

      // 3. Record push and update status
      await recordSuccessfulPush();
      const updatedPlan = await checkProStatus();

      return {
        ...pushRes,
        planStatus: updatedPlan
      };
    })()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error('[SheetSniper BG] Push error:', err);
        sendResponse({ success: false, error: err.message || 'Failed to push to Google Sheets' });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'GET_PLAN_STATUS') {
    checkProStatus().then(res => sendResponse(res));
    return true;
  }

  if (message.type === 'OPEN_PAYMENT') {
    if (extpay) {
      extpay.openPaymentPage();
    } else {
      chrome.tabs.create({ url: 'https://extensionpay.com' });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'OPEN_LOGIN') {
    if (extpay) {
      extpay.openLoginPage();
    } else {
      chrome.tabs.create({ url: 'https://extensionpay.com' });
    }
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'GET_STATUS') {
    getSyncStatus().then(res => sendResponse(res));
    return true;
  }

  if (message.type === 'INIT_SHEET') {
    (async () => {
      const token = await getAuthToken(true);
      const sheetInfo = await getOrCreateSpreadsheet(token);
      return { success: true, ...sheetInfo };
    })()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error('[SheetSniper BG] Init sheet error:', err);
        sendResponse({ success: false, error: err.message || 'Failed to initialize sheet' });
      });
    return true;
  }

  if (message.type === 'RESET_SHEET') {
    chrome.storage.sync.remove(['sheetId', 'sheetUrl'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

/**
 * Get Google OAuth Token with automatic 401 refresh
 */
async function requestToken(interactive = true) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (!token) {
        return reject(new Error('Failed to obtain Google OAuth access token.'));
      }
      resolve(token);
    });
  });
}

async function getAuthToken(interactive = true) {
  return requestToken(interactive);
}

async function invalidateToken(token) {
  if (!token) return;
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

/**
 * Main push handler with 401 retry
 */
async function handlePushToSheets(payload) {
  let token;
  try {
    token = await getAuthToken(true);
  } catch (err) {
    throw new Error(`Google Auth Required: ${err.message}. Please configure OAuth Client ID.`);
  }

  try {
    const { sheetId, sheetUrl } = await getOrCreateSpreadsheet(token);
    await appendRow(token, sheetId, payload);
    return { success: true, sheetId, sheetUrl };
  } catch (err) {
    // If 401 Unauthorized, remove cached token and retry once
    if (err.message && err.message.includes('401')) {
      console.warn('[SheetSniper BG] 401 Unauthorized encountered. Refreshing token...');
      await invalidateToken(token);
      token = await getAuthToken(true);
      const { sheetId, sheetUrl } = await getOrCreateSpreadsheet(token);
      await appendRow(token, sheetId, payload);
      return { success: true, sheetId, sheetUrl };
    }
    throw err;
  }
}

/**
 * Get existing Sheet ID from storage, or create a brand new one using Drive API
 */
async function getOrCreateSpreadsheet(token) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['sheetId', 'sheetUrl'], async (data) => {
      if (data.sheetId && data.sheetUrl) {
        return resolve({ sheetId: data.sheetId, sheetUrl: data.sheetUrl });
      }

      try {
        // Create new spreadsheet using Google Drive API (drive.file scope safe)
        const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: SPREADSHEET_TITLE,
            mimeType: 'application/vnd.google-apps.spreadsheet'
          })
        });

        if (createRes.status === 401) {
          throw new Error('401 Unauthorized');
        }
        if (!createRes.ok) {
          const errData = await createRes.json();
          throw new Error(`Drive file creation failed: ${JSON.stringify(errData)}`);
        }

        const newFile = await createRes.json();
        const newSheetId = newFile.id;
        const newSheetUrl = `https://docs.google.com/spreadsheets/d/${newSheetId}/edit`;

        // Write header row to the newly created sheet
        await writeHeaderRow(token, newSheetId);

        // Save in storage
        chrome.storage.sync.set({
          sheetId: newSheetId,
          sheetUrl: newSheetUrl
        }, () => {
          resolve({ sheetId: newSheetId, sheetUrl: newSheetUrl });
        });

      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Write initial headers to Sheet
 */
async function writeHeaderRow(token, sheetId) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [SHEET_HEADERS]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    console.error('[SheetSniper] Failed to write header:', err);
    throw new Error(`Failed to initialize spreadsheet header: ${err.error ? err.error.message : 'Unknown'}`);
  }
}

/**
 * Append row to Sheet
 */
async function appendRow(token, sheetId, payload) {
  const row = [
    payload.timestamp,
    payload.asin,
    payload.title,
    payload.category,
    payload.buyCost,
    payload.sellPrice,
    payload.netProfit,
    `${payload.roiPercent}%`,
    `${payload.marginPercent}%`,
    payload.breakEvenPrice,
    payload.sizeTier,
    payload.feesBreakdown.totalAmazonFees,
    payload.feesBreakdown.fulfillmentFee,
    payload.feesBreakdown.placementFee,
    payload.feesBreakdown.inboundShipping,
    payload.dimensions,
    payload.weightLbs,
    payload.url
  ];

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });

  if (res.status === 401) {
    throw new Error('401 Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Sheets API Append Error: ${err.error ? err.error.message : 'Unknown'}`);
  }

  return await res.json();
}

/**
 * Status check
 */
async function getSyncStatus() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['sheetId', 'sheetUrl'], (data) => {
      resolve({
        connected: !!(data.sheetId && data.sheetUrl),
        sheetId: data.sheetId || null,
        sheetUrl: data.sheetUrl || null
      });
    });
  });
}
