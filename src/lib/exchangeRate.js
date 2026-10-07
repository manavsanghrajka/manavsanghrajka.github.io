/**
 * Exchange Rate Utility
 * 
 * Fetches GBP→CAD rate from ExchangeRate-API with 24-hour localStorage cache.
 * Falls back to a hardcoded rate if the API fails or no key is configured.
 */

const CACHE_KEY = 'med_dashboard_fx_rate';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms
const FALLBACK_RATE = 1.72; // Reasonable GBP→CAD fallback

/**
 * Get the current GBP→CAD exchange rate.
 * Uses cached value if less than 24 hours old, otherwise fetches fresh.
 * 
 * @returns {Promise<{rate: number, cached: boolean, timestamp: number}>}
 */
export async function getGbpToCadRate() {
  // Check cache first
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return { rate: cached.rate, cached: true, timestamp: cached.timestamp };
    }
  } catch {
    // Cache corrupted, continue to fetch
  }
  
  // Try to fetch fresh rate
  const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
  if (!apiKey) {
    return { rate: FALLBACK_RATE, cached: false, timestamp: Date.now() };
  }
  
  try {
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/GBP/CAD`
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    if (data.result === 'success' && data.conversion_rate) {
      const result = {
        rate: data.conversion_rate,
        cached: false,
        timestamp: Date.now(),
      };
      
      // Cache the result
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      
      return result;
    }
    
    throw new Error('Invalid API response');
  } catch (err) {
    console.warn('Exchange rate fetch failed, using fallback:', err.message);
    return { rate: FALLBACK_RATE, cached: false, timestamp: Date.now() };
  }
}

/**
 * Convert GBP amount to CAD.
 * 
 * @param {number} gbpAmount
 * @param {number} rate - GBP→CAD rate
 * @returns {number} CAD amount
 */
export function convertGbpToCad(gbpAmount, rate) {
  if (!gbpAmount || !rate) return 0;
  return Math.round(gbpAmount * rate);
}

/**
 * Format currency for display.
 * 
 * @param {number} amount
 * @param {'GBP'|'CAD'} currency
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'CAD') {
  if (!amount && amount !== 0) return '—';
  const symbol = currency === 'GBP' ? '£' : 'C$';
  return `${symbol}${amount.toLocaleString()}`;
}
