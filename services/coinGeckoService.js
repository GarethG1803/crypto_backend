const COIN_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  ADA: 'cardano',
  SOL: 'solana',
  DOT: 'polkadot',
};

const COIN_META = {
  BTC: { name: 'Bitcoin', icon: '₿' },
  ETH: { name: 'Ethereum', icon: 'Ξ' },
  ADA: { name: 'Cardano', icon: '₳' },
  SOL: { name: 'Solana', icon: '◎' },
  DOT: { name: 'Polkadot', icon: '●' },
};

const FALLBACK_PRICES = {
  BTC: { name: 'Bitcoin', price: 97000.00, change: 1.20, icon: '₿' },
  ETH: { name: 'Ethereum', price: 3400.00, change: -0.85, icon: 'Ξ' },
  ADA: { name: 'Cardano', price: 0.72, change: 2.10, icon: '₳' },
  SOL: { name: 'Solana', price: 190.00, change: 3.15, icon: '◎' },
  DOT: { name: 'Polkadot', price: 7.50, change: -0.45, icon: '●' },
};

const BASE_URL = 'https://api.coingecko.com/api/v3';

// In-memory cache
const cache = {
  prices: { data: null, expiry: 0 },
  charts: {},
};

const PRICE_TTL = 60 * 1000;       // 60 seconds
const CHART_TTL = 5 * 60 * 1000;   // 5 minutes

async function getCurrentPrices() {
  const now = Date.now();
  if (cache.prices.data && now < cache.prices.expiry) {
    return cache.prices.data;
  }

  try {
    const ids = Object.values(COIN_MAP).join(',');
    const url = `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
    const json = await res.json();

    const prices = {};
    for (const [symbol, coingeckoId] of Object.entries(COIN_MAP)) {
      const coinData = json[coingeckoId];
      if (coinData) {
        prices[symbol] = {
          name: COIN_META[symbol].name,
          price: coinData.usd,
          change: parseFloat((coinData.usd_24h_change || 0).toFixed(2)),
          icon: COIN_META[symbol].icon,
        };
      } else {
        prices[symbol] = FALLBACK_PRICES[symbol];
      }
    }

    cache.prices = { data: prices, expiry: now + PRICE_TTL };
    return prices;
  } catch (err) {
    console.error('CoinGecko price fetch failed, using fallback:', err.message);
    return FALLBACK_PRICES;
  }
}

async function getChartData(symbol, days = 1) {
  const cacheKey = `${symbol}_${days}`;
  const now = Date.now();
  if (cache.charts[cacheKey] && now < cache.charts[cacheKey].expiry) {
    return cache.charts[cacheKey].data;
  }

  const coingeckoId = COIN_MAP[symbol.toUpperCase()];
  if (!coingeckoId) {
    throw new Error(`Unknown symbol: ${symbol}`);
  }

  try {
    const url = `${BASE_URL}/coins/${coingeckoId}/market_chart?vs_currency=usd&days=${days}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CoinGecko API error: ${res.status}`);
    const json = await res.json();

    const data = (json.prices || []).map(([timestamp, price]) => ({
      timestamp,
      price: parseFloat(price.toFixed(2)),
    }));

    cache.charts[cacheKey] = { data, expiry: now + CHART_TTL };
    return data;
  } catch (err) {
    console.error(`CoinGecko chart fetch failed for ${symbol}/${days}d:`, err.message);
    return [];
  }
}

module.exports = { getCurrentPrices, getChartData, COIN_MAP };
