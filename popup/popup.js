document.addEventListener('DOMContentLoaded', () => {
  const statusText = document.getElementById('sync-status-text');
  const statusDot = document.getElementById('sync-status-indicator');
  const sheetLinkContainer = document.getElementById('sheet-link-container');
  const sheetLink = document.getElementById('sheet-link');
  const btnAuthTest = document.getElementById('btn-auth-test');
  const btnReset = document.getElementById('btn-reset-sheet');

  const prepCostInput = document.getElementById('prep-cost');
  const shippingRateInput = document.getElementById('shipping-rate');
  const splitModeSelect = document.getElementById('split-mode');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const saveMsg = document.getElementById('save-msg');

  const planDot = document.getElementById('plan-status-indicator');
  const planText = document.getElementById('plan-status-text');
  const btnUpgrade = document.getElementById('btn-upgrade-plan');
  const btnManage = document.getElementById('btn-manage-plan');

  function updatePlanStatus() {
    chrome.runtime.sendMessage({ type: 'GET_PLAN_STATUS' }, (res) => {
      if (!res) return;
      if (res.plan === 'pro') {
        planDot.className = 'dot connected';
        planText.textContent = 'Pro Member (Unlimited)';
        btnUpgrade.style.display = 'none';
        btnManage.style.display = 'inline-block';
      } else if (res.plan === 'trial') {
        planDot.className = 'dot connected';
        planText.textContent = `Pro Trial (${res.daysRemaining}d left)`;
        btnUpgrade.textContent = 'Upgrade to Pro ($9.99/mo)';
        btnUpgrade.style.display = 'inline-block';
        btnManage.style.display = 'none';
      } else if (res.plan === 'free') {
        planDot.className = 'dot connected';
        planText.textContent = `Free Tier (${res.pushesLeft}/10 pushes left)`;
        btnUpgrade.textContent = 'Upgrade to Pro ($9.99/mo)';
        btnUpgrade.style.display = 'inline-block';
        btnManage.style.display = 'none';
      } else {
        planDot.className = 'dot disconnected';
        planText.textContent = 'Free Limit Reached (10/10)';
        btnUpgrade.textContent = 'Upgrade to Pro ($9.99/mo)';
        btnUpgrade.style.display = 'inline-block';
        btnManage.style.display = 'none';
      }
    });
  }

  btnUpgrade.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT' });
  });

  btnManage.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
  });

  // Load status
  function updateStatus() {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
      if (res && res.connected && res.sheetUrl) {
        statusDot.className = 'dot connected';
        statusText.textContent = 'Connected & Synced';
        sheetLinkContainer.style.display = 'block';
        sheetLink.href = res.sheetUrl;
        btnReset.style.display = 'inline-block';
        btnAuthTest.textContent = 'Check Auth';
      } else {
        statusDot.className = 'dot disconnected';
        statusText.textContent = 'Not Connected (Will auto-connect on 1st Push)';
        sheetLinkContainer.style.display = 'none';
        btnReset.style.display = 'none';
        btnAuthTest.textContent = 'Authorize Now';
      }
    });
  }

  // Load user preferences
  chrome.storage.sync.get(['defaultPrepCost', 'defaultShippingRate', 'defaultSplitMode'], (data) => {
    if (data.defaultPrepCost !== undefined) prepCostInput.value = data.defaultPrepCost;
    if (data.defaultShippingRate !== undefined) shippingRateInput.value = data.defaultShippingRate;
    if (data.defaultSplitMode !== undefined) splitModeSelect.value = data.defaultSplitMode;
  });

  // Save preferences
  btnSaveSettings.addEventListener('click', () => {
    chrome.storage.sync.set({
      defaultPrepCost: parseFloat(prepCostInput.value) || 0.20,
      defaultShippingRate: parseFloat(shippingRateInput.value) || 0.30,
      defaultSplitMode: splitModeSelect.value
    }, () => {
      saveMsg.textContent = '✓ Settings saved!';
      setTimeout(() => { saveMsg.textContent = ''; }, 2000);
    });
  });

  // Reset sheet
  btnReset.addEventListener('click', () => {
    if (confirm('Disconnect current sheet? A new sheet will be created next time you push.')) {
      chrome.runtime.sendMessage({ type: 'RESET_SHEET' }, () => {
        updateStatus();
      });
    }
  });

  // Authorize and initialize sheet immediately
  btnAuthTest.addEventListener('click', () => {
    statusText.textContent = 'Connecting to Google Drive...';
    btnAuthTest.disabled = true;

    chrome.runtime.sendMessage({ type: 'INIT_SHEET' }, (res) => {
      btnAuthTest.disabled = false;
      if (res && res.success && res.sheetUrl) {
        statusDot.className = 'dot connected';
        statusText.textContent = 'Connected & Synced!';
        sheetLinkContainer.style.display = 'block';
        sheetLink.href = res.sheetUrl;
        btnReset.style.display = 'inline-block';
        btnAuthTest.textContent = 'Check Auth';
      } else {
        const errMsg = res ? res.error : 'Unknown error';
        statusText.textContent = 'Error: ' + errMsg;
        statusDot.className = 'dot disconnected';
      }
    });
  });

  updateStatus();
  updatePlanStatus();
});
