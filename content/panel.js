/**
 * SheetSniper - Floating Panel UI Component (Shadow DOM)
 * Professional 2026 FBA Calculator & Google Sheets Sync
 */

(function () {
  'use strict';

  let currentData = null;
  let calcInstance = null;
  let shadowRoot = null;
  let panelEl = null;
  let userSettings = {
    defaultPrepCost: 0.20,
    defaultShippingRate: 0.30,
    defaultSplitMode: 'MINIMAL_SPLIT'
  };

  // Initialize Calculator
  if (typeof FBACalculator !== 'undefined') {
    calcInstance = new FBACalculator();
  }

  function initPanel() {
    if (document.getElementById('sheetsniper-host')) {
      return;
    }

    const extractor = new AmazonExtractor();
    const data = extractor.extractAll();
    if (!data || !data.asin) {
      return; // Not a PDP or ASIN not yet present
    }

    currentData = data;

    // Load user settings from storage
    chrome.storage.sync.get(['defaultPrepCost', 'defaultShippingRate', 'defaultSplitMode'], (saved) => {
      if (saved.defaultPrepCost !== undefined) userSettings.defaultPrepCost = saved.defaultPrepCost;
      if (saved.defaultShippingRate !== undefined) userSettings.defaultShippingRate = saved.defaultShippingRate;
      if (saved.defaultSplitMode !== undefined) userSettings.defaultSplitMode = saved.defaultSplitMode;

      // Create Host and Attach Shadow DOM
      const host = document.createElement('div');
      host.id = 'sheetsniper-host';
      host.style.position = 'fixed';
      host.style.top = '0';
      host.style.left = '0';
      host.style.width = '0';
      host.style.height = '0';
      host.style.zIndex = '2147483647';
      shadowRoot = host.attachShadow({ mode: 'open' });
      document.body.appendChild(host);

      // Fetch and inject CSS
      const styleUrl = chrome.runtime.getURL('content/styles.css');
      fetch(styleUrl)
        .then(res => res.text())
        .then(css => {
          const styleEl = document.createElement('style');
          styleEl.textContent = css;
          shadowRoot.appendChild(styleEl);
          renderUI();
        })
        .catch(err => console.error('[SheetSniper] Error loading styles:', err));
    });
  }

  function renderUI() {
    panelEl = document.createElement('div');
    panelEl.id = 'sheetsniper-panel';

    const hasAutoDims = !currentData.isDimsMissing && currentData.length && currentData.weightLbs;
    const initialLen = currentData.length || 10.0;
    const initialWid = currentData.width || 7.0;
    const initialHei = currentData.height || 1.0;
    const initialWt = currentData.weightLbs || 0.50;

    panelEl.innerHTML = `
      <div class="panel-header" id="drag-handle">
        <div class="logo-container">
          <span class="logo-icon">🎯</span>
          <span class="logo-text">SheetSniper</span>
          <span class="asin-badge" id="panel-asin">${currentData.asin}</span>
          <span class="plan-badge free" id="panel-plan-badge" title="SheetSniper Free">FREE</span>
        </div>
        <div class="header-actions">
          <button id="btn-minimize" title="Minimize">─</button>
        </div>
      </div>

      <div class="panel-content">
        <div class="input-row">
          <span class="input-label">Buy Cost (COG)</span>
          <div class="input-group">
            <span class="input-prefix">$</span>
            <input type="number" step="0.01" id="input-buy-cost" class="input-field" value="" placeholder="0.00" />
          </div>
        </div>

        <div class="input-row">
          <span class="input-label">Sell Price</span>
          <div class="input-group">
            <span class="input-prefix">$</span>
            <input type="number" step="0.01" id="input-sell-price" class="input-field" value="${currentData.sellPrice ? currentData.sellPrice.toFixed(2) : ''}" placeholder="0.00" />
          </div>
        </div>

        <div class="specs-box">
          <div class="specs-header">
            <span>Package Dims & Weight (in / lbs)</span>
            <span id="dims-badge">${hasAutoDims ? '<span style="color:#10b981;">✓ Auto</span>' : '<span style="color:#f59e0b;font-weight:600;" title="Default standard size estimated">⚠️ Std Est</span>'}</span>
          </div>
          <div class="specs-inputs">
            <input type="number" step="0.1" id="input-len" value="${initialLen}" placeholder="L" title="Length (in)" />
            <input type="number" step="0.1" id="input-wid" value="${initialWid}" placeholder="W" title="Width (in)" />
            <input type="number" step="0.1" id="input-hei" value="${initialHei}" placeholder="H" title="Height (in)" />
            <input type="number" step="0.01" id="input-wt" value="${initialWt}" placeholder="lbs" title="Weight (lbs)" />
          </div>
        </div>

        <div class="profit-card" id="profit-card">
          <div style="font-size: 11px; color: #475569; font-weight: 600;" id="profit-card-label">ESTIMATED NET PROFIT</div>
          <div class="profit-amount" id="profit-amount">--</div>
          <div class="profit-metrics">
            <span>ROI: <strong id="roi-val">--%</strong></span>
            <span>Margin: <strong id="margin-val">--%</strong></span>
            <span>BE: <strong id="be-val">--</strong></span>
          </div>
        </div>

        <div class="accordion-toggle" id="fee-toggle">
          <span>2026 Amazon Fees Breakdown</span>
          <span id="accordion-arrow">▼</span>
        </div>

        <div class="fee-breakdown" id="fee-breakdown">
          <div class="fee-item">
            <span>Referral Fee (${Math.round(currentData.referralRate * 100)}%):</span>
            <span id="fee-referral">$0.00</span>
          </div>
          <div class="fee-item">
            <span>FBA Fulfillment Fee:</span>
            <span id="fee-fulfillment">$0.00</span>
          </div>
          <div class="fee-item highlight-2026">
            <span>Placement Fee Mode:</span>
            <select id="select-placement-mode" style="font-size:10px;padding:1px 3px;border-radius:3px;">
              <option value="MINIMAL_SPLIT" ${userSettings.defaultSplitMode === 'MINIMAL_SPLIT' ? 'selected' : ''}>Minimal Split</option>
              <option value="OPTIMIZED" ${userSettings.defaultSplitMode === 'OPTIMIZED' ? 'selected' : ''}>Optimized ($0)</option>
            </select>
          </div>
          <div class="fee-item highlight-2026" style="padding-left:8px;">
            <span>Inbound Placement Fee:</span>
            <span id="fee-placement">$0.00</span>
          </div>
          <div class="fee-item">
            <span>Inbound Shipping ($${userSettings.defaultShippingRate}/lb):</span>
            <span id="fee-inbound">$0.00</span>
          </div>
          <div class="fee-item" style="margin-top: 4px; border-top: 1px dotted #e2e8f0; padding-top: 4px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <input type="checkbox" id="chk-low-inventory" />
              <span>Low-Inventory Fee (+$0.32)</span>
            </label>
            <span id="fee-low-inv">$0.00</span>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn-push" id="btn-push-sheets" disabled>
          <span>⚡</span>
          <span id="btn-push-text">Enter Cost to Push</span>
        </button>
        <div class="status-toast" id="status-toast"></div>
      </div>
    `;

    shadowRoot.appendChild(panelEl);
    setupEventListeners();
    recalculate();

    // Auto focus buy cost for lightning fast entry
    setTimeout(() => {
      const buyInput = shadowRoot.getElementById('input-buy-cost');
      if (buyInput) buyInput.focus();
    }, 100);
  }

  function setupEventListeners() {
    const buyInput = shadowRoot.getElementById('input-buy-cost');
    const sellInput = shadowRoot.getElementById('input-sell-price');
    const lenInput = shadowRoot.getElementById('input-len');
    const widInput = shadowRoot.getElementById('input-wid');
    const heiInput = shadowRoot.getElementById('input-hei');
    const wtInput = shadowRoot.getElementById('input-wt');
    const lowInvChk = shadowRoot.getElementById('chk-low-inventory');
    const splitSelect = shadowRoot.getElementById('select-placement-mode');
    const feeToggle = shadowRoot.getElementById('fee-toggle');
    const feeBreakdown = shadowRoot.getElementById('fee-breakdown');
    const btnMinimize = shadowRoot.getElementById('btn-minimize');
    const btnPush = shadowRoot.getElementById('btn-push-sheets');

    [buyInput, sellInput, lenInput, widInput, heiInput, wtInput].forEach(el => {
      el.addEventListener('input', recalculate);
    });
    lowInvChk.addEventListener('change', recalculate);
    splitSelect.addEventListener('change', recalculate);

    // Accordion toggle
    feeToggle.addEventListener('click', () => {
      const isOpen = feeBreakdown.classList.toggle('open');
      shadowRoot.getElementById('accordion-arrow').textContent = isOpen ? '▲' : '▼';
    });

    // Minimize toggle
    btnMinimize.addEventListener('click', (e) => {
      e.stopPropagation();
      panelEl.classList.toggle('minimized');
      btnMinimize.textContent = panelEl.classList.contains('minimized') ? '+' : '─';
    });
    panelEl.addEventListener('click', () => {
      if (panelEl.classList.contains('minimized')) {
        panelEl.classList.remove('minimized');
        btnMinimize.textContent = '─';
      }
    });

    // Fill default dims link
    const fillLink = shadowRoot.getElementById('link-fill-default');
    if (fillLink) {
      fillLink.addEventListener('click', (e) => {
        e.preventDefault();
        lenInput.value = '10.0';
        widInput.value = '7.0';
        heiInput.value = '1.0';
        wtInput.value = '0.50';
        [lenInput, widInput, heiInput, wtInput].forEach(inp => {
          inp.style.background = '#ffffff';
          inp.style.borderColor = '#cbd5e1';
        });
        fillLink.style.display = 'none';
        const dimsBadge = shadowRoot.getElementById('dims-badge');
        if (dimsBadge) dimsBadge.innerHTML = '<span style="color:#0284c7;">~ Std Est</span>';
        recalculate();
      });
    }

    // Plan badge click -> show upgrade modal
    const planBadge = shadowRoot.getElementById('panel-plan-badge');
    if (planBadge) {
      planBadge.addEventListener('click', () => showUpgradeModal());
    }

    // Push to Google Sheets button
    btnPush.addEventListener('click', handlePushToSheets);

    // Draggable panel
    makeDraggable(panelEl, shadowRoot.getElementById('drag-handle'));

    // Refresh plan status
    refreshPlanStatus();
  }

  let latestCalculation = null;

  function recalculate() {
    if (!calcInstance || !shadowRoot) return;

    const buyVal = shadowRoot.getElementById('input-buy-cost').value.trim();
    const sellVal = shadowRoot.getElementById('input-sell-price').value.trim();
    const lenVal = shadowRoot.getElementById('input-len').value.trim();
    const widVal = shadowRoot.getElementById('input-wid').value.trim();
    const heiVal = shadowRoot.getElementById('input-hei').value.trim();
    const wtVal = shadowRoot.getElementById('input-wt').value.trim();

    const buyCost = parseFloat(buyVal);
    const sellPrice = parseFloat(sellVal);
    const length = parseFloat(lenVal);
    const width = parseFloat(widVal);
    const height = parseFloat(heiVal);
    const weightLbs = parseFloat(wtVal);
    const includeLowInventoryFee = shadowRoot.getElementById('chk-low-inventory').checked;
    const splitMode = shadowRoot.getElementById('select-placement-mode').value;

    const profitEl = shadowRoot.getElementById('profit-amount');
    const profitCard = shadowRoot.getElementById('profit-card');
    const profitCardLabel = shadowRoot.getElementById('profit-card-label');
    const roiEl = shadowRoot.getElementById('roi-val');
    const marginEl = shadowRoot.getElementById('margin-val');
    const beEl = shadowRoot.getElementById('be-val');
    const btnPush = shadowRoot.getElementById('btn-push-sheets');
    const btnText = shadowRoot.getElementById('btn-push-text');

    // Check if specs are missing
    if (!length || !width || !height || !weightLbs) {
      profitCardLabel.textContent = 'SPECS REQUIRED';
      profitEl.textContent = 'Missing Dims';
      roiEl.textContent = '--%';
      marginEl.textContent = '--%';
      beEl.textContent = '--';
      profitCard.classList.remove('negative');
      btnPush.disabled = true;
      btnText.textContent = 'Enter Dims & Weight';
      return;
    }

    // Check if Buy Cost is entered
    if (isNaN(buyCost) || buyCost <= 0) {
      profitCardLabel.textContent = 'ESTIMATED NET PROFIT';
      profitEl.textContent = '$0.00';
      roiEl.textContent = '0%';
      marginEl.textContent = '0%';
      beEl.textContent = '--';
      profitCard.classList.remove('negative');
      btnPush.disabled = true;
      btnText.textContent = 'Enter Buy Cost';

      // Still calculate Amazon fees if sell price is present
      if (sellPrice > 0) {
        const tempRes = calcInstance.calculateProfit({
          sellPrice,
          buyCost: 0,
          lengthInches: length,
          widthInches: width,
          heightInches: height,
          weightLbs,
          inboundShippingCostPerLb: userSettings.defaultShippingRate,
          prepCost: userSettings.defaultPrepCost,
          categoryRate: currentData.referralRate,
          inboundSplitMode: splitMode,
          includeLowInventoryFee
        });
        updateBreakdownUI(tempRes);
      }
      return;
    }

    if (isNaN(sellPrice) || sellPrice <= 0) {
      profitEl.textContent = '--';
      btnPush.disabled = true;
      btnText.textContent = 'Enter Sell Price';
      return;
    }

    try {
      // Full calculation
      const result = calcInstance.calculateProfit({
        sellPrice,
        buyCost,
        lengthInches: length,
        widthInches: width,
        heightInches: height,
        weightLbs,
        inboundShippingCostPerLb: userSettings.defaultShippingRate,
        prepCost: userSettings.defaultPrepCost,
        categoryRate: currentData.referralRate,
        inboundSplitMode: splitMode,
        includeLowInventoryFee
      });

      if (!result) {
        profitCardLabel.textContent = 'SPECS REQUIRED';
        profitEl.textContent = 'Missing Dims';
        roiEl.textContent = '--%';
        marginEl.textContent = '--%';
        beEl.textContent = '--';
        profitCard.classList.remove('negative');
        btnPush.disabled = true;
        btnText.textContent = 'Enter Dims & Weight';
        return;
      }

      latestCalculation = {
        ...result,
        buyCost,
        sellPrice,
        length,
        width,
        height,
        weightLbs
      };

      const profit = Number(result?.netProfit ?? 0);
      profitCardLabel.textContent = 'ESTIMATED NET PROFIT';
      profitEl.textContent = `$${profit.toFixed(2)}`;
      roiEl.textContent = `${result?.roiPercent ?? 0}%`;
      marginEl.textContent = `${result?.marginPercent ?? 0}%`;
      beEl.textContent = `$${(result?.breakEvenPrice ?? 0).toFixed(2)}`;

      if (profit >= 0) {
        profitCard.classList.remove('negative');
      } else {
        profitCard.classList.add('negative');
      }

      btnPush.disabled = false;
      btnText.textContent = 'Push to Google Sheets';
      updateBreakdownUI(result);
    } catch (err) {
      console.warn('[SheetSniper] Calculation error caught:', err);
    }
  }

  function updateBreakdownUI(res) {
    if (!res || !res.breakdown) return;
    shadowRoot.getElementById('fee-referral').textContent = `$${res.breakdown.referralFee.toFixed(2)}`;
    shadowRoot.getElementById('fee-fulfillment').textContent = `$${res.breakdown.fulfillmentFee.toFixed(2)} (${res.tier})`;
    shadowRoot.getElementById('fee-placement').textContent = `$${res.breakdown.placementFee.toFixed(2)}`;
    shadowRoot.getElementById('fee-inbound').textContent = `$${res.breakdown.inboundShipping.toFixed(2)}`;
    shadowRoot.getElementById('fee-low-inv').textContent = `$${res.breakdown.lowInventoryFee.toFixed(2)}`;
  }

  function handlePushToSheets() {
    if (!latestCalculation || !currentData) return;

    const btnPush = shadowRoot.getElementById('btn-push-sheets');
    const btnText = shadowRoot.getElementById('btn-push-text');
    const toast = shadowRoot.getElementById('status-toast');

    btnPush.disabled = true;
    btnText.textContent = 'Pushing to Sheet...';
    toast.className = 'status-toast';
    toast.textContent = '';

    const payload = {
      asin: currentData.asin,
      title: currentData.title,
      category: currentData.category,
      sellPrice: latestCalculation?.sellPrice ?? 0,
      buyCost: latestCalculation?.buyCost ?? 0,
      netProfit: latestCalculation?.netProfit ?? 0,
      roiPercent: latestCalculation?.roiPercent ?? 0,
      marginPercent: latestCalculation?.marginPercent ?? 0,
      breakEvenPrice: latestCalculation?.breakEvenPrice ?? 0,
      dimensions: `${latestCalculation?.length ?? 10}x${latestCalculation?.width ?? 7}x${latestCalculation?.height ?? 1}`,
      weightLbs: latestCalculation?.weightLbs ?? 0.5,
      sizeTier: latestCalculation?.tier ?? 'STANDARD',
      feesBreakdown: latestCalculation?.breakdown ?? {},
      url: currentData.url,
      imageUrl: currentData.imageUrl,
      timestamp: new Date().toLocaleString()
    };

    chrome.runtime.sendMessage({ type: 'PUSH_TO_SHEETS', payload }, (response) => {
      btnPush.disabled = false;
      btnText.textContent = 'Push to Google Sheets';

      if (response && response.success) {
        toast.className = 'status-toast success';
        toast.innerHTML = `✓ Saved to Sheet! <a href="${response.sheetUrl}" target="_blank" style="color:#0284c7;text-decoration:underline;">Open Sheet</a>`;
        if (response.planStatus) {
          updatePlanBadge(response.planStatus);
        }
      } else if (response && response.code === 'PAYWALL') {
        toast.className = 'status-toast error';
        toast.textContent = `Push limit reached (10 free). Upgrade to Pro.`;
        showUpgradeModal(response.planStatus);
      } else {
        toast.className = 'status-toast error';
        const errMsg = response ? response.error : 'Connection error. Check Google Login in extension popup.';
        toast.textContent = `✕ ${errMsg}`;
      }
    });
  }

  function showUpgradeModal(status) {
    let modal = shadowRoot.getElementById('upgrade-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'upgrade-modal';
      modal.className = 'ss-modal-overlay';
      modal.innerHTML = `
        <div class="ss-modal-card">
          <div class="ss-modal-header">
            <div class="ss-modal-title">
              <span style="font-size:20px;">⚡</span>
              <div>
                <h3>SheetSniper Pro</h3>
                <p>Unlimited 1-Click Sync to Google Sheets</p>
              </div>
            </div>
            <button class="ss-modal-close" id="btn-close-modal">&times;</button>
          </div>
          <div class="ss-pricing-options">
            <div class="ss-price-box recommended">
              <div class="ss-ribbon">SAVE 34%</div>
              <div class="ss-price-title">Annual Plan (Best Value)</div>
              <div class="ss-price-number">$79<span> / year</span></div>
              <div class="ss-price-desc">$6.58 / month · Billed annually</div>
              <button class="ss-plan-btn ss-btn-featured" id="btn-upgrade-annual">Upgrade Annual ($79/yr)</button>
            </div>
            <div class="ss-price-box">
              <div class="ss-price-title">Monthly Flex</div>
              <div class="ss-price-number">$9.99<span> / month</span></div>
              <div class="ss-price-desc">Full Pro access · Cancel anytime</div>
              <button class="ss-plan-btn" id="btn-upgrade-monthly">Upgrade Monthly ($9.99/mo)</button>
            </div>
          </div>
          <div class="ss-features-check">
            <div class="ss-feature-row">✓ <strong>Unlimited</strong> 1-Click Google Sheets logging</div>
            <div class="ss-feature-row">✓ 2026 Amazon Fee updates (+3.5% fuel & placement fees)</div>
            <div class="ss-feature-row">✓ 100% Client-side direct to your Drive (Zero data leakage)</div>
          </div>
          <div class="ss-modal-footer">
            <button id="btn-restore-sub" class="ss-link-btn">Already subscribed? Restore / Manage</button>
          </div>
        </div>
      `;
      shadowRoot.appendChild(modal);

      modal.querySelector('#btn-close-modal').addEventListener('click', () => {
        modal.style.display = 'none';
      });

      modal.querySelector('#btn-upgrade-annual').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT', plan: 'annual' });
      });

      modal.querySelector('#btn-upgrade-monthly').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_PAYMENT', plan: 'monthly' });
      });

      modal.querySelector('#btn-restore-sub').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' });
      });
    }

    modal.style.display = 'flex';
  }

  function updatePlanBadge(status) {
    if (!shadowRoot) return;
    const badge = shadowRoot.getElementById('panel-plan-badge');
    if (!badge) return;
    badge.textContent = status.badgeText || 'FREE';
    badge.className = `plan-badge ${status.plan || 'free'}`;
    badge.title = status.message || '';
  }

  function refreshPlanStatus() {
    chrome.runtime.sendMessage({ type: 'GET_PLAN_STATUS' }, (status) => {
      if (status) {
        updatePlanBadge(status);
      }
    });
  }

  function makeDraggable(el, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT') return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px";
      el.style.right = "auto";
      el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Run on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanel);
  } else {
    initPanel();
  }

  // Robust periodic check: inject whenever on product page, handle hydration delays & ASIN changes
  let lastTrackedAsin = null;
  setInterval(() => {
    const extractor = new AmazonExtractor();
    const currentAsin = extractor.extractASIN();
    const host = document.getElementById('sheetsniper-host');

    if (!currentAsin) return;

    // Case 1: On product page but panel not yet mounted (e.g. hydration delay)
    if (!host) {
      lastTrackedAsin = currentAsin;
      initPanel();
      return;
    }

    // Case 2: ASIN switched (user changed variation)
    if (currentAsin !== lastTrackedAsin) {
      lastTrackedAsin = currentAsin;
      const prevBuyCost = shadowRoot ? shadowRoot.getElementById('input-buy-cost')?.value : '';
      host.remove();
      initPanel();
      setTimeout(() => {
        if (shadowRoot && prevBuyCost) {
          const buyInput = shadowRoot.getElementById('input-buy-cost');
          if (buyInput) {
            buyInput.value = prevBuyCost;
            recalculate();
          }
        }
      }, 300);
      return;
    }

    // Case 3: Panel mounted but dimensions were lazy-loaded later by Amazon
    if (shadowRoot) {
      const lenInput = shadowRoot.getElementById('input-len');
      const wtInput = shadowRoot.getElementById('input-wt');
      if (lenInput && !lenInput.value) {
        const dimsAndWt = extractor.extractDimensionsAndWeight();
        if (dimsAndWt && dimsAndWt.length && dimsAndWt.weightLbs) {
          lenInput.value = dimsAndWt.length;
          shadowRoot.getElementById('input-wid').value = dimsAndWt.width;
          shadowRoot.getElementById('input-hei').value = dimsAndWt.height;
          wtInput.value = dimsAndWt.weightLbs;
          const dimsBadge = shadowRoot.getElementById('dims-badge');
          if (dimsBadge) dimsBadge.innerHTML = '<span style="color:#10b981;">✓ Auto</span>';
          const fillLink = shadowRoot.getElementById('link-fill-default');
          if (fillLink) fillLink.style.display = 'none';
          [lenInput, shadowRoot.getElementById('input-wid'), shadowRoot.getElementById('input-hei'), wtInput].forEach(inp => {
            inp.style.background = '#ffffff';
            inp.style.borderColor = '#cbd5e1';
          });
          recalculate();
        }
      }
    }
  }, 500);

})();
