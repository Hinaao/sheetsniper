/**
 * SheetSniper - Amazon US DOM Extractor
 * Extracts ASIN, Title, BuyBox Price, Dimensions, Weight, and Category
 * with robust multi-layer fallback strategies.
 */

class AmazonExtractor {
  constructor() {
    this.extractedData = null;
  }

  /**
   * Extract ASIN from URL or DOM
   */
  extractASIN() {
    // 1. URL path check: /dp/B0... or /gp/product/B0...
    const urlMatch = window.location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (urlMatch && urlMatch[1]) return urlMatch[1].toUpperCase();

    // 2. URL search param check: ?asin=B0...
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('asin')) return urlParams.get('asin').toUpperCase();

    // 3. Hidden input element #ASIN
    const asinInput = document.querySelector('input#ASIN, input[name="ASIN"]');
    if (asinInput && asinInput.value) return asinInput.value.trim().toUpperCase();

    // 4. Data attribute on detail div
    const detailDiv = document.querySelector('[data-asin]');
    if (detailDiv && detailDiv.dataset.asin && detailDiv.dataset.asin.length === 10) {
      return detailDiv.dataset.asin.trim().toUpperCase();
    }

    return null;
  }

  /**
   * Extract Title
   */
  extractTitle() {
    const titleEl = document.querySelector('#productTitle, #title, h1.a-size-large');
    if (titleEl) {
      return titleEl.innerText.trim().replace(/\s+/g, ' ');
    }
    const metaTitle = document.querySelector('meta[name="title"]');
    if (metaTitle && metaTitle.content) {
      return metaTitle.content.trim();
    }
    return document.title.replace(/Amazon\.com.*$/i, '').trim();
  }

  /**
   * Extract BuyBox / Current Offer Price
   * Excludes strike-through / list prices (.a-text-price, .a-text-strike).
   */
  extractPrice() {
    // Priority 1: Direct BuyBox price element with base color (non-discounted / active price)
    const primarySelectors = [
      '#corePriceDisplay_desktop_feature_div .a-price[data-a-color="base"] .a-offscreen',
      '#corePrice_feature_div .a-price[data-a-color="base"] .a-offscreen',
      '#corePriceDisplay_desktop_feature_div .a-price:not(.a-text-price) .a-offscreen',
      '#corePrice_feature_div .a-price:not(.a-text-price) .a-offscreen',
      '#price_inside_buybox',
      '#newBuyBoxPrice',
      '#apex_desktop .a-price:not(.a-text-price) .a-offscreen'
    ];

    for (const sel of primarySelectors) {
      const el = document.querySelector(sel);
      if (el && !el.closest('.a-text-price') && !el.closest('.a-text-strike')) {
        const text = el.innerText || el.textContent;
        const match = text.replace(/,/g, '').match(/\$?(\d+(?:\.\d{2})?)/);
        if (match && parseFloat(match[1]) > 0) {
          return parseFloat(match[1]);
        }
      }
    }

    // Fallback: search within desktop buybox container
    const buybox = document.querySelector('#desktop_buybox, #buybox');
    if (buybox) {
      const offscreens = buybox.querySelectorAll('.a-price:not(.a-text-price) .a-offscreen');
      for (const el of offscreens) {
        if (!el.closest('.a-text-strike')) {
          const text = el.innerText || el.textContent;
          const match = text.replace(/,/g, '').match(/\$?(\d+(?:\.\d{2})?)/);
          if (match && parseFloat(match[1]) > 0) {
            return parseFloat(match[1]);
          }
        }
      }
    }

    return null;
  }

  /**
   * Extract Dimensions (inches) and Weight (lbs)
   * Prioritizes PACKAGE dimensions & SHIPPING weight over item-only dimensions.
   */
  extractDimensionsAndWeight() {
    let pkgDims = null;
    let itemDims = null;
    let shippingWeight = null;
    let itemWeight = null;

    const parseDims = (str) => {
      const dimRegex = /(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(inches|inch|in|cm|centimeters|mm)?/i;
      const m = str.match(dimRegex);
      if (m) {
        let [_, d1, d2, d3, unit] = m;
        let [l, w, h] = [parseFloat(d1), parseFloat(d2), parseFloat(d3)];
        const u = (unit || '').toLowerCase();
        if (u.includes('cm')) {
          l = l / 2.54;
          w = w / 2.54;
          h = h / 2.54;
        } else if (u.includes('mm')) {
          l = l / 25.4;
          w = w / 25.4;
          h = h / 25.4;
        }
        return {
          length: Number(l.toFixed(2)),
          width: Number(w.toFixed(2)),
          height: Number(h.toFixed(2))
        };
      }
      return null;
    };

    const parseWeight = (str) => {
      const weightRegex = /(\d+(?:\.\d+)?)\s*(pounds?|lbs?|ounces?|oz|grams?|g|kilograms?|kg)/i;
      const m = str.match(weightRegex);
      if (m) {
        let val = parseFloat(m[1]);
        let unit = m[2].toLowerCase();
        if (unit.startsWith('ounce') || unit === 'oz') {
          val = val / 16.0;
        } else if (unit.startsWith('gram') || unit === 'g') {
          val = val / 453.592;
        } else if (unit.startsWith('kg') || unit.startsWith('kilo')) {
          val = val * 2.20462;
        }
        return Number(val.toFixed(2));
      }
      return null;
    };

    // 1. Scan all detail tables, bullet sections, modern Amazon product-facts grids, and key-value tables
    const specRows = document.querySelectorAll(
      '#productDetails_techSpec_section_1 tr, #productDetails_techSpec_section_2 tr, #prodDetails table tr, ' +
      '#detailBullets_feature_div li, #detailBulletsWrapper_feature_div li, #productDetails_detailBullets_sections1 li, ' +
      '#productDetails_detailBullets_sections1 tr, .po-row, .product-facts-detail, table.a-keyvalue tr, ' +
      '#technicalSpecifications_section_1 tr, #productOverview_feature_div tr, div[id*="detailBullets"] tr'
    );

    for (const row of specRows) {
      const text = (row.innerText || row.textContent).trim();
      const lower = text.toLowerCase();

      // Check Package Dimensions (Priority 1)
      if (lower.includes('package dimensions') || lower.includes('item package dimensions')) {
        const d = parseDims(text);
        if (d && !pkgDims) pkgDims = d;
      } else if (lower.includes('dimensions') && !itemDims) {
        const d = parseDims(text);
        if (d) itemDims = d;
      }

      // Check Shipping Weight (Priority 1) vs Item Weight
      if (lower.includes('shipping weight') || lower.includes('package weight')) {
        const w = parseWeight(text);
        if (w && !shippingWeight) shippingWeight = w;
      } else if (lower.includes('weight') && !itemWeight) {
        const w = parseWeight(text);
        if (w) itemWeight = w;
      }
    }

    // 2. Full-body text regex fallback if still missing
    if (!pkgDims && !itemDims) {
      const bodyText = document.body ? document.body.innerText : '';
      const pkgMatch = bodyText.match(/(?:Package\s*Dimensions|Item\s*Package\s*Dimensions)\s*[:\n\r\t ]*([^\n\r]+)/i);
      if (pkgMatch) {
        pkgDims = parseDims(pkgMatch[1]);
      }
      if (!pkgDims) {
        const itemMatch = bodyText.match(/(?:Product\s*Dimensions|Item\s*Dimensions)\s*[:\n\r\t ]*([^\n\r]+)/i);
        if (itemMatch) {
          itemDims = parseDims(itemMatch[1]);
        }
      }
    }

    if (!shippingWeight && !itemWeight) {
      const bodyText = document.body ? document.body.innerText : '';
      const shipWtMatch = bodyText.match(/(?:Shipping\s*Weight|Package\s*Weight)\s*[:\n\r\t ]*([^\n\r]+)/i);
      if (shipWtMatch) {
        shippingWeight = parseWeight(shipWtMatch[1]);
      }
      if (!shippingWeight) {
        const itemWtMatch = bodyText.match(/(?:Item\s*Weight)\s*[:\n\r\t ]*([^\n\r]+)/i);
        if (itemWtMatch) {
          itemWeight = parseWeight(itemWtMatch[1]);
        }
      }
    }

    const finalDims = pkgDims || itemDims;
    const finalWeight = shippingWeight || itemWeight;

    return {
      length: finalDims ? finalDims.length : null,
      width: finalDims ? finalDims.width : null,
      height: finalDims ? finalDims.height : null,
      weightLbs: finalWeight || null,
      isMissing: (!finalDims || !finalWeight)
    };
  }


  /**
   * Extract Product Category & Estimate Referral Fee Rate
   */
  extractCategory() {
    const breadcrumbLinks = document.querySelectorAll('#wayfinding-breadcrumbs_feature_div a, .a-breadcrumb a');
    const categories = Array.from(breadcrumbLinks).map(a => a.innerText.trim()).filter(Boolean);
    const primaryCategory = categories.length > 0 ? categories[0] : 'General / Other';

    // Standard Amazon US Category Referral Fee rates
    let rate = 0.15; // default 15%
    const catLower = primaryCategory.toLowerCase();

    if (catLower.includes('electronic') || catLower.includes('camera') || catLower.includes('cell phone')) {
      rate = 0.08;
    } else if (catLower.includes('computer') || catLower.includes('video games') || catLower.includes('consoles')) {
      rate = 0.08; // consoles 8%
    } else if (catLower.includes('grocery') || catLower.includes('gourmet')) {
      rate = 0.15; // 8% if <= $15, 15% if > $15 (simplified baseline 15%)
    } else if (catLower.includes('beauty') || catLower.includes('health') || catLower.includes('personal care')) {
      rate = 0.15; // 8% if <= $10, 15% if > $10
    } else if (catLower.includes('book')) {
      rate = 0.15;
    }

    return {
      primaryCategory,
      categories,
      referralRate: rate
    };
  }

  /**
   * Extract Image URL
   */
  extractImageUrl() {
    const imgEl = document.querySelector('#landingImage, #imgBlkFront, #main-image');
    if (imgEl && imgEl.src) return imgEl.src;
    return '';
  }

  /**
   * Full Extraction Pipeline
   */
  extractAll() {
    const asin = this.extractASIN();
    if (!asin) return null;

    const title = this.extractTitle();
    const sellPrice = this.extractPrice();
    const dimsAndWeight = this.extractDimensionsAndWeight();
    const categoryInfo = this.extractCategory();
    const imageUrl = this.extractImageUrl();

    this.extractedData = {
      asin,
      title,
      sellPrice: sellPrice || 0,
      length: dimsAndWeight.length,
      width: dimsAndWeight.width,
      height: dimsAndWeight.height,
      weightLbs: dimsAndWeight.weightLbs,
      isDimsMissing: dimsAndWeight.isMissing,
      category: categoryInfo.primaryCategory,
      referralRate: categoryInfo.referralRate,
      imageUrl,
      url: window.location.origin + '/dp/' + asin,
      extractedAt: new Date().toISOString()
    };

    return this.extractedData;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AmazonExtractor;
}
