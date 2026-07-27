const assert = require('assert');

// Mock localStorage for node environment
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = String(value);
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

// Import code we want to test
const { formatPrice, formatPriceNoDecimals, getCurrencySymbol } = require('../utils/currency_node.js');

describe('Frontend Currency Utilities Test', () => {
  it('should return default currency symbol', () => {
    localStorage.clear();
    const symbol = getCurrencySymbol();
    assert.strictEqual(symbol, '₹');
  });

  it('should return overridden settings symbol', () => {
    localStorage.setItem('settings', JSON.stringify({ currency: '$' }));
    const symbol = getCurrencySymbol();
    assert.strictEqual(symbol, '$');
  });

  it('should format prices correctly with symbol and decimals', () => {
    localStorage.setItem('settings', JSON.stringify({ currency: '₹' }));
    const formatted = formatPrice(120.456);
    assert.strictEqual(formatted, '₹120.46');
  });

  it('should format prices without decimal places', () => {
    localStorage.setItem('settings', JSON.stringify({ currency: '₹' }));
    const formatted = formatPriceNoDecimals(1500.80);
    assert.strictEqual(formatted, '₹1,501');
  });
});

function describe(name, fn) {
  console.log(`\n=== Running: ${name} ===`);
  fn();
}

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}
