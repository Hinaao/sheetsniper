/**
 * SheetSniper - 2026 Amazon US FBA Fee & Profit Calculator Engine
 * Compliant with 2026 FBA Fulfillment Fees, Inbound Placement Service Fees, and Low-Inventory Fees.
 */

class FBACalculator {
  constructor() {
    // Standard referral fee rate default (15%)
    this.DEFAULT_REFERRAL_RATE = 0.15;
    this.MIN_REFERRAL_FEE = 0.30;
    this.DIMENSIONAL_DIVISOR = 139.0; // Standard Amazon Dim Divisor (inches^3 / lb)
  }

  /**
   * Sort dimensions in descending order [longest, median, shortest] in inches.
   */
  normalizeDimensions(l, w, h) {
    const sorted = [Number(l) || 0, Number(w) || 0, Number(h) || 0].sort((a, b) => b - a);
    return {
      longest: sorted[0],
      median: sorted[1],
      shortest: sorted[2]
    };
  }

  /**
   * Determine the Amazon US Product Size Tier.
   * @param {Object} dims - { longest, median, shortest } in inches
   * @param {number} weightLbs - Actual weight in pounds
   */
  determineSizeTier(dims, weightLbs) {
    const { longest, median, shortest } = dims;
    const weightOz = weightLbs * 16.0;

    // Small standard-size: <= 16 oz, <= 15" longest, <= 12" median, <= 0.75" shortest
    if (longest <= 15 && median <= 12 && shortest <= 0.75 && weightOz <= 16.0) {
      return 'SMALL_STANDARD';
    }

    // Large standard-size: <= 20 lb, <= 18" longest, <= 14" median, <= 8" shortest
    if (longest <= 18 && median <= 14 && shortest <= 8 && weightLbs <= 20.0) {
      return 'LARGE_STANDARD';
    }

    // Large Bulky / Oversize
    return 'LARGE_BULKY';
  }

  /**
   * Calculate Shipping Weight (greater of unit weight or dimensional weight).
   */
  calculateShippingWeight(tier, dims, unitWeightLbs) {
    // For small standard <= 16 oz, Amazon uses unit weight only
    if (tier === 'SMALL_STANDARD') {
      return unitWeightLbs;
    }

    // For large standard and oversize, use greater of unit weight or dimensional weight
    const dimWeightLbs = (dims.longest * dims.median * dims.shortest) / this.DIMENSIONAL_DIVISOR;
    return Math.max(unitWeightLbs, dimWeightLbs);
  }

  /**
   * Calculate 2026 FBA Fulfillment Fee (Official Amazon US Non-Peak $10-$50 standard band).
   */
  calculateFulfillmentFee(tier, shippingWeightLbs, applyFuelSurcharge = false) {
    const weightOz = shippingWeightLbs * 16.0;
    let baseFee = 0;

    if (tier === 'SMALL_STANDARD') {
      if (weightOz <= 2.0) baseFee = 3.32;
      else if (weightOz <= 4.0) baseFee = 3.42;
      else if (weightOz <= 6.0) baseFee = 3.45;
      else if (weightOz <= 8.0) baseFee = 3.57;
      else if (weightOz <= 10.0) baseFee = 3.67;
      else if (weightOz <= 12.0) baseFee = 3.77;
      else if (weightOz <= 14.0) baseFee = 3.87;
      else baseFee = 3.97; // up to 16 oz
    } else if (tier === 'LARGE_STANDARD') {
      if (weightOz <= 4.0) baseFee = 3.99;
      else if (weightOz <= 8.0) baseFee = 4.22;
      else if (weightOz <= 12.0) baseFee = 4.48;
      else if (weightOz <= 16.0) baseFee = 4.87; // 1 lb
      else if (shippingWeightLbs <= 1.5) baseFee = 5.49;
      else if (shippingWeightLbs <= 2.0) baseFee = 5.86;
      else if (shippingWeightLbs <= 2.5) baseFee = 6.24;
      else if (shippingWeightLbs <= 3.0) baseFee = 6.50;
      else {
        // Over 3 lb: $6.97 + $0.08 per 4 oz (quarter-lb) above 3 lb
        const excessOz = (shippingWeightLbs - 3.0) * 16.0;
        const quarterLbUnits = Math.ceil(excessOz / 4.0);
        baseFee = Number((6.97 + quarterLbUnits * 0.08).toFixed(2));
      }
    } else {
      // Large Bulky / Oversize baseline estimate
      if (shippingWeightLbs <= 50.0) {
        baseFee = Number((10.20 + Math.max(0, shippingWeightLbs - 1) * 0.42).toFixed(2));
      } else {
        baseFee = 38.00;
      }
    }

    if (applyFuelSurcharge) {
      baseFee = Number((baseFee * 1.035).toFixed(2));
    }

    return baseFee;
  }

