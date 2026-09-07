const assert = require('assert');
const FBACalculator = require('./engine/fba-calculator.js');

const calc = new FBACalculator();

console.log('=== SheetSniper 2026 Official Golden Rate Verification (with 3.5% Fuel Surcharge) ===\n');

// Case 1: Small Standard item (7x4x0.5 inches, 3.52 oz = 0.22 lb, Sell $19.99, Buy $5.00)
// Base $3.42 * 1.035 = $3.54
const case1 = calc.calculateProfit({
  sellPrice: 19.99,
  buyCost: 5.00,
  lengthInches: 7,
  widthInches: 4,
  heightInches: 0.5,
  weightLbs: 0.22,
  inboundShippingCostPerLb: 0.30,
  prepCost: 0.20,
  categoryRate: 0.15,
  inboundSplitMode: 'MINIMAL_SPLIT',
  applyFuelSurcharge: true
});

console.log('--- Case 1: Small Standard (Beauty/Accessory 3.52 oz) ---');
console.log(`Tier: ${case1.tier}`);
console.log(`Fulfillment Fee (incl 3.5% fuel): $${case1.breakdown.fulfillmentFee} (Expected: $3.54)`);
console.log(`Inbound Placement: $${case1.breakdown.placementFee} (Expected: $0.21)`);
console.log(`Net Profit: $${case1.netProfit}`);
assert.strictEqual(case1.breakdown.fulfillmentFee, 3.54, 'Case 1 fulfillment fee must match $3.54');
assert.strictEqual(case1.breakdown.placementFee, 0.21, 'Case 1 placement fee must match $0.21');

// Case 2: Large Standard (12x8x6 inches, 2.2 lb, Sell $39.99, Buy $14.00)
// Dim weight = 4.14 lbs > 2.2 lbs.
// Base $7.37 * 1.035 = $7.63
const case2 = calc.calculateProfit({
  sellPrice: 39.99,
  buyCost: 14.00,
  lengthInches: 12,
  widthInches: 8,
  heightInches: 6,
  weightLbs: 2.2,
  inboundShippingCostPerLb: 0.30,
  prepCost: 0.50,
  categoryRate: 0.15,
  inboundSplitMode: 'MINIMAL_SPLIT',
  applyFuelSurcharge: true
});

console.log('\n--- Case 2: Large Standard (Dim Weight 4.14 lbs) ---');
console.log(`Fulfillment Fee (incl 3.5% fuel): $${case2.breakdown.fulfillmentFee} (Expected: $7.63)`);
console.log(`Inbound Placement: $${case2.breakdown.placementFee} (Expected: $0.54)`);
assert.strictEqual(case2.breakdown.fulfillmentFee, 7.63, 'Case 2 fulfillment fee must match $7.63');

// Case 3: Low-Inventory Fee Triggered Case
// Base $4.87 * 1.035 = $5.04
const case3 = calc.calculateProfit({
  sellPrice: 24.99,
  buyCost: 8.00,
  lengthInches: 10,
  widthInches: 6,
  heightInches: 2,
  weightLbs: 0.9,
  categoryRate: 0.15,
  inboundSplitMode: 'MINIMAL_SPLIT',
  includeLowInventoryFee: true,
  lowInventoryFeeAmount: 0.32,
  applyFuelSurcharge: true
});

console.log('\n--- Case 3: Low Inventory Fee Surcharge ($0.32) ---');
console.log(`Fulfillment Fee (incl 3.5% fuel): $${case3.breakdown.fulfillmentFee} (Expected: $5.04)`);
console.log(`Low Inventory Fee: $${case3.breakdown.lowInventoryFee} (Expected: $0.32)`);
assert.strictEqual(case3.breakdown.fulfillmentFee, 5.04, 'Case 3 fulfillment fee must match $5.04');
assert.strictEqual(case3.breakdown.lowInventoryFee, 0.32, 'Case 3 low inventory fee must match $0.32');

// Case 4: Strict Guard on Missing Dims (Returns null, never fake calculation)
const case4 = calc.calculateProfit({
  sellPrice: 24.99,
  buyCost: 8.00,
  lengthInches: null,
  widthInches: 6,
  heightInches: 2,
  weightLbs: 0.9
});
console.log('\n--- Case 4: Missing Dims Strict Guard ---');
console.log(`Result with null dimension: ${case4} (Expected: null)`);
assert.strictEqual(case4, null, 'Calculation must be strictly null when dims are missing');

console.log('\n=== ALL 2026 OFFICIAL ASSERTIONS (INCL FUEL SURCHARGE & STRICT GUARDS) PASSED! ===');
