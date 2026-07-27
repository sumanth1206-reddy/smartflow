export function getCurrencySymbol() {
  const settings = localStorage.getItem('settings')
  if (settings) {
    try {
      const parsed = JSON.parse(settings)
      if (parsed.currency) return parsed.currency
    } catch (e) {
      // Ignore
    }
  }
  return localStorage.getItem('currency') || '₹'
}

export function formatPrice(priceVal) {
  if (priceVal === undefined || priceVal === null) return ''
  const symbol = getCurrencySymbol()
  
  // Strip any existing currency symbols: $, €, £, ₹, ¥
  const cleanVal = String(priceVal).replace(/[$\u20AC\u00A3\u20B9\u00A5]/g, '').trim()
  
  if (!cleanVal || isNaN(Number(cleanVal))) {
    return `${symbol}${cleanVal || '0.00'}`
  }
  
  const num = Number(cleanVal)
  return `${symbol}${num.toFixed(2)}`
}

export function formatPriceNoDecimals(priceVal) {
  if (priceVal === undefined || priceVal === null) return ''
  const symbol = getCurrencySymbol()
  
  const cleanVal = String(priceVal).replace(/[$\u20AC\u00A3\u20B9\u00A5]/g, '').trim()
  
  const num = Number(cleanVal)
  if (isNaN(num)) {
    return `${symbol}${cleanVal}`
  }
  
  return `${symbol}${Math.round(num).toLocaleString()}`
}

export function getPdfSafePrice(priceVal) {
  const formatted = formatPrice(priceVal)
  return formatted
    .replace(/₹/g, 'Rs. ')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    .replace(/¥/g, 'JPY ')
}

export function getPdfSafePriceNoDecimals(priceVal) {
  const formatted = formatPriceNoDecimals(priceVal)
  return formatted
    .replace(/₹/g, 'Rs. ')
    .replace(/€/g, 'EUR ')
    .replace(/£/g, 'GBP ')
    .replace(/¥/g, 'JPY ')
}