  /**
   * 2026 Inbound Placement Service Fee.
   * Default to 'MINIMAL_SPLIT' (typical for Online Arbitrage sellers).
   */
  calculateInboundPlacementFee(tier, shippingWeightLbs, splitMode = 'MINIMAL_SPLIT') {
    if (splitMode === 'OPTIMIZED') {
      return 0.00; // Free if merchant splits into 5+ shipments
    }

    // Minimal shipment split (1-3 destinations)
    const weightOz = shippingWeightLbs * 16.0;
    if (tier === 'SMALL_STANDARD') {
      if (weightOz <= 8.0) return 0.21;
      return 0.24; // 8 to 16 oz
    }

    if (tier === 'LARGE_STANDARD') {
      if (weightOz <= 12.0) return 0.27;
      if (weightOz <= 16.0) return 0.30;
      if (shippingWeightLbs <= 1.5) return 0.33;
      if (shippingWeightLbs <= 2.0) return 0.34;
      if (shippingWeightLbs <= 3.0) return 0.38;
      const excess = Math.ceil(shippingWeightLbs - 3.0);
      return Number((0.44 + excess * 0.05).toFixed(2));
    }

    return 0.60; // Oversize default
  }

  /**
   * Referral Fee (Category based or 15% default).
   */
  calculateReferralFee(sellPrice, categoryRate = this.DEFAULT_REFERRAL_RATE) {
    const rawFee = sellPrice * categoryRate;
    return Number(Math.max(this.MIN_REFERRAL_FEE, rawFee).toFixed(2));
  }

  /**
   * Full Profit & ROI Calculation.
   */
  calculateProfit(params) {
    const {
      sellPrice = 0,
      buyCost = 0,
      lengthInches = null,
      widthInches = null,
      heightInches = null,
      weightLbs = null,
      inboundShippingCostPerLb = 0.30,
      prepCost = 0.00,
      categoryRate = this.DEFAULT_REFERRAL_RATE,
      inboundSplitMode = 'MINIMAL_SPLIT', // 'MINIMAL_SPLIT' or 'OPTIMIZED'
      includeLowInventoryFee = false,
      lowInventoryFeeAmount = 0.32,
      applyFuelSurcharge = true // Default true (active since April 2026)
    } = params;

    // Strict validation: Do not fake dimensions
    if (!lengthInches || !widthInches || !heightInches || !weightLbs ||
        Number(lengthInches) <= 0 || Number(widthInches) <= 0 || Number(heightInches) <= 0 || Number(weightLbs) <= 0) {
      return null;
    }

    const sell = Number(sellPrice) || 0;
    const buy = Number(buyCost) || 0;
    const prep = Number(prepCost) || 0;

    const dims = this.normalizeDimensions(lengthInches, widthInches, heightInches);
    const tier = this.determineSizeTier(dims, Number(weightLbs) || 0);
    const shippingWeight = this.calculateShippingWeight(tier, dims, Number(weightLbs) || 0);

    // Fee breakdown
    const referralFee = this.calculateReferralFee(sell, categoryRate);
    const fulfillmentFee = this.calculateFulfillmentFee(tier, shippingWeight, applyFuelSurcharge);
    const placementFee = this.calculateInboundPlacementFee(tier, shippingWeight, inboundSplitMode);
    const lowInventoryFee = includeLowInventoryFee ? Number(lowInventoryFeeAmount) : 0.00;
    const inboundShipping = Number(((Number(weightLbs) || 0) * inboundShippingCostPerLb).toFixed(2));

    const totalAmazonFees = Number((referralFee + fulfillmentFee + placementFee + lowInventoryFee).toFixed(2));
    const totalCosts = Number((buy + totalAmazonFees + inboundShipping + prep).toFixed(2));
    const netProfit = Number((sell - totalCosts).toFixed(2));

    const roiPercent = buy > 0 ? Number(((netProfit / buy) * 100).toFixed(1)) : 0.0;
    const marginPercent = sell > 0 ? Number(((netProfit / sell) * 100).toFixed(1)) : 0.0;

    // Break-even sell price: Price where Profit = 0
    // Sell - (Sell * rate) - (Fees + Buy + Shipping + Prep) = 0
    // Sell * (1 - rate) = nonReferralCosts
    const nonReferralCosts = buy + fulfillmentFee + placementFee + lowInventoryFee + inboundShipping + prep;
    const breakEvenPrice = categoryRate < 1 ? Number((nonReferralCosts / (1 - categoryRate)).toFixed(2)) : 0;

    return {
      tier,
      dimensions: dims,
      shippingWeightLbs: Number(shippingWeight.toFixed(2)),
      breakdown: {
        referralFee,
        fulfillmentFee,
        placementFee,
        lowInventoryFee,
        inboundShipping,
        prepCost: prep,
        totalAmazonFees
      },
      netProfit,
      roiPercent,
      marginPercent,
      breakEvenPrice
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FBACalculator;
}
