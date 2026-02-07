// Stock API module - fetches data from Yahoo Finance and FRED
const FRED_API_KEY = import.meta.env.VITE_FRED_API_KEY;

// Multiple CORS proxies for fallback
const CORS_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

/**
 * Format ticker for the correct market
 */
export function formatTicker(ticker, market) {
  const cleanTicker = ticker.toUpperCase().trim();
  if (market === 'TSX') {
    return cleanTicker.endsWith('.TO') ? cleanTicker : `${cleanTicker}.TO`;
  }
  return cleanTicker;
}

/**
 * Fetch with CORS proxy fallback
 */
async function fetchWithProxy(url) {
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url);
      const response = await fetch(proxyUrl);
      
      if (response.ok) {
        return response;
      }
    } catch (e) {
      console.log('Proxy failed, trying next...', e);
      continue;
    }
  }
  throw new Error('All CORS proxies failed. Please try again later.');
}

/**
 * Fetch historical stock data from Yahoo Finance
 */
export async function fetchStockData(ticker, market, period = '2y') {
  const formattedTicker = formatTicker(ticker, market);
  
  // Calculate date range
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (2 * 365 * 24 * 60 * 60); // 2 years ago
  
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?period1=${startDate}&period2=${endDate}&interval=1d`;
  
  try {
    const response = await fetchWithProxy(url);
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No data found for this ticker');
    }
    
    const timestamps = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const adjClose = result.indicators?.adjclose?.[0]?.adjclose || quotes.close || [];
    
    // Transform to array of daily data
    const history = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      timestamp: ts,
      open: quotes.open?.[i],
      high: quotes.high?.[i],
      low: quotes.low?.[i],
      close: quotes.close?.[i],
      adjClose: adjClose[i],
      volume: quotes.volume?.[i],
    })).filter(d => d.close != null && !isNaN(d.close));
    
    return {
      ticker: formattedTicker,
      currency: result.meta?.currency || (market === 'TSX' ? 'CAD' : 'USD'),
      history,
      meta: result.meta,
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

/**
 * Fetch macroeconomic data from FRED API
 */
export async function fetchMacroData() {
  if (!FRED_API_KEY) {
    console.warn('FRED API key not configured');
    return { fedFundsRate: null, cpi: null };
  }
  
  try {
    // Fetch Federal Funds Rate
    const fedFundsUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    const fedFundsRes = await fetch(fedFundsUrl);
    const fedFundsData = await fedFundsRes.json();
    const fedFundsRate = parseFloat(fedFundsData.observations?.[0]?.value) || null;
    
    // Fetch CPI
    const cpiUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=1`;
    const cpiRes = await fetch(cpiUrl);
    const cpiData = await cpiRes.json();
    const cpi = parseFloat(cpiData.observations?.[0]?.value) || null;
    
    return { fedFundsRate, cpi };
  } catch (error) {
    console.error('Error fetching macro data:', error);
    return { fedFundsRate: null, cpi: null };
  }
}

/**
 * Get company info if available
 */
export async function fetchCompanyInfo(ticker, market) {
  const formattedTicker = formatTicker(ticker, market);
  
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedTicker}`;
    const response = await fetchWithProxy(url);
    const data = await response.json();
    const quote = data.quoteResponse?.result?.[0];
    
    return {
      name: quote?.longName || quote?.shortName || formattedTicker,
      exchange: quote?.exchange,
      marketCap: quote?.marketCap,
      peRatio: quote?.trailingPE,
      eps: quote?.epsTrailingTwelveMonths,
      beta: quote?.beta,
      fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote?.fiftyTwoWeekLow,
    };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return { name: formattedTicker };
  }
}
